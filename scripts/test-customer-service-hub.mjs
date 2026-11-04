import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } });
try {
  const root = '/src';
  const { customerEntryFlow } = await server.ssrLoadModule(`${root}/app/router.tsx`);
  const { preparationEntryStep } = await server.ssrLoadModule(`${root}/modules/auth/verification.ts`);
  const { preparationNavigationUrl } = await server.ssrLoadModule(`${root}/app/customer-journey/serviceNavigation.ts`);
  const { LanguageProvider } = await server.ssrLoadModule(`${root}/contexts/LanguageContext.tsx`);
  const { preparationTranslations } = await server.ssrLoadModule(`${root}/i18n/preparation.ts`);
  const { RenewalPayment, RenewalStatus, RenewalUnresolved } = await server.ssrLoadModule(`${root}/modules/rental-extension/RentalExtensionPage.tsx`);
  for (const search of ['', '?flow=pickup-preparation', '?flow=unknown']) assert.equal(customerEntryFlow(search), 'customer');
  assert.equal(customerEntryFlow('?flow=selfservice'), 'selfservice');
  assert.equal(preparationEntryStep('renewal'), 'renewal');
  for (const path of ['/', '/selfservice.html?flow=pickup-preparation']) {
    const url = preparationNavigationUrl(`https://customer.invalid${path}`, 'renewal', 'RC10001');
    assert.equal(url.searchParams.get('step'), 'renewal');
    assert.equal(url.searchParams.get('orderId'), 'RC10001');
    assert.equal(url.searchParams.has('surname'), false);
    const back = preparationNavigationUrl(url.href, 'home', 'RC10001');
    assert.equal(back.searchParams.get('orderId'), 'RC10001');
    assert.equal(back.searchParams.get('step'), 'home');
  }
  const record = {
    id: 'REQUEST-1', status: 'AWAITING_PAYMENT', new_return_time: '2026-11-06T10:00:00+09:00',
    payment: { status: 'PENDING', amount: 12000, currency: 'JPY' },
    pricing_snapshot: { total_rent: 10000, insurance_amount: 1000, addon_amount: 1000, grand_total: 12000, currency: 'JPY' },
    deposit_plan: { strategy: 'EXEMPT', consent_required: false, original_amount: 0, required_amount: 0, currency: 'JPY', required_through: '2026-11-07T10:00:00+09:00' },
    allocation: { mode: 'FULL_RENTAL', status: 'HELD', hold_id: 'HOLD-1', expires_at: new Date(Date.now() + 60000).toISOString(), source: 'AUTO' },
    manual_review: { status: 'NOT_REQUIRED' }, contract: { status: 'NOT_READY' }, refund: { status: 'NOT_APPLICABLE' },
  };
  const render = (component, props, language) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(component, { record, busy: false, unknown: false, timezone: 'Asia/Tokyo', onPay() {}, onRefresh() {}, onBack() {}, ...props })));
  const primaryDisabled = html => /<button[^>]*disabled=""[^>]*class="[^"]*bg-customer-fill-disabled/.test(html);
  for (const [language, copy] of Object.entries(preparationTranslations)) {
    for (const [key, value] of Object.entries(copy)) if (key.startsWith('renew')) assert.ok(value?.trim(), `${language}.${key}`);
    const payment = render(RenewalPayment, {}, language);
    assert.ok(payment.includes(copy.renewPay));
    assert.equal(primaryDisabled(payment), false, 'explicitly opened payment needs a valid hold without signature');
    assert.doesNotMatch(payment, /<canvas|type="checkbox"/);
    for (const patch of [{ currency: 'USD' }, { required_amount: NaN }, { required_through: 'invalid' }, { required_through: '2026-11-05T10:00:00+09:00' }]) {
      const invalid = structuredClone(record); Object.assign(invalid.deposit_plan, patch);
      const html = render(RenewalPayment, { record: invalid }, language);
      assert.ok(primaryDisabled(html), 'invalid deposit plan blocks the visible payment button');
      assert.ok(html.includes(copy.renewAgreementMissing));
    }
    const unresolved = render(RenewalUnresolved, {}, language);
    assert.ok(unresolved.includes(copy.renewRequestUnknown));
    assert.ok(unresolved.includes(copy.renewReconnect));
    assert.ok(!unresolved.includes(copy.renewPay));
    const expired = structuredClone(record);
    expired.allocation.expires_at = new Date(Date.now() - 1000).toISOString();
    assert.ok(primaryDisabled(render(RenewalPayment, { record: expired }, language)), 'expired hold cannot be paid');
    const waiting = structuredClone(record);
    waiting.status = 'PENDING_STORE_CONFIRMATION'; waiting.allocation.status = 'REVIEW_REQUIRED'; waiting.manual_review.status = 'PENDING';
    const waitingHtml = render(RenewalStatus, { record: waiting }, language);
    assert.ok(waitingHtml.includes(copy.renewAwaitingStore));
    assert.ok(!waitingHtml.includes(copy.renewPay));
    assert.ok(!waitingHtml.includes(copy.renewContractTitle));
    waiting.manual_review.notification_status = 'FAILED';
    assert.ok(render(RenewalStatus, { record: waiting }, language).includes(copy.renewNotificationFailed));
    const rejected = structuredClone(waiting);
    rejected.status = 'CLOSED'; rejected.manual_review.status = 'REJECTED';
    const rejectedHtml = render(RenewalStatus, { record: rejected }, language);
    assert.ok(rejectedHtml.includes(copy.renewStoreRejected));
    assert.ok(!rejectedHtml.includes(copy.renewPay));
    for (const [status, key] of [['NOT_READY', 'renewContractPending'], ['GENERATING', 'renewContractGenerating'], ['FAILED', 'renewContractFailed'], ['READY', 'renewContractReady']]) {
      const paid = structuredClone(record);
      paid.status = 'EFFECTIVE'; paid.payment.status = 'PAID'; paid.contract = { status, url: 'https://contracts.invalid/extension.pdf' };
      const html = render(RenewalStatus, { record: paid }, language);
      assert.ok(html.includes(copy[key]));
      assert.equal(html.includes('href="https://contracts.invalid/extension.pdf"'), status === 'READY');
      assert.ok(!html.includes(copy.renewPay));
      for (const url of ['javascript:alert(1)', 'http://contracts.invalid/file.pdf', '/file.pdf', '']) {
        paid.contract.url = url;
        const invalid = render(RenewalStatus, { record: paid }, language);
        assert.doesNotMatch(invalid, /href=/, 'contract download requires an HTTPS link');
        if (status === 'READY') assert.ok(invalid.includes(copy.renewContractUnavailable));
      }
    }
  }
  console.log('Customer hub: default/compatible entry, same-order renewal navigation, payment eligibility, hold expiry, manual review/rejection and post-payment contracts in six languages passed.');
} finally { await server.close(); }
