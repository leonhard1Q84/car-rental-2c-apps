import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, logLevel: 'error', server: { middlewareMode: true } });
try {
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { LanguageProvider } = await server.ssrLoadModule('/src/apps/selfservice-rental/contexts/LanguageContext.tsx');
  const { preparationTranslations } = await server.ssrLoadModule('/src/apps/selfservice-rental/i18n/preparation.ts');
  const { InspectionPageContent } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/PreparationInspectionPage.tsx');
  const { inspectionAvailability, loadPublishedInspection } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/fixtures.ts');
  const { assertInspectionOwnership, formatInspectionTime, formatInspectionValue, inspectionGroupTitles, inspectionGroupOrder } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/model.ts');
  const { preparationEntryStep } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/verification.ts');
  const { requiredPreparationStep } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/stepAdmission.ts');
  const { PreparationServiceEntries } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/PreparationServiceEntries.tsx');
  const { newDraft } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/model.ts');
  const render = (state, language = 'zh-CN') => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionPageContent, { state, onRetry() {} })));
  assert.equal(preparationEntryStep('inspection'), 'inspection');
  assert.equal(requiredPreparationStep('inspection', { booking: false, drivers: false, terms: false }), null);
  assert.equal(inspectionAvailability('PREP01'), 'ready');
  const snapshot = await loadPublishedInspection('PREP01');
  assert.equal(snapshot.revision, 'DEMO-PREP01-PREPARED-2', 'PREP01 starts a stable prepared-but-unreviewed demo version');
  const { inspectionGallery, adjacentPhotoIndex, inspectionSwipeDirection } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/gallery.ts');
  const { InspectionPhotoViewer } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/InspectionPhotos.tsx');
  const gallery = inspectionGallery(snapshot);
  assert.equal(gallery.length, 12, 'vehicle summary photo is not duplicated in the gallery');
  assert.deepEqual(gallery.map(item => item.group), ['exteriorAndDamage', 'exteriorAndDamage', 'exteriorAndDamage', 'exteriorAndDamage', 'lightPhotos', 'tirePhotos', 'interiorPhotos', 'interiorPhotos', 'metrics', 'keyStoragePhotos', 'etcDevicePhotos', 'inspectionAndPaperChecklist']);
  assert.equal(adjacentPhotoIndex(3, 1, gallery.length), 4, 'navigation crosses category boundaries');
  assert.equal(adjacentPhotoIndex(4, -1, gallery.length), 3);
  for (const [index, direction, total] of [[0, -1, 11], [10, 1, 11], [0, -1, 1], [0, 1, 1], [-1, 1, 11], [0, 1, 0]]) assert.equal(adjacentPhotoIndex(index, direction, total), null);
  const origin = { x: 100, y: 100 };
  assert.equal(inspectionSwipeDirection(origin, { x: 50, y: 100 }), 1);
  assert.equal(inspectionSwipeDirection(origin, { x: 151, y: 100 }), -1);
  for (const end of [{ x: 51, y: 100 }, { x: 20, y: 160 }, { x: 100, y: 200 }, origin]) assert.equal(inspectionSwipeDirection(origin, end), null, 'short or vertical gestures do not navigate');
  const emptyGroup = structuredClone(snapshot);
  emptyGroup.groups.lightPhotos.photos = [];
  assert.equal(inspectionGallery(emptyGroup)[4].group, 'tirePhotos', 'gallery skips empty groups');
  for (const language of Object.keys(preparationTranslations)) {
    const copy = preparationTranslations[language];
    for (const [position, total, expected] of [[1, 11, [true, false]], [6, 11, [false, false]], [11, 11, [false, true]], [1, 1, [true, true]]]) {
      const markup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionPhotoViewer, {
        photo: gallery[0].photo, label: copy.prepInspectionPhotoFront, position, total, onPrevious() {}, onNext() {}, onClose() {},
      })));
      const buttons = [...markup.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
      const previous = buttons.find(button => button.includes(`aria-label="${copy.prepInspectionPreviousPhoto}"`));
      const next = buttons.find(button => button.includes(`aria-label="${copy.prepInspectionNextPhoto}"`));
      assert.ok(previous && next, `${language}: navigation has accessible names`);
      assert.deepEqual([previous.includes('disabled=""'), next.includes('disabled=""')], expected);
      assert.match(markup, /aria-live="polite"/);
    }
  }
  assert.deepEqual(inspectionGroupOrder, ['exteriorAndDamage', 'lightPhotos', 'tirePhotos', 'interiorPhotos', 'metrics', 'keyStoragePhotos', 'etcDevicePhotos', 'inspectionAndPaperChecklist']);
  assert.equal(snapshot.source, 'DEMO');
  assert.equal(inspectionAvailability('PREP02'), 'ready');
  const secondSnapshot = await loadPublishedInspection('PREP02');
  assertInspectionOwnership(secondSnapshot, 'PREP02');
  assert.equal(secondSnapshot.orderId, 'PREP02');
  assert.equal(secondSnapshot.source, 'DEMO');
  assert.equal(secondSnapshot.revision, 'DEMO-PREP02-PREPARED-1', 'PREP02 restores photo controls using a new stable demo version');
  assert.notEqual(secondSnapshot.vehicleId, snapshot.vehicleId);
  assert.equal(inspectionGallery(secondSnapshot).length, 12);
  assert.ok(inspectionGallery(secondSnapshot).every(item => item.photo.vehicleId === secondSnapshot.vehicleId));
  secondSnapshot.groups.interiorPhotos.photos.length = 0;
  assert.equal((await loadPublishedInspection('PREP02')).groups.interiorPhotos.photos.length, 2);
  assert.equal((await loadPublishedInspection('PREP01')).groups.interiorPhotos.photos.length, 2);
  assert.equal(inspectionAvailability('PREP04'), 'ready');
  const fourthSnapshot = await loadPublishedInspection('PREP04');
  assertInspectionOwnership(fourthSnapshot, 'PREP04');
  assert.equal(fourthSnapshot.source, 'DEMO');
  assert.equal(fourthSnapshot.revision, 'DEMO-PREP04-PREPARED-1', 'new PREP04 demo does not reuse historical DEMO-1 confirmations');
  assert.notEqual(fourthSnapshot.vehicleId, snapshot.vehicleId);
  assert.notEqual(fourthSnapshot.vehicleId, secondSnapshot.vehicleId);
  assert.equal(inspectionGallery(fourthSnapshot).length, 12);
  assert.ok(inspectionGallery(fourthSnapshot).every(item => item.photo.vehicleId === fourthSnapshot.vehicleId));
  fourthSnapshot.groups.interiorPhotos.photos.length = 0;
  assert.equal((await loadPublishedInspection('PREP04')).groups.interiorPhotos.photos.length, 2);
  assert.equal((await loadPublishedInspection('PREP02')).groups.interiorPhotos.photos.length, 2);
  for (const orderId of ['PREP03', 'PREP05']) {
    assert.equal(inspectionAvailability(orderId), 'empty');
    assert.equal(await loadPublishedInspection(orderId), null);
    const markup = render({ status: 'empty', orderId });
    assert.ok(markup.includes(preparationTranslations['zh-CN'].prepInspectionEmpty));
    assert.ok(!markup.includes(snapshot.vehicle.plate));
    assert.doesNotMatch(markup, /<img /);
  }
  await assert.rejects(loadPublishedInspection('UNKNOWN'), /UNKNOWN_PREPARATION_ORDER/);
  assert.throws(() => assertInspectionOwnership(snapshot, 'PREP02'), /OWNERSHIP_MISMATCH/);
  const wrongVehicle = structuredClone(snapshot);
  wrongVehicle.vehicle.id = 'OTHER';
  assert.throws(() => assertInspectionOwnership(wrongVehicle, 'PREP01'), /OWNERSHIP_MISMATCH/);
  const wrongPhoto = structuredClone(snapshot);
  wrongPhoto.groups.exteriorAndDamage.photos[0].vehicleId = 'OTHER';
  assert.throws(() => assertInspectionOwnership(wrongPhoto, 'PREP01'), /OWNERSHIP_MISMATCH/);
  const editableCopy = await loadPublishedInspection('PREP01');
  editableCopy.groups.interiorPhotos.photos.length = 0;
  assert.equal((await loadPublishedInspection('PREP01')).groups.interiorPhotos.photos.length, 2);
  assert.equal(formatInspectionTime('2026-10-20T02:30:00Z'), '2026/10/20 11:30');
  assert.equal(formatInspectionTime('invalid'), null);
  assert.equal(formatInspectionTime(null), null);
  assert.equal(formatInspectionValue(0, 'en'), '0');
  for (const value of [null, NaN, -1, Infinity]) assert.equal(formatInspectionValue(value, 'en'), null);
  assert.equal(formatInspectionValue(101, 'en', 100), null);
  const statusDraft = newDraft('PREP01');
  const beforeDraft = structuredClone(statusDraft);
  const beforeSnapshot = structuredClone(snapshot);
  for (const language of Object.keys(preparationTranslations)) {
    const copy = preparationTranslations[language];
    const markup = render({ status: 'ready', orderId: 'PREP01', snapshot }, language);
    for (const key of ['prepInspectionMileage', 'prepInspectionFuel', 'prepInspectionEtcPhotos']) assert.ok(markup.includes(copy[key]), `${language}: ${key}`);
    for (const key of ['prepInspectionDemo', 'prepInspectionPreparedAt', 'prepInspectionPhotoChecklist', 'prepInspectionRecordedAt', 'prepInspectionReadOnlyHint', 'prepInspectionMetricsHint', 'prepInspectionConditionNote', 'prepInspectionDemoCondition']) assert.ok(!markup.includes(copy[key]), `${language}: removed content ${key}`);
    assert.ok(markup.indexOf('data-inspection-vehicle-photo') < markup.indexOf(snapshot.vehicle.model), 'vehicle photo appears before the vehicle details');
    assert.ok(markup.indexOf('data-inspection-vehicle-photo') < markup.indexOf('data-inspection-group=\"exteriorAndDamage\"'), 'vehicle card appears before exterior photos');
    assert.ok(markup.indexOf('inspection-review-title') < markup.indexOf('data-inspection-group=\"exteriorAndDamage\"'), 'review card appears before exterior photos');
    assert.ok(markup.includes(copy.prepInspectionPhotosUpdatedAt));
    assert.ok(markup.includes(copy.prepJapanTime));
    assert.ok(markup.includes(`<time dateTime="${snapshot.publishedAt}">${formatInspectionTime(snapshot.publishedAt)}</time>`));
    assert.ok(markup.indexOf('data-inspection-review-hint') < markup.indexOf('data-inspection-photos-updated-at'));
    assert.ok(markup.indexOf('data-inspection-photos-updated-at') < markup.indexOf('data-inspection-group='));
    let previous = -1;
    assert.ok(markup.indexOf("data-inspection-footer-space") > markup.lastIndexOf("data-inspection-group="), "footer spacing follows all photo groups");
    for (const groupId of inspectionGroupOrder) {
      const position = markup.indexOf(`data-inspection-group="${groupId}"`);
      assert.ok(position > previous, `${language}: ${groupId} order`);
      assert.ok(markup.includes(copy[inspectionGroupTitles[groupId]]));
      previous = position;
    }
    const metricsCard = markup.split('<section').find(section => section.includes('data-inspection-group="metrics"'));
    assert.ok(metricsCard.indexOf('<img ') < metricsCard.indexOf('<dl'), 'dashboard photo immediately follows heading and precedes readings');
    assert.equal((metricsCard.match(/<dt\b/g) || []).length, 2);
    assert.doesNotMatch(markup, /href="tel:/);
    assert.equal((markup.match(/<img /g) || []).length, 13);
    assert.equal((markup.match(/<figcaption /g) || []).length, 9);
    assert.ok(!markup.includes(copy.prepInspectionRevision), 'technical snapshot version is retained in data without occupying customer content');
    assert.doesNotMatch(markup, /object-cover/, 'document and vehicle thumbnails show the complete image');
    for (const [groupId, group] of Object.entries(snapshot.groups)) {
      for (const photo of group.photos) {
        assert.ok(photo.labelKey && copy[photo.labelKey], `${language}: each fixture photo has a translated name`);
        assert.ok(markup.includes(`alt="${copy[photo.labelKey]}"`));
        const hasCaption = !['keyStoragePhotos', 'etcDevicePhotos', 'inspectionAndPaperChecklist'].includes(groupId);
        assert.equal(markup.includes(`>${copy[photo.labelKey]}</figcaption>`), hasCaption);
      }
    }
    assert.doesNotMatch(markup, /<select|<textarea|type="submit"|contenteditable|data-pickup-key-storage/i);
    assert.doesNotMatch(markup, /type="file"|capture="environment"/, 'customer flow cannot add photos');
    assert.ok(!markup.includes(copy.prepCaptureAdd));
    assert.ok(markup.includes(copy.prepInspectionIssue));
    assert.ok(markup.includes(copy.prepCaptureStatement));
    const home = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(PreparationServiceEntries, { draft: statusDraft, hasPreparation: false, phone: '+81 50 0000 0000', onIdentity() {}, onInspection() {} })));
    assert.ok(home.includes(copy.prepPickupTileTitle), 'homepage entry is independent of inspection loading');
    assert.ok(!home.includes(copy.prepQuickPickupAction));
  }
  assert.deepEqual(statusDraft, beforeDraft);
  assert.deepEqual(snapshot, beforeSnapshot);
  assert.equal(formatInspectionTime('2026-10-25T18:30:00Z'), '2026/10/26 03:30', 'Japan time is independent of browser timezone');
  for (const publishedAt of [null, undefined, '', 'invalid']) {
    const missingTime = render({ status: 'ready', orderId: snapshot.orderId, snapshot: { ...snapshot, publishedAt } });
    assert.ok(!missingTime.includes('data-inspection-photos-updated-at'), 'invalid/missing publication time hides the entire row');
    assert.ok(!missingTime.includes(preparationTranslations['zh-CN'].prepInspectionPhotosUpdatedAt));
  }
  const updatedSnapshot = { ...snapshot, revision: 'updated-photos', publishedAt: '2026-10-25T18:30:00Z' };
  const updatedMarkup = render({ status: 'ready', orderId: snapshot.orderId, snapshot: updatedSnapshot });
  assert.ok(updatedMarkup.includes('2026/10/26 03:30'));
  assert.ok(!updatedMarkup.includes(`dateTime="${snapshot.publishedAt}"`), 'new publication uses its own timestamp');
  const { InspectionCaptureControls } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/inspection/InspectionCaptureSection.tsx');
  for (const language of Object.keys(preparationTranslations)) {
    const confirmedMarkup = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(InspectionCaptureControls, {
      state: { record: { orderId: snapshot.orderId, vehicleId: snapshot.vehicleId, revision: snapshot.revision, version: 1, sequence: 1, photos: [], confirmation: { at: '2026-10-25T19:30:00Z', language, statement: 'Confirm' } }, loading: false, saving: false, error: null },
      publishedAt: updatedSnapshot.publishedAt, onConfirm() {}, onRetry() {}, onBack() {},
    })));
    assert.ok(confirmedMarkup.includes(preparationTranslations[language].prepInspectionPhotosUpdatedAt));
    assert.ok(confirmedMarkup.includes('2026/10/26 03:30'), 'publication time remains visible after confirmation');
    assert.ok(confirmedMarkup.includes('2026/10/26 04:30'), 'customer confirmation time stays distinct');
  }
  const legacyPhoto = structuredClone(snapshot);
  delete legacyPhoto.groups.metrics.photos[0].labelKey;
  const legacyMarkup = render({ status: 'ready', orderId: 'PREP01', snapshot: legacyPhoto });
  assert.ok(legacyMarkup.includes(`alt="${preparationTranslations['zh-CN'].prepInspectionMetrics} · 1"`), 'photos without a specific name retain an accessible group/sequence fallback');
  const zero = structuredClone(snapshot);
  zero.metrics = { mileage: 0, energyType: 'BATTERY', energyPercent: 0, recordedAt: null };
  zero.groups.keyStoragePhotos.photos = [];
  const zeroMarkup = render({ status: 'ready', orderId: 'PREP01', snapshot: zero });
  assert.ok(zeroMarkup.includes(preparationTranslations['zh-CN'].prepInspectionBattery));
  assert.ok(zeroMarkup.includes('0%'));
  assert.ok(zeroMarkup.includes(preparationTranslations['zh-CN'].prepInspectionNoPhotos));
  const noExterior = structuredClone(snapshot);
  noExterior.groups.exteriorAndDamage.photos = [];
  const noExteriorMarkup = render({ status: 'ready', orderId: 'PREP01', snapshot: noExterior });
  assert.match(noExteriorMarkup, /data-inspection-vehicle-photo[^>]*><p/);
  assert.equal((noExteriorMarkup.match(/<img /g) || []).length, 8, 'missing exterior photos cannot fall back to an unrelated vehicle image');
  const legacyEtc = structuredClone(snapshot);
  delete legacyEtc.groups.etcDevicePhotos;
  const legacyEtcMarkup = render({ status: 'ready', orderId: 'PREP01', snapshot: legacyEtc });
  const etcSection = legacyEtcMarkup.split('<section').find(section => section.includes('data-inspection-group="etcDevicePhotos"'));
  assert.ok(etcSection.includes(preparationTranslations['zh-CN'].prepInspectionNoPhotos));
  assert.doesNotMatch(etcSection, /<img /, 'legacy publication does not receive a fabricated ETC photo');
  const wrongEtc = structuredClone(snapshot);
  wrongEtc.groups.etcDevicePhotos.photos[0].vehicleId = 'OTHER';
  assert.throws(() => assertInspectionOwnership(wrongEtc, 'PREP01'), /OWNERSHIP_MISMATCH/);
  const wrongKey = structuredClone(snapshot);
  wrongKey.groups.keyStoragePhotos.photos[0].vehicleId = 'OTHER';
  assert.throws(() => assertInspectionOwnership(wrongKey, 'PREP01'), /OWNERSHIP_MISMATCH/);
  assert.match(render({ status: 'loading', orderId: 'PREP01' }), /role="status"/);
  const errorMarkup = render({ status: 'error', orderId: 'PREP01' });
  assert.match(errorMarkup, /role="alert"/);
  assert.ok(errorMarkup.includes(preparationTranslations['zh-CN'].prepRetry));
  assert.doesNotMatch(errorMarkup, /<img /);
  console.log('Customer pickup inspection: order/vehicle/photo ownership, isolated snapshots, pending/error states, Japan time, zero/missing readings, group order, six languages and read-only rendering passed. Browser interaction remains manual.');
} finally {
  await server.close();
}
