import type { ExtensionRequest, LookupSuccessResponse, SanitizedOrder } from './contracts';
import type { PreparationLanguage } from '../../i18n/preparation';
export interface AgreementDocument {
  id: string; locale: PreparationLanguage; version: string; hash: string;
  title: string; notice: string;
  sections: Array<{ title: string; rows?: Array<{label: string; value: string}>; paragraphs?: string[];
    photos?: Array<{label: string; url: string; sha256: string}> }>;
}
export interface DepositPlan {
  strategy: 'REUSE' | 'EXEMPT' | 'INCREMENT' | 'REAUTHORIZE'; consent_required: boolean;
  original_amount: number; required_amount: number; currency: string; required_through: string;
  record_type?: 'CARD_PREAUTH' | 'CASH_DEPOSIT'; capture_before?: string; fingerprint?: string; terms_version?: string;
}
export interface DepositConsent { accepted: true; fingerprint: string; terms_version: string; }
export interface RentalAllocation {
  mode: 'FULL_RENTAL';
  status: 'HELD' | 'REVIEW_REQUIRED' | 'REJECTED';
  pickup_time: string; original_return_time: string; new_return_time: string; vehicle_id: string;
  hold_id: string | null; expires_at: string | null;
  source: 'AUTO' | 'STORE_OVERRIDE' | null;
}
export interface RequestRecord extends ExtensionRequest {
  allocation: RentalAllocation;
  manual_review: {
    status: 'NOT_REQUIRED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    notification_status: 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'FAILED';
  };
  contract: { status: 'NOT_READY' | 'GENERATING' | 'READY' | 'FAILED'; url?: string };
  deposit_plan?: DepositPlan | null;
  deposit_authorization?: { status: 'PENDING' | 'SUFFICIENT' | 'FAILED' | 'UNKNOWN'; release_status?: string };

  payment: ExtensionRequest['payment'] & {required?: boolean; processed_at?: string; card_last4?: string};
  document?: AgreementDocument | null;
  delivery_email?: string;
  effective_at?: string;
  original_return_time?: string;
  remaining_seconds?: number;
  insurance_snapshot?: SanitizedOrder['insurance'];
  addon_snapshot?: SanitizedOrder['addons'];
}
export interface LookupResult extends Omit<LookupSuccessResponse, 'active_request' | 'access_token'> {
  workflow_version: 'FULL_RENTAL_V2';
  active_request: RequestRecord | null;
  latest_request?: RequestRecord | null;
  // Optional history projection; service integration must confirm availability.
  request_history?: RequestRecord[];
}
export interface Quote {
  quote_id: string;
  deposit_plan?: DepositPlan | null;
  extension_days: number; current_return_time: string; new_return_time: string;
  pricing: {
    rental_days: number; markup_rate: number; base_daily_rate: number; base_rent: number; markup_amount: number; total_rent: number;
    insurance_amount: number; addon_amount: number; grand_total: number; currency: string;
  };
  addon_details?: SanitizedOrder['addons'];
}
export class ApiError extends Error {
  constructor(public code: string, public data: Record<string, unknown> = {}) { super(code); }
}

/** Protocol adapted from the reference customer prototype; no backend is bundled.
 *  All calls reuse the unified customer session token from the home verification; nothing else is issued or stored here. */
export function createExtensionApi(baseUrl: string = import.meta.env?.VITE_RENTAL_EXTENSION_API_BASE_URL || '', getToken: () => string | null = () => null) {
  async function request<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    if (!baseUrl.trim()) throw new ApiError('SERVICE_UNAVAILABLE');
    const token = getToken();
    if (!token) throw new ApiError('SESSION_REQUIRED');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new ApiError('RESULT_UNKNOWN')); }, 15000);
    });
    try {
      return await Promise.race([timeout, (async () => {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/mock/rental-extension${path}`, {
          method: body === undefined ? 'GET' : 'POST', signal: controller.signal, cache: 'no-store',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok) throw new ApiError(result.code || 'SERVICE_UNAVAILABLE');
        return result as T;
      })()]);
    } finally { clearTimeout(timer!); }
  }
  return {
    lookup: async (orderId: string) => {
      const result = await request<LookupResult>('/auth/lookup', { order_id: orderId });
      if (result.order?.id !== orderId) throw new ApiError('ORDER_CHANGED');
      if (result.workflow_version !== 'FULL_RENTAL_V2') throw new ApiError('WORKFLOW_UNSUPPORTED');
      return result;
    },
    quote: (confirmation_number: string, extension_days: number, new_return_time: string) => request<Quote>('/quotes/calculate', {
      confirmation_number, extension_days, new_return_time, scheduling_policy: 'FULL_RENTAL_V2',
    }),
    create: (confirmation_number: string, extension_days: number, delivery_email: string, locale: PreparationLanguage,
      new_return_time: string, quote_id: string, idempotencyKey: string) => request<RequestRecord>('/requests/create', {
      confirmation_number, extension_days, delivery_email, locale, new_return_time, quote_id, scheduling_policy: 'FULL_RENTAL_V2',
    }, idempotencyKey),
    get: (id: string) => request<RequestRecord>(`/requests/${encodeURIComponent(id)}`),
    pay: (id: string, deposit_consent: DepositConsent | undefined, idempotencyKey: string) =>
      request<{ request: RequestRecord }>(`/requests/${encodeURIComponent(id)}/pay`, { deposit_consent }, idempotencyKey),
  };
}
