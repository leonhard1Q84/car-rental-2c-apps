import { ApiError, type DepositPlan, type LookupResult, type Quote, type RequestRecord } from './api';
import type { PreparationKey } from '../../i18n/preparation';

export type RenewalStage = 'conditions' | 'detail' | 'processing' | 'payment' | 'status';
export interface RenewalBooking {
  orderId: string; confirmationNumber: string; brand: string;
  customerName: string; vehicleName: string; plate?: string;
  returnAt: string; timezone: string; phone: string;
}

export function formatQuoteBreakdown(quote: Quote, order: LookupResult['order']) {
  const p = quote.pricing;
  const insurance = order.insurance;
  const addons = quote.addon_details ?? order.addons;
  return {
    newReturnTime: quote.new_return_time,
    baseDailyRate: p.base_daily_rate,
    baseRent: p.total_rent - p.markup_amount,
    insuranceName: insurance?.name || '',
    insuranceDailyRate: insurance?.daily_rate ?? 0,
    insuranceAmount: p.insurance_amount,
    addonsList: (addons || []).map((a) => ({
      ...a,
      subtotal: a.charge_type === 'DAILY' ? a.unit_price * a.quantity * quote.extension_days : a.unit_price * a.quantity,
    })),
    addonAmount: p.addon_amount,
    extensionFee: 0,
    grandTotal: p.grand_total,
    currency: p.currency,
  };
}

export function renewalHoldValid(record: RequestRecord, now = Date.now()) {
  const a = record.allocation;
  return Boolean(a?.mode === 'FULL_RENTAL' && a.status === 'HELD' && a.hold_id
    && Number.isFinite(Date.parse(a.expires_at ?? '')) && Date.parse(a.expires_at!) > now
    && ((a.source === 'AUTO' && record.manual_review?.status === 'NOT_REQUIRED')
      || (a.source === 'STORE_OVERRIDE' && record.manual_review?.status === 'ACCEPTED')));
}
export function renewalPayable(record: RequestRecord, now = Date.now()) {
  return record.status === 'AWAITING_PAYMENT' && renewalHoldValid(record, now)
    && ['PENDING', 'FAILED'].includes(record.payment?.status) && !record.payment.processed_at
    && record.deposit_authorization?.status !== 'UNKNOWN'
    && record.contract?.status === 'NOT_READY';
}
export function renewalDepositPlanValid(plan: DepositPlan | null | undefined, record: RequestRecord): plan is DepositPlan {
  return Boolean(plan && ['REUSE', 'EXEMPT', 'INCREMENT', 'REAUTHORIZE'].includes(plan.strategy)
    && typeof plan.consent_required === 'boolean' && plan.currency === record.pricing_snapshot.currency
    && Number.isFinite(plan.original_amount) && plan.original_amount >= 0
    && Number.isFinite(plan.required_amount) && plan.required_amount >= 0
    && Number.isFinite(Date.parse(plan.required_through)) && Date.parse(plan.required_through) >= Date.parse(record.new_return_time)
    && (!plan.consent_required || (plan.fingerprint && plan.terms_version)));
}
export function renewalPaymentUnresolved(record: RequestRecord) {
  return record.payment.status === 'PENDING' && record.deposit_authorization?.status !== 'FAILED'
    && !['CLOSED', 'EFFECTIVE'].includes(record.status);
}
export function renewalStage(record: RequestRecord, now = Date.now()): RenewalStage {
  return renewalPayable(record, now) || record.status === 'PENDING_STORE_CONFIRMATION' ? 'processing' : 'status';
}
export function shouldPollRenewal(record: RequestRecord) {
  return !['EFFECTIVE', 'CLOSED'].includes(record.status)
    || ['PROCESSING', 'ACCEPTED'].includes(record.refund?.status)
    || (record.payment.status === 'PAID' && ['NOT_READY', 'GENERATING'].includes(record.contract?.status));
}
export function renewalQuoteMatches(record: RequestRecord, quote: Quote) {
  const a = record.pricing_snapshot, b = quote.pricing;
  const plansMatch = (['strategy', 'consent_required', 'original_amount', 'required_amount', 'currency', 'required_through',
    'record_type', 'capture_before', 'fingerprint', 'terms_version'] as const)
    .every(key => record.deposit_plan?.[key] === quote.deposit_plan?.[key]);
  return record.extension_days === quote.extension_days && sameInstant(record.new_return_time, quote.new_return_time)
    && sameInstant(record.original_return_time ?? '', quote.current_return_time) && plansMatch
    && (['rental_days', 'base_daily_rate', 'markup_rate', 'markup_amount', 'total_rent', 'insurance_amount', 'addon_amount', 'grand_total', 'currency'] as const)
      .every(key => a[key] === b[key]);
}
function sameInstant(a: string, b: string) { return Number.isFinite(Date.parse(a)) && Date.parse(a) === Date.parse(b); }
export function validateRenewalRecord(record: RequestRecord, lookup: LookupResult): RequestRecord {
  if (!record || record.confirmation_number !== lookup.order.confirmation_number || record.brand_code !== lookup.order.brand_code
    || record.order_id !== lookup.order.id || !record.id || !record.payment || !record.pricing_snapshot) throw new ApiError('ORDER_CHANGED');
  const a = record.allocation, p = record.pricing_snapshot;
  const finiteAmounts = [p.rental_days, p.base_daily_rate, p.markup_rate, p.markup_amount, p.total_rent,
    p.insurance_amount, p.addon_amount, p.grand_total, record.payment.amount].every(value => Number.isFinite(value) && value >= 0);
  const validPeriod = Number.isInteger(record.extension_days) && record.extension_days > 0
    && Date.parse(record.new_return_time) > Date.parse(record.original_return_time ?? '');
  if (!a || a.mode !== 'FULL_RENTAL' || !['HELD', 'REVIEW_REQUIRED', 'REJECTED'].includes(a.status)
    || !sameInstant(a.pickup_time, lookup.order.pickup_time) || a.vehicle_id !== lookup.order.actual_vehicle_id
    || !sameInstant(a.new_return_time, record.new_return_time)
    || !sameInstant(a.original_return_time, record.original_return_time ?? '')
    || !['NOT_REQUIRED', 'PENDING', 'ACCEPTED', 'REJECTED'].includes(record.manual_review?.status)
    || !['NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED'].includes(record.manual_review?.notification_status)
    || !['NOT_READY', 'GENERATING', 'READY', 'FAILED'].includes(record.contract?.status)
    || !finiteAmounts || !validPeriod || !p.currency || record.payment.currency !== p.currency
    || record.payment.amount !== p.grand_total) throw new ApiError('SNAPSHOT_CHANGED');
  if (!['DRAFT', 'AWAITING_CUSTOMER_CONFIRMATION', 'PENDING_STORE_CONFIRMATION', 'AWAITING_PAYMENT', 'PROCESSING', 'EFFECTIVE', 'CLOSED'].includes(record.status)
    || !['PENDING', 'PROCESSING', 'PAID', 'FAILED'].includes(record.payment.status)) throw new ApiError('SNAPSHOT_CHANGED');
  if (record.payment.status !== 'PAID' && record.contract.status !== 'NOT_READY') throw new ApiError('SNAPSHOT_CHANGED');
  if (record.status === 'EFFECTIVE' && record.payment.status !== 'PAID') throw new ApiError('SNAPSHOT_CHANGED');
  if (record.status === 'AWAITING_PAYMENT' && (!sameInstant(a.original_return_time, lookup.order.current_return_time)
    || a.status !== 'HELD' || !a.hold_id || !Number.isFinite(Date.parse(a.expires_at ?? ''))
    || !((a.source === 'AUTO' && record.manual_review.status === 'NOT_REQUIRED')
      || (a.source === 'STORE_OVERRIDE' && record.manual_review.status === 'ACCEPTED')))) throw new ApiError('SNAPSHOT_CHANGED');
  if (record.status === 'PENDING_STORE_CONFIRMATION' && (a.status !== 'REVIEW_REQUIRED' || a.hold_id || a.source
    || record.manual_review.status !== 'PENDING' || record.payment.status !== 'PENDING')) throw new ApiError('SNAPSHOT_CHANGED');
  if (record.manual_review.status === 'REJECTED' && (record.status !== 'CLOSED' || a.status !== 'REJECTED'
    || record.payment.status !== 'PENDING' || record.closed_reason !== 'STORE_REJECTED')) throw new ApiError('SNAPSHOT_CHANGED');
  return record;
}
export function renewalError(error: unknown): PreparationKey {
  const code = (error as { code?: string })?.code || '';
  if (code === 'SESSION_REQUIRED') return 'renewSessionRequired';
  if (/ORDER_NOT_ACTIVE|ORDER_OVERDUE|EXTENSION_DISABLED/.test(code)) return 'prepRenewalWaitingHint';
  if (/ATP|STOCK|VEHICLE|HARD_CONFLICT/.test(code)) return 'renewNoStock';
  if (/INVALID_EXTENSION|INVALID_RETURN|TIMEZONE/.test(code)) return 'renewInvalidReturn';
  if (/CHANGED|MISMATCH|HASH|VERSION|SESSION/.test(code)) return 'renewMismatch';
  if (/DOCUMENT|TEMPLATE|LOCALE/.test(code)) return 'renewAgreementMissing';
  if (/DEPOSIT|GUARANTEE|PAYMENT/.test(code)) return 'renewPaymentFailed';
  return 'renewUnavailable';
}

export function renewalHistory(lookup: LookupResult, observed: RequestRecord[] = []) {
  const byId = new Map<string, RequestRecord>();
  for (const record of [...observed, ...(lookup.request_history ?? []), lookup.latest_request, lookup.active_request]) {
    if (!record) continue;
    byId.set(record.id, record);
  }
  return [...byId.values()].map(record => validateRenewalRecord(record, lookup))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

/** Resume work before showing the most recent effective extension, even if a later attempt closed. */
export function renewalEntryRecord(lookup: LookupResult, observed: RequestRecord[] = []) {
  const records = renewalHistory(lookup, observed);
  const active = lookup.active_request ?? records.find(item => !['EFFECTIVE', 'CLOSED'].includes(item.status));
  if (active) return active;
  // Missing active snapshots must not allow another quote or application.
  if (lookup.has_active_request || lookup.active_request_id) throw new ApiError('RESULT_UNKNOWN');
  return records.filter(item => item.status === 'EFFECTIVE')
    .sort((a, b) => Date.parse(b.new_return_time) - Date.parse(a.new_return_time))[0]
    ?? lookup.latest_request ?? records[0] ?? null;
}

export function renewalRestartReady(record: RequestRecord, lookup: LookupResult, now = Date.now()) {
  return record.status === 'EFFECTIVE' && lookup.order.status === 'PICKED_UP' && lookup.brand.extension_enabled
    && record.order_id === lookup.order.id && record.brand_code === lookup.order.brand_code
    && !lookup.has_active_request && !lookup.active_request && !lookup.active_request_id
    && Date.parse(lookup.order.current_return_time) > now
    && Date.parse(lookup.order.current_return_time) >= Date.parse(record.new_return_time);
}

export function renewalRecordStatus(record: RequestRecord): PreparationKey {
  if (record.status === 'EFFECTIVE') return 'renewEffective';
  if (record.status === 'CLOSED') return record.closed_reason === 'STORE_REJECTED' ? 'renewRecordDeclined' : 'renewRecordEnded';
  if (record.status === 'PENDING_STORE_CONFIRMATION') return 'renewAwaitingStore';
  if (record.status === 'AWAITING_PAYMENT') return 'renewStepPendingPayment';
  return 'renewProcessing';
}

export function renewalPaymentStatus(record: RequestRecord): PreparationKey {
  return record.payment.status === 'PAID' ? 'renewPaid' : record.payment.status === 'FAILED'
    ? 'renewPaymentFailed' : record.payment.status === 'PROCESSING' ? 'renewProcessing' : 'renewStepPendingPayment';
}

export function renewalContractUrl(record: RequestRecord) {
  if (record.payment.status !== 'PAID' || record.contract.status !== 'READY') return undefined;
  try {
    const url = new URL(record.contract.url ?? '');
    return url.protocol === 'https:' ? url.href : undefined;
  } catch { return undefined; }
}
