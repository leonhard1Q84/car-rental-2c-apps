import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom', logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [], entries: [] },
  server: { middlewareMode: true },
});

try {
  const base = '/src/apps/selfservice-rental';
  const { isDriverSnapshotValid, buildDriverPhotoConfirmation, isDriverPhotoConfirmationComplete, driverPhotoKey } = await server.ssrLoadModule(`${base}/modules/driver-photos/model.ts`);
  const { createDemoDriverSnapshot } = await server.ssrLoadModule(`${base}/modules/driver-photos/fixtures.ts`);
  const { isInspectionReadyForContract } = await server.ssrLoadModule(`${base}/components/inspectionContractEntry.ts`);
  const { default: InspectionScreen } = await server.ssrLoadModule(`${base}/components/InspectionScreen.tsx`);
  const { DriverPhotoSection } = await server.ssrLoadModule(`${base}/modules/driver-photos/DriverPhotoSection.tsx`);
  const { LanguageProvider } = await server.ssrLoadModule(`${base}/contexts/LanguageContext.tsx`);
  const { driverPhotoTranslations: translations } = await server.ssrLoadModule(`${base}/i18n/driver-photos.ts`);
  const snapshot = createDemoDriverSnapshot('ORDER-1', true);
  const binding = { orderId: 'ORDER-1', vehicleId: 'PLATE-1', snapshot };
  const photos = snapshot.drivers.map(driver => ({ ...driver, photo: 'data:image/jpeg;base64,dGVzdA==', savedAt: '2026-10-28T03:00:00Z' }));
  const complete = buildDriverPhotoConfirmation(binding, photos);

  assert.equal(isDriverSnapshotValid(createDemoDriverSnapshot('SINGLE')), true);
  assert.equal(isDriverSnapshotValid(snapshot), true);
  assert.equal(isDriverSnapshotValid({ ...snapshot, drivers: [...snapshot.drivers, { ...snapshot.drivers[1], id: 'fourth' }] }), true);
  for (const invalid of [undefined, null, {}, { ...snapshot, revision: '' }, { ...snapshot, drivers: [] },
    { ...snapshot, drivers: [null] }, { ...snapshot, drivers: [...snapshot.drivers, snapshot.drivers[0]] },
    { ...snapshot, drivers: snapshot.drivers.map(driver => ({ ...driver, role: 'additional' })) },
    { ...snapshot, drivers: [{ ...snapshot.drivers[0], credentialType: 'unknown' }] },
    { ...snapshot, drivers: [{ ...snapshot.drivers[0], name: '' }] },
    { ...snapshot, drivers: Array.from({ length: 5 }, (_, index) => ({ ...snapshot.drivers[0], id: String(index) })) },
  ]) assert.equal(isDriverSnapshotValid(invalid), false, JSON.stringify(invalid));

  assert.equal(isDriverPhotoConfirmationComplete(complete, binding), true);
  assert.equal(isDriverPhotoConfirmationComplete(buildDriverPhotoConfirmation(binding, photos.slice(0, 1)), binding), false);
  assert.equal(isDriverPhotoConfirmationComplete(buildDriverPhotoConfirmation(binding, [photos[0], photos[0], photos[0]]), binding), false, 'duplicate primary photos cannot fill other drivers');
  assert.equal(isDriverPhotoConfirmationComplete({ ...complete, drivers: [photos[0], photos[0], photos[2]] }, binding), false);
  for (const other of [
    { ...binding, orderId: 'ORDER-2' }, { ...binding, vehicleId: 'PLATE-2' },
    { ...binding, snapshot: undefined }, { ...binding, snapshot: { ...snapshot, revision: 'r2' } },
    { ...binding, snapshot: { ...snapshot, drivers: snapshot.drivers.slice(0, 2) } },
    { ...binding, snapshot: { ...snapshot, drivers: snapshot.drivers.map((driver, index) => index === 1 ? { ...driver, name: 'Different person' } : driver) } },
    { ...binding, snapshot: { ...snapshot, drivers: snapshot.drivers.map(driver => ({ ...driver, id: `other-${driver.id}` })) } },
  ]) {
    assert.equal(isDriverPhotoConfirmationComplete(complete, other), false, 'stale binding must fail closed');
  }
  for (const corrupt of [undefined, {}, { ...complete, drivers: undefined }, { ...complete, drivers: [null] },
    { ...complete, drivers: photos.map(photo => ({ ...photo, photo: 'blob:expired' })) },
    { ...complete, drivers: photos.map(photo => ({ ...photo, savedAt: 'invalid' })) },
  ]) assert.equal(isDriverPhotoConfirmationComplete(corrupt, binding), false);
  assert.deepEqual(buildDriverPhotoConfirmation(binding, [{ photo: 'old-unbound-photo.jpg' }]).drivers, []);
  assert.notEqual(driverPhotoKey(binding, photos[0].id), driverPhotoKey({ ...binding, vehicleId: 'other' }, photos[0].id));
  assert.notEqual(driverPhotoKey(binding, photos[0].id), driverPhotoKey(binding, photos[1].id));

  const record = { verificationStatus: 'uploaded', verificationPhotos: photos.map(photo => photo.photo), driverPhotoConfirmation: complete,
    dashboardPhoto: 'dashboard.jpg', vehicleMetricCheckpoint: { finalMetrics: { mileageKm: 12345, energyPercent: 50 } }, decisionMode: 'skip' };
  const order = { orderNumber: binding.orderId, vehicle: { licensePlate: binding.vehicleId }, onlineCheckinDrivers: snapshot };
  assert.equal(isInspectionReadyForContract(record, order), true);
  assert.equal(isInspectionReadyForContract({ ...record, driverPhotoConfirmation: buildDriverPhotoConfirmation(binding, photos.slice(0, 1)) }, order), false);
  assert.equal(isInspectionReadyForContract(record, { ...order, onlineCheckinDrivers: undefined }), false);
  assert.equal(isInspectionReadyForContract({ ...record, verificationStatus: 'idle' }, order), false, 'busy or failed capture cannot submit');
  assert.equal(isInspectionReadyForContract({ ...record, dashboardPhoto: '', vehicleMetricCheckpoint: undefined }, order), true, 'removed dashboard collection must not leave a contract gate');
  assert.equal(isInspectionReadyForContract({ ...record, vehicleMetricCheckpoint: { finalMetrics: { mileageKm: -1, energyPercent: 50 } } }, order), true, 'legacy metric data is not a new capture prerequisite');
  assert.equal(isInspectionReadyForContract({ ...record, decisionMode: 'report', exceptionPhotos: [] }, order), false);
  assert.equal(isInspectionReadyForContract({ ...record, driverPhotoConfirmation: undefined, verificationStatus: 'approved' }), true, 'historical completed record remains readable');

  const capture = { photos: photos.slice(0, 1), loading: false, loadError: false, uploading: [], errors: {}, confirmation: complete,
    complete: false, capture: async () => {}, reload() {} };
  for (const language of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th']) {
    const resources = translations[language];
    const page = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language },
      React.createElement(InspectionScreen, {
        orderDetails: { ...order, vehicle: { licensePlate: binding.vehicleId, telematicsStatus: 'OFFLINE' } },
        setView() {}, onInspectionRecordChange() {}, onContinueToContract() {},
      })));
    assert.ok(page.includes('data-pickup-dashboard'), 'read-only dashboard stays visible without metrics');
    assert.equal(page.includes('type="number"'), false, 'pickup must not render editable metric fields');
    assert.equal(page.includes('type="file"'), false, 'no dashboard capture input; roster remains in SSR loading state');

    for (const [key, value] of Object.entries(resources)) assert.ok(value.trim(), `${language}/${key}`);
    const render = (state = capture, activeBinding = binding) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language },
      React.createElement(DriverPhotoSection, { binding: activeBinding, capture: state })));
    const html = render();
    assert.equal((html.match(/data-driver-photo-id=/g) || []).length, 3);
    for (const driver of snapshot.drivers) assert.ok(html.includes(driver.name));
    assert.equal(html.includes('aria-describedby='), false, 'removed hints must not leave dangling descriptions');
    assert.ok(html.includes(resources.driverPhotoCarryBody));
    assert.ok(html.includes(resources.driverPhotoProgress.replace('{count}', '1').replace('{total}', '3')));
    assert.equal((html.match(/type="file"/g) || []).length, 3);
    assert.equal(html.includes('type="checkbox"'), false);
    assert.ok(render({ ...capture, uploading: [photos[1].id] }).includes(resources.driverPhotoUploading));
    assert.ok(render({ ...capture, errors: { [photos[1].id]: 'save' } }).includes(resources.driverPhotoSaveError));
    assert.ok(render({ ...capture, loadError: true }).includes(resources.driverPhotoLoadError));
    assert.ok(render(capture, { ...binding, snapshot: undefined }).includes(resources.driverPhotoRosterMissing));
  }
  assert.equal(translations['zh-TW'].driverPhotoCarryBody, '依日本《道路交通法》，每位駕駛人（含額外駕駛人）駕駛時，均須攜帶適用且有效的駕駛證件。請在駕駛前確認已帶齊相關證件。');
  assert.equal(JSON.stringify(translations).includes('證件照片不能代替'), false);
  console.log('PASS: driver roster validation, photo binding, stale evidence, contract guards and six-language server rendering');
} finally {
  await server.close();
}
