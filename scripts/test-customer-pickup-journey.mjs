import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
try {
  const base = '/src/';
  const load = path => server.ssrLoadModule(base + path);
  const { pickupJourneyState } = await load('modules/selfservice-rental/pickup/pickupJourneyState.ts');
  const { InspectionCaptureSession } = await load('modules/selfservice-rental/pickup/inspection/capture.ts');
  const { confirmInspectionAndContinue } = await load('modules/selfservice-rental/pickup/inspection/sequentialConfirmation.ts');
  const { PreparationPickupSteps } = await load('modules/selfservice-rental/pickup/PreparationPickupJourney.tsx');
  const { InspectionCaptureControls } = await load('modules/selfservice-rental/pickup/inspection/InspectionCaptureSection.tsx');
  const { InspectionConfirmDialogContent } = await load('modules/selfservice-rental/pickup/inspection/InspectionConfirmDialog.tsx');
  const { preparationTranslations } = await load('i18n/preparation.ts');
  const { LanguageProvider } = await load('contexts/LanguageContext.tsx');
  const { preparationPageTitleKey } = await load('app/customer-journey/servicePresentation.ts');
  const expectedTitles = {
    home: 'myRentalTitle', auth: 'prepServiceTitle', booking: 'prepBooking',
    drivers: 'prepIdentityTileTitle', documents: 'prepIdentityTileTitle',
    pickup: 'prepPickupTileTitle', inspection: 'prepOnlineInspection',
    contract: 'prepContractTitle', details: 'prepTripDetails', terms: 'prepTerms', notices: 'prepNoticesTitle',
  };
  for (const [step, title] of Object.entries(expectedTitles)) assert.equal(preparationPageTitleKey(step), title);
  for (const copy of Object.values(preparationTranslations)) {
    assert.equal(copy[preparationPageTitleKey('drivers')], copy.prepIdentityTileTitle);
    assert.equal(copy[preparationPageTitleKey('documents')], copy.prepIdentityTileTitle);
    assert.equal(copy[preparationPageTitleKey('pickup')], copy.prepPickupTileTitle);
  }
  const ready = { status: 'ready', orderId: 'RC10001', snapshot: { revision: 'r1' } };
  const verified = { ...ready, confirmation: { at: '2026-10-26T00:00:00Z' } };
  for (const status of ['loading', 'empty', 'error']) {
    const state = pickupJourneyState({ status, orderId: 'RC10001' }, false, 2, 'r1');
    assert.equal(state.current, 1); assert.equal(state.changed, false);
  }
  assert.equal(pickupJourneyState(ready, false, 2).current, 1);
  assert.equal(pickupJourneyState(verified, false, null).current, 2);
  assert.equal(pickupJourneyState(verified, false, 1).current, 1);
  assert.equal(pickupJourneyState({ ...ready, snapshot: { revision: 'r2' } }, false, 2, 'r1').changed, true);
  assert.equal(pickupJourneyState({ ...ready, snapshot: { revision: 'r2' } }, true, null, 'r1').current, 2);
  const binding = { orderId: 'RC10001', vehicleId: 'car1', revision: 'r1' };
  let fail = true, saved, advances = 0;
  const repository = { load: async () => saved, save: async value => { if (fail) throw new Error('SAVE_FAILED'); saved = structuredClone(value); } };
  const session = new InspectionCaptureSession(binding, repository);
  await session.load();
  const advance = async () => { assert.ok(saved.confirmation); advances++; };
  assert.equal(await confirmInspectionAndContinue(session, 'zh-CN', 'statement', advance), false);
  assert.equal(advances, 0);
  fail = false;
  assert.equal(await confirmInspectionAndContinue(session, 'zh-CN', 'statement', advance, true), true);
  assert.equal(advances, 1);
  const persisted = structuredClone(saved);
  await assert.rejects(confirmInspectionAndContinue(session, 'zh-CN', 'statement', async () => { throw new Error('READBACK_FAILED'); }, true));
  assert.deepEqual(saved, persisted);
  assert.equal(await confirmInspectionAndContinue(session, 'zh-CN', 'statement', advance, true), true);
  assert.equal(advances, 2); assert.deepEqual(saved, persisted);
  for (const [lang, copy] of Object.entries(preparationTranslations)) {
    const render = (component, props) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: lang }, React.createElement(component, props)));
    for (const complete of [false, true]) {
      const steps = render(PreparationPickupSteps, { current: complete ? 2 : 1, confirmed: complete, signed: false, onSelect() {} });
      assert.ok(steps.includes(copy.prepOnlineInspection)); assert.ok(steps.includes(copy.prepPickupSignContract));
      assert.equal(steps.includes('aria-disabled'), !complete);
      assert.ok(!steps.includes('data-signing-intro'));
    }
    const controls = render(InspectionCaptureControls, { sequential: true, state: { loading: false, saving: false, error: null, record: { ...binding, version: 1, sequence: 0, photos: [] } }, onConfirm() {}, onRetry() {}, onBack() {}, onContract() {} });
    assert.ok(controls.includes(copy.prepPickupReviewNext));
    assert.ok(controls.includes(copy.prepInspectionIssue));
    const modal = render(InspectionConfirmDialogContent, { sequential: true, submitting: false, onClose() {}, onConfirm() {} });
    assert.ok(modal.includes(copy.prepPickupConfirmNext));
  }
  console.log('Sequential pickup: initial/revisit/stale/loading states, transaction and read-back failure recovery, preserved confirmation, six-language steps/controls/dialog passed.');
} finally { await server.close(); }
