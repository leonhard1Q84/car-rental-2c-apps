import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
const originalFetch = globalThis.fetch;
try {
  const { createCustomerAuthApi, customerAuthConfigured, CustomerAuthError, setCustomerSession, getCustomerSession, clearCustomerSession } = await server.ssrLoadModule('/src/shared/services/customerAuthApi.ts');

  const calls = [];
  let fetchImpl = async () => new Response('{}', { status: 500 });
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options, body: options?.body ? JSON.parse(options.body) : undefined });
    return fetchImpl(url, options);
  };
  const respond = (status, body) => {
    fetchImpl = async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
  const success = (patch = {}) => ({
    access_token: 'token-1', token_type: 'Bearer', expires_at: new Date(Date.now() + 60000).toISOString(),
    order: { order_id: 'PREP01', confirmation_number: 'NRT-PREP-001', brand_code: 'IX' }, ...patch,
  });

  assert.equal(customerAuthConfigured(''), false);
  assert.equal(customerAuthConfigured('  '), false);
  assert.equal(customerAuthConfigured('https://auth.test'), true);
  assert.equal(customerAuthConfigured(), false, 'env base URL is unset in this test run');
  await assert.rejects(createCustomerAuthApi('').lookup('PREP01', '5678'), e => e.code === 'SERVICE_UNAVAILABLE');
  assert.equal(calls.length, 0, 'unconfigured auth service never fetches');

  const api = createCustomerAuthApi('https://auth.test/');
  respond(200, success());
  const session = await api.lookup(' prep01 ', '56-78');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://auth.test/api/customer/auth/lookup', 'trailing slash is normalized');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(calls[0].body, { order_id: 'PREP01', phone_last4: '5678' }, 'order id trims/uppercases, phone keeps digits only');
  assert.deepEqual(session, { accessToken: 'token-1', expiresAt: session.expiresAt, orderId: 'PREP01', confirmationNumber: 'NRT-PREP-001', brandCode: 'IX' });

  let before = calls.length;
  for (const phone of ['567', '56789', 'Smith']) {
    await assert.rejects(api.lookup('PREP01', phone), e => e instanceof CustomerAuthError && e.code === 'LOOKUP_MISMATCH');
  }
  assert.equal(calls.length, before, 'non-4-digit phone input rejects without a network call');

  const invalid = [
    success({ access_token: '' }),
    { ...success(), access_token: undefined },
    success({ token_type: 'Basic' }),
    success({ expires_at: '2020-01-01T00:00:00Z' }),
    success({ order: { order_id: 'OTHER', confirmation_number: 'NRT-PREP-001', brand_code: 'IX' } }),
    { unexpected: true },
  ];
  for (const body of invalid) {
    respond(200, body);
    await assert.rejects(api.lookup('PREP01', '5678'), e => e instanceof CustomerAuthError && e.code === 'SESSION_INVALID', JSON.stringify(body));
  }

  respond(401, { code: 'LOOKUP_MISMATCH' });
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'LOOKUP_MISMATCH');
  respond(401, { code: 'OTHER' });
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'SERVICE_UNAVAILABLE');
  respond(429, { code: 'RATE_LIMITED', retry_after_seconds: 30 });
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'RATE_LIMITED' && e.retryAfterSeconds === 30);
  respond(429, { code: 'RATE_LIMITED' });
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'RATE_LIMITED' && e.retryAfterSeconds === undefined);
  respond(500, { code: 'INTERNAL_ERROR' });
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'SERVICE_UNAVAILABLE');
  respond(200, 'not json');
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'SERVICE_UNAVAILABLE', 'unparseable success body');
  fetchImpl = async () => { throw new TypeError('network down'); };
  await assert.rejects(api.lookup('PREP01', '5678'), e => e.code === 'SERVICE_UNAVAILABLE', 'network failure');
  fetchImpl = () => new Promise(() => {});
  await assert.rejects(createCustomerAuthApi('https://auth.test', 30).lookup('PREP01', '5678'), e => e.code === 'SERVICE_UNAVAILABLE', 'request timeout');

  setCustomerSession(session);
  assert.equal(getCustomerSession('PREP01'), session);
  assert.equal(getCustomerSession('OTHER'), null, 'session is bound to a single order');
  setCustomerSession({ ...session, expiresAt: '2020-01-01T00:00:00Z' });
  assert.equal(getCustomerSession('PREP01'), null, 'expired session is rejected');
  clearCustomerSession();
  assert.equal(getCustomerSession('PREP01'), null, 'cleared session is rejected');
  setCustomerSession(session);
  clearCustomerSession();
  assert.equal(getCustomerSession('PREP01'), null);

  console.log('Customer auth: request normalization, credential validation, error mapping, timeout and in-memory session lifecycle passed.');
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
