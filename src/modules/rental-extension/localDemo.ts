import type { DepositConsent, LookupResult, Quote, RequestRecord } from './api';
import type { PreparationLanguage } from '../../i18n/preparation';
import { localRenewalDemoScenario, type LocalRenewalDemoScenario } from './localDemoGate';
import { preparationBooking } from '../../app/customer-journey/bookingFixtures';

type DemoState = { scenario: LocalRenewalDemoScenario; order: LookupResult['order']; request?: RequestRecord; history: RequestRecord[]; createKeys: Map<string, string>; gets: number; payAttempts: number };
const states = new Map<string, DemoState>();

// Simulated network latency so processing/loading states are observable in the demo.
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function resetLocalRenewalDemo(orderId: string): void {
  if (localRenewalDemoScenario(orderId)) states.delete(orderId.trim().toUpperCase());
}

function makeOrder(orderId: string): LookupResult['order'] {
  const booking = preparationBooking(orderId);
  const vehicle = booking.vehicleAssignment;
  if (vehicle.status !== 'ASSIGNED') throw new Error('DEMO_VEHICLE_NOT_ASSIGNED');
  return {
    id: orderId, confirmation_number: booking.confirmationCode, brand_code: booking.brandCode, brand_name: 'IX RENTAL',
    primary_driver: { surname: booking.last, full_name: `${booking.first} ${booking.last}`, email: booking.email, phone: booking.phone },
    status: 'PICKED_UP', pickup_time: booking.pickupAt, pickup_branch_id: 'tokyo-narita',
    pickup_branch_name: 'Narita Airport Branch', current_return_time: booking.returnAt,
    return_branch_id: 'tokyo-narita', return_branch_name: 'Narita Airport Branch', branch_timezone: booking.timezone,
    booked_model_id: 'toyota-yaris', booked_model_name: 'Toyota Yaris', actual_vehicle_id: `vehicle-${orderId}`,
    actual_plate: vehicle.plate, actual_model_id: 'toyota-harrier', actual_model_name: vehicle.model, currency: 'JPY',
    daily_base_rate: 12000, insurance: { code: 'STANDARD', name: 'Standard coverage', daily_rate: 1000, can_extend: true, provider: 'IX' },
    addons: [{ code: 'ETC', name: 'ETC card', charge_type: 'DAILY', unit_price: 100, quantity: 1 }],
    deposit_status: 'AUTHORIZED', atp_status: 'UNAVAILABLE',
    conflict_status: ['review-pending', 'review-accepted', 'review-rejected'].includes(localRenewalDemoScenario(orderId) || '') ? 'HARD_CONFLICT' : 'NONE',
    active_request_id: null,
  };
}

function depositPlan(newReturnTime: string) {
  // 演示方案对齐参考实现：沿用原卡预授权（REUSE），客户仍需勾选同意并授权 Stripe 延长押金预授权。
  return { strategy: 'REUSE' as const, consent_required: true, record_type: 'CARD_PREAUTH' as const,
    original_amount: 50000, required_amount: 50000, currency: 'JPY', required_through: newReturnTime,
    fingerprint: 'demo-deposit-plan-v1', terms_version: '2026-10-19' };
}

function createRecord(state: DemoState, newReturnTime = '2026-11-06T10:00:00+09:00', status: RequestRecord['status'] = 'AWAITING_PAYMENT'): RequestRecord {
  const days = Math.ceil((Date.parse(newReturnTime) - Date.parse(state.order.current_return_time)) / 86_400_000);
  const baseRent = days * 12000;
  const totalRent = Math.round(baseRent * 1.1);
  const insuranceAmount = days * 1000;
  const addonAmount = days * 100;
  const total = totalRent + insuranceAmount + addonAmount;
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const manual = status === 'PENDING_STORE_CONFIRMATION';
  const rejected = state.scenario === 'review-rejected' && status === 'CLOSED';
  const accepted = state.request?.manual_review.status === 'ACCEPTED' || state.scenario === 'review-accepted' && status === 'AWAITING_PAYMENT';
  const requestStatus = status;
  const paymentStatus: RequestRecord['payment']['status'] = state.scenario === 'payment-processing' && status === 'PROCESSING' ? 'PROCESSING'
    : status === 'EFFECTIVE' ? 'PAID' : 'PENDING';
  return {
    id: `demo-renewal-${state.order.id}${state.history.length ? `-${state.history.length + 1}` : ''}`, order_id: state.order.id, confirmation_number: state.order.confirmation_number,
    brand_code: state.order.brand_code, created_at: new Date().toISOString(), expires_at: expiresAt,
    status: requestStatus, closed_reason: rejected ? 'STORE_REJECTED' : undefined, extension_days: days,
    original_return_time: state.order.current_return_time, new_return_time: newReturnTime,
    pricing_snapshot: { rental_days: days, base_daily_rate: 12000, markup_rate: 0.1, markup_amount: totalRent - baseRent,
      total_rent: totalRent, insurance_amount: insuranceAmount, addon_amount: addonAmount, grand_total: total, currency: 'JPY' },
    payment: { status: paymentStatus, amount: total, currency: 'JPY', payment_intent_id: `pi-demo-${state.order.id}`,
      ...(paymentStatus === 'PAID' ? { processed_at: new Date().toISOString(), paid_at: new Date().toISOString() } : {}) },
    schedule: { status: manual ? 'PENDING_DISPATCH' : 'LOCKED_CURRENT', vehicle_locked: !manual, target_vehicle_id: state.order.actual_vehicle_id },
    guarantee: { status: 'SUFFICIENT', deposit_id: `deposit-${state.order.id}` },
    refund: { status: 'NOT_APPLICABLE', amount: 0, currency: 'JPY' },
    allocation: { mode: 'FULL_RENTAL', status: rejected ? 'REJECTED' : manual ? 'REVIEW_REQUIRED' : 'HELD',
      pickup_time: state.order.pickup_time, original_return_time: state.order.current_return_time, new_return_time: newReturnTime,
      vehicle_id: state.order.actual_vehicle_id, hold_id: manual || rejected ? null : `hold-${state.order.id}`,
      expires_at: manual || rejected ? null : expiresAt, source: manual || rejected ? null : accepted ? 'STORE_OVERRIDE' : 'AUTO' },
    manual_review: { status: rejected ? 'REJECTED' : manual ? 'PENDING' : accepted ? 'ACCEPTED' : 'NOT_REQUIRED',
      notification_status: manual ? 'SENT' : 'NOT_REQUIRED' },
    // The local demo has no formal PDF; READY without a URL exercises missing-file recovery.
    contract: { status: status !== 'EFFECTIVE' ? 'NOT_READY' : state.scenario === 'contract-failed' ? 'FAILED' : 'READY' },
    deposit_plan: depositPlan(newReturnTime), deposit_authorization: { status: paymentStatus === 'PAID' ? 'SUFFICIENT' : 'PENDING' },
    insurance_snapshot: structuredClone(state.order.insurance), addon_snapshot: structuredClone(state.order.addons),
  };
}

function stateFor(orderId: string): DemoState {
  const scenario = localRenewalDemoScenario(orderId);
  if (!scenario) throw Object.assign(new Error('ORDER_NOT_ACTIVE'), { code: 'ORDER_NOT_ACTIVE' });
  const normalized = orderId.trim().toUpperCase();
  const existing = states.get(normalized);
  if (existing) return existing;
  const state: DemoState = { scenario, order: makeOrder(normalized), history: [], createKeys: new Map(), gets: 0, payAttempts: 0 };
  states.set(normalized, state);
  return state;
}

function lookupView(state: DemoState): LookupResult {
  const request = state.request;
  const terminal = request && ['EFFECTIVE', 'CLOSED'].includes(request.status);
  return {
    code: 'SUCCESS', workflow_version: 'FULL_RENTAL_V2', has_active_request: Boolean(request && !terminal),
    active_request_id: request && !terminal ? request.id : null,
    active_request: request && !terminal ? request : null,
    ...(request && terminal ? { latest_request: structuredClone(request) } : {}), order: structuredClone(state.order),
    request_history: structuredClone([...state.history, ...(request ? [request] : [])]),
    brand: { code: 'IX', name: 'IX RENTAL', logo_url: '', primary_color: '#FF5A00', support_phone: '+81 50 0000 0000',
      support_email: 'support@example.com', currency: 'JPY', extension_enabled: true },
    limits: { max_single_extension_days: 15, current_return_time: state.order.current_return_time,
      branch_timezone: state.order.branch_timezone, atp_status: state.order.atp_status, daily_base_rate: 12000, currency: 'JPY' },
  };
}

export function createLocalRenewalApi(orderId: string) {
  const state = stateFor(orderId);
  return {
    lookup: async (id: string) => {
      if (id !== state.order.id) throw Object.assign(new Error('ORDER_CHANGED'), { code: 'ORDER_CHANGED' });
      await delay(400);
      return lookupView(state);
    },
    quote: async (_confirmationNumber: string, days: number, newReturnTime: string): Promise<Quote> => {
      await delay(600);
      const plan = depositPlan(newReturnTime);
      const baseRent = days * 12000;
      const markupAmount = days * 1200;
      const pricing = { rental_days: days, markup_rate: 0.1, base_daily_rate: 12000, base_rent: baseRent,
        markup_amount: markupAmount, total_rent: baseRent + markupAmount, insurance_amount: days * 1000,
        addon_amount: days * 100, grand_total: baseRent + markupAmount + days * 1100, currency: 'JPY' };
      return { quote_id: `quote-${state.order.id}-${newReturnTime}`, deposit_plan: plan, extension_days: days,
        current_return_time: state.order.current_return_time, new_return_time: newReturnTime, pricing,
        addon_details: state.order.addons };
    },
    create: async (_confirmationNumber: string, _days: number, _email: string, _locale: PreparationLanguage,
      newReturnTime: string, _quoteId: string, _idempotencyKey: string): Promise<RequestRecord> => {
      await delay(900);
      const previousId = state.createKeys.get(_idempotencyKey);
      const previous = [state.request, ...state.history].find(item => item?.id === previousId);
      if (previous) return structuredClone(previous);
      if (state.request && ['EFFECTIVE', 'CLOSED'].includes(state.request.status)) {
        state.history.push(structuredClone(state.request));
        state.request = undefined;
        state.gets = 0; state.payAttempts = 0;
      }
      if (!state.request) {
        const status: RequestRecord['status'] = ['review-pending', 'review-accepted', 'review-rejected'].includes(state.scenario)
          ? 'PENDING_STORE_CONFIRMATION' : 'AWAITING_PAYMENT';
        state.request = createRecord(state, newReturnTime, status);
        state.request.delivery_email = _email;
      }
      state.createKeys.set(_idempotencyKey, state.request.id);
      return structuredClone(state.request);
    },
    get: async (id: string) => {
      await delay(500);
      const archived = state.history.find(item => item.id === id);
      if (archived) return structuredClone(archived);
      if (!state.request || id !== state.request.id) throw Object.assign(new Error('REQUEST_NOT_FOUND'), { code: 'REQUEST_NOT_FOUND' });
      state.gets += 1;
      if (state.scenario === 'review-accepted' && state.gets >= 2 && state.request.status === 'PENDING_STORE_CONFIRMATION') {
        state.request = createRecord(state, state.request.new_return_time, 'AWAITING_PAYMENT');
        state.request.allocation.source = 'STORE_OVERRIDE';
        state.request.manual_review.status = 'ACCEPTED';
      }
      if (state.scenario === 'review-rejected' && state.gets >= 2 && state.request.status === 'PENDING_STORE_CONFIRMATION') {
        state.request = createRecord(state, state.request.new_return_time, 'CLOSED');
      }
      if (state.scenario === 'payment-processing' && state.gets >= 2 && state.request.status === 'PROCESSING') {
        state.request.status = 'EFFECTIVE';
        state.request.payment.status = 'PAID';
        state.request.payment.processed_at = new Date().toISOString();
        state.request.payment.paid_at = new Date().toISOString();
        state.request.deposit_authorization = { status: 'SUFFICIENT' };
        state.request.contract = { status: 'GENERATING' };
        state.order.current_return_time = state.request.new_return_time;
      }
      if (state.scenario === 'payment-processing' && state.gets >= 3 && state.request.status === 'EFFECTIVE') state.request.contract = { status: 'READY' };
      return structuredClone(state.request);
    },
    pay: async (id: string, _consent: DepositConsent | undefined, _idempotencyKey: string) => {
      await delay(1600);
      if (!state.request || id !== state.request.id) throw Object.assign(new Error('REQUEST_NOT_FOUND'), { code: 'REQUEST_NOT_FOUND' });
      state.payAttempts += 1;
      if (state.scenario === 'payment-retry' && state.payAttempts === 1) {
        state.request.payment.status = 'FAILED';
        state.request.deposit_authorization = { status: 'FAILED' };
      } else if (state.scenario === 'payment-processing') {
        state.request.status = 'PROCESSING';
        state.request.payment.status = 'PROCESSING';
        state.request.payment.processed_at = undefined;
        state.request.contract = { status: 'NOT_READY' };
      } else {
        state.request.payment.status = 'PAID';
        state.request.payment.processed_at = new Date().toISOString();
        state.request.payment.paid_at = new Date().toISOString();
        state.request.status = 'EFFECTIVE';
        state.order.current_return_time = state.request.new_return_time;
        state.request.deposit_authorization = { status: 'SUFFICIENT' };
        state.request.contract = { status: state.scenario === 'contract-failed' ? 'FAILED' : 'READY' };
      }
      return { request: structuredClone(state.request) };
    },
  };
}
