import { identityDeadlinePassed } from './identityDeadline';
import type { PickupContractConfirmationRecord } from '@shared/contracts';
import type { PreparationLanguage } from '../../i18n/preparation';
import { preparationTermsComplete, type PreparationAdditionalConfirmationRecord, type PreparationContractSnapshot } from './materials';
import { preparationBooking } from './bookingFixtures';

export const ORDER_ID = 'PREP01';
export const PREP02_RESET_REVISION = '20261019-1';
export type Step = 'home' | 'booking' | 'drivers' | 'documents' | 'terms' | 'auth' | 'details' | 'inspection' | 'notices' | 'contract' | 'pickup';
export const STEPS: Step[] = ['home', 'booking', 'drivers', 'documents', 'terms', 'auth', 'details', 'inspection', 'notices', 'contract', 'pickup'];
export type DocumentKind = 'licence' | 'idp' | 'passport' | 'translation' | 'entry' | 'other';
export type DocumentPage = 'front' | 'back' | 'info' | 'cover' | 'classes' | 'supplement';
export interface Photo { id: string; name: string; driverId: string; kind: DocumentKind; page?: DocumentPage; blob: Blob }
export interface Driver {
  id: string; first: string; last: string; email: string; phone: string;
  mode: 'local' | 'international';
  countryCode?: string;
}
export type RejectedDocumentType = 'licence' | 'passport' | 'idp' | 'other';
export interface PreparationReview {
  state: 'PENDING_ONSITE_CHECK' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  rejectionReason?: string;
  rejectedDocumentTypes?: RejectedDocumentType[];
  rejectionReasonKey?: 'prepReviewSampleReason';
}
export interface PreparationReviewHistory {
  submittedAt: string;
  review: PreparationReview;
  drivers: Driver[];
  photos: Photo[];
}
export interface PreparationDraft {
  contractSignatureSyncPending?: boolean;
  demoTermsResetRevision?: string;
  demoTermsHistory?: Array<{ snapshot: PreparationDraft["contractConfigSnapshot"]; confirmation: PreparationDraft["confirmation"]; additionalConfirmations: PreparationDraft["additionalConfirmations"] }>;
  demoContractResetRevision?: string;
  demoJourneyResetRevision?: string;
  demoFullJourneyResetRevision?: string;
  demoPhotoReviewResetRevision?: string;
  contractSignatureHistory?: NonNullable<PreparationDraft['contractSignature']>[];
  contractSignature?: { orderId: string; revision: string; signature: string; language: PreparationLanguage; signedAt: string; configurationRevision?: string; inspectionRevision?: string };
  orderId: string; version: 1; bookingConfirmed: boolean; drivers: Driver[];
  confirmation?: PickupContractConfirmationRecord; language: PreparationLanguage;
  submittedAt?: string;
  documentReview?: PreparationReview;
  correctionStartedAt?: string;
  reviewHistory?: PreparationReviewHistory[];
  submittedSteps?: Partial<Record<'booking' | 'drivers' | 'terms', boolean>>;
  configurationVersion?: 1;
  contractConfigSnapshot?: PreparationContractSnapshot;
  additionalConfirmations?: PreparationAdditionalConfirmationRecord;
  documentLayoutVersion?: 2;
  identityConfirmed?: boolean;
  demoResetRevision?: string;
}
export function newDriver(id: string): Driver {
  return { id, first: '', last: '', email: '', phone: '', mode: 'international' };
}
export function newDraft(orderId = ORDER_ID): PreparationDraft {
  const booking = preparationBooking(orderId);
  return { version: 1, configurationVersion: 1, contractConfigSnapshot: booking.contractConfigSnapshot, documentLayoutVersion: 2, orderId, ...(orderId === 'PREP02' ? { demoResetRevision: PREP02_RESET_REVISION } : {}), bookingConfirmed: false, language: 'zh-CN', drivers: [
    { ...newDriver('primary'), first: booking.first, last: booking.last, email: booking.email, phone: booking.phone }
  ] };
}
export const requiredDocuments = (driver: Driver): DocumentKind[] => driver.mode === 'local'
  ? ['licence'] : ['licence', 'idp', 'passport'];
export function requiredDocumentPages(driver: Driver): Array<{ kind: DocumentKind; page: DocumentPage }> {
  const licence: Array<{ kind: DocumentKind; page: DocumentPage }> = [
    { kind: 'licence', page: 'front' }, { kind: 'licence', page: 'back' }
  ];
  return driver.mode === 'local' ? licence : [...licence,
    { kind: 'passport', page: 'info' }, { kind: 'idp', page: 'cover' },
    { kind: 'idp', page: 'info' }, { kind: 'idp', page: 'classes' }
  ];
}
export function documentsComplete(draft: PreparationDraft, photos: Photo[]): boolean {
  const legacySubmitted = Boolean(draft.submittedAt && !draft.documentLayoutVersion);
  return draft.drivers.length > 0 && draft.drivers.every(driver => legacySubmitted
    ? requiredDocuments(driver).every(kind => photos.some(photo => photo.driverId === driver.id && photo.kind === kind))
    : requiredDocumentPages(driver).every(slot => photos.some(photo => photo.driverId === driver.id && photo.kind === slot.kind && photo.page === slot.page)));
}
export function validDrivers(drivers: Driver[]): boolean {
  if (drivers.length < 1 || drivers.length > 4 || new Set(drivers.map(d => d.id)).size !== drivers.length) return false;
  return drivers.every((driver, index) => {
    const email = driver.email.trim();
    const phone = driver.phone.trim();
    const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = !phone || /^\+[1-9][\d\s()-]{5,20}$/.test(phone);
    return emailValid && phoneValid && (index > 0 || Boolean(driver.first.trim() && driver.last.trim() && (email || phone)));
  });
}
export function completion(draft: PreparationDraft, photos: Photo[]) {
  return {
    booking: draft.bookingConfirmed,
    drivers: validDrivers(draft.drivers),
    documents: documentsComplete(draft, photos),
    terms: preparationTermsComplete(draft)
  };
}
export const canSubmit = (draft: PreparationDraft, photos: Photo[]) => !draft.submittedAt
  && Object.values(completion(draft, photos)).every(Boolean);
export const canSubmitIdentity = (draft: PreparationDraft, photos: Photo[]) => !draft.submittedAt
  && validDrivers(draft.drivers) && documentsComplete(draft, photos);
export function submitIdentityDraft(draft: PreparationDraft, photos: Photo[], now: string): PreparationDraft {
  if (identityDeadlinePassed(draft.orderId, Date.parse(now))) throw new Error('IDENTITY_DEADLINE_PASSED');
  if (!canSubmitIdentity(draft, photos)) throw new Error('PREPARATION_INCOMPLETE');
  return { ...draft, submittedAt: now, submittedSteps: { ...draft.submittedSteps, drivers: true },
    documentReview: { state: 'PENDING_ONSITE_CHECK' }, correctionStartedAt: undefined };
}
export function submitDraft(draft: PreparationDraft, photos: Photo[], now: string): PreparationDraft {
  if (!canSubmit(draft, photos)) throw new Error('PREPARATION_INCOMPLETE');
  return { ...draft, submittedAt: now, submittedSteps: { booking: true, drivers: true, terms: true },
    documentReview: { state: 'PENDING_ONSITE_CHECK' }, correctionStartedAt: undefined,
    reviewHistory: draft.reviewHistory };
}
