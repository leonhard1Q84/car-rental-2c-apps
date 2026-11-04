import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const server = await createServer({ appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
const originalFetch = globalThis.fetch;
try {
  const base = '/src/modules/rental-extension/';
  const model = await server.ssrLoadModule(base + 'model.ts');
  const { createExtensionApi, ApiError } = await server.ssrLoadModule(base + 'api.ts');
  // Exercise the fixture adapter as bundled for Vercel, where DEV is false.
  const productionFixtures = await build({ configFile: false, envDir: false, logLevel: 'error',
    resolve: { alias: { '@shared': path.join(root, 'shared') } },
    plugins: [{ name: 'renewal-production-fixtures', resolveId: id => id === 'renewal-fixtures' || id.endsWith('/renewal-fixtures') ? '\0renewal-fixtures' : undefined,
      load: id => id === '\0renewal-fixtures' ? `export * from ${JSON.stringify(path.join(root, 'modules/rental-extension/localDemo.ts'))}; export * from ${JSON.stringify(path.join(root, 'modules/rental-extension/localDemoGate.ts'))};` : undefined }],
    build: { write: false, lib: { entry: 'renewal-fixtures', formats: ['es'] }, minify: false },
  });
  const fixtureCode = (Array.isArray(productionFixtures) ? productionFixtures[0] : productionFixtures).output.find(item => item.type === 'chunk' && item.isEntry).code;
  const { createLocalRenewalApi, resetLocalRenewalDemo, localRenewalDemoScenario } = await import(`data:text/javascript;base64,${Buffer.from(fixtureCode).toString('base64')}`);
  for (const apiKey of ['VITE_CUSTOMER_AUTH_API_BASE_URL', 'VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL', 'VITE_RENTAL_EXTENSION_API_BASE_URL']) {
    const result = await build({ configFile: false, envDir: false, logLevel: 'error', define: { [`import.meta.env.${apiKey}`]: JSON.stringify('https://api.example.test') },
      build: { write: false, lib: { entry: path.join(root, 'modules/rental-extension/localDemoGate.ts'), formats: ['es'] }, minify: false } });
    const code = (Array.isArray(result) ? result[0] : result).output.find(item => item.type === 'chunk' && item.isEntry).code;
    const gate = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${apiKey}`);
    for (let number = 10006; number <= 10013; number++) assert.equal(gate.localRenewalDemoScenario(`RC${number}`), undefined, `${apiKey} disables simulated eligibility in production`);
  }
  const { findPreparationBooking } = await server.ssrLoadModule('/src/modules/auth/verification.ts');
  const { preparationBooking } = await server.ssrLoadModule('/src/app/customer-journey/bookingFixtures.ts');
  const now = Date.parse('2026-11-03T04:00:00Z');
  const original = '2026-11-04T01:00:00Z';
  const extended = '2026-11-06T01:00:00Z';
  const pickup = '2026-11-01T01:00:00Z';
  const expires = '2026-11-03T05:00:00Z';
  const pricing = { rental_days: 2, base_daily_rate: 100, markup_rate: 0.1, markup_amount: 20, total_rent: 220,
    insurance_amount: 40, addon_amount: 10, grand_total: 270, currency: 'JPY' };
  const plan = { strategy: 'REUSE', consent_required: false, original_amount: 500, required_amount: 500,
    currency: 'JPY', required_through: extended };
  const record = {
    id: 'req-1', order_id: 'order-1', confirmation_number: 'booking-1', brand_code: 'IX', status: 'AWAITING_PAYMENT',
    created_at: '2026-11-03T04:00:00Z', expires_at: expires, extension_days: 2, original_return_time: original,
    new_return_time: extended, pricing_snapshot: pricing, deposit_plan: plan,
    payment: { status: 'PENDING', amount: 270, currency: 'JPY', payment_intent_id: 'pi-1' },
    schedule: { status: 'LOCKED_CURRENT', vehicle_locked: true, target_vehicle_id: 'car-1' },
    allocation: { mode: 'FULL_RENTAL', status: 'HELD', pickup_time: pickup, original_return_time: original,
      new_return_time: extended, vehicle_id: 'car-1', hold_id: 'hold-1', expires_at: expires, source: 'AUTO' },
    manual_review: { status: 'NOT_REQUIRED', notification_status: 'NOT_REQUIRED' },
    contract: { status: 'NOT_READY' }, guarantee: { status: 'SUFFICIENT', deposit_id: 'deposit-1' },
    refund: { status: 'NOT_APPLICABLE', amount: 0 },
  };
  const lookup = {
    code: 'SUCCESS', workflow_version: 'FULL_RENTAL_V2', has_active_request: false,
    active_request_id: null, active_request: null,
    order: { id: 'order-1', confirmation_number: 'booking-1', brand_code: 'IX', status: 'PICKED_UP',
      pickup_time: pickup, current_return_time: original, actual_vehicle_id: 'car-1', atp_status: 'UNAVAILABLE',
      conflict_status: 'HARD_CONFLICT', primary_driver: { surname: 'Smith', email: 'test@example.com' } },
    brand: { extension_enabled: true }, limits: { max_single_extension_days: 15, current_return_time: original },
  };
  const copy = () => structuredClone(record);
  const valid = value => model.validateRenewalRecord(value, lookup);
  const invalid = (edit, message) => { const next = copy(); edit(next); assert.throws(() => valid(next), undefined, message); };

  assert.equal(valid(record), record);
  assert.equal(model.renewalStage(record, now), 'processing', 'a held request resumes its result and requires an explicit payment action');
  assert.equal(model.renewalPayable(record, now), true, 'legacy ATP or conflict flags do not override the new full-rental hold');
  assert.equal('agreement_draft' in record, false);
  assert.equal(model.renewalDepositPlanValid(plan, record), true);
  assert.equal(model.renewalDepositPlanValid(null, record), false);
  assert.equal(model.renewalDepositPlanValid({ ...plan, required_through: original }, record), false);
  assert.equal(model.renewalDepositPlanValid({ ...plan, currency: 'USD' }, record), false);
  assert.equal(model.renewalDepositPlanValid({ ...plan, required_amount: -1 }, record), false);
  assert.equal(model.renewalDepositPlanValid({ ...plan, consent_required: true }, record), false);
  assert.equal(model.renewalDepositPlanValid({ ...plan, consent_required: true, fingerprint: 'fp', terms_version: 'v2' }, record), true);

  const pending = copy();
  pending.status = 'PENDING_STORE_CONFIRMATION'; pending.allocation.status = 'REVIEW_REQUIRED';
  pending.allocation.hold_id = null; pending.allocation.expires_at = null; pending.allocation.source = null;
  pending.manual_review = { status: 'PENDING', notification_status: 'FAILED' };
  valid(pending);
  assert.equal(model.renewalStage(pending, now), 'processing');
  assert.equal(model.renewalPayable(pending, now), false, 'risky full-rental result cannot be paid before branch acceptance');
  assert.equal(model.shouldPollRenewal(pending), true, 'notification failure retains the same review request');
  const accepted = copy(); accepted.allocation.source = 'STORE_OVERRIDE'; accepted.manual_review.status = 'ACCEPTED';
  valid(accepted);
  assert.equal(model.renewalStage(accepted, now), 'processing', 'accepted override still needs a valid hold and payment');
  accepted.allocation.hold_id = null;
  assert.equal(model.renewalPayable(accepted, now), false, 'acceptance alone does not prove forced allocation succeeded');
  const declined = structuredClone(pending); declined.status = 'CLOSED'; declined.closed_reason = 'STORE_REJECTED';
  declined.manual_review.status = 'REJECTED'; declined.allocation.status = 'REJECTED';
  valid(declined);
  assert.equal(model.renewalStage(declined, now), 'status');
  assert.equal(model.shouldPollRenewal(declined), false);
  assert.equal(model.renewalPayable(record, Date.parse(expires)), false, 'hold expiry closes the payment gate immediately');
  const legacy = copy(); legacy.status = 'DRAFT'; legacy.agreement_draft = { signed_at: '2026-11-03T04:00:00Z' };
  assert.equal(model.renewalStage(legacy, now), 'status', 'legacy signature cannot grant payment permission');

  const paid = copy(); paid.status = 'PROCESSING'; paid.payment.status = 'PAID'; paid.contract.status = 'GENERATING';
  valid(paid);
  assert.equal(model.renewalPayable(paid, now), false);
  assert.equal(model.shouldPollRenewal(paid), true);
  paid.status = 'EFFECTIVE'; valid(paid);
  assert.equal(model.shouldPollRenewal(paid), true, 'contract still generates after the renewal takes effect');
  paid.contract.status = 'FAILED'; valid(paid);
  assert.equal(model.renewalStage(paid, now), 'status', 'contract failure never sends a paid request back to payment');
  assert.equal(model.shouldPollRenewal(paid), false);
  const refunding = copy(); refunding.status = 'CLOSED'; refunding.refund.status = 'ACCEPTED';
  assert.equal(model.shouldPollRenewal(refunding), true);

  for (const [status, unresolved] of [['PENDING', true], ['PROCESSING', false], ['PAID', false], ['FAILED', false]]) {
    const next = copy(); next.payment.status = status;
    assert.equal(model.renewalPaymentUnresolved(next), unresolved, `unknown payment reconciliation: ${status}`);
    if (status === 'PROCESSING') assert.equal(model.renewalStage(next, now), 'status');
  }
  const depositFailed = copy(); depositFailed.deposit_authorization = { status: 'FAILED' };
  assert.equal(model.renewalPaymentUnresolved(depositFailed), false);
  const depositUnknown = copy(); depositUnknown.deposit_authorization = { status: 'UNKNOWN' };
  assert.equal(model.renewalPayable(depositUnknown, now), false);
  const depositPending = copy(); depositPending.deposit_authorization = { status: 'PENDING' };
  assert.equal(model.renewalPayable(depositPending, now), true, 'deposit authorization may run as part of the first payment');

  invalid(r => { r.order_id = 'someone-else'; }, 'cross-order response');
  invalid(r => { r.confirmation_number = 'another-booking'; }, 'cross-booking response');
  invalid(r => { r.allocation.pickup_time = original; }, 'tail-only allocation cannot pass as full-rental');
  invalid(r => { r.allocation.vehicle_id = 'replacement-car'; }, 'no silent vehicle switch during rental');
  invalid(r => { r.allocation.new_return_time = original; }, 'hold and request period mismatch');
  invalid(r => { r.allocation.source = 'STORE_OVERRIDE'; }, 'override lacks branch acceptance');
  invalid(r => { r.contract.status = 'GENERATING'; }, 'no contract generation before payment success');
  invalid(r => { r.status = 'EFFECTIVE'; }, 'no effectiveness without successful payment');
  invalid(r => { r.payment.amount = 0; }, 'payment must use the frozen price');
  invalid(r => { r.pricing_snapshot.grand_total = NaN; }, 'invalid server price');
  invalid(r => { delete r.allocation; }, 'legacy response without new inventory evidence');
  const quote = { quote_id: 'quote-1', extension_days: 2, current_return_time: original, new_return_time: extended,
    pricing: { ...pricing, base_rent: 200 }, deposit_plan: plan };
  assert.equal(model.renewalQuoteMatches(record, quote), true);
  assert.equal(model.renewalQuoteMatches(record, { ...quote, pricing: { ...quote.pricing, grand_total: 280 } }), false);
  assert.equal(model.renewalQuoteMatches(record, { ...quote, current_return_time: pickup }), false);

  const calls = [];
  let responseBody = lookup;
  let responseStatus = 200;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: options.body ? JSON.parse(options.body) : undefined });
    return new Response(JSON.stringify(responseBody), { status: responseStatus, headers: { 'Content-Type': 'application/json' } });
  };
  const api = createExtensionApi('https://extension.test', () => 'test-session');
  await api.lookup('order-1');
  assert.equal(calls.at(-1).options.method, 'POST');
  assert.deepEqual(calls.at(-1).body, { order_id: 'order-1' }, 'lookup only sends the order id');
  for (const key of ['confirmation_number', 'surname', 'brand']) assert.equal(key in calls.at(-1).body, false);
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer test-session', 'lookup reuses the customer session token');
  responseBody = quote;
  await api.quote('booking-1', 2, extended);
  assert.equal(calls.at(-1).body.scheduling_policy, 'FULL_RENTAL_V2');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer test-session');
  responseBody = pending;
  await api.create('booking-1', 2, 'test@example.com', 'ja', extended, 'quote-1', 'create-key');
  assert.equal(calls.at(-1).options.headers['Idempotency-Key'], 'create-key');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer test-session');
  assert.equal(calls.at(-1).body.quote_id, 'quote-1');
  assert.equal(calls.at(-1).body.scheduling_policy, 'FULL_RENTAL_V2');
  responseBody = record;
  await api.get('req-1');
  assert.equal(calls.at(-1).options.method, 'GET');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer test-session');
  responseBody = { request: paid };
  await api.pay('req/1', undefined, 'pay-key');
  assert.ok(calls.at(-1).url.endsWith('/requests/req%2F1/pay'));
  assert.equal(calls.at(-1).options.headers['Idempotency-Key'], 'pay-key');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer test-session');
  assert.deepEqual(calls.at(-1).body, {}, 'no simulated card, signature, or self-reported success in payment');
  assert.equal('sign' in api, false);
  assert.ok(calls.every(call => !call.url.endsWith('/sign')));
  responseBody = { ...lookup, workflow_version: undefined };
  await assert.rejects(api.lookup('order-1'), e => e instanceof ApiError && e.code === 'WORKFLOW_UNSUPPORTED');
  responseBody = { ...lookup, order: { ...lookup.order, id: 'another-order' } };
  await assert.rejects(api.lookup('order-1'), e => e.code === 'ORDER_CHANGED');
  responseBody = { code: 'HOLD_EXPIRED' }; responseStatus = 409;
  await assert.rejects(api.get('req-1'), e => e.code === 'HOLD_EXPIRED');
  const before = calls.length;
  await assert.rejects(createExtensionApi('').lookup('order-1'), e => e.code === 'SERVICE_UNAVAILABLE');
  await assert.rejects(createExtensionApi('https://extension.test', () => null).lookup('order-1'), e => e instanceof ApiError && e.code === 'SESSION_REQUIRED');
  assert.equal(calls.length, before, 'no configured endpoint or missing session means no network call');
  assert.equal(model.renewalError({ code: 'SESSION_REQUIRED' }), 'renewSessionRequired');
  assert.equal(localRenewalDemoScenario('RC10001'), undefined, 'ordinary fixtures do not bypass active-rental eligibility');
  const demoStates = { RC10006: 'auto-hold', RC10007: 'review-pending', RC10008: 'review-accepted', RC10009: 'review-rejected',
    RC10010: 'payment-success', RC10011: 'payment-processing', RC10012: 'contract-failed', RC10013: 'payment-retry' };
  const demoLookups = new Map();
  for (const [orderId, scenario] of Object.entries(demoStates)) {
    assert.equal(localRenewalDemoScenario(orderId), scenario);
    assert.ok(findPreparationBooking(orderId, '8888'), `${orderId} uses the shared demo phone suffix`);
    const demoApi = createLocalRenewalApi(orderId);
    const demoLookup = await demoApi.lookup(orderId);
    assert.equal(demoLookup.order.status, 'PICKED_UP');
    assert.equal(demoLookup.brand.extension_enabled, true);
    assert.equal(demoLookup.active_request, null, `${orderId} begins before renewal quote and allocation`);
    assert.equal(demoLookup.latest_request, undefined, `${orderId} has no seeded prior renewal`);
    assert.equal(demoLookup.order.actual_vehicle_id, `vehicle-${orderId}`, 'the existing rental vehicle remains assigned');
    const booking = preparationBooking(orderId);
    assert.equal(demoLookup.order.confirmation_number, booking.confirmationCode);
    assert.equal(demoLookup.order.actual_plate, booking.vehicleAssignment.plate);
    assert.equal(demoLookup.order.actual_model_name, booking.vehicleAssignment.model);
    assert.equal(demoLookup.order.pickup_time, booking.pickupAt);
    assert.equal(demoLookup.order.current_return_time, booking.returnAt);
    assert.equal(demoLookup.order.primary_driver.phone, booking.phone);
    demoLookups.set(orderId, demoLookup);
  }
  async function createFor(orderId, api = createLocalRenewalApi(orderId)) {
    const quote = await api.quote(orderId, 2, extended);
    const request = await api.create(orderId, 2, 'alex.smith@example.com', 'zh-CN', extended, quote.quote_id, `demo-${orderId}`);
    assert.equal(model.renewalQuoteMatches(request, quote), true, `${orderId} request preserves the selected quote`);
    model.validateRenewalRecord(request, demoLookups.get(orderId));
    return { api, quote, request };
  }
  const auto = await createFor('RC10006');
  assert.equal(auto.request.status, 'AWAITING_PAYMENT', 'full-period feasible allocation creates an atomic hold');
  assert.equal(auto.request.allocation.source, 'AUTO');
  assert.equal(auto.request.allocation.vehicle_id, auto.request.schedule.target_vehicle_id);
  const waiting = await createFor('RC10007');
  assert.equal(waiting.request.status, 'PENDING_STORE_CONFIRMATION', 'inventory risk routes the same application to branch review');
  assert.equal(model.renewalPayable(waiting.request), false);
  const acceptedReview = await createFor('RC10008');
  assert.equal(acceptedReview.request.status, 'PENDING_STORE_CONFIRMATION');
  await acceptedReview.api.get(acceptedReview.request.id);
  const acceptedRequest = await acceptedReview.api.get(acceptedReview.request.id);
  assert.equal(acceptedRequest.status, 'AWAITING_PAYMENT', 'branch acceptance force-holds the full period before payment');
  assert.equal(acceptedRequest.allocation.source, 'STORE_OVERRIDE');
  model.validateRenewalRecord(acceptedRequest, demoLookups.get('RC10008'));
  const rejected = await createFor('RC10009');
  await rejected.api.get(rejected.request.id);
  const rejectedRequest = await rejected.api.get(rejected.request.id);
  assert.equal(rejectedRequest.status, 'CLOSED');
  assert.equal(rejectedRequest.closed_reason, 'STORE_REJECTED');
  model.validateRenewalRecord(rejectedRequest, demoLookups.get('RC10009'));
  const paidFlow = await createFor('RC10010');
  const paidDemo = await paidFlow.api.pay(paidFlow.request.id, undefined, 'demo-pay');
  assert.equal(paidDemo.request.status, 'EFFECTIVE');
  assert.equal(model.renewalContractUrl(paidDemo.request), undefined, 'local demo does not offer a fake PDF link');
  model.validateRenewalRecord(paidDemo.request, demoLookups.get('RC10010'));
  const retry = await createFor('RC10013');
  const failedPayment = await retry.api.pay(retry.request.id, undefined, 'demo-retry-1');
  assert.equal(failedPayment.request.payment.status, 'FAILED');
  assert.equal(model.renewalStage(failedPayment.request), 'processing');
  const retrySuccess = await retry.api.pay(retry.request.id, undefined, 'demo-retry-2');
  assert.equal(retrySuccess.request.status, 'EFFECTIVE');
  const processingApi = createLocalRenewalApi('RC10011');
  const processing = await createFor('RC10011', processingApi);
  const processingPay = await processingApi.pay(processing.request.id, undefined, 'demo-pay-processing');
  assert.equal(processingPay.request.payment.status, 'PROCESSING');
  assert.equal((await processingApi.get(processing.request.id)).payment.status, 'PROCESSING');
  assert.equal((await processingApi.get(processing.request.id)).contract.status, 'GENERATING');
  assert.equal((await processingApi.get(processing.request.id)).contract.status, 'READY');
  const failedContract = await createFor('RC10012');
  const contractFailedPay = await failedContract.api.pay(failedContract.request.id, undefined, 'demo-pay-failed-contract');
  assert.equal(contractFailedPay.request.status, 'EFFECTIVE');
  assert.equal(contractFailedPay.request.contract.status, 'FAILED');

  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { OrderOverviewPage } = await server.ssrLoadModule(base + 'OrderOverviewPage.tsx');
  const { LanguageProvider } = await server.ssrLoadModule('/src/contexts/LanguageContext.tsx');
  const sampleLookup = demoLookups.get('RC10006');
  const overviewHtml = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      { initialLang: 'zh-TW' },
      React.createElement(OrderOverviewPage, {
        order: sampleLookup.order,
        maxDays: 15,
        extensionDays: 2,
        requestedReturnTime: '2026-11-06T10:00',
        onReturnTimeChange() {},
        onResetLookup() {},
        onSearchQuote() {},
        searching: false,
        searchError: null,
      })
    )
  );
  assert.ok(overviewHtml.includes('<dialog'), 'first-time entry opens date selection directly');
  assert.ok(!overviewHtml.includes(sampleLookup.order.primary_driver.email), 'date entry omits duplicate driver details');
  assert.ok(!overviewHtml.includes(sampleLookup.order.actual_plate), 'date entry omits duplicate vehicle details');
  assert.ok(overviewHtml.includes('選擇預計還車時間'), 'Renders return time picker title');
  assert.ok(overviewHtml.includes('確認還車時間'), 'date choice confirms the time before quote review');
  assert.ok(!overviewHtml.includes('續租記錄'), 'date choice has no unrelated history action');

  const extensionPageSource = await fs.readFile(path.join(root, 'modules/rental-extension/RentalExtensionPage.tsx'), 'utf8');
  const preparationAppSource = await fs.readFile(path.join(root, 'app/customer-journey/PickupPreparationApp.tsx'), 'utf8');
  assert.ok(extensionPageSource.includes('return null;'), 'initial renewal lookup does not render a standalone loading page');
  assert.ok(!extensionPageSource.includes("<span>{t('prepLoading')}</span>"), 'renewal flow omits the generic preparation loading card');
  assert.ok(preparationAppSource.includes("step === 'renewal' && !renewalReady ? 'home' : step"), 'the trip home remains visible until renewal entry routing is ready');

  // Re-entering renewal starts at the latest effective return, preserving prior snapshots.
  const afterFirst = await paidFlow.api.lookup('RC10010');
  assert.equal(Date.parse(afterFirst.order.current_return_time), Date.parse(extended));
  assert.equal(model.renewalRestartReady(paidDemo.request, afterFirst, now), true);
  assert.equal(model.renewalRestartReady(paidDemo.request, { ...afterFirst, has_active_request: true }, now), false);
  assert.equal(model.renewalRestartReady(paidDemo.request, { ...afterFirst, order: { ...afterFirst.order, current_return_time: original } }, now), false, 'stale order cannot start another extension');
  assert.equal(model.renewalRestartReady(paidDemo.request, afterFirst, Date.parse(extended)), false, 'overdue rental cannot restart');
  const nextReturn = '2026-11-07T01:00:00Z';
  const nextQuote = await paidFlow.api.quote('RC10010', 1, nextReturn);
  assert.equal(Date.parse(nextQuote.current_return_time), Date.parse(extended));
  const second = await paidFlow.api.create('RC10010', 1, 'alex.smith@example.com', 'en', nextReturn, nextQuote.quote_id, 'second-request');
  assert.notEqual(second.id, paidDemo.request.id);
  assert.equal(model.renewalQuoteMatches(second, nextQuote), true);
  const withSecond = await paidFlow.api.lookup('RC10010');
  const history = model.renewalHistory(withSecond, [paidFlow.request]);
  assert.equal(history.length, 2, 'new server snapshot replaces previously observed unpaid version');
  assert.equal(history.find(item => item.id === paidDemo.request.id).payment.status, 'PAID');
  assert.deepEqual(await paidFlow.api.get(paidDemo.request.id), paidDemo.request, 'archived request is immutable');
  assert.equal((await paidFlow.api.create('RC10010', 1, 'alex.smith@example.com', 'en', nextReturn, nextQuote.quote_id, 'second-request')).id, second.id, 'repeated create retains the same request');
  await paidFlow.api.pay(second.id, undefined, 'second-pay');
  assert.equal((await paidFlow.api.create('RC10010', 1, 'alex.smith@example.com', 'en', nextReturn, nextQuote.quote_id, 'second-request')).id, second.id, 'replayed creation after payment must not open another request');
  assert.throws(() => model.renewalHistory({ ...withSecond, request_history: [{ ...paidDemo.request, order_id: 'another-order' }] }), /ORDER_CHANGED/);

  assert.equal(model.renewalEntryRecord({ ...afterFirst, latest_request: { ...paidDemo.request, id: 'later-closed', status: 'CLOSED', created_at: '2026-11-03T08:00:00Z' }, request_history: [paidDemo.request] }).id, paidDemo.request.id, 'a later failed attempt does not hide the last effective extension');
  assert.equal(model.renewalEntryRecord(withSecond).id, second.id, 'an active request takes precedence over the effective result');
  assert.equal(model.renewalEntryRecord({ ...lookup, request_history: [] }), null, 'a first extension opens date selection');
  assert.throws(() => model.renewalEntryRecord({ ...lookup, has_active_request: true, active_request_id: 'missing' }), /RESULT_UNKNOWN/, 'missing active snapshot cannot open a duplicate application');
  const allEffective = await paidFlow.api.lookup(paidDemo.request.order_id);
  assert.equal(model.renewalEntryRecord(allEffective).id, second.id, 'latest effective period is selected after a second extension');

  const { RenewalRecordContent, RenewalContractManagement, RenewalRecords } = await server.ssrLoadModule(base + 'RenewalRecords.tsx');
  const { ActiveExtendedBookingPage } = await server.ssrLoadModule(base + 'ActiveExtendedBookingPage.tsx');
  const { ExtensionDetailPage } = await server.ssrLoadModule(base + 'ExtensionDetailPage.tsx');
  const { ProcessingPage } = await server.ssrLoadModule(base + 'ProcessingPage.tsx');
  const { PaymentPage } = await server.ssrLoadModule(base + 'PaymentPage.tsx');
  const { preparationTranslations } = await server.ssrLoadModule('/src/i18n/preparation.ts');
  const render = (locale, Component, props) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: locale }, React.createElement(Component, props)));
  const archived = { ...paidDemo.request, insurance_snapshot: { ...afterFirst.order.insurance, name: 'Archived coverage' }, addon_snapshot: [], payment: { ...paidDemo.request.payment, card_last4: '4242' } };
  const currentOrder = { ...afterFirst.order, current_return_time: '2026-12-01T10:00:00+09:00', insurance: { ...afterFirst.order.insurance, name: 'Changed coverage' } };
  for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th']) {
    const html = render(locale, RenewalRecordContent, { record: archived, order: currentOrder });
    assert.ok(html.includes('Archived coverage') && !html.includes('Changed coverage'), 'historical coverage uses its frozen snapshot');
    assert.ok(html.includes('•••• 4242'));
    const laterReturn = new Intl.DateTimeFormat(locale, { timeZone: currentOrder.branch_timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(currentOrder.current_return_time));
    assert.ok(!html.includes(laterReturn), 'historical timeline does not borrow the current return time');
    assert.ok(!html.includes(preparationTranslations[locale].renewExtendAgain), 'historical details are read only');
    assert.ok(html.includes(preparationTranslations[locale].renewOriginalReturn));
    assert.ok(html.includes(preparationTranslations[locale].renewRequestedReturn));
    assert.ok(html.includes(preparationTranslations[locale].renewReturnLocation));
    assert.ok(html.includes(preparationTranslations[locale].renewThisExtension.replace('{count}', new Intl.NumberFormat(locale).format(archived.extension_days))));
    assert.ok(!html.includes(preparationTranslations[locale].pickupTime), 'historical details omit the redundant pickup timeline');
    const archivedNewReturn = new Intl.DateTimeFormat(locale, { timeZone: currentOrder.branch_timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(archived.new_return_time));
    assert.equal(html.split(archivedNewReturn).length - 1, 1, 'new return time is shown once');
    assert.ok(html.includes(preparationTranslations[locale].renewNoAddons));
    assert.ok(html.includes(archived.payment.payment_intent_id));
    const successHtml = render(locale, ActiveExtendedBookingPage, { record: archived, order: currentOrder, busy: false, error: null, onRefresh() {}, onBack() {} });
    assert.ok(!successHtml.includes(currentOrder.primary_driver.email), 'result omits duplicate driver contact');
    assert.ok(successHtml.includes(currentOrder.actual_plate), 'result keeps the assigned vehicle');
    assert.ok(successHtml.includes(currentOrder.return_branch_name), 'result shows the return branch');
    assert.ok(!successHtml.includes(preparationTranslations[locale].renewMainContract), 'result omits original contract');
    assert.ok(!successHtml.includes('<details'), 'result omits the fee breakdown');
    for (const key of ['renewSuccessTitle', 'renewSuccessDescription', 'renewPaidAmount', 'renewPaid', 'renewRequestedReturn', 'renewReturnLocation', 'renewContractTitle', 'prepBackHome']) assert.ok(successHtml.includes(preparationTranslations[locale][key]), `${locale} success screen includes ${key}`);
    for (const key of ['renewExtendAgain', 'renewRecordDetails', 'renewHistory', 'renewBeforeExtension', 'renewPaymentReceipt', 'renewCompleteBooking', 'renewPricingDetailsTitle', 'renewRefresh', 'prepCallStore']) assert.ok(!successHtml.includes(preparationTranslations[locale][key]), `${locale} success screen omits ${key}`);
    const footer = successHtml.slice(successHtml.indexOf('<footer'));
    assert.ok(footer.includes(preparationTranslations[locale].prepBackHome), 'back-to-home is the only primary success action');
    assert.ok(!footer.includes(preparationTranslations[locale].renewExtendAgain));
    assert.ok(!footer.includes(preparationTranslations[locale].renewCompleteBooking));
    const downloadable = render(locale, ActiveExtendedBookingPage, { record: { ...archived, contract: { status: 'READY', url: 'https://files.test/extension.pdf' } }, order: currentOrder, busy: false, error: null, onRefresh() {}, onBack() {} });
    assert.ok(downloadable.includes('https://files.test/extension.pdf') && downloadable.includes(preparationTranslations[locale].renewDownloadPdf) && downloadable.includes(preparationTranslations[locale].renewContractArchiveHint), `${locale} ready contract offers the PDF download`);
    const held = { ...record, expires_at: new Date(Date.now() + 60000).toISOString(), allocation: { ...record.allocation, expires_at: new Date(Date.now() + 60000).toISOString() } };
    const props = { order: sampleLookup.order, record: held, extensionDays: held.extension_days, newReturnTime: held.new_return_time, grandTotal: pricing.grand_total, currency: pricing.currency };
    const readyHtml = render(locale, ProcessingPage, props);
    assert.ok(readyHtml.includes(preparationTranslations[locale].renewGoToPayment), 'reservation offers an explicit payment action');
    assert.ok(readyHtml.includes(preparationTranslations[locale].renewPaymentDeadlineLabel));
    assert.ok(!readyHtml.includes('cc-number'), 'reservation does not collect card data');
    assert.ok(!readyHtml.includes(preparationTranslations[locale].renewPaidAmount), 'reservation never claims a payment');
    const confirmingPaymentHtml = render(locale, ProcessingPage, { ...props, record: { ...held, status: 'PROCESSING', payment: { ...held.payment, status: 'PROCESSING' } } });
    assert.ok(confirmingPaymentHtml.includes(preparationTranslations[locale].renewProcessingPaymentTitle));
    assert.ok(!confirmingPaymentHtml.includes(preparationTranslations[locale].renewPaidAmount), 'bank processing does not claim confirmed funds');
    const confirmingExtensionHtml = render(locale, ProcessingPage, { ...props, record: { ...held, status: 'PROCESSING', payment: { ...held.payment, status: 'PAID' } } });
    assert.ok(confirmingExtensionHtml.includes(preparationTranslations[locale].renewConfirmingTitle));
    assert.ok(confirmingExtensionHtml.includes(preparationTranslations[locale].renewPaidAmount));
    const expiredHtml = render(locale, ProcessingPage, { ...props, record });
    assert.ok(!expiredHtml.includes(preparationTranslations[locale].renewGoToPayment), 'an expired reservation cannot open payment');
    const paymentHtml = render(locale, PaymentPage, { ...props, onBack() {}, onPay() {} });
    assert.ok(paymentHtml.includes('cc-number'), 'card entry exists on the explicitly opened payment screen');
    assert.ok(!paymentHtml.includes(preparationTranslations[locale].renewHoldReady), 'payment omits the duplicate reservation banner');
    assert.ok(!paymentHtml.includes('<header') && !paymentHtml.includes('lucide-languages'), 'payment uses the app navigation');
    const listHtml = render(locale, RenewalRecords, { records: [archived], order: currentOrder, busy: false, onRefresh() {}, onSelect() {}, onExtendAgain() {} });
    assert.ok(!listHtml.includes(preparationTranslations[locale].renewRefresh), 'stable records omit the global refresh action');
    assert.ok(listHtml.includes(preparationTranslations[locale].renewExtendAgain), 'records page offers apply-again as the primary action');
  }
  const missingSnapshot = { ...archived, insurance_snapshot: undefined, addon_snapshot: undefined };
  const missingHtml = render('en', RenewalRecordContent, { record: missingSnapshot, order: currentOrder });
  assert.ok(missingHtml.includes('Details unavailable') && !missingHtml.includes('Changed coverage'));
  const noPaymentHtml = render('en', RenewalRecordContent, { record, order: currentOrder });
  assert.ok(!noPaymentHtml.includes(record.payment.payment_intent_id), 'unpaid request has no payment receipt');
  assert.equal(model.renewalContractUrl({ ...archived, contract: { status: 'READY', url: 'javascript:alert(1)' } }), undefined);
  assert.equal(model.renewalContractUrl({ ...archived, contract: { status: 'GENERATING', url: 'https://files.test/contract.pdf' } }), undefined);
  const filesHtml = render('en', RenewalContractManagement, { record: { ...archived, contract: { status: 'READY', url: 'https://files.test/extension.pdf' } }, originalContract: { number: 'ORIGINAL-1', url: 'https://files.test/original.pdf' }, busy: false, onRefresh() {} });
  assert.ok(filesHtml.includes('https://files.test/extension.pdf') && !filesHtml.includes('https://files.test/original.pdf'), 'renewal shows only the extension contract');
  const failedFilesHtml = render('en', RenewalContractManagement, { record: { ...archived, contract: { status: 'FAILED' } }, busy: false, onRefresh() {} });
  assert.ok(failedFilesHtml.includes(preparationTranslations.en.renewContractFailed));
  assert.ok(!failedFilesHtml.includes('<a '), 'unavailable files do not produce fake contract links');
  const emptyRecordsHtml = render('en', RenewalRecords, { records: [], order: currentOrder, busy: false, onRefresh() {}, onSelect() {} });
  assert.ok(emptyRecordsHtml.includes(preparationTranslations.en.renewHistoryEmpty));
  const detailHtml = render('en', ExtensionDetailPage, { order: currentOrder, quote: nextQuote, busy: false, error: null, onApply() {}, onBack() {} });
  assert.ok(detailHtml.includes(preparationTranslations.en.renewConfirmApply), 'review quote remains reachable before submitting another extension');
  assert.ok(!detailHtml.includes(preparationTranslations.en.renewResetLookup) && !detailHtml.includes('<header'), 'quote review has no duplicate lookup or brand header');

  const untouchedDemo = await createLocalRenewalApi('RC10011').lookup('RC10011');
  resetLocalRenewalDemo('RC10010');
  const restartedDemo = await createLocalRenewalApi('RC10010').lookup('RC10010');
  assert.equal(restartedDemo.order.current_return_time, '2026-11-04T10:00:00+09:00', 'restart restores original rental period');
  assert.equal(restartedDemo.active_request, null, 'restart clears active requests');
  assert.equal(restartedDemo.latest_request ?? null, null, 'restart clears processed requests');
  assert.deepEqual(restartedDemo.request_history, [], 'restart clears local request history');
  assert.deepEqual(await createLocalRenewalApi('RC10011').lookup('RC10011'), untouchedDemo, 'other renewal demo remains unchanged');
  console.log('Renewal records: repeated extensions, replayed creates, immutable snapshots, same-order history, six-language details, payment receipts, contract file states and isolated demo restart passed.');
  console.log('Local renewal demos: shared 8888 login, active eligibility, allocation/payment, manual review/rejection, payment recovery and contract lifecycle passed.');
  console.log('Rental extension: explicit payment entry, full-period/current-car evidence, review/override/rejection gates, expiry, unknown payment, paid contract lifecycle, snapshots, sessions and idempotent API payloads passed.');
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
