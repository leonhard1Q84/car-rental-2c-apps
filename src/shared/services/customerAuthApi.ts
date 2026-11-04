// Customer unified auth: exchange 订单号 + 订单联系电话后四位 for an in-memory session token.
// Contract: docs/shared/api-contract/customer-auth.md. The token is never persisted or put in URLs.

export type CustomerSession = {
  accessToken: string;
  expiresAt: string;
  orderId: string;
  confirmationNumber: string;
  brandCode: string;
};

export type CustomerAuthErrorCode = 'LOOKUP_MISMATCH' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE' | 'SESSION_INVALID';

export class CustomerAuthError extends Error {
  constructor(public code: CustomerAuthErrorCode, public retryAfterSeconds?: number) {
    super(code);
    this.name = 'CustomerAuthError';
  }
}

export function customerAuthConfigured(baseUrl: string = import.meta.env?.VITE_CUSTOMER_AUTH_API_BASE_URL || ''): boolean {
  return Boolean(baseUrl.trim());
}

let session: CustomerSession | null = null;

export function setCustomerSession(next: CustomerSession) {
  session = next;
}

export function clearCustomerSession() {
  session = null;
}

export function getCustomerSession(orderId: string): CustomerSession | null {
  if (!session || session.orderId !== orderId) return null;
  const expiry = Date.parse(session.expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;
  return session;
}

interface CustomerAuthLookupResponse {
  access_token?: unknown;
  token_type?: unknown;
  expires_at?: unknown;
  order?: { order_id?: unknown; confirmation_number?: unknown; brand_code?: unknown };
}

export function createCustomerAuthApi(baseUrl: string = import.meta.env?.VITE_CUSTOMER_AUTH_API_BASE_URL || '', timeoutMs = 15000) {
  return {
    lookup: async (orderId: string, phoneLast4: string): Promise<CustomerSession> => {
      const normalizedOrderId = orderId.trim().toUpperCase();
      const normalizedPhoneLast4 = phoneLast4.replace(/\D/g, '');
      if (!/^\d{4}$/.test(normalizedPhoneLast4)) throw new CustomerAuthError('LOOKUP_MISMATCH');
      if (!baseUrl.trim()) throw new CustomerAuthError('SERVICE_UNAVAILABLE');
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout>;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new CustomerAuthError('SERVICE_UNAVAILABLE')); }, timeoutMs);
      });
      let response: Response;
      try {
        response = await Promise.race([timeout, fetch(`${baseUrl.replace(/\/$/, '')}/api/customer/auth/lookup`, {
          method: 'POST',
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: normalizedOrderId, phone_last4: normalizedPhoneLast4 }),
        })]);
      } catch {
        throw new CustomerAuthError('SERVICE_UNAVAILABLE');
      } finally {
        clearTimeout(timer!);
      }
      let result: CustomerAuthLookupResponse & { code?: unknown; retry_after_seconds?: unknown };
      try {
        result = await response.json();
      } catch {
        throw new CustomerAuthError('SERVICE_UNAVAILABLE');
      }
      if (!response.ok) {
        if (response.status === 401 && result?.code === 'LOOKUP_MISMATCH') throw new CustomerAuthError('LOOKUP_MISMATCH');
        if (response.status === 429) {
          const retry = result?.retry_after_seconds;
          throw new CustomerAuthError('RATE_LIMITED', typeof retry === 'number' && Number.isFinite(retry) ? retry : undefined);
        }
        throw new CustomerAuthError('SERVICE_UNAVAILABLE');
      }
      const order = result?.order ?? {};
      const expiry = typeof result?.expires_at === 'string' ? Date.parse(result.expires_at) : NaN;
      if (typeof result?.access_token !== 'string' || !result.access_token
        || result.token_type !== 'Bearer'
        || !Number.isFinite(expiry) || expiry <= Date.now()
        || order.order_id !== normalizedOrderId) {
        throw new CustomerAuthError('SESSION_INVALID');
      }
      return {
        accessToken: result.access_token,
        expiresAt: result.expires_at as string,
        orderId: normalizedOrderId,
        confirmationNumber: typeof order.confirmation_number === 'string' ? order.confirmation_number : '',
        brandCode: typeof order.brand_code === 'string' ? order.brand_code : '',
      };
    },
  };
}
