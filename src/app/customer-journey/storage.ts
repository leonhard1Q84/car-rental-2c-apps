import { inspectionReviewRevision } from '@shared/contracts/inspectionReviewBinding';
import { clearCustomerPickupSignature } from '@shared/services/customerPickupSignatureStorage';
import { clearCustomerContractFile } from '@shared/services/customerContractFileStorage';
import { customerInspectionApiConfigured } from '@shared/services/customerInspectionApi';
import { customerAuthConfigured } from '@shared/services/customerAuthApi';
import { clearCustomerTermsConfirmation } from '@shared/services/customerTermsConfirmationStorage';
import { clearDemoInspectionProgress } from '../../modules/selfservice-rental/public-api';
import { ORDER_ID, RC10002_RESET_REVISION, newDraft, type Photo, type PreparationDraft } from './model';
import { approvedPreparationFixture, rejectedPreparationFixture } from '../../modules/online-checkin/reviewFixture';
import { preparationBooking } from './bookingFixtures';
import { contractMissingServices, preparationContractReady } from './servicePresentation';
import { loadInspectionReview } from '../../modules/selfservice-rental/pickup/inspection/reviewStatus';
import { saveCustomerPickupSignatureAdapter, loadCustomerPickupSignatureAdapter } from '@shared/services/customerInspectionApi';
import { clearCustomerTermsConfirmationAdapter } from '@shared/services/customerInspectionApi';
import { preparationTermsComplete } from '../../modules/selfservice-rental/pickup/materials';
import { buildCustomerTermsConfirmationSnapshot } from '../../modules/selfservice-rental/pickup/customerTermsSync';
import { preparationFulfillmentOrderId } from './bookingFixtures';
import { loadPublishedInspection } from '../../modules/selfservice-rental/pickup/inspection/fixtures';
import { resetDemoInspectionConfirmation } from '../../modules/selfservice-rental/pickup/inspection/captureStorage';
import { customerInspectionPublicationChannelName, resetLocalCustomerInspectionPublication } from '@shared/services/customerInspectionPublicationStorage';
const JOURNEY_RERUN_REVISION = '20261025-xhs-journey-rerun-1';
const TERMS_RERUN_REVISION = '20261025-rerun-02';
const FULL_JOURNEY_RERUN_REVISION = '20261027-xhs-full-journey-rerun-2';
const PHOTO_REVIEW_RERUN_REVISION = '20261026-xhs-photo-review-rerun-1';
const DATABASE = 'customer-pickup-preparation-v1';
const STORE = 'orders';
export interface PreparationRecord { draft: PreparationDraft; photos: Photo[] }

function initialPreparation(orderId: string): PreparationRecord {
  return orderId === 'RC10005' ? approvedPreparationFixture()
    : orderId === 'RC10003' || orderId === 'RC10004' ? rejectedPreparationFixture(orderId)
    : { draft: newDraft(orderId), photos: [] };
}

export async function resetDemoPreparation(orderId: string): Promise<PreparationRecord | null> {
  if (customerAuthConfigured() || customerInspectionApiConfigured() || import.meta.env?.VITE_RENTAL_EXTENSION_API_BASE_URL) return null;
  preparationBooking(orderId);
  await clearDemoInspectionProgress(orderId);
  const fulfillmentOrderId = preparationFulfillmentOrderId(orderId);
  await clearCustomerTermsConfirmation(fulfillmentOrderId);
  await clearCustomerPickupSignature(fulfillmentOrderId);
  await clearCustomerContractFile(fulfillmentOrderId);
  const initial = initialPreparation(orderId);
  if (orderId === 'RC10002') initial.draft.demoContractResetRevision = '20261021-unsigned-1';
  if (orderId === 'RC10014') {
    // A fresh reset already supersedes the historical one-shot migrations.
    // Do not let the next load erase the independent store publication.
    Object.assign(initial.draft, {
      demoTermsResetRevision: TERMS_RERUN_REVISION,
      demoContractResetRevision: '20261025-xhs-signature-rerun-1',
      demoJourneyResetRevision: JOURNEY_RERUN_REVISION,
      demoFullJourneyResetRevision: FULL_JOURNEY_RERUN_REVISION,
      demoPhotoReviewResetRevision: PHOTO_REVIEW_RERUN_REVISION,
    });
  }
  await savePreparation(initial);
  if (import.meta.env.DEV) {
    const { resetLocalRenewalDemo } = await import('../../modules/rental-extension/localDemo');
    resetLocalRenewalDemo(orderId);
  }
  return initial;
}
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('STORAGE_BLOCKED'));
  });
}
async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('STORAGE_ABORTED'));
    });
  } finally { db.close(); }
}
export async function loadPreparation(orderId = ORDER_ID): Promise<PreparationRecord> {
  preparationBooking(orderId);
  let result = await transaction<PreparationRecord | undefined>('readonly', store => store.get(orderId));
  if (result && orderId === 'RC10002' && result.draft?.demoResetRevision !== RC10002_RESET_REVISION) {
    const reset = { draft: newDraft(orderId), photos: [] };
    await savePreparation(reset);
    return reset;
  }
  if (!result) {
    const reviewExample = orderId === 'RC10003' || orderId === 'RC10004' || orderId === 'RC10005';
    const initial = initialPreparation(orderId);
    if (orderId === 'RC10014') {
      await clearCustomerTermsConfirmationAdapter(orderId);
      initial.draft.demoTermsResetRevision = TERMS_RERUN_REVISION;
      await savePreparation(initial);
    }
    if (orderId === 'RC10002') initial.draft.demoContractResetRevision = '20261021-unsigned-1';
    if (reviewExample || orderId === 'RC10002') await savePreparation(initial);
    if (orderId !== 'RC10014') return initial;
    result = initial;
  }
  if (result.draft?.version !== 1 || result.draft.orderId !== orderId || !Array.isArray(result.draft.drivers)
    || !['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th'].includes(result.draft.language)
    || result.draft.drivers.length < 1 || result.draft.drivers.length > 4
    || result.draft.drivers.some(driver => !driver || !['local', 'international'].includes(driver.mode)
      || ['id', 'first', 'last', 'email', 'phone'].some(key => typeof driver[key as keyof typeof driver] !== 'string'))
    || !Array.isArray(result.photos) || result.photos.some(photo => !(photo.blob instanceof Blob))) throw new Error('INVALID_DRAFT');
  if (orderId === 'RC10002' && result.draft.demoContractResetRevision !== '20261021-unsigned-1') {
    result = { ...result, draft: { ...result.draft, demoContractResetRevision: '20261021-unsigned-1',
      contractSignatureHistory: [...(result.draft.contractSignatureHistory ?? []), ...(result.draft.contractSignature ? [result.draft.contractSignature] : [])],
      contractSignature: undefined } };
    await savePreparation(result);
  }
  const currentDemoConfig = preparationBooking(orderId).contractConfigSnapshot;
  if (["RC10001", "RC10014"].includes(orderId) && (result.draft.contractConfigSnapshot?.revision !== currentDemoConfig.revision
    || result.draft.contractConfigSnapshot?.publishedAt !== currentDemoConfig.publishedAt)) {
    result = { ...result, draft: { ...result.draft, configurationVersion: 1, contractConfigSnapshot: currentDemoConfig,
      confirmation: undefined, additionalConfirmations: undefined,
      demoTermsHistory: [...(result.draft.demoTermsHistory ?? []), { snapshot: result.draft.contractConfigSnapshot, confirmation: result.draft.confirmation, additionalConfirmations: result.draft.additionalConfirmations }] } };
    await savePreparation(result);
  }
  if (orderId === 'RC10014' && result.draft.demoTermsResetRevision !== TERMS_RERUN_REVISION) {
    await clearCustomerTermsConfirmationAdapter(orderId);
    result = { ...result, draft: { ...result.draft, demoTermsResetRevision: TERMS_RERUN_REVISION,
      confirmation: undefined, additionalConfirmations: undefined,
      demoTermsHistory: [...(result.draft.demoTermsHistory ?? []), { snapshot: result.draft.contractConfigSnapshot, confirmation: result.draft.confirmation, additionalConfirmations: result.draft.additionalConfirmations }] } };
    await savePreparation(result);
  }
  if (!customerInspectionApiConfigured() && orderId === 'RC10014' && result.draft.demoContractResetRevision !== '20261025-xhs-signature-rerun-1') {
    await clearCustomerPickupSignature(orderId);
    await clearCustomerContractFile(orderId);
    result = { ...result, draft: { ...result.draft, demoContractResetRevision: '20261025-xhs-signature-rerun-1',
      contractSignatureHistory: [...(result.draft.contractSignatureHistory ?? []), ...(result.draft.contractSignature ? [result.draft.contractSignature] : [])],
      contractSignature: undefined, contractSignatureSyncPending: false } };
    await savePreparation(result);
  }
  if (!customerInspectionApiConfigured() && orderId === 'RC10014' && result.draft.demoJourneyResetRevision !== JOURNEY_RERUN_REVISION) {
    const snapshot = await loadPublishedInspection(orderId);
    if (snapshot) await resetDemoInspectionConfirmation(snapshot, JOURNEY_RERUN_REVISION);
    await clearCustomerTermsConfirmationAdapter(orderId);
    await clearCustomerPickupSignature(orderId);
    await clearCustomerContractFile(orderId);
    result = { ...result, draft: { ...result.draft, demoJourneyResetRevision: JOURNEY_RERUN_REVISION,
      demoTermsHistory: [...(result.draft.demoTermsHistory ?? []), ...(result.draft.confirmation || result.draft.additionalConfirmations ? [{ snapshot: result.draft.contractConfigSnapshot, confirmation: result.draft.confirmation, additionalConfirmations: result.draft.additionalConfirmations }] : [])],
      confirmation: undefined, additionalConfirmations: undefined,
      contractSignatureHistory: [...(result.draft.contractSignatureHistory ?? []), ...(result.draft.contractSignature ? [result.draft.contractSignature] : [])],
      contractSignature: undefined, contractSignatureSyncPending: false } };
    await savePreparation(result);
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(customerInspectionPublicationChannelName);
      channel.postMessage({ orderId }); channel.close();
    }
  }
  if (!customerInspectionApiConfigured() && orderId === 'RC10014' && result.draft.demoFullJourneyResetRevision !== FULL_JOURNEY_RERUN_REVISION) {
    const snapshot = await loadPublishedInspection(orderId);
    if (snapshot) await resetDemoInspectionConfirmation(snapshot, FULL_JOURNEY_RERUN_REVISION);
    await resetLocalCustomerInspectionPublication(orderId, '20261027-xhs-inspection-before-photo-ready-2');
    await clearCustomerTermsConfirmationAdapter(orderId);
    await clearCustomerPickupSignature(orderId);
    await clearCustomerContractFile(orderId);
    result = { ...result, draft: { ...result.draft, demoFullJourneyResetRevision: FULL_JOURNEY_RERUN_REVISION,
      demoTermsHistory: [...(result.draft.demoTermsHistory ?? []), ...(result.draft.confirmation || result.draft.additionalConfirmations ? [{ snapshot: result.draft.contractConfigSnapshot, confirmation: result.draft.confirmation, additionalConfirmations: result.draft.additionalConfirmations }] : [])],
      confirmation: undefined, additionalConfirmations: undefined,
      contractSignatureHistory: [...(result.draft.contractSignatureHistory ?? []), ...(result.draft.contractSignature ? [result.draft.contractSignature] : [])],
      contractSignature: undefined, contractSignatureSyncPending: false } };
    await savePreparation(result);
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(customerInspectionPublicationChannelName);
      channel.postMessage({ orderId }); channel.close();
    }
  }
  if (!customerInspectionApiConfigured() && orderId === 'RC10014' && result.draft.demoPhotoReviewResetRevision !== PHOTO_REVIEW_RERUN_REVISION) {
    const snapshot = await loadPublishedInspection(orderId);
    if (snapshot) await resetDemoInspectionConfirmation(snapshot, PHOTO_REVIEW_RERUN_REVISION);
    await clearCustomerPickupSignature(orderId);
    result = { ...result, draft: { ...result.draft, demoPhotoReviewResetRevision: PHOTO_REVIEW_RERUN_REVISION,
      contractSignatureHistory: [...(result.draft.contractSignatureHistory ?? []), ...(result.draft.contractSignature ? [result.draft.contractSignature] : [])],
      contractSignature: undefined, contractSignatureSyncPending: false } };
    await savePreparation(result);
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(customerInspectionPublicationChannelName);
      channel.postMessage({ orderId }); channel.close();
    }
  }
  if (result.draft.contractSignatureSyncPending && result.draft.contractSignature) {
    // The authoritative commit may succeed before the local completion flag.
    const committed = await loadCustomerPickupSignatureAdapter(preparationFulfillmentOrderId(orderId)).catch(() => null);
    if (committed?.termsConfirmation && committed.signature === result.draft.contractSignature.signature
      && committed.signedAt === result.draft.contractSignature.signedAt
      && committed.language === result.draft.contractSignature.language
      && committed.configurationRevision === result.draft.contractConfigSnapshot?.revision
      && committed.termsConfirmation.configurationPublishedAt === result.draft.contractConfigSnapshot?.publishedAt
      && committed.inspectionRevision === result.draft.contractSignature.inspectionRevision) {
      result = { ...result, draft: { ...result.draft, contractSignatureSyncPending: false } };
      await savePreparation(result).catch(() => {});
    }
  }
  if (result.draft.submittedAt) return result;
  if (!result.draft.configurationVersion) {
    const migrated: PreparationRecord = { ...result, draft: { ...result.draft, documentLayoutVersion: 2, configurationVersion: 1,
      contractConfigSnapshot: preparationBooking(orderId).contractConfigSnapshot } };
    await savePreparation(migrated);
    return migrated;
  }
  return { ...result, draft: { ...result.draft, documentLayoutVersion: 2 } };
}
export async function savePreparation(record: PreparationRecord): Promise<void> {
  preparationBooking(record.draft.orderId);
  await transaction('readwrite', store => store.put(record, record.draft.orderId));
}

export async function savePreparationSignature(orderId: string, signature: NonNullable<PreparationDraft['contractSignature']>): Promise<PreparationDraft> {
  if (!preparationContractReady(orderId) || signature.orderId !== orderId
    || signature.revision !== 'demo-contract-v1' || !signature.signature.startsWith('data:image/png;base64,')
    || !Number.isFinite(Date.parse(signature.signedAt))) throw new Error('INVALID_CONTRACT_SIGNATURE');
  const inspection = await loadInspectionReview(orderId);
  if (inspection.status !== 'ready' || !inspection.confirmation) throw new Error('INSPECTION_NOT_CONFIRMED');
  const initial = await loadPreparation(orderId);
  const db = await database();
  try {
    const saved = await new Promise<PreparationDraft>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const read = store.get(orderId);
      let draft: PreparationDraft;
      read.onsuccess = () => {
        const record: PreparationRecord = read.result ?? initial;
        if ((record.draft.contractSignature && !record.draft.contractSignatureSyncPending) || signature.language !== record.draft.language || !preparationTermsComplete(record.draft) || contractMissingServices(record.draft, true).length) { tx.abort(); return; }
        const pending = record.draft.contractSignature;
        const terms = buildCustomerTermsConfirmationSnapshot(record.draft);
        if (!terms) { tx.abort(); return; }
        const attempt = record.draft.contractSignatureSyncPending && pending?.signature === signature.signature
          && pending.language === signature.language && pending.configurationRevision === terms.configurationRevision
          && pending.inspectionRevision === inspectionReviewRevision(inspection.snapshot)
          && Date.parse(pending.signedAt) >= Date.parse(terms.confirmedAt) ? pending : signature;
        draft = { ...record.draft, contractSignature: { ...attempt, configurationRevision: terms.configurationRevision, inspectionRevision: inspectionReviewRevision(inspection.snapshot) }, contractSignatureSyncPending: true };
        store.put({ ...record, draft }, orderId);
      };
      tx.oncomplete = () => resolve(draft);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('CONTRACT_ALREADY_SIGNED'));
    });
    const review = await loadInspectionReview(orderId);
    if (review.status !== 'ready' || !review.confirmation || inspectionReviewRevision(review.snapshot) !== inspectionReviewRevision(inspection.snapshot)) throw new Error('INSPECTION_NOT_CONFIRMED');
    const termsConfirmation = buildCustomerTermsConfirmationSnapshot(saved);
    if (!termsConfirmation) throw new Error('TERMS_NOT_CONFIRMED');
    const attempt = saved.contractSignature!;
    await saveCustomerPickupSignatureAdapter({
      orderId: preparationFulfillmentOrderId(orderId),
      signature: attempt.signature, signedAt: attempt.signedAt, language: attempt.language,
      configurationRevision: saved.contractConfigSnapshot!.revision,
      inspectionRevision: inspectionReviewRevision(review.snapshot),
      submissionId: `pickup-signature-${preparationFulfillmentOrderId(orderId)}-${attempt.signedAt}`,
      primaryDriverId: saved.drivers[0].id,
      termsConfirmation,
    });
    const complete = { ...saved, contractSignatureSyncPending: false };
    // Failure to tidy the local flag cannot turn a committed result into failure.
    await savePreparation({ ...initial, draft: complete }).catch(() => {});
    return complete;
  } finally { db.close(); }
}
