import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } });
const originalIndexedDB = globalThis.indexedDB;
const originalWindow = globalThis.window;
const records = new Map();
let failWrite = false;
let failSignatureSync = false;
let failTermsSync = false;
let failRead = false;
let failCompletionWriteOnce = false;
// Asynchronous transactional adapter exercises the real IndexedDB repository without a browser.
globalThis.indexedDB = {
  open(name) {
    const request = {};
    request.result = {
      close() {},
      transaction() {
        let aborted = false;
        let writing = false;
        const tx = {
          abort() { aborted = true; queueMicrotask(() => tx.onabort()); },
          objectStore: () => ({
            openCursor() {
              const request = {};
              const entries = [...records.entries()].filter(([key]) => key.startsWith(`${name}:`));
              let index = 0;
              const advance = () => queueMicrotask(() => {
                const entry = entries[index++];
                request.result = entry ? {
                  value: structuredClone(entry[1]),
                  delete() { records.delete(entry[0]); },
                  continue: advance,
                } : null;
                request.onsuccess();
                if (!entry) tx.oncomplete();
              });
              advance();
              return request;
            },
            get(key) {
              const read = {};
              queueMicrotask(() => {
                if (failRead) { tx.error = new Error('READ_FAILED'); tx.onerror(); return; }
                read.result = structuredClone(records.get(`${name}:${key}`));
                if (read.onsuccess) {
                  read.onsuccess();
                  queueMicrotask(() => { if (!aborted && !writing) tx.oncomplete?.(); });
                } else if (!aborted) tx.oncomplete();
              });
              return read;
            },
            delete(key) {
              queueMicrotask(() => { records.delete(`${name}:${key}`); tx.oncomplete(); });
              return {};
            },
            put(value, key) {
              writing = true;
              queueMicrotask(() => {
                if (aborted) return;
                if (failCompletionWriteOnce && name === 'customer-pickup-preparation-v1' && value.draft?.contractSignature && !value.draft.contractSignatureSyncPending) {
                  failCompletionWriteOnce = false; tx.error = new Error('LOCAL_COMPLETION_WRITE_FAILED'); tx.onerror(); return;
                }
                if (failWrite || (failSignatureSync && name === 'customer-pickup-signature-v1') || (failTermsSync && name === 'customer-self-service-terms-v1')) { tx.error = new Error('QUOTA_EXCEEDED'); tx.onerror(); return; }
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
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const root = '/src/';
  const { LanguageProvider } = await server.ssrLoadModule(root + 'contexts/LanguageContext.tsx');
  const { preparationTranslations } = await server.ssrLoadModule(root + 'i18n/preparation.ts');
  const { newDraft } = await server.ssrLoadModule(root + 'app/customer-journey/model.ts');
  const { PreparationTerms } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/PreparationTerms.tsx');
  const historicalTitles = newDraft('RC10014');
  historicalTitles.contractConfigSnapshot.rentalContract.attachments[0].title = '租车条款（原型）';
  historicalTitles.contractConfigSnapshot.rentalGuidelines.attachments[0].title = '租车注意事项（原型）';
  const originalTitles = structuredClone(historicalTitles);
  const titlesMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTerms, { draft: historicalTitles, readOnly: false, onChange() {} })));
  assert.ok(titlesMarkup.includes('租车条款'));
  assert.ok(titlesMarkup.includes('租车注意事项'));
  assert.ok(!titlesMarkup.includes('（原型）'), 'historical snapshot attachment labels omit prototype suffix');
  assert.deepEqual(historicalTitles, originalTitles, 'display cleanup does not rewrite saved configuration or confirmations');
  const { preparationContractReady, preparationContractSigned, PREPARATION_CONTRACT_REVISION } = await server.ssrLoadModule(root + 'app/customer-journey/servicePresentation.ts');
  const { PreparationServiceEntriesContent: PreparationServiceEntries } = await server.ssrLoadModule(root + 'modules/home/PreparationServiceEntries.tsx');
  const { PreparationContractContent: PreparationContractPage } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/PreparationContractPage.tsx');
  const { serviceCompletionDestination, preparationNavigationUrl } = await server.ssrLoadModule(root + 'app/customer-journey/serviceNavigation.ts');
  const source = 'http://localhost/selfservice.html?flow=pickup-preparation&step=contract&orderId=RC10002';
  const { availablePreparationStep } = await server.ssrLoadModule(root + 'app/customer-journey/releaseScope.ts');
  for (const legacyStep of ['drivers', 'documents']) {
    assert.equal(availablePreparationStep(legacyStep), legacyStep);
    const legacy = preparationNavigationUrl(source, legacyStep, 'RC10004', 'contract');
    assert.equal(legacy.searchParams.get('step'), legacyStep);
    assert.equal(legacy.searchParams.get('orderId'), 'RC10004');
    assert.equal(legacy.searchParams.get('returnTo'), 'contract');
  }
  const 补齐 = preparationNavigationUrl(source, 'notices', 'RC10002', 'contract');
  assert.equal(serviceCompletionDestination(补齐.search), 'contract');
  assert.equal(serviceCompletionDestination(''), 'home');
  assert.equal(preparationNavigationUrl(补齐.href, 'home', 'RC10002').searchParams.has('returnTo'), false);
  assert.equal(preparationNavigationUrl(补齐.href, 'notices', 'RC10001').searchParams.has('returnTo'), false);
  assert.equal(preparationNavigationUrl(补齐.href, 'notices', 'RC10002').searchParams.get('returnTo'), 'contract');
  const inspectionUrl = preparationNavigationUrl(source, 'inspection', 'RC10002', 'contract');
  assert.equal(serviceCompletionDestination(inspectionUrl.search), 'contract');
  assert.equal(preparationNavigationUrl(inspectionUrl.href, 'inspection', 'RC10002').searchParams.get('returnTo'), 'contract');
  for (const service of ['notices', 'inspection']) {
    const destination = preparationNavigationUrl(source.replace('RC10002', 'RC10004'), service, 'RC10004', 'contract');
    assert.equal(destination.searchParams.get('orderId'), 'RC10004');
    assert.equal(destination.searchParams.get('step'), service);
    assert.equal(serviceCompletionDestination(destination.search), 'contract');
    const returned = preparationNavigationUrl(destination.href, 'contract', 'RC10004');
    assert.equal(returned.searchParams.get('orderId'), 'RC10004');
    assert.equal(returned.searchParams.get('step'), 'contract');
    assert.equal(returned.searchParams.has('returnTo'), false);
  }
  const { preparationEntryStep } = await server.ssrLoadModule(root + 'modules/auth/verification.ts');
  assert.equal(preparationEntryStep('contract'), 'contract');
  assert.equal(preparationEntryStep('pickup'), 'pickup');
  for (const target of ['inspection', 'contract']) {
    const child = preparationNavigationUrl(source, target, 'RC10002', 'pickup');
    assert.equal(serviceCompletionDestination(child.search), 'pickup');
    assert.equal(preparationNavigationUrl(child.href, 'pickup', 'RC10002').searchParams.has('returnTo'), false);
    assert.equal(preparationNavigationUrl(child.href, target, 'RC10004').searchParams.has('returnTo'), false);
  }
  const signing = preparationNavigationUrl(source, 'contract', 'RC10002', 'pickup');
  const guided = preparationNavigationUrl(signing.href, 'inspection', 'RC10002', 'contract');
  assert.equal(serviceCompletionDestination(guided.search), 'contract');
  const resumed = preparationNavigationUrl(guided.href, 'contract', 'RC10002');
  assert.equal(serviceCompletionDestination(resumed.search), 'pickup');
  assert.equal(resumed.searchParams.has('journey'), false);
  const otherOrder = preparationNavigationUrl(guided.href, 'inspection', 'RC10004');
  assert.equal(otherOrder.searchParams.has('journey'), false);
  assert.equal(serviceCompletionDestination(otherOrder.search), 'home');

  assert.equal(preparationContractReady('RC10002'), true);
  assert.equal(preparationContractReady('RC10004'), true);
  assert.equal(preparationContractReady('RC10003'), true);
  assert.equal(preparationContractReady('RC10014'), true);
  assert.equal(preparationContractReady('UNKNOWN'), false);
  const { approvedPreparationFixture } = await server.ssrLoadModule(root + 'modules/online-checkin/reviewFixture.ts');
  const approved = approvedPreparationFixture();
  const draft = { ...approved.draft, orderId: 'RC10002', demoResetRevision: newDraft('RC10002').demoResetRevision, demoContractResetRevision: '20261021-unsigned-1' };
  const { canSubmitIdentity, submitIdentityDraft } = await server.ssrLoadModule(root + 'app/customer-journey/model.ts');
  const identityOnly = { ...draft, submittedAt: undefined, bookingConfirmed: false, confirmation: undefined, additionalConfirmations: undefined, identityConfirmed: true };
  assert.equal(canSubmitIdentity(identityOnly, approved.photos), true);
  assert.equal(submitIdentityDraft(identityOnly, approved.photos, '2026-10-21T00:00:00Z').documentReview.state, 'PENDING_ONSITE_CHECK');
  const { contractMissingServices } = await server.ssrLoadModule(root + 'app/customer-journey/servicePresentation.ts');
  assert.deepEqual(contractMissingServices(identityOnly), ['inspection']);
  assert.deepEqual(contractMissingServices(draft, true), []);

  const record = { orderId: 'RC10002', revision: PREPARATION_CONTRACT_REVISION, signature: 'data:image/png;base64,AA==', signedAt: new Date(Date.now() + 60000).toISOString(), language: 'zh-CN' };
  assert.equal(preparationContractSigned(draft), false);
  assert.equal(preparationContractSigned({ ...draft, contractSignature: record }), true);
  assert.equal(preparationContractSigned({ ...draft, orderId: 'RC10001', contractSignature: record }), false);
  assert.equal(preparationContractSigned({ ...draft, contractSignature: { ...record, revision: 'old' } }), false);
  const render = (Component, props, lang) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: lang }, React.createElement(Component, props)));
  const { PreparationPickupSteps } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/PreparationPickupJourney.tsx');
  for (const [lang, copy] of Object.entries(preparationTranslations)) {
    for (const reviewed of [false, true]) {
      const markup = render(PreparationPickupSteps, { current: reviewed ? 2 : 1, confirmed: reviewed, signed: false, onSelect() {} }, lang);
      assert.ok(markup.includes(copy.prepOnlineInspection));
      assert.ok(markup.includes(copy.prepPickupSignContract));
      assert.ok(markup.includes('aria-current'));
      assert.equal(markup.includes('aria-disabled'), !reviewed);
      assert.ok(!markup.includes(copy.prepSigningJourneyProgress.replace('{count}', '0')));
    }
    for (const [available, confirmed, label, action] of [
      [false, false, 'prepInspectionPending', 'prepViewInfo'],
      [true, false, 'prepInspectionAwaitingReview', 'prepInspectionStart'],
      [true, true, 'prepCaptureConfirmed', 'prepInspectionView'],
      [false, true, 'prepInspectionPending', 'prepViewInfo'],
    ]) {
      const markup = render(PreparationContractPage, { draft: { ...draft, confirmation: undefined }, inspectionAvailable: available, inspectionConfirmed: confirmed, inspectionConfirmedAt: confirmed ? record.signedAt : undefined, onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} }, lang);
      const row = markup.split('<article').find(article => article.includes('data-signing-service="inspection"'));
      if (available && confirmed) {
        assert.ok(!row);
        assert.ok(markup.includes('<canvas'));
        assert.ok(markup.includes('type="checkbox"'));
        assert.ok(!markup.includes(copy.prepSigningEmbeddedTermsRequired));
        continue;
      }
      assert.ok(row.includes(copy[label]), `${lang}: ${label}`);
      assert.ok(row.includes(copy[action]), `${lang}: ${action}`);
      assert.equal(row.includes(copy.prepCaptureConfirmedAt), available && confirmed);
      assert.ok(!markup.includes(copy.prepSigningRequirements));
      assert.ok(!markup.includes('role="progressbar"'));
      assert.ok(!markup.includes('<canvas'));
    }
    for (const identityDone of [false, true]) for (const noticesDone of [false, true]) for (const inspectionDone of [false, true]) {
      const combination = { ...draft, orderId: 'RC10004', submittedAt: identityDone ? draft.submittedAt : undefined, confirmation: noticesDone ? draft.confirmation : undefined };
      const expectedMissing = inspectionDone ? [] : ['inspection'];
      assert.deepEqual(contractMissingServices(combination, inspectionDone), expectedMissing);
      const combinationMarkup = render(PreparationContractPage, { draft: combination, inspectionConfirmed: inspectionDone, inspectionConfirmedAt: inspectionDone ? record.signedAt : undefined, onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} }, lang);
                assert.equal(combinationMarkup.includes('<canvas'), expectedMissing.length === 0, `${lang}: signature requires both enabled services`);
                if (expectedMissing.length === 0) assert.match(combinationMarkup, /touchAction|touch-none|touch-action/, `${lang}: signature canvas must preserve touch input`);
      if (expectedMissing.length) {
        for (const [id, completed] of [['inspection', inspectionDone]]) {
          const row = combinationMarkup.split('<article').find(article => article.includes(`data-signing-service="${id}"`));
          assert.ok(row, `${lang}: ${id} is always visible`);
          assert.ok(row.includes(id === 'inspection'
            ? completed ? copy.prepInspectionView : copy.prepInspectionStart
            : completed ? copy.prepView : copy.prepGoComplete));
          if (id === 'inspection') assert.ok(row.includes(completed ? copy.prepCaptureConfirmed : copy.prepInspectionAwaitingReview));
        }
        assert.equal(combinationMarkup.includes(copy.prepCaptureConfirmedAt), inspectionDone, 'confirmation evidence appears only for confirmed inspection');
      }
    }
    const card = render(PreparationServiceEntries, { draft, hasPreparation: false, pickupReady: true, rentalActive: true, phone: '', onIdentity() {}, onContract() {} }, lang);
    assert.ok(card.includes(copy.prepPickupTileTitle));
    assert.ok(!card.includes(copy.prepQuickPickupHint));
    assert.ok(!card.includes(copy.prepQuickPickupAction));
    assert.ok(!card.includes('data-step-number'));
    assert.ok(!card.includes('data-signing-flow'));
    const RC10004Draft = { ...draft, orderId: 'RC10004', documentReview: { state: 'REJECTED' } };
    const RC10004Blocked = render(PreparationContractPage, { draft: RC10004Draft, onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} }, lang);
    assert.ok(!RC10004Blocked.includes(copy.prepOnlineIdentity));
    assert.ok(RC10004Blocked.includes(copy.prepOnlineInspection));
    assert.ok(!RC10004Blocked.includes('data-signing-service="drivers"'));
    assert.ok(!RC10004Blocked.includes('<canvas'));
    const RC10004Ready = render(PreparationContractPage, { draft: { ...draft, orderId: 'RC10004' }, inspectionConfirmed: true, onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} }, lang);
    assert.ok(RC10004Ready.includes(copy.prepContractInfo));
    assert.ok(RC10004Ready.includes('<canvas'));
    const blocked = render(PreparationContractPage, { draft: newDraft('RC10002'), onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} }, lang);
    assert.ok(!blocked.includes(copy.prepSigningRequirements));
    assert.ok(!blocked.includes('role="progressbar"'));
    assert.ok(blocked.includes(copy.prepOnlineInspection));
    const inspectionOnly = render(PreparationContractPage, { draft, onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} }, lang);
    assert.ok(inspectionOnly.includes(copy.prepOnlineInspection));
    assert.ok(!inspectionOnly.includes('<canvas'));
    assert.ok(!blocked.includes('<canvas'));
    const props = { draft, inspectionConfirmed: true, onBack() {}, onSaved() {}, onBusy() {}, onDirty() {} };
    const pending = render(PreparationContractPage, props, lang);
    assert.ok(pending.includes(copy.prepContractInfo));
    assert.ok(pending.includes('type="checkbox"'));
    assert.ok(!pending.includes('prepContractDemo'));
    assert.ok(!pending.includes(copy.prepContractRequired));
    assert.match(pending, /disabled/);
    const example = render(PreparationContractPage, { ...props, draft: { ...newDraft('RC10014'), language: lang } }, lang);
    assert.equal((example.match(/type="checkbox"/g) || []).length, 3, 'example signing page contains all three configured acknowledgements');
    assert.ok(example.indexOf('data-rental-materials-list') < example.indexOf('<canvas'), 'terms materials precede handwritten signing');
    assert.ok(!example.includes('data-signing-service="notices"'));
    const failedTerms = render(PreparationContractPage, { ...props, termsSaveError: true, onTermsRetry() {} }, lang);
    assert.ok(failedTerms.includes(copy.prepStorageError));
    assert.ok(failedTerms.includes(copy.prepRetry));
    const signed = render(PreparationContractPage, { ...props, draft: { ...draft, contractSignature: record } }, lang);
    assert.ok(signed.includes(copy.prepSignatureCompleted));
    assert.ok(signed.includes(copy.prepContractWaiting));
    assert.ok(!signed.includes('download='));
    assert.ok(!signed.includes('<canvas'));
    const unavailable = render(PreparationContractPage, { ...props, draft: newDraft('RC10003') }, lang);
    assert.ok(!unavailable.includes(copy.prepContractUnavailable));
    assert.ok(unavailable.includes('<canvas'));
    assert.ok(!unavailable.includes(copy.prepSigningEmbeddedTermsRequired));
  }
  const { savePreparation, savePreparationSignature, loadPreparation, resetDemoPreparation } = await server.ssrLoadModule(root + 'app/customer-journey/storage.ts');
  const { preparationTermsComplete } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/materials.ts');
  const demoOrder = 'RC10014';
  const confirmedDemo = { ...draft, orderId: demoOrder };
  await savePreparation({ draft: confirmedDemo, photos: approved.photos });
  const resetDemo = await loadPreparation(demoOrder);
  assert.equal(preparationTermsComplete(resetDemo.draft), false);
  assert.deepEqual(resetDemo.draft.demoTermsHistory[0].confirmation, confirmedDemo.confirmation);
  assert.deepEqual(resetDemo.photos, approved.photos);
  const reconfirmedDemo = { ...resetDemo.draft, confirmation: confirmedDemo.confirmation, additionalConfirmations: confirmedDemo.additionalConfirmations };
  await savePreparation({ ...resetDemo, draft: reconfirmedDemo });
  assert.deepEqual((await loadPreparation(demoOrder)).draft.confirmation, confirmedDemo.confirmation, 'new confirmation survives reload');
  assert.equal((await loadPreparation(demoOrder)).draft.demoTermsHistory.length, resetDemo.draft.demoTermsHistory.length);
  const oldSignature = { ...record, orderId: demoOrder };
  await savePreparation({ ...resetDemo, draft: { ...reconfirmedDemo, demoContractResetRevision: undefined, contractSignature: oldSignature } });
  const unsignedDemo = await loadPreparation(demoOrder);
  assert.equal(unsignedDemo.draft.contractSignature, undefined);
  assert.deepEqual(unsignedDemo.draft.contractSignatureHistory.at(-1), oldSignature);
  assert.deepEqual(unsignedDemo.draft.confirmation, reconfirmedDemo.confirmation);
  assert.deepEqual(unsignedDemo.photos, resetDemo.photos);
  assert.deepEqual(unsignedDemo.draft.drivers, resetDemo.draft.drivers);
  await savePreparation({ ...unsignedDemo, draft: { ...unsignedDemo.draft, contractSignature: oldSignature } });
  assert.deepEqual((await loadPreparation(demoOrder)).draft.contractSignature, oldSignature, 'signature reset happens once');
  const oldRC10001 = { ...draft, orderId: 'RC10001' };
  await savePreparation({ draft: oldRC10001, photos: approved.photos });
  const pendingRC10001 = await loadPreparation('RC10001');
  assert.equal(preparationTermsComplete(pendingRC10001.draft), false);
  assert.deepEqual(pendingRC10001.draft.demoTermsHistory[0].confirmation, oldRC10001.confirmation);
  assert.deepEqual(pendingRC10001.photos, approved.photos);
  assert.deepEqual(pendingRC10001.draft.drivers, oldRC10001.drivers);
  assert.deepEqual((await loadPreparation('RC10001')).draft, pendingRC10001.draft, 'demo migration happens once');
  await assert.rejects(savePreparationSignature('RC10002', record));
  await savePreparation({ draft, photos: approved.photos });
  await assert.rejects(savePreparationSignature('RC10002', record), /INSPECTION_NOT_CONFIRMED/);
  const { loadPublishedInspection } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/inspection/fixtures.ts');
  const { captureRepository } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/inspection/captureStorage.ts');
  const { loadSigningInspectionConfirmed, loadSigningInspectionConfirmation } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/inspection/signingEligibility.ts');
  const snapshot = await loadPublishedInspection('RC10002');
  const binding = { orderId: snapshot.orderId, vehicleId: snapshot.vehicleId, revision: snapshot.revision };
  const capture = { ...binding, version: 1, sequence: 1, photos: [], confirmation: { at: record.signedAt, language: 'zh-CN', statement: 'Confirm' } };
  const demoSnapshot = { ...snapshot, orderId: demoOrder, source: 'STORE_OPS' };
  const demoCapture = { ...capture, orderId: demoOrder, photos: [{ id: 'retained-photo', blob: new Blob(['photo'], { type: 'image/jpeg' }), addedAt: record.signedAt }] };
  await captureRepository.save(demoCapture, 0);
  const savedWindow = globalThis.window;
  globalThis.window = { localStorage: { getItem: key => key === `ix-rental:customer-inspection:${demoOrder}` ? JSON.stringify(demoSnapshot) : null } };
  try {
    await savePreparation({ ...unsignedDemo, draft: { ...unsignedDemo.draft, ...{ confirmation: reconfirmedDemo.confirmation, additionalConfirmations: reconfirmedDemo.additionalConfirmations }, contractSignature: oldSignature, demoJourneyResetRevision: undefined } });
    const publishedBeforeReset = await loadPublishedInspection(demoOrder);
    const rerun = await loadPreparation(demoOrder);
    assert.equal(rerun.draft.confirmation, undefined);
    assert.equal(rerun.draft.additionalConfirmations, undefined);
    assert.equal(rerun.draft.contractSignature, undefined);
    assert.deepEqual(rerun.draft.contractSignatureHistory.at(-1), oldSignature);
    assert.deepEqual(rerun.draft.demoTermsHistory.at(-1).confirmation, reconfirmedDemo.confirmation);
    assert.deepEqual(rerun.photos, unsignedDemo.photos);
    assert.deepEqual(rerun.draft.drivers, unsignedDemo.draft.drivers);
    const pendingCapture = await captureRepository.load(demoSnapshot);
    assert.equal(pendingCapture.confirmation, undefined);
    assert.deepEqual(pendingCapture.confirmationHistory, [demoCapture.confirmation]);
    assert.deepEqual(pendingCapture.photos, demoCapture.photos);
    assert.equal(pendingCapture.sequence, 2);
    assert.deepEqual(await loadPublishedInspection(demoOrder), publishedBeforeReset, 'published store photos remain available');
    await captureRepository.save({ ...pendingCapture, sequence: 3, confirmation: demoCapture.confirmation }, 2);
    await savePreparation({ ...rerun, draft: { ...rerun.draft, confirmation: reconfirmedDemo.confirmation, additionalConfirmations: reconfirmedDemo.additionalConfirmations } });
    assert.deepEqual((await loadPreparation(demoOrder)).draft.confirmation, reconfirmedDemo.confirmation);
    assert.deepEqual((await captureRepository.load(demoSnapshot)).confirmation, demoCapture.confirmation, 'new inspection survives reload');
    const { resetDemoInspectionConfirmation } = await server.ssrLoadModule(root + 'modules/selfservice-rental/pickup/inspection/captureStorage.ts');
    await resetDemoInspectionConfirmation(demoSnapshot, pendingCapture.demoResetRevision);
    assert.equal((await captureRepository.load(demoSnapshot)).sequence, 3, 'retry does not reset or archive twice');
    assert.equal(await captureRepository.load(binding), undefined, 'other orders remain untouched');
  } finally {
    if (savedWindow === undefined) delete globalThis.window;
    else globalThis.window = savedWindow;
  }
  await captureRepository.save({ ...capture, revision: 'old' }, 0);
  await captureRepository.save({ ...capture, vehicleId: 'other' }, 0);
  assert.equal(await loadSigningInspectionConfirmed('RC10002'), false);
  assert.equal(await loadSigningInspectionConfirmed('RC10001'), false);
  await captureRepository.save({ ...capture, confirmation: undefined }, 0);
  assert.equal(await loadSigningInspectionConfirmed('RC10002'), false);
  await assert.rejects(savePreparationSignature('RC10002', record), /INSPECTION_NOT_CONFIRMED/);
  await captureRepository.save({ ...capture, sequence: 2 }, 1);
  assert.equal(await loadSigningInspectionConfirmed('RC10002'), true);
  assert.equal((await loadSigningInspectionConfirmation('RC10002')).at, record.signedAt);
  failRead = true;
  await assert.rejects(loadSigningInspectionConfirmed('RC10002'));
  await assert.rejects(savePreparationSignature('RC10002', record));
  failRead = false;
  failWrite = true;
  await assert.rejects(savePreparationSignature('RC10002', record));
  assert.equal((await loadPreparation('RC10002')).draft.contractSignature, undefined);
  failWrite = false;
  failSignatureSync = true;
  failTermsSync = true;
  await assert.rejects(savePreparationSignature('RC10002', record));
  assert.equal(preparationContractSigned((await loadPreparation('RC10002')).draft), false, 'commit failure cannot report signing success');
  assert.equal(records.has('customer-pickup-signature-v1:RC10002'), false, 'failed atomic commit must not expose terms or signature');
  failTermsSync = false;
  await assert.rejects(savePreparationSignature('RC10002', record));
  assert.equal(preparationContractSigned((await loadPreparation('RC10002')).draft), false, 'shared failure must not report signed');
  let photoReads = 0;
  globalThis.window = { localStorage: {
    getItem: key => key === 'ix-rental:customer-inspection:RC10002'
      ? JSON.stringify({ ...snapshot, source: 'STORE_OPS', revision: `AUTO-${++photoReads}`, reviewRevision: snapshot.revision, readyToConfirm: false }) : null,
    setItem() {},
  } };
  failSignatureSync = false;
  failTermsSync = true; // The atomic commit does not require the old separate terms store.
  failCompletionWriteOnce = true;
  await savePreparationSignature('RC10002', record);
  assert.equal(records.get('customer-pickup-preparation-v1:RC10002').draft.contractSignatureSyncPending, true, 'a failed local completion flag does not roll back the atomic commit');
  assert.equal((await loadPreparation('RC10002')).draft.contractSignatureSyncPending, false, 'reload recovers the successful commit');
  assert.equal((await loadPreparation('RC10002')).draft.contractSignature.signature, record.signature);
  const { loadCustomerPickupSignatureAdapter } = await server.ssrLoadModule('/src/shared/services/customerInspectionApi.ts');
  const sharedSignature = await loadCustomerPickupSignatureAdapter('RC10002');
  failTermsSync = false;
  assert.ok(sharedSignature.submissionId);
  assert.ok(sharedSignature.primaryDriverId);
  assert.equal(sharedSignature.termsConfirmation.orderId, 'RC10002');
  assert.ok(sharedSignature.termsConfirmation.items.length > 0);
  assert.equal(records.has('customer-self-service-terms-v1:RC10002'), false, 'no independent pre-signing terms write is needed');
  assert.equal(sharedSignature.signature, record.signature);
  assert.equal(sharedSignature.signedAt, record.signedAt);
  assert.equal(sharedSignature.inspectionRevision, snapshot.revision);
  const { loadCustomerSigningResult } = await server.ssrLoadModule('/src/shared/services/customerSigningResult.ts');
  const loadedAfterPhotoChanges = await loadCustomerSigningResult('RC10002', (await loadPreparation('RC10002')).draft.contractConfigSnapshot);
  assert.equal(loadedAfterPhotoChanges.signature, record.signature, 'same-vehicle photo revisions during and after signing retain the complete signing result');
  assert.ok(photoReads > 2, 'test advances photo revisions across real signature transaction reads');
  globalThis.window = originalWindow;
  const { saveCustomerPickupSignatureAdapter } = await server.ssrLoadModule('/src/shared/services/customerInspectionApi.ts');
  await saveCustomerPickupSignatureAdapter(sharedSignature);
  assert.deepEqual(await loadCustomerPickupSignatureAdapter('RC10002'), sharedSignature, 'same submission retry is idempotent');
  await assert.rejects(saveCustomerPickupSignatureAdapter({ ...sharedSignature, signature: 'data:image/png;base64,BB==' }), 'same submission cannot change evidence');
  await assert.rejects(saveCustomerPickupSignatureAdapter({ ...sharedSignature, submissionId: 'other-attempt' }), 'another tab cannot overwrite a committed signing result');
  assert.equal(await loadCustomerPickupSignatureAdapter('RC10001'), null);
  assert.equal((await loadPreparation('RC10001')).draft.contractSignature, undefined);
  await assert.rejects(savePreparationSignature('RC10002', record));
  const retained = await loadPreparation('RC10002');
  await savePreparation({ ...retained, draft: { ...retained.draft, confirmation: undefined } });
  assert.equal((await loadPreparation('RC10002')).draft.contractSignature.signature, record.signature);
  assert.deepEqual(contractMissingServices((await loadPreparation('RC10002')).draft), []);
  assert.deepEqual(contractMissingServices({ ...draft, documentReview: { state: 'REJECTED' } }, true), []);
  await assert.rejects(savePreparationSignature('RC10001', record));
  const beforeReset = await loadPreparation('RC10002');
  await savePreparation({ ...beforeReset, draft: { ...beforeReset.draft, demoContractResetRevision: undefined } });
  const reset = await loadPreparation('RC10002');
  assert.equal(reset.draft.contractSignature, undefined);
  assert.equal(reset.draft.contractSignatureHistory.at(-1).signature, record.signature);
  assert.deepEqual(reset.draft.drivers, beforeReset.draft.drivers);
  assert.equal(reset.draft.submittedAt, beforeReset.draft.submittedAt);
  assert.equal(reset.photos.length, beforeReset.photos.length);
  await savePreparation({ ...reset, draft: { ...reset.draft, contractSignature: record } });
  assert.equal((await loadPreparation('RC10002')).draft.contractSignature.signature, record.signature, 'reset only happens once');
  const RC10004Signature = { ...record, orderId: 'RC10004' };
  const RC10004Draft = { ...draft, orderId: 'RC10004', documentReview: { state: 'REJECTED' } };
  await savePreparation({ draft: RC10004Draft, photos: approved.photos });
  await assert.rejects(savePreparationSignature('RC10004', RC10004Signature), /INSPECTION_NOT_CONFIRMED/);
  const RC10004Snapshot = await loadPublishedInspection('RC10004');
  const RC10004Capture = { ...capture, orderId: 'RC10004', vehicleId: RC10004Snapshot.vehicleId, revision: RC10004Snapshot.revision };
  await captureRepository.save({ ...RC10004Capture, revision: 'DEMO-1' }, 0);
  await captureRepository.save({ ...RC10004Capture, vehicleId: 'OTHER-VEHICLE' }, 0);
  assert.equal(await loadSigningInspectionConfirmed('RC10004'), false, 'old version and other vehicle confirmations cannot satisfy RC10004');
  await captureRepository.save({ ...RC10004Capture, confirmation: undefined }, 0);
  assert.equal(await loadSigningInspectionConfirmed('RC10004'), false, 'an unconfirmed current draft is not completion');
  failWrite = true;
  await assert.rejects(captureRepository.save({ ...RC10004Capture, sequence: 2 }, 1));
  failWrite = false;
  assert.equal(await loadSigningInspectionConfirmed('RC10004'), false, 'failed confirmation cannot satisfy signing');
  for (const inspectionDone of [false, true]) {
    if (inspectionDone) await captureRepository.save({ ...RC10004Capture, sequence: 2 }, 1);
    for (const identityDone of [false, true]) for (const noticesDone of [false, true]) {
      const combination = { ...draft, orderId: 'RC10004', submittedAt: identityDone ? draft.submittedAt : undefined, confirmation: noticesDone ? draft.confirmation : undefined };
      await savePreparation({ draft: combination, photos: approved.photos });
      if (!inspectionDone || !noticesDone) {
        await assert.rejects(savePreparationSignature('RC10004', RC10004Signature), 'all incomplete combinations reject direct saving');
        assert.equal((await loadPreparation('RC10004')).draft.contractSignature, undefined);
      }
    }
  }
  await savePreparation({ draft: RC10004Draft, photos: approved.photos });
  assert.deepEqual(contractMissingServices(RC10004Draft, true), [], 'historical rejected documents do not block this release');
  await savePreparation({ draft: { ...RC10004Draft, documentReview: { state: 'PENDING_ONSITE_CHECK' }, confirmation: undefined }, photos: approved.photos });
  await assert.rejects(savePreparationSignature('RC10004', RC10004Signature), 'missing terms still block RC10004 signing');
  const noIdentityDraft = { ...draft, orderId: 'RC10004', submittedAt: undefined, documentReview: { state: 'REJECTED', rejectionReason: 'historical' } };
  await savePreparation({ draft: noIdentityDraft, photos: approved.photos });
  failWrite = true;
  await assert.rejects(savePreparationSignature('RC10004', RC10004Signature));
  failWrite = false;
  assert.equal((await loadPreparation('RC10004')).draft.contractSignature, undefined);
  await savePreparationSignature('RC10004', RC10004Signature);
  const savedWithoutIdentity = await loadPreparation('RC10004');
  assert.equal(savedWithoutIdentity.draft.contractSignature.signature, record.signature);
  assert.equal(savedWithoutIdentity.draft.submittedAt, undefined);
  assert.deepEqual(savedWithoutIdentity.draft.documentReview, noIdentityDraft.documentReview);
  assert.deepEqual(savedWithoutIdentity.photos, approved.photos);
  await assert.rejects(savePreparationSignature('RC10004', RC10004Signature));
  await assert.rejects(savePreparationSignature('RC10004', record));
  const otherOrderBeforeReset = await loadPreparation('RC10004');
  const publicationKey = 'ix-rental-customer-inspection-v1:RC10002';
  records.set(publicationKey, { orderId: 'RC10002', snapshot: { source: 'STORE_OPS' } });
  const otherCaptureKey = 'customer-vehicle-condition-v1:other-order';
  records.set(otherCaptureKey, { orderId: 'RC10004', confirmation: { at: '2026-11-03T00:00:00Z' } });
  records.set('customer-vehicle-condition-v1:older-revision', { orderId: 'RC10002', confirmation: { at: '2026-11-02T00:00:00Z' }, photos: ['old-photo'] });
  records.set('customer-contract-file-v1:RC10002', { orderId: 'RC10002', url: 'old-contract' });
  const legacyMarkers = new Map([['ix-rental:customer-inspection:RC10002', JSON.stringify({ confirmedAt: '2026-11-03T00:00:00Z', vehicleId: 'DEMO-RC10002-VEHICLE' })]]);
  globalThis.window = { localStorage: {
    getItem: key => legacyMarkers.get(key) ?? null,
    removeItem: key => legacyMarkers.delete(key),
  } };
  const cleanRC10002 = await resetDemoPreparation('RC10002');
  assert.equal(cleanRC10002.draft.contractSignature, undefined);
  assert.equal(cleanRC10002.draft.confirmation, undefined);
  assert.equal(cleanRC10002.draft.submittedAt, undefined);
  assert.equal(cleanRC10002.draft.bookingConfirmed, false);
  assert.equal(cleanRC10002.photos.length, 0);
  assert.deepEqual(await loadPreparation('RC10002'), cleanRC10002, 'reset survives re-verifying the same account');
  for (const database of ['customer-self-service-terms-v1', 'customer-pickup-signature-v1', 'customer-contract-file-v1']) {
    assert.equal(records.has(`${database}:RC10002`), false, `${database} cleared for current account`);
  }
  assert.equal([...records.entries()].some(([key, value]) => key.startsWith('customer-vehicle-condition-v1:') && value.orderId === 'RC10002'), false, 'all old inspection revisions cleared');
  assert.equal(legacyMarkers.has('ix-rental:customer-inspection:RC10002'), false, 'confirmation marker does not override the initial fixture');
  assert.equal(records.has(publicationKey), true, 'store vehicle publication is preserved');
  assert.equal(records.has(otherCaptureKey), true, 'other order inspection is preserved');
  assert.deepEqual(await loadPreparation('RC10004'), otherOrderBeforeReset, 'other order progress is preserved');
  const { rejectedPreparationFixture } = await server.ssrLoadModule(root + 'modules/online-checkin/reviewFixture.ts');
  for (const account of ['RC10003', 'RC10004', 'RC10005']) {
    await savePreparation({ draft: { ...newDraft(account), submittedAt: '2026-11-03T00:00:00Z' }, photos: [] });
    const expected = account === 'RC10005' ? approvedPreparationFixture() : rejectedPreparationFixture(account);
    const restored = await resetDemoPreparation(account);
    // Fixture confirmations use the current clock; verify their content and
    // persisted result independently of the millisecond they were generated.
    expected.draft.confirmation.confirmations.forEach((item, index) => {
      const generated = restored.draft.confirmation.confirmations[index].confirmedAt;
      assert.ok(Number.isFinite(Date.parse(generated)));
      item.confirmedAt = generated;
    });
    assert.deepEqual(restored, expected, `${account} restores its own review scenario`);
    assert.deepEqual(await loadPreparation(account), expected, `${account} initial scenario survives reload`);
  }
  failWrite = true;
  await assert.rejects(resetDemoPreparation('RC10002'), /QUOTA_EXCEEDED/, 'failed reset is reported');
  failWrite = false;
  assert.deepEqual(await resetDemoPreparation('RC10002'), cleanRC10002, 'reset can be retried');
  const xhsPublicationKey = 'ix-rental-customer-inspection-v1:RC10014';
  records.set(xhsPublicationKey, { orderId: 'RC10014', snapshot: { source: 'STORE_OPS' } });
  const cleanXhs = await resetDemoPreparation('RC10014');
  assert.deepEqual(await loadPreparation('RC10014'), cleanXhs, 'historical demo migrations do not undo explicit reset');
  assert.equal(records.has(xhsPublicationKey), true, 'historical demo migrations do not clear independent store data after reset');
  console.log('Mock order reset: persisted restart, all inspection revisions, shared signing records, review fixtures, order isolation and retry passed.');
  console.log('Signing storage: failure/retry, reload, duplicate and cross-order rejection passed.');
  console.log('Signing flow: inspection-only admission, embedded terms, all 8 combinations, six languages, single home entry and two-step pickup journey, confirmation evidence and return destinations passed.');
  console.log('Contract service: six-language cards, pending/signed/empty states, route, order and revision isolation passed.');
} finally { globalThis.window = originalWindow; globalThis.indexedDB = originalIndexedDB; await server.close(); }
