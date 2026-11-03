import assert from 'node:assert/strict';
import { createServer } from 'vite';
const originalDateNow = Date.now;
Date.now = () => Date.parse('2026-10-31T12:00:00Z');
const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, logLevel: 'error', server: { middlewareMode: true } });
try {
  const model = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/model.ts');
  const { createPreparationMaterials, preparationMaterials, preparationConfirmationItems, preparationTermsComplete } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/materials.ts');
  const { preparationTranslations } = await server.ssrLoadModule('/src/apps/selfservice-rental/i18n/preparation.ts');
  const { resolveRentalMaterialConfiguration, updateRentalMaterialConfirmation } = await server.ssrLoadModule('/src/apps/selfservice-rental/components/rentalContractConfirmation.ts');
  const { newDraft, newDriver, requiredDocuments, requiredDocumentPages, validDrivers, completion, canSubmit, submitDraft } = model;
  const { matchesPreparationBooking, findPreparationBooking, preparationOrderId, preparationEntryStep } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/verification.ts');
  assert.equal(preparationEntryStep(null), 'auth');
  assert.equal(preparationEntryStep('unknown'), 'auth');
  assert.equal(preparationEntryStep('drivers'), 'drivers');
  assert.equal(preparationEntryStep('details'), 'details');
  assert.equal(preparationEntryStep('notices'), 'notices');
  assert.equal(matchesPreparationBooking(' prep01 ', ' 5678 '), true);
  assert.equal(matchesPreparationBooking('prep01', '5678'), true);
  assert.equal(matchesPreparationBooking('prep01', '56-78'), true);
  assert.equal(matchesPreparationBooking('XHS-NRT-20260319-312', '1012'), true);
  assert.equal(findPreparationBooking('XHS-NRT-20260319-312', '1012')?.orderId, 'ORD-20260319-012');
  for (const [reference, phoneLast4] of [['', '5678'], ['NRT-PREP-001', '5678'], ['PREP01', ''], ['PREP01', '1234'], ['PREP01', '567'], ['WRONG', '5678']]) {
    assert.equal(matchesPreparationBooking(reference, phoneLast4), false);
  }
  assert.equal(findPreparationBooking(' prep02 ', ' 5678 ')?.orderId, 'PREP02');
  assert.equal(findPreparationBooking('NRT-PREP-002', '5678'), undefined);
  assert.equal(findPreparationBooking('PREP02', '1234'), undefined);
  assert.equal(findPreparationBooking('PREP02', '567'), undefined);
  assert.equal(preparationOrderId('PREP02'), 'PREP02');
  assert.equal(preparationOrderId('XHS-NRT-20260319-312'), 'ORD-20260319-012');
  assert.equal(preparationOrderId('UNKNOWN'), 'PREP01');
  const untouched = newDraft('PREP02');
  assert.equal(untouched.orderId, 'PREP02');
  assert.deepEqual(completion(untouched, []), { booking: false, drivers: true, documents: false, terms: false }, 'prefilled valid driver data does not complete missing documents');
  assert.equal(untouched.confirmation, undefined);
  assert.equal(untouched.submittedAt, undefined);
  assert.throws(() => newDraft('UNKNOWN'), /UNKNOWN_PREPARATION_ORDER/);

  // Exercise the real storage functions against an asynchronous in-memory IDB adapter.
  const records = new Map();
  const originalIndexedDB = globalThis.indexedDB;
  let failWrite = false;
  globalThis.indexedDB = {
    open() {
      const request = {};
      request.result = {
        close() {},
        transaction() {
          const tx = { objectStore: () => ({
            get(key) {
              const read = {};
              queueMicrotask(() => { read.result = structuredClone(records.get(key)); tx.oncomplete(); });
              return read;
            },
            put(record, key) {
              const write = {};
              queueMicrotask(() => {
                if (failWrite) { tx.error = new Error('STORAGE_FULL'); tx.onerror(); return; }
                records.set(key, structuredClone(record)); write.result = key; tx.oncomplete();
              });
              return write;
            }
          }) };
          return tx;
        }
      };
      queueMicrotask(() => request.onsuccess());
      return request;
    }
  };
  try {
    const { loadPreparation, savePreparation } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/storage.ts');
    const { reopenPreparation } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/review.ts');
    for (const [orderId, state] of [['PREP04', 'REJECTED'], ['PREP05', 'APPROVED']]) {
      assert.equal(findPreparationBooking(` ${orderId.toLowerCase()} `, ' 5678 ')?.orderId, orderId);
      assert.equal(findPreparationBooking(orderId, '5678')?.orderId, orderId);
      failWrite = true;
      await assert.rejects(loadPreparation(orderId), /STORAGE_FULL/, 'initialization must report persistence failure');
      assert.equal(records.has(orderId), false);
      failWrite = false;
      const example = await loadPreparation(orderId);
      assert.equal(example.draft.documentReview.state, state);
      assert.ok(Object.values(completion(example.draft, example.photos)).every(Boolean));
      assert.ok((await example.photos[0].blob.text()).includes(orderId));
      assert.equal(records.get(orderId).draft.documentReview.state, state);
      if (state === 'APPROVED') {
        assert.equal(example.draft.documentReview.rejectionReasonKey, undefined);
        assert.equal(example.draft.documentReview.rejectedDocumentTypes, undefined);
        assert.throws(() => reopenPreparation(example.draft, example.photos, '2026-10-19T09:00:00Z'), /PREPARATION_NOT_REJECTED/);
      } else {
        const edited = { ...example, draft: reopenPreparation(example.draft, example.photos, '2026-10-19T09:00:00Z') };
        edited.draft.identityConfirmed = true;
        edited.draft = submitDraft(edited.draft, edited.photos, '2026-10-19T09:05:00Z');
        await savePreparation(edited);
        const reloaded = await loadPreparation(orderId);
        assert.equal(reloaded.draft.documentReview.state, 'PENDING_ONSITE_CHECK');
        assert.equal(reloaded.draft.reviewHistory.length, 1);
      }
    }
    const rejectedRecord = await loadPreparation('PREP03');
    assert.equal(rejectedRecord.draft.documentReview.state, 'REJECTED');
    assert.ok(Object.values(completion(rejectedRecord.draft, rejectedRecord.photos)).every(Boolean));
    const editableRecord = { ...rejectedRecord, draft: reopenPreparation(rejectedRecord.draft, rejectedRecord.photos, '2026-10-19T09:00:00Z') };
    failWrite = true;
    await assert.rejects(savePreparation(editableRecord), /STORAGE_FULL/);
    assert.equal((await loadPreparation('PREP03')).draft.documentReview.state, 'REJECTED');
    assert.ok((await loadPreparation('PREP03')).draft.submittedAt, 'failed reopen cannot unlock stored submission');
    failWrite = false;
    await savePreparation(editableRecord);
    const resumed = await loadPreparation('PREP03');
    assert.equal(resumed.draft.correctionStartedAt, '2026-10-19T09:00:00Z');
    assert.equal(resumed.draft.identityConfirmed, false);
    assert.equal(resumed.photos.length, rejectedRecord.photos.length);
    resumed.draft.identityConfirmed = true;
    const retrySubmission = { ...resumed, draft: submitDraft(resumed.draft, resumed.photos, '2026-10-19T09:05:00Z') };
    failWrite = true;
    await assert.rejects(savePreparation(retrySubmission), /STORAGE_FULL/);
    assert.equal((await loadPreparation('PREP03')).draft.submittedAt, undefined, 'failed resubmission stays editable');
    failWrite = false;
    await savePreparation(retrySubmission);
    assert.equal((await loadPreparation('PREP03')).draft.documentReview.state, 'PENDING_ONSITE_CHECK');
    assert.equal((await loadPreparation('PREP03')).draft.reviewHistory.length, 1);
    const primary = await loadPreparation();
    primary.draft.bookingConfirmed = true;
    primary.draft.submittedAt = '2026-10-19T08:00:00Z';
    primary.photos = [{ id: 'primary-only', driverId: 'primary', kind: 'licence', page: 'front', name: 'sample.png', blob: new Blob(['primary'], { type: 'image/png' }) }];
    await savePreparation(primary);
    const legacySecond = { draft: { ...newDraft('PREP02'), bookingConfirmed: true, submittedAt: '2026-10-19T08:00:00Z', identityConfirmed: true, confirmation: {}, drivers: [...newDraft('PREP02').drivers, newDriver('old-extra')] }, photos: primary.photos };
    delete legacySecond.draft.demoResetRevision;
    records.set('PREP02', structuredClone(legacySecond));
    failWrite = true;
    await assert.rejects(() => loadPreparation('PREP02'), /STORAGE_FULL/, 'failed reset must not return an unpersisted success');
    assert.equal(records.get('PREP02').draft.submittedAt, legacySecond.draft.submittedAt);
    failWrite = false;
    const second = await loadPreparation('PREP02');
    assert.equal(second.draft.demoResetRevision, model.PREP02_RESET_REVISION);
    assert.equal(second.draft.submittedAt, undefined);
    assert.equal(second.draft.confirmation, undefined);
    assert.equal(second.draft.identityConfirmed, undefined);
    assert.equal(second.draft.drivers.length, 1);
    assert.equal(records.get('PREP02').photos.length, 0, 'reset must delete persisted old blobs');
    assert.deepEqual(completion(second.draft, second.photos), { booking: false, drivers: true, documents: false, terms: false });
    assert.equal(second.photos.length, 0, 'new order must not inherit old photos');
    second.draft.bookingConfirmed = true;
    await savePreparation(second);
    assert.equal((await loadPreparation('PREP02')).draft.bookingConfirmed, true, 'selected order restores its own progress');
    assert.equal((await loadPreparation('PREP02')).draft.submittedAt, undefined);
    const restoredPrimary = await loadPreparation('PREP01');
    assert.equal(restoredPrimary.draft.submittedAt, primary.draft.submittedAt);
    assert.equal(restoredPrimary.photos.length, 1);
    assert.equal(restoredPrimary.photos[0].blob.size, primary.photos[0].blob.size);
    failWrite = true;
    await assert.rejects(() => savePreparation({ ...second, draft: { ...second.draft, bookingConfirmed: false } }), /STORAGE_FULL/);
    assert.equal((await loadPreparation('PREP02')).draft.bookingConfirmed, true, 'failed save keeps prior saved record');
    failWrite = false;
    const { savedPreparationLocks, prepareStepSubmission } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/stepLocks.ts');
    let saved = await loadPreparation('PREP02');
    assert.equal(savedPreparationLocks(saved.draft, saved.photos).booking, false, 'reload preserves an editable checked draft');
    await savePreparation({ ...saved, draft: { ...saved.draft, bookingConfirmed: false } });
    assert.equal((await loadPreparation('PREP02')).draft.bookingConfirmed, false, 'cancelling acknowledgement persists');
    await savePreparation(saved);
    const attempted = { ...saved, draft: prepareStepSubmission(saved.draft, saved.photos, 'booking') };
    failWrite = true;
    await assert.rejects(() => savePreparation(attempted), /STORAGE_FULL/);
    saved = await loadPreparation('PREP02');
    assert.equal(savedPreparationLocks(saved.draft, saved.photos).booking, false, 'failed explicit submission does not lock after refresh');
    failWrite = false;
    await savePreparation(attempted);
    saved = await loadPreparation('PREP02');
    assert.equal(savedPreparationLocks(saved.draft, saved.photos).booking, true, 'successful explicit submission restores locked state after refresh');
    const frozenTitle = saved.draft.contractConfigSnapshot.rentalGuidelines.attachments[0].title = 'Frozen configured notes';
    await savePreparation(saved);
    assert.equal((await loadPreparation('PREP02')).draft.contractConfigSnapshot.rentalGuidelines.attachments[0].title, frozenTitle, 'loading cannot regenerate or replace the frozen order configuration');
    const legacyDraft = structuredClone(saved);
    delete legacyDraft.draft.configurationVersion;
    delete legacyDraft.draft.contractConfigSnapshot;
    await savePreparation(legacyDraft);
    const migrated = await loadPreparation('PREP02');
    assert.equal(migrated.draft.configurationVersion, 1);
    assert.ok(migrated.draft.contractConfigSnapshot);
    assert.equal(migrated.draft.bookingConfirmed, true, 'migration keeps entered information');
    assert.ok(records.get('PREP02').draft.contractConfigSnapshot, 'migrated snapshot is persisted for future reloads');
    await assert.rejects(() => loadPreparation('UNKNOWN'), /UNKNOWN_PREPARATION_ORDER/);
    records.set('PREP02', { ...primary, draft: { ...primary.draft, demoResetRevision: model.PREP02_RESET_REVISION } });
    await assert.rejects(() => loadPreparation('PREP02'), /INVALID_DRAFT/, 'mismatched record cannot become target order');
  } finally {
    if (originalIndexedDB === undefined) delete globalThis.indexedDB;
    else globalThis.indexedDB = originalIndexedDB;
  }
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { PreparationVerification } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationVerification.tsx');
  const { LanguageProvider } = await server.ssrLoadModule('/src/apps/selfservice-rental/contexts/LanguageContext.tsx');
  const verificationProps = { reference: '', phoneLast4: '', onReferenceChange() {}, onPhoneLast4Change() {}, onSubmit() {}, loading: false, loadError: false, onRetry() {} };
  function renderVerification(language, patch = {}) {
    return renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationVerification, { ...verificationProps, ...patch })));
  }
  for (const language of Object.keys(preparationTranslations)) {
    const markup = renderVerification(language);
    const copy = preparationTranslations[language];
    assert.ok(markup.includes(copy.prepServiceTitle));
    assert.ok(markup.includes(copy.prepViewJourney));
    assert.ok(markup.includes(copy.prepEntryPreparationHint));
    assert.ok(markup.includes(copy.prepEntryStatusHint));
    assert.ok(!markup.includes(copy.prepVerifyBenefitDocuments));
    assert.ok(markup.includes(copy.prepReferenceHint));
    assert.ok(markup.includes(copy.prepPhoneLast4Hint));
    assert.ok(markup.includes(copy.prepPhoneLast4));
    assert.match(markup, /type="submit" disabled=""/);
  }
  assert.doesNotMatch(renderVerification('zh-CN', { reference: 'NRT-PREP-001', phoneLast4: '5678' }), /type="submit" disabled=""/);
  assert.match(renderVerification('zh-CN', { reference: '   ', phoneLast4: '5678' }), /type="submit" disabled=""/);
  assert.match(renderVerification('zh-CN', { reference: 'NRT-PREP-001', phoneLast4: '5678', loading: true }), /type="submit" disabled=""/);
  assert.match(renderVerification('zh-CN', { reference: 'NRT-PREP-001', phoneLast4: '5678', loadError: true }), /role="alert"/);
  assert.match(renderVerification('zh-CN', { error: preparationTranslations['zh-CN'].prepAuthError }), /aria-invalid="true"/);
  const { PreparationTripSummary } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationTripSummary.tsx');
  const { publishedTripAssignment } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PublishedPreparationTripSummary.tsx');
  const originalVehicle = { status: 'ASSIGNED', model: 'Honda Stepwgn', plate: '成田330し110', fuelType: 'regular' };
  const publishedVehicle = { status: 'ready', orderId: 'ORD-20260319-012', snapshot: { orderId: 'ORD-20260319-012', vehicle: { model: 'Honda Stepwgn', plate: '成田330し110' } } };
  const resolveVehicle = state => publishedTripAssignment('ORD-20260319-012', state, originalVehicle);
  assert.deepEqual(resolveVehicle(publishedVehicle), originalVehicle);
  const withPhoto = vehicleId => ({ ...publishedVehicle, snapshot: { ...publishedVehicle.snapshot, vehicleId: 'FLEET-110', groups: { exteriorAndDamage: { photos: [{ vehicleId, url: '/current-vehicle.jpg' }] } } } });
  assert.equal(resolveVehicle(withPhoto('FLEET-110')).imageUrl, undefined, 'inspection evidence is not a verified vehicle display image');
  assert.equal(resolveVehicle(withPhoto('OTHER-VEHICLE')).imageUrl, undefined);

  assert.deepEqual(resolveVehicle({ ...publishedVehicle, snapshot: { ...publishedVehicle.snapshot, vehicle: { ...publishedVehicle.snapshot.vehicle, model: 'Honda Stepwgn or similar' } } }), originalVehicle);
  assert.deepEqual(resolveVehicle({ ...publishedVehicle, snapshot: { ...publishedVehicle.snapshot, vehicle: { model: 'Toyota Prius', plate: 'NEW-PLATE' } } }), { status: 'ASSIGNED', model: 'Toyota Prius', plate: 'NEW-PLATE' });
  assert.equal(resolveVehicle({ status: 'loading', orderId: 'ORD-20260319-012' }), undefined);
  assert.equal(resolveVehicle({ status: 'error', orderId: 'ORD-20260319-012' }), undefined);
  assert.equal(resolveVehicle({ ...publishedVehicle, orderId: 'PREP01' }), undefined);
  assert.equal(resolveVehicle({ ...publishedVehicle, snapshot: { ...publishedVehicle.snapshot, orderId: 'PREP01' } }), undefined);
  assert.deepEqual(resolveVehicle({ status: 'empty', orderId: 'ORD-20260319-012' }), originalVehicle);

  const currentAssignment = (await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/bookingFixtures.ts')).preparationBooking('ORD-20260319-012').vehicleAssignment;
  const { DEFAULT_RENTAL_CAR_IMAGE } = await server.ssrLoadModule('/src/apps/selfservice-rental/utils/imageFallback.ts');
  assert.equal(currentAssignment.imageUrl, DEFAULT_RENTAL_CAR_IMAGE);
  assert.equal(currentAssignment.imageCredit, undefined);
  const photoAssignment = { ...currentAssignment, imageUrl: '/honda-stepwgn.jpg', imageCredit: { source: 'https://example.com/photo', author: 'Example', license: 'Example license' } };
  assert.ok(photoAssignment.imageUrl.includes('honda-stepwgn'));
  assert.equal(publishedTripAssignment('ORD-20260319-012', publishedVehicle, photoAssignment).imageUrl, photoAssignment.imageUrl);
  const changedModel = { ...publishedVehicle, snapshot: { ...publishedVehicle.snapshot, vehicle: { model: 'Toyota Prius', plate: photoAssignment.plate } } };
  assert.equal(publishedTripAssignment('ORD-20260319-012', changedModel, photoAssignment).imageUrl, undefined);
  const reservation = {
    orderNumber: 'PREP01', confirmationCode: 'NRT-PREP-001',
    rentalPeriod: { start: '2026-11-01 10:00 (JST)', end: '2026-11-04 10:00 (JST)', duration: '3' },
    pickupLocation: preparationTranslations['zh-CN'].prepStore,
    returnLocation: preparationTranslations['zh-CN'].prepStore,
    vehicle: { name: preparationTranslations['zh-CN'].prepGroup },
    customer: { name: 'Alex Smith', phone: '+819012345678', email: 'alex.smith@example.com' },
  };
  const summaryMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Toyota Yaris', onDetails() {} })));
  for (const value of ['PREP01', 'Toyota Yaris', '2026-11-01 10:00 (JST)', '2026-11-04 10:00 (JST)', preparationTranslations['zh-CN'].prepViewTripDetails]) assert.ok(summaryMarkup.includes(value));
  assert.match(summaryMarkup, /type="button"/);
  assert.ok(summaryMarkup.indexOf('Alex Smith') < summaryMarkup.indexOf('Toyota Yaris'));
  assert.ok(summaryMarkup.includes('+819012345678'));
  const assignedMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Toyota Yaris', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType: 'regular' }, onDetails() {} })));
  assert.ok(!assignedMarkup.includes(preparationTranslations['zh-CN'].prepAssignedVehicle));
  assert.ok(assignedMarkup.includes('成田330あ1234'));
  assert.ok(assignedMarkup.includes(preparationTranslations['zh-CN'].prepFuelTypeRegular));
  const missingFuelMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Toyota Yaris', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: 'NEW-PLATE' }, onDetails() {} })));
  assert.ok(missingFuelMarkup.includes('油品'));
  assert.ok(missingFuelMarkup.includes(preparationTranslations['zh-CN'].prepInspectionMissing));
  assert.ok(!missingFuelMarkup.includes('data-fuel-sign'));
  const unassignedMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Toyota Yaris', vehicleAssignment: { status: 'UNASSIGNED' }, onDetails() {} })));
  assert.ok(unassignedMarkup.includes(preparationTranslations['zh-CN'].prepVehicleUnassigned));
  assert.doesNotMatch(unassignedMarkup, /成田330あ1234|普通汽油|油品/);
  assert.doesNotMatch(unassignedMarkup, /data-fuel-sign/);
  const fuelCases = [
    ['regular', 'prepFuelTypeRegular', 'jp-regular.svg'],
    ['highOctane', 'prepFuelTypeHighOctane', 'jp-premium.svg'],
    ['diesel', 'prepFuelTypeDiesel', 'jp-diesel.svg'],
    ['electric', 'prepFuelTypeElectric', undefined],
  ];
  for (const language of Object.keys(preparationTranslations)) {
    for (const [fuelType, label, asset] of fuelCases) {
      const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Toyota Yaris', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType }, onDetails() {} })));
      assert.ok(markup.includes(preparationTranslations[language][label]));
      if (asset) {
        const { default: signSource } = await server.ssrLoadModule(`/src/apps/selfservice-rental/assets/fuel-signs/${asset}`);
        const expectedImage = renderToStaticMarkup(React.createElement('img', { src: signSource, alt: preparationTranslations[language][label] }));
        const expectedSource = expectedImage.match(/<img src="([^"]+)"/)[1];
        assert.ok(markup.includes(`src="${expectedSource}"`), `${fuelType} uses its own fuel sign`);
        assert.ok(markup.includes(`alt="${preparationTranslations[language][label]}"`));
        assert.ok(markup.includes(`data-fuel-sign="${fuelType}"`));
      } else assert.doesNotMatch(markup, /data-fuel-sign|jp-(regular|premium|diesel)/);
    }
  }
  for (const fuelType of [undefined, null, '', 'unknown', 'toString', '__proto__']) {
    const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Toyota Yaris', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType }, onDetails() {} })));
    assert.doesNotMatch(markup, /data-fuel-sign/);
    assert.ok(markup.includes(preparationTranslations['zh-CN'].prepInspectionMissing));
    assert.ok(markup.includes('成田330あ1234'));
  }

  const { identityDeadlinePassed } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/identityDeadline.ts');
  const cutoff = Date.parse('2026-11-01T06:00:00+09:00');
  assert.equal(identityDeadlinePassed('PREP01', cutoff - 1), false);
  assert.equal(identityDeadlinePassed('PREP01', cutoff), false);
  assert.equal(identityDeadlinePassed('PREP01', cutoff + 1), true);
  assert.equal(identityDeadlinePassed('PREP01', Date.parse('2026-10-31T21:00:00Z')), false);
  assert.throws(() => model.submitIdentityDraft(newDraft('PREP01'), [], '2026-11-01T06:00:00.001+09:00'), /IDENTITY_DEADLINE_PASSED/);
  const { PreparationServiceEntriesContent: PreparationServiceEntries } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationServiceEntries.tsx');
  const { preparationServiceBlockReason } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/servicePresentation.ts');
  const { PreparationServiceDialogContent } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationServiceDialog.tsx');
  const availableServiceState = { busy: false, identityClosed: false, pickupReady: true, rentalActive: true, pickupState: 'ready' };
  for (const service of ['identity', 'pickup', 'renewal']) {
    assert.equal(preparationServiceBlockReason(service, availableServiceState), undefined);
    assert.equal(preparationServiceBlockReason(service, { ...availableServiceState, busy: true }), 'prepServiceBusy');
  }
  assert.equal(preparationServiceBlockReason('identity', { ...availableServiceState, identityClosed: true }), 'prepIdentityExpired');
  assert.equal(preparationServiceBlockReason('identity', { ...availableServiceState, identityClosed: true, identityReason: 'prepIdentityDemoClosed' }), 'prepIdentityDemoClosed');
  assert.equal(preparationServiceBlockReason('renewal', { ...availableServiceState, rentalActive: false }), 'prepRenewalWaitingHint');
  for (const [pickupState, expected] of [['loading', 'prepLoading'], ['error', 'prepInspectionLoadError'], ['empty', 'prepPickupWaitingHint']]) {
    assert.equal(preparationServiceBlockReason('pickup', { ...availableServiceState, pickupReady: false, pickupState }), expected);
  }
  for (const language of Object.keys(preparationTranslations)) {
    const copy = preparationTranslations[language];
    for (const [title, reason] of [
      ['prepIdentityTileTitle', 'prepIdentityExpired'], ['prepPickupTileTitle', 'prepLoading'],
      ['prepPickupTileTitle', 'prepPickupWaitingHint'], ['prepPickupTileTitle', 'prepInspectionLoadError'],
      ['prepRenewal', 'prepRenewalWaitingHint'], ['prepIdentityTileTitle', 'prepServiceBusy'],
    ]) {
      const retry = reason === 'prepInspectionLoadError';
      const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationServiceDialogContent, { title, reason, onClose() {}, onRetry: retry ? () => {} : undefined })));
      assert.ok(markup.includes(copy[title]));
      const renderedReason = renderToStaticMarkup(React.createElement('p', null, copy[reason]));
      assert.ok(markup.includes(renderedReason.slice(3, -4)), `${language}: localized restriction reason`);
      assert.ok(markup.includes(copy.prepInspectionIssueAcknowledge));
      assert.equal((markup.match(/<button\b/g) || []).length, retry ? 2 : 1);
      if (retry) assert.ok(markup.includes(copy.prepRetry));
    }
  }
  for (const language of Object.keys(preparationTranslations)) {
    const servicesMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationServiceEntries, { draft: newDraft('PREP02'), hasPreparation: false, pickupReady: true, rentalActive: true, phone: '+81 50 0000 0000', onIdentity() {}, onInspection() {}, onNotices() {} })));
    assert.ok(!servicesMarkup.includes(preparationTranslations[language].prepIdentityDeadline));
    assert.ok(!servicesMarkup.includes('data-preparation-service="notices"'));
    assert.ok(!servicesMarkup.includes(preparationTranslations[language].prepQuickPickupHint));
    for (const key of ['prepSelfServices', 'prepIdentityTileTitle', 'prepPickupTileTitle', 'prepRenewal', 'prepFeedbackTitle']) assert.ok(servicesMarkup.includes(preparationTranslations[language][key]));
    assert.match(servicesMarkup, /href="tel:\+815000000000"/);
    assert.equal((servicesMarkup.match(/<article /g) || []).length, 4);
    const serviceOrder = [...servicesMarkup.matchAll(/data-preparation-service="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(serviceOrder, ['identity', 'pickup', 'renewal', 'feedback']);
    assert.ok(servicesMarkup.includes(preparationTranslations[language].prepFeedbackTitle));
    assert.ok(!servicesMarkup.includes(preparationTranslations[language].prepFeedbackSummary));
    assert.ok(!servicesMarkup.includes(preparationTranslations[language].prepRenewalSummary));
    assert.ok(servicesMarkup.includes('target="_blank"'));
    assert.ok(servicesMarkup.includes('rel="noopener noreferrer"'));
    const renewal = servicesMarkup.split('<article').find(part => part.includes('data-preparation-service="renewal"'));
    assert.ok(!renewal.includes('lucide-chevron-right'));
    assert.ok(!renewal.includes('lucide-phone'));

    assert.ok(servicesMarkup.includes(preparationTranslations[language].prepIdentityTileTitle));
    assert.ok(!servicesMarkup.includes('step=inspection'));
  }
  const xhsIdentityMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationServiceEntries, { draft: newDraft('ORD-20260319-012'), hasPreparation: false, phone: '+81 50 0000 0000', onIdentity() {} })));
  const xhsIdentityTile = xhsIdentityMarkup.split('<article').find(part => part.includes('data-preparation-service="identity"'));
  assert.ok(xhsIdentityTile?.includes('aria-haspopup="dialog"'), 'XHS local demo identity entry remains clickable while styled unavailable');
  const identityDemoExplanation = preparationTranslations['zh-CN'].prepIdentityDemoClosed;
  assert.ok(!xhsIdentityMarkup.includes(`>${identityDemoExplanation}<`), 'demo-only explanation is not rendered as standalone homepage text; the deadline notice may share its prefix');
  for (const language of Object.keys(preparationTranslations)) {
    const locked = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationServiceEntries, { draft: newDraft('PREP02'), hasPreparation: false, phone: '+81 50 0000 0000', onIdentity() {}, onPickup() {} })));
    assert.equal((locked.match(/aria-haspopup="dialog"/g) || []).length, 2);
    assert.doesNotMatch(locked, /\s(?:disabled|aria-disabled)=|cursor-not-allowed/);
    assert.ok(!locked.includes('href="tel:'));
    assert.ok(locked.includes('target="_blank"'));
    const feedback = locked.split('<article').find(part => part.includes('data-preparation-service="feedback"'));
    assert.ok(feedback.includes('href="https://docs.google.com/forms/'));
    assert.ok(!feedback.includes('aria-disabled'));
    assert.ok(!locked.includes(preparationTranslations[language].prepPickupUnavailable));
    assert.ok(!locked.includes(preparationTranslations[language].prepRentalServicesGate));
  }
  for (const rentalActive of [false, true]) {
    for (let visit = 0; visit < 2; visit++) {
      const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationServiceEntries, { draft: newDraft('PREP02'), hasPreparation: false, disabled: true, rentalActive, phone: '', onIdentity() {}, onPickup() {} })));
      const feedback = markup.split('<article').find(part => part.includes('data-preparation-service="feedback"'));
      assert.ok(feedback.includes('href="https://docs.google.com/forms/'), 'feedback stays open during other work and repeated visits');
      assert.ok(!feedback.includes('aria-disabled'));
    }
  }
  const { identityServicePresentation } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/servicePresentation.ts');
  const { rentalServicesAvailable } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/servicePresentation.ts');
  assert.equal(rentalServicesAvailable('PREP02', null), false);
  for (const status of [undefined, 'PENDING', 'RETURNED', 'CANCELLED']) assert.equal(rentalServicesAvailable('PREP02', { orderId: 'PREP02', orderLifecycleStatus: status }), false);
  assert.equal(rentalServicesAvailable('PREP02', { orderId: 'PREP01', orderLifecycleStatus: 'PICKED_UP' }), false);
  assert.equal(rentalServicesAvailable('PREP02', { orderId: 'PREP02', orderLifecycleStatus: 'PICKED_UP' }, false), false);
  assert.equal(rentalServicesAvailable('PREP02', { orderId: 'PREP02', orderLifecycleStatus: 'PICKED_UP' }), true);
  const serviceDraft = newDraft('PREP02');
  assert.equal(identityServicePresentation(serviceDraft, false).status, 'prepServiceNotStarted', 'prefilled contact details are not preparation progress');
  assert.equal(identityServicePresentation(serviceDraft, true).status, 'prepServiceDraft');
  const serviceSubmitted = { ...serviceDraft, submittedAt: '2026-10-20T01:00:00Z' };
  const compactPendingMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationServiceEntries, { draft: serviceSubmitted, hasPreparation: true, phone: '+81 50 0000 0000', onIdentity() {} })));
  assert.ok(compactPendingMarkup.includes(preparationTranslations['zh-CN'].prepSubmitted));
  assert.ok(compactPendingMarkup.includes(preparationTranslations['zh-CN'].prepServiceViewSubmitted));
  assert.ok(!compactPendingMarkup.includes(preparationTranslations['zh-CN'].prepPendingHint), 'pending status does not repeat its explanation');
  assert.ok(!compactPendingMarkup.includes(preparationTranslations['zh-CN'].prepIdentityDescription), 'service purpose and benefit use one concise sentence');
  assert.equal(identityServicePresentation(serviceSubmitted, true).status, 'prepSubmitted', 'completed preparation is not approval');
  assert.equal(identityServicePresentation({ ...serviceSubmitted, documentReview: { state: 'APPROVED' } }, true).action, 'prepServiceViewResult');
  const serviceRejected = { ...serviceSubmitted, documentReview: { state: 'REJECTED', rejectionReason: 'Please replace the blurry photo' } };
  assert.equal(identityServicePresentation(serviceRejected, true).action, 'prepReviewModify');
  assert.equal(identityServicePresentation({ ...serviceRejected, submittedAt: undefined, correctionStartedAt: '2026-10-20T02:00:00Z' }, true).status, 'prepServiceNeedsUpdate', 'correction retains rejection until resubmission');
  const rejectedServicesMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'en' }, React.createElement(PreparationServiceEntries, { draft: serviceRejected, hasPreparation: true, phone: '+81 50 0000 0000', onIdentity() {} })));
  assert.ok(rejectedServicesMarkup.includes('Please replace the blurry photo'));
  assert.ok(rejectedServicesMarkup.includes(preparationTranslations.en.prepIdentityTileTitle));
  const photoSummary = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(PreparationTripSummary, { reservation, vehicleModel: 'Honda Stepwgn', vehicleAssignment: photoAssignment, onDetails() {} })));
  assert.ok(!photoSummary.includes(photoAssignment.imageCredit.source), 'homepage has no image credit link');
  assert.ok(photoSummary.indexOf(photoAssignment.plate) < photoSummary.indexOf('data-fuel-sign'), 'fuel follows the plate');
  const { default: ReservationDetailsScreen } = await server.ssrLoadModule('/src/apps/selfservice-rental/components/ReservationDetailsScreen.tsx');
  const { PreparationExtras } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationExtras.tsx');
  const { PreparationInsurance } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationInsurance.tsx');
  const detailsMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(React.Fragment, null,
    React.createElement(ReservationDetailsScreen, { embedded: true, orderDetails: reservation, setView() {}, afterBookingInfo: React.createElement(React.Fragment, null, React.createElement(PreparationExtras, { items: (await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/bookingFixtures.ts')).preparationBooking('PREP01').extras }), React.createElement(PreparationInsurance, { planKey: 'prepBasicInsurance' })) }))));
  for (const value of ['NRT-PREP-001', 'Toyota Yaris', preparationTranslations['zh-CN'].prepExtras, preparationTranslations['zh-CN'].prepInsurance, 'Alex Smith', '+819012345678']) assert.ok(detailsMarkup.includes(value));
  assert.doesNotMatch(detailsMarkup, /tel:|\+81 50 0000 0000/);
  assert.doesNotMatch(detailsMarkup, /type="checkbox"/);
  const { TripVehicleContent } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationTripVehicle.tsx');
  const photoDetails = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: 'zh-CN' }, React.createElement(TripVehicleContent, { state: { ...publishedVehicle, snapshot: { ...publishedVehicle.snapshot, groups: {} } }, assignment: photoAssignment, onRetry() {} })));
  assert.ok(photoDetails.includes(photoAssignment.imageCredit.source), 'details preserve source attribution');
  assert.ok(photoDetails.includes(photoAssignment.imageCredit.author));
  const { loadPublishedInspection: loadTripVehicle } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/fixtures.ts');
  const tripSnapshot = await loadTripVehicle('PREP01');
  for (const language of Object.keys(preparationTranslations)) {
    const vehicleCard = React.createElement(TripVehicleContent, { state: {status:'ready',orderId:'PREP01',snapshot:tripSnapshot},onRetry() {} });
    const markup = renderToStaticMarkup(React.createElement(LanguageProvider, {initialLang:language},
      React.createElement(ReservationDetailsScreen, {embedded:true, customerInfoFirst:true, beforeBookingInfo:vehicleCard,
        orderDetails:reservation,setView() {},afterBookingInfo:React.createElement(PreparationInsurance,{planKey:'prepBasicInsurance'})})));
    assert.ok(markup.indexOf('data-trip-vehicle') < markup.indexOf('Alex Smith'));
    assert.ok(markup.indexOf('Alex Smith') < markup.indexOf('NRT-PREP-001'));
    assert.equal((markup.match(/Alex Smith/g) ?? []).length, 1, 'customer information is not duplicated');
    assert.ok(markup.includes(tripSnapshot.vehicle.plate));
    assert.doesNotMatch(markup, /prepInspectionVehicle|prepInspectionPlate|prepInspectionModel/);
    for (const status of ['loading','empty','error']) {
      const stateMarkup = renderToStaticMarkup(React.createElement(LanguageProvider,{initialLang:language},
        React.createElement(TripVehicleContent,{state:{status,orderId:'PREP01'},onRetry() {}})));
      assert.ok(stateMarkup.includes(preparationTranslations[language][status === 'loading' ? 'prepLoading' : status === 'error' ? 'prepInspectionLoadError' : 'prepInspectionEmpty']));
      assert.equal(stateMarkup.includes('<button'),status === 'error');
    }
  }
  assert.ok(detailsMarkup.indexOf('NRT-PREP-001') < detailsMarkup.indexOf('Alex Smith'), 'default shared detail layout retains original order');
  const { preparationPrimaryLabel } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/primaryAction.ts');
  const noSteps = { booking: false, drivers: false, terms: false };
  const allSteps = { booking: true, drivers: true, terms: true };
  const { requiredPreparationStep } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/stepAdmission.ts');
  assert.equal(requiredPreparationStep('booking', noSteps), null);
  assert.equal(requiredPreparationStep('details', noSteps), null);
  assert.equal(requiredPreparationStep('notices', noSteps), null, 'standalone materials do not require document submission');
  assert.equal(requiredPreparationStep('drivers', noSteps), null);
  assert.equal(requiredPreparationStep('documents', noSteps), null);
  assert.equal(requiredPreparationStep('terms', noSteps), null);
  assert.equal(requiredPreparationStep('terms', { ...noSteps, booking: true }), null);
  assert.equal(requiredPreparationStep('drivers', { ...noSteps, booking: true }), null);
  assert.equal(requiredPreparationStep('terms', allSteps), null);
  assert.equal(requiredPreparationStep('home', noSteps), null);
  assert.equal(requiredPreparationStep('auth', noSteps), null);

  assert.equal(preparationPrimaryLabel('booking', noSteps, false, false), 'prepSubmitNext');
  assert.equal(preparationPrimaryLabel('booking', { ...noSteps, booking: true }, false, false), 'prepSubmitNext');
  assert.equal(preparationPrimaryLabel('drivers', { ...allSteps, drivers: false }, false, false), 'prepSubmitNext');
  assert.equal(preparationPrimaryLabel('drivers', allSteps, false, false), 'prepSubmitNext');
  assert.equal(preparationPrimaryLabel('booking', allSteps, true, false), 'prepSaving');
  for (const step of ['booking', 'drivers', 'terms']) assert.equal(preparationPrimaryLabel(step, allSteps, false, true), 'prepBackHome');
  assert.equal(preparationPrimaryLabel('terms', allSteps, false, false), 'prepSubmitNext');
  assert.equal(preparationPrimaryLabel('home', allSteps, false, false), 'prepSubmit');
  assert.equal(preparationPrimaryLabel('home', noSteps, false, false), 'prepStart');
  assert.equal(preparationPrimaryLabel('home', { ...noSteps, booking: true }, false, false), 'prepContinue');
  const { savedPreparationLocks, canEditPreparationPatch, prepareStepSubmission } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/stepLocks.ts');
  const { PreparationStepProgress } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationStepProgress.tsx');
  for (const language of Object.keys(preparationTranslations)) {
    for (const [completed, allowed] of [
      [noSteps, [true, true, true]],
      [{ booking: true, drivers: false, terms: false }, [true, true, true]],
      [{ booking: true, drivers: true, terms: false }, [true, true, true]],
      [allSteps, [true, true, true]]
    ]) {
      for (const disabled of [false, true]) {
        const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language },
          React.createElement(PreparationStepProgress, { currentStep: 'booking', completed, disabled, onNavigate() {} })));
        const buttons = [...markup.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
        assert.equal(buttons.length, 3);
        assert.deepEqual(buttons.map(button => !button.includes('disabled=""')), allowed.map(value => value && !disabled), 'independent services remain available without preceding submissions');
        assert.ok(!markup.includes('aria-disabled="false"'));
      }
    }
  }
  const draft = newDraft();
  assert.deepEqual(savedPreparationLocks(draft, []), noSteps);
  const checkedDraft = { ...draft, bookingConfirmed: true };
  assert.deepEqual(savedPreparationLocks(checkedDraft, []), noSteps, 'autosaved checkbox is still an editable draft');
  assert.equal(canEditPreparationPatch(savedPreparationLocks(checkedDraft, []), { bookingConfirmed: false }), true);
  assert.throws(() => prepareStepSubmission(draft, [], 'booking'), /PREPARATION_INCOMPLETE/);
  const bookedDraft = prepareStepSubmission(checkedDraft, [], 'booking');
  assert.equal(checkedDraft.submittedSteps, undefined, 'preparing submission cannot mutate the saved draft');
  const bookingLocked = savedPreparationLocks(bookedDraft, []);
  assert.deepEqual(bookingLocked, { ...noSteps, booking: true });
  assert.equal(canEditPreparationPatch(bookingLocked, { bookingConfirmed: false }), false);
  assert.equal(canEditPreparationPatch(bookingLocked, { identityConfirmed: true }), true);
  assert.equal(canEditPreparationPatch(allSteps, { drivers: draft.drivers }), false);
  assert.equal(canEditPreparationPatch(allSteps, { identityConfirmed: false }), false);
  assert.equal(canEditPreparationPatch(allSteps, { language: 'en', confirmation: undefined }), false);
  assert.equal(canEditPreparationPatch(noSteps, { language: 'en', confirmation: undefined }), true);
  assert.deepEqual(savedPreparationLocks({ ...draft, submittedAt: '2026-10-19T08:00:00Z' }, []), { ...allSteps, terms: false });
  assert.equal(canSubmit(draft, []), false);
  assert.throws(() => submitDraft(draft, [], new Date().toISOString()), /PREPARATION_INCOMPLETE/);
  assert.equal(validDrivers(draft.drivers), true);
  assert.equal(validDrivers([{ ...draft.drivers[0], email: '', phone: '' }]), false);
  assert.equal(validDrivers([{ ...draft.drivers[0], email: '', phone: '+819012345678' }]), true);
  assert.equal(validDrivers([{ ...draft.drivers[0], phone: '', email: 'a@b.com' }]), true);
  assert.equal(validDrivers([{ ...draft.drivers[0], phone: '123', email: 'a@b.com' }]), false);
  assert.equal(validDrivers([draft.drivers[0], newDriver('additional-1')]), true);
  assert.equal(validDrivers([draft.drivers[0], newDriver('primary')]), false);
  assert.deepEqual(requiredDocuments({ ...draft.drivers[0], mode: 'local' }), ['licence']);
  const photos = requiredDocumentPages(draft.drivers[0]).map(({ kind, page }) => ({ id: `${kind}-${page}`, driverId: 'primary', kind, page, name: `${kind}-${page}.png`, blob: new Blob(['sample'], { type: 'image/png' }) }));
  assert.equal(completion(draft, photos).documents, true);
  assert.equal(savedPreparationLocks(draft, photos).drivers, false, 'photos alone must not lock a partially completed driver step');
  assert.equal(savedPreparationLocks({ ...bookedDraft, identityConfirmed: true }, photos).drivers, false, 'complete autosaved driver draft remains editable');
  assert.throws(() => prepareStepSubmission({ ...checkedDraft, identityConfirmed: true }, photos, 'drivers'), /PREPARATION_INCOMPLETE/, 'checked booking cannot bypass explicit submission');
  assert.equal(prepareStepSubmission(bookedDraft, photos, 'drivers').submittedSteps.drivers, true, 'complete documents do not require the removed acknowledgement');
  assert.throws(() => prepareStepSubmission({ ...bookedDraft, identityConfirmed: true }, [], 'drivers'), /PREPARATION_INCOMPLETE/);
  const driversSubmitted = prepareStepSubmission({ ...bookedDraft, identityConfirmed: true }, photos, 'drivers');
  assert.equal(savedPreparationLocks(driversSubmitted, photos).drivers, true);
  assert.equal(canEditPreparationPatch(savedPreparationLocks(driversSubmitted, photos), { identityConfirmed: false }), false);
  assert.equal(completion(draft, photos.filter(photo => photo.page !== 'back')).documents, false, 'licence front does not satisfy the back page');
  assert.equal(completion(draft, photos.filter(photo => !(photo.kind === 'idp' && photo.page === 'classes'))).documents, false, 'IDP category page is required');
  assert.equal(completion(draft, photos.map(({ page, ...photo }) => photo)).documents, false, 'legacy unclassified photos do not silently satisfy page-specific requirements');
  assert.equal(completion({ ...draft, submittedAt: '2026-10-19T08:00:00Z', documentLayoutVersion: undefined }, photos.map(({ page, ...photo }) => photo)).documents, true, 'historical submitted requirements remain frozen');
  const localDraft = { ...draft, drivers: [{ ...draft.drivers[0], mode: 'local' }] };
  assert.equal(completion(localDraft, photos.filter(photo => photo.kind === 'licence')).documents, true);
  const { splitPhone } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/documentSlots.ts');
  assert.deepEqual(splitPhone('+81 90-1234-5678'), { code: '+81', number: '9012345678' });
  assert.deepEqual(splitPhone('+85291234567'), { code: '+852', number: '91234567' });
  assert.deepEqual(splitPhone('', '+86'), { code: '+86', number: '' });
  assert.equal(completion({ ...draft, drivers: [...draft.drivers, newDriver('extra')] }, photos).documents, false, 'primary photos must not satisfy another driver');
  assert.equal(completion(draft, photos.filter(photo => photo.kind !== 'idp')).documents, false);
  const { PreparationTerms } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationTerms.tsx');
  const allKeys = Object.keys(preparationTranslations.en).sort();
  for (const [language, texts] of Object.entries(preparationTranslations)) {
    assert.deepEqual(Object.keys(texts).sort(), allKeys);
    assert.ok(Object.values(texts).every(text => typeof text === 'string' && text.trim()));
    const snapshot = preparationMaterials({ ...draft, language });
    const resolution = resolveRentalMaterialConfiguration(snapshot, language);
    assert.equal(resolution.available, true);
    let confirmation;
    for (const group of resolution.groups) {
      assert.ok(group.attachments.every(attachment => attachment.url.startsWith('data:image/svg+xml')));
      confirmation = updateRentalMaterialConfirmation({ resolution, currentRecord: confirmation, materialGroup: group.materialGroup, confirmed: true });
    }
    const ready = { ...draft, language, bookingConfirmed: true, identityConfirmed: true, confirmation };
    const noticesOnly = { ...newDraft('PREP02'), contractConfigSnapshot: snapshot, language, confirmation };
    assert.equal(preparationTermsComplete(noticesOnly), true);
    assert.equal(canSubmit(noticesOnly, []), false, 'advance acknowledgements cannot replace booking or driver documents');
    assert.equal(noticesOnly.submittedAt, undefined);
    assert.equal(newDraft('PREP01').confirmation, undefined, 'another order does not inherit acknowledgements');
    const noticesMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationServiceEntries, { draft: noticesOnly, hasPreparation: false, phone: '+81 50 0000 0000', onIdentity() {}, onInspection() {}, onNotices() {} })));
    assert.ok(!noticesMarkup.includes('data-preparation-service="notices"'));
    assert.ok(!noticesMarkup.includes(texts.prepPickupUnavailable));
    assert.equal(canSubmit(ready, photos), true);
    assert.equal(preparationConfirmationItems(ready).onsite.length, 2, 'Merchant handover acknowledgements cannot be confirmed before pickup');
    const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationTerms, { draft: ready, readOnly: false, onChange() {} })));
    assert.ok(markup.includes(texts.prepConfirmationsTitle));
    for (const item of preparationConfirmationItems(ready).onsite) assert.ok(!markup.includes(item.text), 'onsite acknowledgements are absent from preparation UI');
    assert.equal((markup.match(/type="checkbox"/g) || []).length, 2, 'onsite items have no checkbox');
    assert.equal(canSubmit({ ...ready, contractConfigSnapshot: undefined }, photos), false, 'missing order snapshot cannot use another demo configuration');
    const changed = structuredClone(ready);
    changed.contractConfigSnapshot.revision = 'published-next-version';
    assert.equal(canSubmit(changed, photos), false, 'prior version acknowledgements cannot satisfy a new version');
    const custom = structuredClone(ready);
    custom.contractConfigSnapshot.customerConfirmationItems.push({ id: 'custom-preparation', order: 15, title: { [language]: 'Configured custom acknowledgement' }, description: { [language]: 'Configured description' } });
    custom.contractConfigSnapshot.preparationConfirmationItemIds.push('custom-preparation');
    assert.equal(canSubmit(custom, photos), false, 'every configured advance acknowledgement is required');
    custom.additionalConfirmations = { configRevision: custom.contractConfigSnapshot.revision, configPublishedAt: custom.contractConfigSnapshot.publishedAt, language,
      items: [{ id: 'custom-preparation', text: 'Configured custom acknowledgement', locale: language, confirmedAt: '2026-10-19T08:00:00Z' }] };
    assert.equal(canSubmit(custom, photos), true);
    const customMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationTerms, { draft: custom, readOnly: false, onChange() {} })));
    assert.equal((customMarkup.match(/type="checkbox"/g) || []).length, 3);
    assert.ok(customMarkup.includes('Configured description'));
    const firstText = resolution.groups[0].confirmationText;
    const secondText = resolution.groups[1].confirmationText;
    assert.ok(customMarkup.indexOf(firstText) < customMarkup.indexOf('Configured custom acknowledgement'));
    assert.ok(customMarkup.indexOf('Configured custom acknowledgement') < customMarkup.indexOf(secondText), 'custom confirmations follow configured order');
    custom.contractConfigSnapshot.customerConfirmationItems.push(custom.contractConfigSnapshot.customerConfirmationItems[0]);
    assert.equal(preparationConfirmationItems(custom).available, false, 'duplicate configuration IDs fail closed');
    assert.equal(canSubmit(custom, photos), false);

    assert.deepEqual(savedPreparationLocks(ready, photos), noSteps, 'complete autosaved forms remain editable for every language');
    const stepsSubmitted = prepareStepSubmission(prepareStepSubmission(ready, photos, 'booking'), photos, 'drivers');
    assert.deepEqual(savedPreparationLocks(stepsSubmitted, photos), { booking: true, drivers: true, terms: false }, 'terms acknowledgement remains editable until final submission');
    assert.equal(canEditPreparationPatch(savedPreparationLocks(stepsSubmitted, photos), { confirmation: undefined }), true);
    assert.deepEqual(savedPreparationLocks(submitDraft(stepsSubmitted, photos, '2026-10-19T08:00:00Z'), photos), { ...allSteps, terms: false });
    assert.equal(canSubmit({ ...ready, identityConfirmed: false }, photos), true, 'removed acknowledgement does not block submission');
    assert.equal(canSubmit({ ...ready, bookingConfirmed: false }, photos), false);
    assert.equal(canSubmit({ ...ready, language: language === 'ja' ? 'en' : 'ja' }, photos), false, 'different material language requires a new confirmation');
    const submitted = submitDraft(ready, photos, '2026-10-19T08:00:00Z');
    assert.equal(submitted.submittedAt, '2026-10-19T08:00:00Z');
    assert.equal(submitted.documentReview.state, 'PENDING_ONSITE_CHECK', 'submission awaits staff verification at pickup without online review');
    assert.equal(canSubmit(submitted, photos), false);
    assert.throws(() => submitDraft(submitted, photos, '2026-10-19T08:01:00Z'), /PREPARATION_INCOMPLETE/, 'repeat submission is blocked');
    assert.equal('canonical_status' in submitted, false);
  }
  const { reopenPreparation, isPreparationCorrection, preparationReviewIssues, preparationDriverStepLabel } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/review.ts');
  assert.equal(preparationDriverStepLabel({}, false), 'prepTodo');
  assert.equal(preparationDriverStepLabel({}, true), 'prepCompleted');
  assert.equal(preparationDriverStepLabel({ submittedAt: '2026-10-19T08:00:00Z' }, true), 'prepSubmitted', 'legacy submission displays submitted without rewriting its review fact');
  for (const [state, label] of [['PENDING_ONSITE_CHECK', 'prepSubmitted'], ['PENDING_REVIEW', 'prepSubmitted'], ['APPROVED', 'prepStepApproved'], ['REJECTED', 'prepStepRejected']]) {
    assert.equal(preparationDriverStepLabel({ submittedAt: '2026-10-19T08:00:00Z', documentReview: { state } }, true), label);
  }
  assert.equal(preparationDriverStepLabel({ documentReview: { state: 'REJECTED' }, correctionStartedAt: '2026-10-19T09:00:00Z' }, false), 'prepStepRejected', 'editing retains the rejection until resubmission');
  const { rejectedPreparationFixture } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/reviewFixture.ts');
  const { PreparationReviewStatus } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationReviewStatus.tsx');
  const rejected = rejectedPreparationFixture();
  const { PreparationDrivers } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationDrivers.tsx');
  for (const language of Object.keys(preparationTranslations)) {
    for (const readOnly of [false, true]) {
      const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationDrivers, {
        drivers: rejected.draft.drivers, photos: [], readOnly,
        onChange() {}, onRemove() {}, clearAdditional() {}, async addPhotos() {}, removePhoto() {},
      })));
      assert.ok(!markup.includes(preparationTranslations[language].prepIdentityConfirm), 'driver form omits the removed identity acknowledgement in every language');
      assert.doesNotMatch(markup, /type="checkbox"/);
    }
  }
  for (const identityConfirmed of [false, true, undefined]) {
    const identityDraft = { ...rejected.draft, submittedAt: undefined, identityConfirmed };
    assert.equal(model.canSubmitIdentity(identityDraft, rejected.photos), true);
    assert.equal(model.canSubmitIdentity(identityDraft, rejected.photos.slice(1)), false);
    assert.equal(model.canSubmitIdentity({ ...identityDraft, drivers: [{ ...identityDraft.drivers[0], first: '' }] }, rejected.photos), false);
    const submitted = model.submitIdentityDraft(identityDraft, rejected.photos, '2026-10-21T10:00:00Z');
    assert.equal(submitted.documentReview.state, 'PENDING_ONSITE_CHECK');
    assert.equal(model.canSubmitIdentity(submitted, rejected.photos), false);
  }
  assert.deepEqual(preparationReviewIssues({ state: 'REJECTED', rejectedDocumentTypes: ['licence', 'passport', 'idp', 'other', 'passport', 'unknown', '__proto__'] }).map(item => item.type), ['licence', 'passport', 'idp', 'other']);
  assert.deepEqual(preparationReviewIssues({ state: 'REJECTED' }), []);
  assert.deepEqual(preparationReviewIssues({ state: 'REJECTED', rejectionReason: 'licence blurry' }), [], 'do not infer categories from free text');
  assert.deepEqual(preparationReviewIssues({ state: 'REJECTED', rejectionReasonKey: 'prepReviewSampleReason' }).map(item => item.type), ['licence'], 'existing demo records work without resets');
  assert.deepEqual(preparationReviewIssues({ state: 'REJECTED', rejectedDocumentTypes: [], rejectionReasonKey: 'prepReviewSampleReason' }), [], 'explicit empty list wins over legacy fixture fallback');
  assert.deepEqual(preparationReviewIssues({ state: 'REJECTED', rejectedDocumentTypes: 'licence' }), [], 'malformed payload safely falls back');
  assert.equal(findPreparationBooking('prep03', '5678')?.orderId, 'PREP03');
  assert.deepEqual(savedPreparationLocks(rejected.draft, rejected.photos), { ...allSteps, terms: false });
  const correction = reopenPreparation(rejected.draft, rejected.photos, '2026-10-19T10:00:00Z');
  assert.equal(isPreparationCorrection(correction), true);
  assert.deepEqual(savedPreparationLocks(correction, rejected.photos), { booking: true, drivers: false, terms: false });
  assert.equal(requiredPreparationStep('terms', savedPreparationLocks(correction, rejected.photos)), null);
  assert.deepEqual(correction.confirmation, rejected.draft.confirmation);
  assert.deepEqual(correction.contractConfigSnapshot, rejected.draft.contractConfigSnapshot);
  assert.equal(canEditPreparationPatch(savedPreparationLocks(correction, rejected.photos), { drivers: correction.drivers }), true);
  for (const patch of [{ bookingConfirmed: false }, { documentReview: { state: 'APPROVED' } }, { reviewHistory: [] }, { correctionStartedAt: undefined }]) {
    assert.equal(canEditPreparationPatch(savedPreparationLocks(correction, rejected.photos), patch), false);
  }
  assert.equal(canSubmit(correction, rejected.photos), true, 'resubmission no longer requires the removed acknowledgement');
  const corrected = correction;
  assert.equal(canSubmit(corrected, rejected.photos.slice(1)), false, 'missing required photo blocks resubmission');
  const extra = { ...newDriver('extra-review'), mode: 'local' };
  assert.equal(canSubmit({ ...corrected, drivers: [...corrected.drivers, extra] }, rejected.photos), false, 'additional driver documents are required too');
  const extraPhotos = requiredDocumentPages(extra).map(slot => ({ ...rejected.photos[0], ...slot, id: 'extra-' + slot.page, driverId: extra.id }));
  assert.equal(canSubmit({ ...corrected, drivers: [...corrected.drivers, extra] }, [...rejected.photos, ...extraPhotos]), true);
  const resubmitted = submitDraft(corrected, rejected.photos, '2026-10-19T10:05:00Z');
  assert.equal(resubmitted.documentReview.state, 'PENDING_ONSITE_CHECK');
  assert.equal(resubmitted.correctionStartedAt, undefined);
  assert.deepEqual(savedPreparationLocks(resubmitted, rejected.photos), { ...allSteps, terms: false });
  assert.deepEqual(resubmitted.confirmation, rejected.draft.confirmation);
  assert.equal(resubmitted.reviewHistory[0].review.state, 'REJECTED');
  assert.deepEqual(resubmitted.reviewHistory[0].review.rejectedDocumentTypes, ['licence']);
  assert.equal(resubmitted.documentReview.rejectedDocumentTypes, undefined);
  correction.drivers[0].first = 'Updated';
  assert.equal(correction.reviewHistory[0].drivers[0].first, 'Alex', 'history preserves original driver data');
  assert.equal(correction.reviewHistory[0].photos[0].blob.size, rejected.photos[0].blob.size);
  assert.throws(() => reopenPreparation(resubmitted, rejected.photos, 'later'), /PREPARATION_NOT_REJECTED/);
  assert.throws(() => reopenPreparation({ ...resubmitted, documentReview: { state: 'APPROVED' } }, rejected.photos, 'later'), /PREPARATION_NOT_REJECTED/);
  assert.throws(() => reopenPreparation(correction, rejected.photos, 'later'), /PREPARATION_NOT_REJECTED/);
  for (const [language, texts] of Object.entries(preparationTranslations)) {
    const renderReview = (value, props = {}) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationReviewStatus, { draft: value, ...props })));
    const rejectedMarkup = renderReview(rejected.draft);
    assert.ok(rejectedMarkup.includes(texts.prepReviewRejected));
    assert.ok(rejectedMarkup.includes(texts.prepReviewSampleReason));
    assert.ok(rejectedMarkup.includes(texts.prepReviewItems));
    assert.ok(rejectedMarkup.includes(texts.prepReviewLicence));
    assert.ok(rejectedMarkup.includes(texts.prepReviewReason));
    const editableStatus = renderReview(rejected.draft, { onEdit() {} });
    assert.ok(editableStatus.includes(texts.prepReviewModify));
    assert.ok(!editableStatus.includes('disabled=""'));
    assert.ok(renderReview(rejected.draft, { onEdit() {}, disabled: true }).includes('disabled=""'));
    assert.ok(!renderReview(resubmitted, { onEdit() {} }).includes('<button'));
    assert.ok(!renderReview({ ...resubmitted, documentReview: { state: 'APPROVED' } }, { onEdit() {} }).includes('<button'));
    assert.ok(!rejectedMarkup.includes('<button'));
    const issueItem = rejectedMarkup.match(/<li [^>]*>/)?.[0];
    assert.ok(issueItem && !/border|rounded|bg-/.test(issueItem), 'issue items are plain text, without button styling');
    const multipleIssues = renderReview({ ...rejected.draft, documentReview: { state: 'REJECTED', rejectedDocumentTypes: ['passport', 'licence', 'idp', 'other', 'passport', 'UNKNOWN_FIELD'], rejectionReason: 'line one\nline two' } });
    for (const key of ['prepPassport', 'prepReviewLicence', 'prepReviewIdp', 'prepReviewOther']) assert.ok(multipleIssues.includes(texts[key]));
    assert.equal((multipleIssues.match(/<li /g) || []).length, 4, 'deduplicated list covers all document categories');
    assert.ok(!multipleIssues.includes('UNKNOWN_FIELD'));
    assert.ok(multipleIssues.includes('line one\nline two'));
    const missingIssues = renderReview({ ...rejected.draft, documentReview: { state: 'REJECTED', rejectedDocumentTypes: [] } });
    assert.ok(missingIssues.includes(texts.prepReviewItemsMissing));
    const legacyDemo = { ...rejected.draft, documentReview: { ...rejected.draft.documentReview, rejectedDocumentTypes: undefined } };
    assert.ok(renderReview(legacyDemo).includes(texts.prepReviewLicence));
    assert.ok(renderReview(correction).includes(texts.prepReviewItems), 'correction retains review details');
    assert.ok(!renderReview(resubmitted).includes(texts.prepReviewItems), 'resubmission hides old rejected items');
    assert.ok(!renderReview({ ...resubmitted, documentReview: { state: 'APPROVED', rejectedDocumentTypes: ['licence'] } }).includes(texts.prepReviewItems));
    assert.ok(!rejectedMarkup.includes(texts.prepSubmitted));
    assert.ok(renderReview({ ...rejected.draft, documentReview: { state: 'REJECTED', rejectionReason: '<script>unsafe</script>' } }).includes('&lt;script&gt;unsafe&lt;/script&gt;'));
    assert.ok(renderReview({ ...rejected.draft, documentReview: { state: 'REJECTED' } }).includes(texts.prepReviewMissingReason));
    assert.ok(renderReview(resubmitted).includes(texts.prepSubmitted));
    for (const state of [undefined, 'PENDING_REVIEW', 'PENDING_ONSITE_CHECK']) {
      const pending = { ...resubmitted, documentReview: state ? { state } : undefined };
      const before = structuredClone(pending);
      const markup = renderReview(pending);
      assert.ok(markup.includes(texts.prepSubmittedHint), 'all submitted variants explain onsite verification in every language');
      assert.ok(!markup.includes(texts.prepPending), 'submission does not ask the customer to await online review');
      assert.ok(!markup.includes(texts.prepReviewApproved), 'submission cannot claim verification passed');
      assert.deepEqual(pending, before, 'displaying a legacy submission must preserve its original facts');
      assert.equal(identityServicePresentation(pending, true).status, 'prepSubmitted');
    }
    assert.ok(renderReview({ ...resubmitted, documentReview: { state: 'APPROVED' } }).includes(texts.prepReviewApproved));
    assert.ok(renderReview({ ...resubmitted, documentReview: undefined }).includes(texts.prepSubmitted), 'legacy submission prompts onsite verification');
    assert.equal(renderReview(newDraft('PREP02')), '');
  }
  console.log('Review correction: rejected fixture, reopen and resubmission persistence/failures, required documents, preserved confirmations/history, locked fields, duplicate submission and six-language status rendering passed.');
  console.log('Pickup preparation: untouched PREP02 fixture, order storage isolation and recovery, verification entry, credentials, 6-language verification rendering, validation, driver isolation, document requirements, 6 languages, confirmation revisions and idempotent submission passed.');
} finally { Date.now = originalDateNow; await server.close(); }
