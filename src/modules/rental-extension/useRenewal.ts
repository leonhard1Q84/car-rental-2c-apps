import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PreparationLanguage, PreparationKey } from '../../i18n/preparation';
import { customerAuthConfigured, getCustomerSession } from '@shared/services/customerAuthApi';
import { ApiError, createExtensionApi, type DepositConsent, type LookupResult, type RequestRecord } from './api';
import { renewalDepositPlanValid, renewalEntryRecord, renewalError, renewalHistory, renewalPayable, renewalPaymentUnresolved, renewalQuoteMatches, renewalRestartReady, renewalStage, shouldPollRenewal, validateRenewalRecord, type RenewalBooking, type RenewalStage } from './model';
import { extensionDaysForReturnTime, fromBranchLocalDateTime, isRequestedReturnTimeValid, toBranchLocalDateTime } from './returnTime';
import { localRenewalDemoScenario } from './localDemoGate';

export function useRenewal(booking: RenewalBooking, eligible: boolean, locale: PreparationLanguage) {
  const api = useMemo(() => {
    const demoApi = import.meta.env.DEV && localRenewalDemoScenario(booking.orderId)
      ? import('./localDemo').then(({ createLocalRenewalApi }) => createLocalRenewalApi(booking.orderId))
      : null;
    if (demoApi) return {
      lookup: (id: string) => demoApi.then(client => client.lookup(id)),
      quote: (...args: Parameters<ReturnType<typeof createExtensionApi>['quote']>) => demoApi.then(client => client.quote(...args)),
      create: (...args: Parameters<ReturnType<typeof createExtensionApi>['create']>) => demoApi.then(client => client.create(...args)),
      get: (id: string) => demoApi.then(client => client.get(id)),
      pay: (...args: Parameters<ReturnType<typeof createExtensionApi>['pay']>) => demoApi.then(client => client.pay(...args)),
    };
    return createExtensionApi(undefined, () => {
    // 未配置统一鉴权时续租按服务不可用处理；已配置但无有效会话则 SESSION_REQUIRED。
    if (!customerAuthConfigured()) throw new ApiError('SERVICE_UNAVAILABLE');
    return getCustomerSession(booking.orderId)?.accessToken ?? null;
    });
  }, [booking.orderId]);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [record, setRecord] = useState<RequestRecord | null>(null);
  const [originRecord, setOriginRecord] = useState<RequestRecord | null>(null);
  const [history, setHistory] = useState<RequestRecord[]>([]);
  const [activeQuote, setActiveQuote] = useState<import('./api').Quote | null>(null);
  const [stage, setStage] = useState<RenewalStage>('conditions');
  const [requested, setRequestedState] = useState(() => toBranchLocalDateTime(new Date(Date.parse(booking.returnAt) + 2 * 86400000).toISOString(), booking.timezone));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PreparationKey | null>(null);
  const [unknown, setUnknown] = useState(false);
  // 入口分流：无进行中申请且已有续租记录时置位，页面据此直达续租记录列表。
  const [entryCompleted, setEntryCompleted] = useState(false);
  const lock = useRef(false);
  const live = useRef(false);
  const allowed = useRef(eligible);
  allowed.current = eligible;
  const unknownOperation = useRef<'create' | 'pay' | null>(null);
  const snapshotBlocked = useRef(false);
  const paymentKey = useRef<{ requestId: string; key: string } | null>(null);
  const activeRequestId = useRef<string | null>(null);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);

  const run = useCallback(async (operation: (current: () => boolean) => Promise<void>) => {
    if (lock.current || !allowed.current) return;
    lock.current = true;
    const current = () => live.current && allowed.current;
    setBusy(true); setError(null);
    try { await operation(current); }
    catch (failure) { if (current()) { setError(renewalError(failure)); if (unknownOperation.current) setStage('status'); } }
    finally { lock.current = false; if (live.current) setBusy(false); }
  }, []);

  function accept(next: RequestRecord, session: LookupResult, expectedId?: string) {
    validateRenewalRecord(next, session);
    if (expectedId && next.id !== expectedId) throw new ApiError('ORDER_CHANGED');
    const unresolved = unknownOperation.current === 'pay' && renewalPaymentUnresolved(next);
    if (!unresolved) unknownOperation.current = null;
    activeRequestId.current = next.id;
    setHistory(previous => renewalHistory({ ...session, active_request: null, latest_request: null, request_history: [] }, [...previous.filter(item => item.id !== next.id), next]));
    setOriginRecord(null);
    setRecord(next); setUnknown(unresolved);
    setStage(previous => unresolved ? 'status' : previous === 'payment' && renewalPayable(next) ? 'payment' : renewalStage(next));
    snapshotBlocked.current = false;
  }
  const reconnect = useCallback(() => run(async current => {
    const result = await api.lookup(booking.orderId);
    if (!current()) return;
    if (result.order.brand_code !== booking.brand) throw new ApiError('ORDER_CHANGED');
    if (result.order.status !== 'PICKED_UP' || !result.brand.extension_enabled) throw new ApiError('ORDER_NOT_ACTIVE');
    const previous = renewalEntryRecord(result);
    if (previous) validateRenewalRecord(previous, result);
    renewalHistory(result);
    setHistory(previous => renewalHistory(result, previous));
    setLookup(result);
    setOriginRecord(null);
    if (previous) {
      accept(previous, result, unknownOperation.current === 'pay' ? activeRequestId.current ?? undefined : undefined);
      setRequestedState(toBranchLocalDateTime(previous.new_return_time, result.order.branch_timezone));
      setEntryCompleted(['EFFECTIVE', 'CLOSED'].includes(previous.status));
    } else {
      setEntryCompleted(false);
      setRecord(null);
      // An empty lookup cannot prove that an interrupted mutation never committed.
      setUnknown(Boolean(unknownOperation.current));
      setStage(unknownOperation.current ? 'status' : 'conditions');
      setRequestedState(toBranchLocalDateTime(new Date(Date.parse(result.order.current_return_time) + 86400000).toISOString(), result.order.branch_timezone));
    }
  }), [api, booking.orderId, booking.brand, run]);
  useEffect(() => { if (eligible) void reconnect(); }, [eligible, reconnect]);

  const refreshRecords = () => run(async current => {
    const result = await api.lookup(booking.orderId);
    if (!current()) return;
    if (result.order.brand_code !== booking.brand) throw new ApiError('ORDER_CHANGED');
    const records = renewalHistory(result);
    setLookup(result);
    setHistory(previous => renewalHistory(result, previous));
    setOriginRecord(previous => previous ? records.find(item => item.id === previous.id) ?? previous : previous);
    const next = result.active_request ?? records.find(item => item.id === record?.id);
    if (next) accept(next, result, unknownOperation.current === 'pay' ? activeRequestId.current ?? undefined : undefined);
  });

  // 再次申请续租：成功页与续租记录列表共用。以最近一次已生效申请做快照校验；
  // 仅有失败/取消记录时以本次查询为准直接发起。
  const extendAgain = () => run(async current => {
    if (unknown || unknownOperation.current) return;
    const base = record?.status === 'EFFECTIVE' ? record
      : history.find(item => item.status === 'EFFECTIVE') ?? null;
    const result = await api.lookup(booking.orderId);
    if (!current()) return;
    if (result.order.brand_code !== booking.brand) throw new ApiError('ORDER_CHANGED');
    if (result.order.status !== 'PICKED_UP' || !result.brand.extension_enabled
      || Date.parse(result.order.current_return_time) <= Date.now()) throw new ApiError('ORDER_NOT_ACTIVE');
    const resumed = renewalEntryRecord(result);
    if (resumed && !['EFFECTIVE', 'CLOSED'].includes(resumed.status)) {
      setLookup(result);
      accept(resumed, result);
      return;
    }
    const snapshot = resumed?.status === 'EFFECTIVE' ? resumed : base;
    if (snapshot && !renewalRestartReady(snapshot, result)) throw new ApiError('SNAPSHOT_CHANGED');
    setLookup(result);
    setHistory(previous => renewalHistory(result, previous));
    setOriginRecord(snapshot);
    setRecord(null); setActiveQuote(null); setStage('conditions');
    activeRequestId.current = null; paymentKey.current = null;
    setRequestedState(toBranchLocalDateTime(new Date(Date.parse(result.order.current_return_time) + 86400000).toISOString(), result.order.branch_timezone));
  });

  const currentReturn = lookup?.order.current_return_time ?? booking.returnAt;
  const timezone = lookup?.order.branch_timezone ?? booking.timezone;
  const maxDays = Math.min(15, lookup?.limits.max_single_extension_days ?? 15);
  const returnAt = fromBranchLocalDateTime(requested, timezone);
  const validTime = isRequestedReturnTimeValid(currentReturn, returnAt, maxDays);

  const calculateQuote = useCallback(async (customRequested?: string) => {
    if (!eligible || !lookup || unknown || record || unknownOperation.current) return false;
    const reqValue = customRequested || requested;
    const targetReturn = fromBranchLocalDateTime(reqValue, timezone);
    const valid = isRequestedReturnTimeValid(currentReturn, targetReturn, maxDays);
    if (!valid) return false;

    let success = false;
    await run(async current => {
      const days = extensionDaysForReturnTime(currentReturn, targetReturn);
      const result = await api.quote(lookup.order.confirmation_number, days, targetReturn);
      if (!current()) return;
      if (!result.quote_id || result.extension_days !== days || Date.parse(result.new_return_time) !== Date.parse(targetReturn)
        || Date.parse(result.current_return_time) !== Date.parse(currentReturn)) throw new ApiError('SNAPSHOT_CHANGED');
      setActiveQuote(result);
      setRequestedState(reqValue);
      setStage('detail');
      success = true;
    });
    return success;
  }, [eligible, lookup, unknown, record, requested, timezone, currentReturn, maxDays, run, api]);

  const setRequested = useCallback((value: string) => {
    setRequestedState(value);
  }, []);

  function cancelDateSelection() {
    if (originRecord) { setRecord(originRecord); setOriginRecord(null); }
    setActiveQuote(null); setStage('status'); setError(null);
    return true;
  }

  async function apply() {
    if (!eligible || !lookup || !activeQuote || unknown || record || unknownOperation.current) return;
    const targetReturn = fromBranchLocalDateTime(requested, timezone);
    const days = extensionDaysForReturnTime(currentReturn, targetReturn);
    if (!validTime || Date.parse(activeQuote.new_return_time) !== Date.parse(targetReturn)
      || Date.parse(activeQuote.current_return_time) !== Date.parse(currentReturn) || activeQuote.extension_days !== days) return;

    await run(async current => {
      unknownOperation.current = 'create';
      setUnknown(true);
      setStage('processing');

      const draft = await api.create(lookup.order.confirmation_number, days, lookup.order.primary_driver.email, locale,
        targetReturn, activeQuote.quote_id, crypto.randomUUID());

      if (!current()) return;
      unknownOperation.current = null;
      setUnknown(false);

      if (!renewalQuoteMatches(draft, activeQuote)) {
        snapshotBlocked.current = true;
        setRecord(draft);
        setStage('status');
        throw new ApiError('SNAPSHOT_CHANGED');
      }

      accept(draft, lookup);

    });
  }

  // 保留旧 quote 引用兼容已有调用
  const quote = calculateQuote;
  function openPayment() {
    if (record && !busy && !unknown && !snapshotBlocked.current && renewalPayable(record)) setStage('payment');
  }
  const refresh = useCallback(() => run(async current => {
    if (!record || !lookup) return;
    const next = await api.get(record.id);
    if (!current()) return;
    accept(next, lookup, record.id);
  }), [api, record, lookup, run]);
  async function pay(consent?: DepositConsent) {
    if (!record || !lookup || unknown || unknownOperation.current || snapshotBlocked.current || !renewalPayable(record)) return;
    const plan = record.deposit_plan;
    if (!renewalDepositPlanValid(plan, record)
      || (plan.consent_required && (!consent || consent.accepted !== true || !plan.fingerprint || !plan.terms_version
        || consent.fingerprint !== plan.fingerprint || consent.terms_version !== plan.terms_version))) return;
    await run(async current => {
      // Set before sending. Any exception after this point requires reconciliation.
      // Stay on the payment stage while in flight so the secure-payment overlay can play;
      // accept() or the catch branch below routes to the status view afterwards.
      unknownOperation.current = 'pay'; setUnknown(true);
      if (!paymentKey.current || paymentKey.current.requestId !== record.id) paymentKey.current = { requestId: record.id, key: crypto.randomUUID() };
      const result = await api.pay(record.id, consent, paymentKey.current.key);
      if (!current()) return;
      accept(result.request, lookup, record.id);
      if (result.request.payment.status === 'FAILED' || result.request.deposit_authorization?.status === 'FAILED') {
        // A confirmed failed attempt may be retried with a new idempotency key.
        paymentKey.current = null; setError('renewPaymentFailed');
      }
    });
  }
  useEffect(() => {
    if (!eligible || !record) return;
    const check = () => {
      if (document.visibilityState === 'hidden') return;
      if (stage === 'payment' && !renewalPayable(record)) setStage('status');
      if (unknown || shouldPollRenewal(record)) void refresh();
    };
    const timer = window.setInterval(check, 5000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [eligible, stage, record, unknown, refresh]);
  useEffect(() => {
    if (!record || !['payment', 'processing'].includes(stage) || record.status !== 'AWAITING_PAYMENT') return;
    const remaining = Date.parse(record.allocation.expires_at ?? '') - Date.now();
    if (remaining <= 0) { setStage('status'); return; }
    const timer = window.setTimeout(() => { setStage('status'); void refresh(); }, Math.min(remaining, 2147483647));
    return () => window.clearTimeout(timer);
  }, [record, stage, refresh]);
  return { lookup, record, originRecord, history, activeQuote, stage, setStage, requested, setRequested, currentReturn, timezone, validTime,
    busy, error, unknown, entryCompleted, reconnect, quote, apply, pay, openPayment, refresh, refreshRecords, extendAgain, cancelDateSelection };
}
