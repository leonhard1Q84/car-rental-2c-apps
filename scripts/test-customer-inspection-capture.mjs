import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, logLevel: 'error', server: { middlewareMode: true } });
const originalIndexedDB = globalThis.indexedDB;
const records = new Map();
let failWrite = false;
let failRead = false;
// Asynchronous transactional adapter exercises the real IndexedDB repository without a browser.
globalThis.indexedDB = {
  open(name) {
    const request = {};
    request.result = {
      close() {},
      transaction() {
        let aborted = false;
        const tx = {
          abort() { aborted = true; queueMicrotask(() => tx.onabort()); },
          objectStore: () => ({
            get(key) {
              const read = {};
              queueMicrotask(() => {
                if (failRead) { tx.error = new Error('READ_FAILED'); tx.onerror(); return; }
                read.result = structuredClone(records.get(`${name}:${key}`));
                if (read.onsuccess) read.onsuccess();
                else if (!aborted) tx.oncomplete();
              });
              return read;
            },
            put(value, key) {
              queueMicrotask(() => {
                if (aborted) return;
                if (failWrite) { tx.error = new Error('QUOTA_EXCEEDED'); tx.onerror(); return; }
                records.set(`${name}:${key}`, structuredClone(value));
                tx.oncomplete();
              });
              return {};
            },
          }),
        };
        return tx;
      },
    };
    queueMicrotask(() => request.onsuccess());
    return request;
  },
};

try {
  const { InspectionCaptureSession, assertCaptureRecord, captureKey, MAX_CAPTURE_BYTES } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/capture.ts');
  const { captureRepository } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/captureStorage.ts');
  const { InspectionCaptureControls } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/InspectionCaptureSection.tsx');
  const { LanguageProvider } = await server.ssrLoadModule('/src/apps/selfservice-rental/contexts/LanguageContext.tsx');
  const { preparationTranslations } = await server.ssrLoadModule('/src/apps/selfservice-rental/i18n/preparation.ts');
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const binding = { orderId: 'PREP01', vehicleId: 'vehicle-1', revision: 'revision-1' };
  const image = new Blob(['photo'], { type: 'image/jpeg' });
  const session = new InspectionCaptureSession(binding, captureRepository);
  await session.load();
  assert.equal(session.getSnapshot().record.photos.length, 0);
  await session.add([]);
  assert.equal(await captureRepository.load(binding), undefined, 'cancel does not write a record');
  for (const blob of [new Blob([], { type: 'image/png' }), new Blob(['svg'], { type: 'image/svg+xml' }), new Blob([new Uint8Array(MAX_CAPTURE_BYTES + 1)], { type: 'image/jpeg' })]) {
    await session.add([blob]);
    assert.equal(session.getSnapshot().error, 'files');
    assert.equal(session.getSnapshot().record.photos.length, 0);
    await session.retry();
  }
  await session.add(Array(13).fill(image));
  assert.equal(session.getSnapshot().error, 'files');
  await session.retry();

  failWrite = true;
  await session.add([image]);
  const photoId = session.getSnapshot().record.photos[0].id;
  assert.equal(session.getSnapshot().error, 'save');
  assert.equal(session.hasUnsavedChanges(), true);
  assert.equal(await captureRepository.load(binding), undefined);
  await session.confirm('en', 'Confirm');
  assert.equal(session.getSnapshot().record.confirmation, undefined, 'failed photo save blocks confirmation');
  failWrite = false;
  await session.retry();
  assert.equal(session.hasUnsavedChanges(), false);
  assert.equal((await captureRepository.load(binding)).photos[0].id, photoId, 'retry preserves photo identity');
  assert.equal(await (await captureRepository.load(binding)).photos[0].blob.text(), 'photo');

  const restored = new InspectionCaptureSession(binding, captureRepository);
  await restored.load();
  assert.equal(restored.getSnapshot().record.photos[0].id, photoId);
  const stale = new InspectionCaptureSession(binding, captureRepository);
  await stale.load();
  const preConfirm = structuredClone(restored.getSnapshot());
  failWrite = true;
  await restored.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
  assert.equal(restored.getSnapshot().error, 'save');
  assert.equal(restored.getSnapshot().record.confirmation, undefined, 'failed confirmation never appears confirmed');
  assert.equal((await captureRepository.load(binding)).confirmation, undefined);
  failWrite = false;
  const retry = restored.retry();
  await restored.confirm('en', 'Must not replace the pending confirmation');
  await retry;
  const confirmed = structuredClone(restored.getSnapshot());
  assert.ok(confirmed.record.confirmation.at);
  assert.equal(confirmed.record.confirmation.language, 'zh-CN');
  assert.equal(confirmed.record.confirmation.statement, preparationTranslations['zh-CN'].prepCaptureStatement);
  await restored.remove(photoId);
  await restored.add([image]);
  await restored.confirm('en', 'Changed');
  assert.deepEqual(restored.getSnapshot().record, confirmed.record, 'confirmed records are immutable');
  const reloaded = new InspectionCaptureSession(binding, captureRepository);
  await reloaded.load();
  assert.deepEqual(reloaded.getSnapshot().record, confirmed.record, 'confirmation and blobs survive reopening');

  await stale.remove(photoId);
  assert.equal(stale.getSnapshot().error, 'conflict', 'stale tabs cannot overwrite a confirmed record');
  assert.deepEqual(await captureRepository.load(binding), confirmed.record);
  await stale.retry();
  assert.deepEqual(stale.getSnapshot().record, confirmed.record);

  for (const alternative of [{ ...binding, orderId: 'PREP02' }, { ...binding, vehicleId: 'vehicle-2' }, { ...binding, revision: 'revision-2' }]) {
    assert.notEqual(captureKey(alternative), captureKey(binding));
    const empty = new InspectionCaptureSession(alternative, captureRepository);
    await empty.load();
    assert.equal(empty.getSnapshot().record.photos.length, 0);
    assert.equal(empty.getSnapshot().record.confirmation, undefined);
    assert.throws(() => assertCaptureRecord(confirmed.record, alternative), /INVALID_CAPTURE_RECORD/);
  }
  const noPhotos = new InspectionCaptureSession({ ...binding, orderId: 'PREP02' }, captureRepository);
  await noPhotos.load();
  const firstConfirmation = noPhotos.confirm('en', preparationTranslations.en.prepCaptureStatement);
  const duplicate = noPhotos.confirm('ja', 'Duplicate');
  assert.equal(noPhotos.getSnapshot().saving, true);
  assert.equal(noPhotos.getSnapshot().record.confirmation, undefined);
  await Promise.all([firstConfirmation, duplicate]);
  assert.equal(noPhotos.getSnapshot().record.photos.length, 0);
  assert.equal(noPhotos.getSnapshot().record.confirmation.language, 'en');
  assert.equal(noPhotos.getSnapshot().record.sequence, 1, 'zero-photo confirmation is explicit and idempotent');

  const removable = new InspectionCaptureSession({ ...binding, orderId: 'PREP03' }, captureRepository);
  await removable.load();
  await removable.add([image, image]);
  const keptId = removable.getSnapshot().record.photos[1].id;
  await removable.remove(removable.getSnapshot().record.photos[0].id);
  assert.deepEqual((await captureRepository.load({ ...binding, orderId: 'PREP03' })).photos.map(photo => photo.id), [keptId]);
  failRead = true;
  const failedLoad = new InspectionCaptureSession(binding, captureRepository);
  await failedLoad.load();
  assert.equal(failedLoad.getSnapshot().error, 'load');
  await failedLoad.confirm('en', 'Blocked');
  assert.equal(failedLoad.getSnapshot().record.confirmation, undefined);
  failRead = false;
  await failedLoad.retry();
  assert.deepEqual(failedLoad.getSnapshot().record, confirmed.record);

  const { loadPublishedInspection } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/fixtures.ts');
  for (const orderId of ['PREP02']) {
    const snapshot = await loadPublishedInspection(orderId);
    const oldBinding = { ...snapshot, revision: 'DEMO-1' };
    const historical = new InspectionCaptureSession(oldBinding, captureRepository);
    await historical.load();
    await historical.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
    const current = new InspectionCaptureSession(snapshot, captureRepository);
    await current.load();
    assert.equal(current.getSnapshot().record.confirmation, undefined, 'PREP02 new version permits adding photos');
    assert.ok((await captureRepository.load(oldBinding)).confirmation, 'historical PREP02 confirmation is retained');
    await current.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
    const refreshed = new InspectionCaptureSession(snapshot, captureRepository);
    await refreshed.load();
    assert.ok(refreshed.getSnapshot().record.confirmation, 'new PREP02 confirmation survives refresh');
  }
  const prep04 = await loadPublishedInspection('PREP04');
  const oldPrep04 = new InspectionCaptureSession({ ...prep04, revision: 'DEMO-1' }, captureRepository);
  await oldPrep04.load();
  await oldPrep04.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
  const newPrep04 = new InspectionCaptureSession(prep04, captureRepository);
  await newPrep04.load();
  assert.equal(newPrep04.getSnapshot().record.confirmation, undefined, 'new PREP04 version starts with photo controls despite old confirmation');
  assert.ok((await captureRepository.load({ ...prep04, revision: 'DEMO-1' })).confirmation, 'old PREP04 confirmation remains stored');
  await newPrep04.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
  const reloadedPrep04 = new InspectionCaptureSession(prep04, captureRepository);
  await reloadedPrep04.load();
  assert.ok(reloadedPrep04.getSnapshot().record.confirmation, 'new confirmation survives reload without recurring resets');

  const { loadInspectionReview, inspectionReviewPresentation, assertCurrentInspection } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/reviewStatus.ts');
  const { loadSigningInspectionConfirmed } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/signingEligibility.ts');
  const { InspectionIssueDialog, InspectionIssueDialogContent, inspectionContactHref } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/InspectionIssueDialog.tsx');
  const { InspectionConfirmDialog, InspectionConfirmDialogContent } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/InspectionConfirmDialog.tsx');
  const untouched = await loadInspectionReview('PREP01');
  const prep01OldBinding = { ...untouched.snapshot, revision: 'DEMO-1' };
  const prep01Historical = new InspectionCaptureSession(prep01OldBinding, captureRepository);
  await prep01Historical.load();
  await prep01Historical.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
  assert.equal(inspectionReviewPresentation(await loadInspectionReview('PREP01')).status, 'prepInspectionAwaitingReview', 'old PREP01 confirmation does not complete the new prepared example');
  assert.ok((await captureRepository.load(prep01OldBinding)).confirmation, 'PREP01 historical confirmation is retained');
  assert.equal(inspectionReviewPresentation(untouched).status, 'prepInspectionAwaitingReview');
  assert.equal((await loadInspectionReview('PREP03')).status, 'empty');
  assert.equal(inspectionReviewPresentation({ status: 'error', orderId: 'PREP01' }).action, 'prepRetry');
  assert.equal(inspectionReviewPresentation({ status: 'loading', orderId: 'PREP01' }).status, 'prepLoading');
  assert.equal(inspectionReviewPresentation({ status: 'empty', orderId: 'PREP03' }).status, 'prepInspectionPending');
  const completeReview = await loadInspectionReview('PREP04');
  assert.equal(inspectionReviewPresentation(completeReview).status, 'prepCaptureConfirmed');
  assert.equal(await loadSigningInspectionConfirmed('PREP04'), true);
  failRead = true;
  await assert.rejects(loadInspectionReview('PREP04'), 'failed reads cannot be presented as completed or awaiting store preparation');
  failRead = false;
  const originalWindow = globalThis.window;
  const published = new Map();
  globalThis.window = { localStorage: { getItem: key => published.get(key) ?? null } };
  try {
    const key = 'ix-rental:customer-inspection:PREP03';
    const source = await loadPublishedInspection('PREP01');
    const publication = { ...source, orderId: 'PREP03', source: 'STORE_OPS', revision: 'PHOTO-REVIEW-1' };
    published.set(key, JSON.stringify(publication));
    const current = new InspectionCaptureSession(publication, captureRepository, assertCurrentInspection);
    await current.load();
    assert.equal(inspectionReviewPresentation(await loadInspectionReview('PREP03')).status, 'prepInspectionAwaitingReview');
    await current.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
    assert.equal(inspectionReviewPresentation(await loadInspectionReview('PREP03')).status, 'prepCaptureConfirmed');
    assert.equal(await loadSigningInspectionConfirmed('PREP03'), true, 'home and signing use the identical confirmation');
    const updated = { ...publication, revision: 'PHOTO-REVIEW-2' };
    published.set(key, JSON.stringify(updated));
    assert.equal(inspectionReviewPresentation(await loadInspectionReview('PREP03')).status, 'prepInspectionAwaitingReview');
    assert.equal(await loadSigningInspectionConfirmed('PREP03'), false, 'new publication does not inherit a previous confirmation');
    assert.ok((await captureRepository.load(publication)).confirmation, 'historical confirmation is retained');
    const pending = new InspectionCaptureSession(updated, captureRepository, assertCurrentInspection);
    await pending.load();
    published.set(key, JSON.stringify({ ...updated, revision: 'PHOTO-REVIEW-3' }));
    await pending.confirm('en', preparationTranslations.en.prepCaptureStatement);
    assert.equal(pending.getSnapshot().error, 'outdated');
    assert.equal(pending.getSnapshot().record.confirmation, undefined);
    assert.equal(await captureRepository.load(updated), undefined, 'stale page must not save confirmation');
    // Automatic photo sync advances the photo revision without changing the review scope.
    const autoUpdated = { ...publication, revision: 'AUTO-PHOTO-4', reviewRevision: publication.revision, readyToConfirm: false, missingFields: ['light'] };
    published.set(key, JSON.stringify(autoUpdated));
    const retained = await loadInspectionReview('PREP03');
    assert.equal(retained.confirmation.at, current.getSnapshot().record.confirmation.at);
    assert.equal(await loadSigningInspectionConfirmed('PREP03'), true, 'later incomplete photo changes do not revoke an existing confirmation');
    const stableBinding = { orderId: autoUpdated.orderId, vehicleId: autoUpdated.vehicleId, revision: autoUpdated.reviewRevision, photoRevision: autoUpdated.revision };
    await assert.rejects(assertCurrentInspection(stableBinding), /OUTDATED/, 'first confirmation still requires complete records');
    await assertCurrentInspection(stableBinding, true);
    const reopened = new InspectionCaptureSession(stableBinding, captureRepository, assertCurrentInspection);
    await reopened.load();
    assert.equal(reopened.getSnapshot().record.confirmation.at, retained.confirmation.at, 'reopened review retains the original confirmation time');
    assert.equal(reopened.getSnapshot().record.confirmation.photoRevision, publication.revision, 'confirmation evidence keeps the actual original photo revision');
    const wrongVehicle = { ...updated, vehicleId: 'OTHER', vehicle: { ...updated.vehicle, id: 'OTHER' } };
    published.set(key, JSON.stringify(wrongVehicle));
    await assert.rejects(loadInspectionReview('PREP03'), /OWNERSHIP/, 'foreign vehicle photos are rejected');
    for (const bad of ['{broken', JSON.stringify({ ...publication, orderId: 'PREP02' }), JSON.stringify({ ...publication, revision: '' }), JSON.stringify({ ...publication, source: 'DEMO' })]) {
      published.set(key, bad);
      await assert.rejects(loadInspectionReview('PREP03'), 'invalid records are errors rather than available materials or empty state');
    }
  } finally { globalThis.window = originalWindow; }
  assert.equal(inspectionContactHref('+81 50 0000 0000'), 'tel:+815000000000');
  for (const phone of [undefined, '', 'javascript:alert(1)', 'call store', '123']) assert.equal(inspectionContactHref(phone), undefined);

  const { newDraft } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/model.ts');
  const callbacks = { onConfirm() {}, onRetry() {}, onBack() {} };
  for (const [language, copy] of Object.entries(preparationTranslations)) {
    const render = state => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionCaptureControls, { state, ...callbacks })));
    const draftMarkup = render(preConfirm);
    const reviewIntro = draftMarkup.split('<footer')[0];
    assert.match(reviewIntro, /data-inspection-review/);
    assert.match(reviewIntro, /data-inspection-review-hint/);
    assert.ok(reviewIntro.includes('border-l-2 border-primary/40'));
    assert.match(reviewIntro, /lucide-info/);
    assert.match(reviewIntro, /font-medium leading-6 text-gray-700/);
    assert.doesNotMatch(reviewIntro, /padding-bottom|rounded-xl|shadow-sm|bg-white|border-gray-200/);
    assert.ok(draftMarkup.includes(copy.prepInspectionReviewHint));
    assert.ok(!draftMarkup.includes(copy.prepCaptureAdd));
    assert.ok(draftMarkup.includes(copy.prepInspectionIssue));
    assert.ok(draftMarkup.includes(copy.prepCaptureConfirm));
    assert.ok(draftMarkup.includes(copy.prepCaptureStatement));
    assert.doesNotMatch(draftMarkup, /capture="environment"/);
    assert.equal((draftMarkup.match(/type="file"/g) || []).length, 0);
    const doneMarkup = render(confirmed);
    assert.match(doneMarkup, /lucide-circle-check|lucide-check-circle/);
    for (const key of ['prepInspectionReviewComplete', 'prepCaptureConfirmedAt', 'prepCaptureSaved', 'prepBackHome']) assert.ok(doneMarkup.includes(copy[key]), `${language}: ${key}`);
    assert.doesNotMatch(doneMarkup, /type="file"/);
    assert.ok(!doneMarkup.includes(copy.prepCaptureConfirm + '</span>'));
    let confirmCalls = 0;
    const confirmMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionConfirmDialogContent, { submitting: false, onClose() {}, onConfirm() { confirmCalls += 1; } })));
    for (const key of ['prepInspectionConfirmTitle', 'prepInspectionConfirmDescription', 'prepInspectionConfirmSubmit']) assert.ok(confirmMarkup.includes(copy[key]), `${language}: confirmation dialog ${key}`);
    assert.match(confirmMarkup, /id="inspection-confirm-title"/);
    const confirmSubmittingMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionConfirmDialogContent, { submitting: true, onClose() {}, onConfirm() {} })));
    assert.ok(confirmSubmittingMarkup.includes(copy.prepSaving));
    assert.match(confirmSubmittingMarkup, /disabled=""/);
    const issueMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionIssueDialog, { phone: '+81 50 0000 0000', onClose() {} })));
    for (const key of ['prepInspectionIssueTitle', 'prepInspectionIssueDescription', 'prepInspectionIssueAcknowledge']) assert.ok(issueMarkup.includes(copy[key]), `${language}: issue dialog ${key}`);
    assert.ok(!issueMarkup.includes(copy.prepInspectionIssueReturn), 'issue acknowledgement has its own label');
    assert.ok(confirmMarkup.includes(copy.prepInspectionIssueReturn), 'photo confirmation keeps its return action');
    assert.ok(issueMarkup.includes('w-[calc(100vw_-_48px)]'));
    assert.ok(issueMarkup.includes('max-w-[360px]'));
    assert.ok(!issueMarkup.includes('94vw'));
    assert.match(issueMarkup, /<dialog[^>]*aria-labelledby="inspection-issue-title"/);
    assert.doesNotMatch(issueMarkup, /href="tel:|<a /);
    assert.ok(!issueMarkup.includes(copy.prepInspectionIssueContact));
    assert.equal((issueMarkup.match(/<button /g) || []).length, 2, 'close and return are the only actions');
    const noPhone = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionIssueDialogContent, { phone: '', onClose() {} })));
    assert.doesNotMatch(noPhone, /href="tel:/);
    assert.doesNotMatch(noPhone, /<a /);
    const outdatedMarkup = render({ ...preConfirm, error: 'outdated' });
    assert.ok(outdatedMarkup.includes(copy.prepInspectionOutdated));
    assert.match(outdatedMarkup, /disabled=""/);
    const failedMarkup = render({ ...preConfirm, error: 'save' });
    assert.match(failedMarkup, /role="alert"/);
    assert.ok(failedMarkup.includes(copy.prepInspectionReviewSaveError));
  }
  const prep01New = new InspectionCaptureSession(untouched.snapshot, captureRepository, assertCurrentInspection);
  await prep01New.load();
  assert.equal(prep01New.getSnapshot().record.confirmation, undefined);
  await prep01New.confirm('zh-CN', preparationTranslations['zh-CN'].prepCaptureStatement);
  assert.equal(inspectionReviewPresentation(await loadInspectionReview('PREP01')).status, 'prepCaptureConfirmed', 'new demo confirmation survives reopening without repeated resets');
  console.log('Customer photo review: actual confirmation transactions, preserved historical photos, failure/retry, duplicate clicks, stale publication rejection, home/signing consistency, invalid publications, version isolation, no upload controls and six-language dialog rendering passed.');
} finally {
  globalThis.indexedDB = originalIndexedDB;
  await server.close();
}
