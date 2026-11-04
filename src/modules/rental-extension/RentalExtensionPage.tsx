import React, { useContext, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock3,
  Phone,
  XCircle,
} from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';
import type { RequestRecord } from './api';
import type { SanitizedOrder } from './contracts';
import { type RenewalBooking } from './model';
import { useRenewal } from './useRenewal';
import {
  extensionDaysForReturnTime,
  fromBranchLocalDateTime,
} from './returnTime';
import {
  Alert,
  Button,
  Card,
  IconChip,
  InfoList,
  InfoRow,
  buttonClass,
} from '../../design/ui';
import { OrderOverviewPage } from './OrderOverviewPage';
import { RentalVehicleCard } from './RentalVehicleCard';
import { ActiveExtendedBookingPage } from './ActiveExtendedBookingPage';
import { ExtensionDetailPage } from './ExtensionDetailPage';
import { ExpectedReturnDateTimePicker } from './ExpectedReturnDateTimePicker';
import { ProcessingPage } from './ProcessingPage';
import { RenewalContractManagement, RenewalRecordContent, RenewalRecords, type OriginalRentalContract } from './RenewalRecords';
import { useRenewalNavigation } from './useRenewalNavigation';

import { PaymentPage, PaymentPage as RenewalPayment } from './PaymentPage';
export { PaymentPage, RenewalPayment };

const secondary = buttonClass({ variant: 'secondary', size: 'md' });

export function RenewalStatus({
  record,
  unknown,
  busy,
  timezone,
  order,
  onRefresh,
  onBack,
}: {
  record: RequestRecord;
  unknown: boolean;
  busy: boolean;
  timezone: string;
  order?: SanitizedOrder;
  onRefresh: () => void;
  onBack: () => void;
}) {
  const { t, lang } = useContext(LanguageContext);
  const rejected = record.manual_review.status === 'REJECTED';
  const waiting = record.manual_review.status === 'PENDING';
  const statusKey: PreparationKey = unknown
    ? 'renewUnknown'
    : rejected
    ? 'renewStoreRejected'
    : record.status === 'EFFECTIVE'
    ? 'renewEffective'
    : record.status === 'CLOSED'
    ? 'renewClosed'
    : waiting
    ? 'renewAwaitingStore'
    : record.status === 'AWAITING_PAYMENT'
    ? 'renewHoldExpired'
    : 'renewProcessing';

  const refundKey: Partial<Record<string, PreparationKey>> = {
    PROCESSING: 'renewRefundProcessing',
    ACCEPTED: 'renewRefundAccepted',
    SETTLED: 'renewRefundSettled',
    FAILED: 'renewRefundFailed',
  };
  const contractKey: Record<RequestRecord['contract']['status'], PreparationKey> = {
    NOT_READY: 'renewContractPending',
    GENERATING: 'renewContractGenerating',
    READY: 'renewContractReady',
    FAILED: 'renewContractFailed',
  };
  const paid = record.payment.status === 'PAID';

  let safeDownload: string | undefined;
  try {
    const download = new URL(record.contract.url || '');
    if (download.protocol === 'https:') safeDownload = download.href;
  } catch {
    // Missing link keeps download disabled
  }

  const date = (value: string) =>
    new Intl.DateTimeFormat(lang, {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  return (
    <div className="space-y-4 pb-20">
      <section className="bg-white rounded-2xl p-5 border border-customer-border shadow-customer-card text-center space-y-4">
        <div className="flex justify-center">
            {rejected ? (
              <IconChip icon={XCircle} tone="danger" className="size-14 [&>svg]:size-8" />
            ) : record.status === 'EFFECTIVE' ? (
              <IconChip icon={CheckCircle2} tone="success" className="size-14 [&>svg]:size-8" />
            ) : (
              <IconChip icon={Clock3} tone="brand" className="size-14 [&>svg]:size-8" />
            )}
          </div>
          <div>
            <h2 role="status" className="text-base font-bold text-customer-text">
              {t(statusKey)}
            </h2>
          </div>

          {waiting && record.manual_review.notification_status === 'FAILED' && (
            <Alert tone="danger" role="alert" className="text-left text-xs">
              {t('renewNotificationFailed')}
            </Alert>
          )}

          <div className="text-left pt-2 border-t border-customer-border-subtle">
            <InfoList>
              <InfoRow
                stacked
                label={t('renewRequest')}
                value={<span className="break-all font-mono text-xs">{record.id}</span>}
              />
              {record.status === 'EFFECTIVE' && (
                <InfoRow
                  stacked
                  label={t('renewRequestedReturn')}
                  value={date(record.new_return_time)}
                  emphasis
                />
              )}
            </InfoList>
          </div>

          {paid && (
            <div
              className="text-left space-y-2 border-t border-customer-border-subtle pt-3"
              aria-labelledby="renew-contract-title"
            >
              <h3 id="renew-contract-title" className="text-xs font-bold text-customer-text">
                {t('renewContractTitle')}
              </h3>
              <p
                role={record.contract.status === 'FAILED' ? 'alert' : 'status'}
                className="text-xs text-customer-text-secondary"
              >
                {t(contractKey[record.contract.status])}
              </p>
              {record.contract.status === 'READY' &&
                (safeDownload ? (
                  <a
                    className={`${secondary} flex w-full justify-center items-center`}
                    href={safeDownload}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('renewContractDownload')}
                  </a>
                ) : (
                  <p role="alert" className="text-xs text-customer-danger-text">
                    {t('renewContractUnavailable')}
                  </p>
                ))}
            </div>
          )}

          {record.status === 'CLOSED' && refundKey[record.refund?.status] && (
            <div className="text-left border-t border-customer-border-subtle pt-3 text-xs text-customer-text-secondary">
              <p>{t(refundKey[record.refund.status]!)}</p>
              <p className="mt-1 font-bold text-customer-text">
                {t('renewRefund')}:{' '}
                {new Intl.NumberFormat(lang, {
                  style: 'currency',
                  currency: record.refund.currency || record.payment.currency,
                }).format(record.refund.amount)}
              </p>
            </div>
          )}

          {order && (
            <div className="pt-2 text-left">
              <RentalVehicleCard
                order={order}
                title={t('renewVehicleConfigTitle')}
                showPlate
                showBookedVehicle={false}
              />
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button
              variant="secondary"
              size="md"
              block
              disabled={busy}
              onClick={onRefresh}
            >
              {t('renewRefresh')}
            </Button>
            <Button variant="secondary" size="md" block onClick={onBack}>
              {t('prepServiceReturn')}
            </Button>
          </div>
        </section>
    </div>
  );
}

export function RenewalUnresolved({
  busy,
  onReconnect,
}: {
  busy: boolean;
  onReconnect: () => void;
}) {
  const { t } = useContext(LanguageContext);
  return (
    <Card padding="compact" role="status">
      <p className="text-customer-body">{t('renewRequestUnknown')}</p>
      <Button
        variant="secondary"
        size="md"
        block
        disabled={busy}
        className="mt-3"
        onClick={onReconnect}
      >
        {t('renewReconnect')}
      </Button>
    </Card>
  );
}

export function RentalExtensionPage({
  booking,
  eligible,
  eligibilityLoading,
  eligibilityError,
  onRetryEligibility,
  onBack,
  onReverify,
  originalContract,
  onRefreshContract,
  onNavigation,
  onEntryReady,
}: {
  booking: RenewalBooking;
  eligible: boolean;
  eligibilityLoading: boolean;
  eligibilityError?: boolean;
  onRetryEligibility: () => void;
  onBack: () => void;
  onReverify: () => void;
  originalContract?: OriginalRentalContract;
  onRefreshContract?: () => void;
  onNavigation?: (title: PreparationKey, back: () => void, busy: boolean) => void;
  onEntryReady?: () => void;
}) {
  const { t, lang } = useContext(LanguageContext);
  const flow = useRenewal(booking, eligible, lang);
  const navigation = useRenewalNavigation(booking.orderId, flow.stage, requestedStage => {
    if (requestedStage === 'processing' && flow.record && !flow.unknown && flow.record.status === 'AWAITING_PAYMENT') { flow.setStage('processing'); return 'processing'; }
    if (requestedStage === 'status' && flow.originRecord && flow.cancelDateSelection()) return 'status';
    if (!flow.record && !flow.unknown && (requestedStage === 'conditions' || (requestedStage === 'detail' && flow.activeQuote))) {
      flow.setStage(requestedStage); return requestedStage;
    }
    return flow.stage;
  });
  const record = flow.record;
  const order = flow.lookup?.order;
  const maxDays = Math.min(15, flow.lookup?.limits.max_single_extension_days ?? 15);
  const returnAt = fromBranchLocalDateTime(flow.requested, flow.timezone);
  const extensionDays = extensionDaysForReturnTime(flow.currentReturn, returnAt);
  const entryReady = Boolean(eligibilityError)
    || (!eligibilityLoading && (!eligible || Boolean(flow.lookup) || Boolean(flow.error)));

  const refresh = () => { void flow.refreshRecords(); if (!originalContract) onRefreshContract?.(); };
  // 结果页“刷新申请状态”针对当前申请做请求级查询（api.get），可观察到合同生成等状态推进。
  const refreshActive = () => { if (flow.record) void flow.refresh(); else void flow.refreshRecords(); if (!originalContract) onRefreshContract?.(); };

  // 入口分流：无进行中申请且已有续租记录时直达续租记录列表（replace，返回退出续租）。
  const routedToHistory = useRef(false);
  useEffect(() => {
    if (!routedToHistory.current && flow.entryCompleted && navigation.view.page === 'flow') {
      routedToHistory.current = true;
      navigation.landHistory();
    }
  });

  // 在续租记录列表上发起再次申请：弹层选时间，报价成功或恢复进行中申请后推入流程页。
  const previousStage = useRef(flow.stage);
  useEffect(() => {
    const previous = previousStage.current;
    previousStage.current = flow.stage;
    if (navigation.view.page !== 'flow' && previous !== flow.stage && !['conditions', 'status'].includes(flow.stage)) {
      navigation.openFlow(flow.stage);
    }
  });

  // 详情页返回到续租记录列表时重新打开日期弹层，保留已选时间。
  const previousView = useRef(navigation.view);
  useEffect(() => {
    const previous = previousView.current;
    previousView.current = navigation.view;
    if (previous.page === 'flow' && navigation.view.page === 'history' && flow.stage === 'detail') {
      flow.setStage('conditions');
    }
  });

  useEffect(() => {
    const page = navigation.view.page;
    const title: PreparationKey = page === 'history' ? 'renewHistory' : page === 'record' ? 'renewRecordTitle'
      : flow.stage === 'payment' ? 'renewPay' : flow.stage === 'detail' ? 'renewRecordTitle' : 'prepRenewal';
    const back = page !== 'flow' || flow.stage === 'detail' ? navigation.back
      : flow.stage === 'payment' ? () => { flow.setStage('processing'); navigation.back(); }
      : flow.stage === 'conditions' && flow.originRecord ? navigation.back : onBack;
    onNavigation?.(title, back, flow.busy);
  });

  useEffect(() => {
    if (entryReady) onEntryReady?.();
  }, [entryReady, onEntryReady]);

  if (eligible && order && navigation.view.page !== 'flow') {
    const selectedId = navigation.view.page === 'record' ? navigation.view.id : null;
    const selected = flow.history.find(item => item.id === selectedId);
    if (selectedId) {
      return <div className="space-y-3 pb-6">
        {selected ? <>
          {flow.error && <Alert tone="danger">{t(flow.error)}</Alert>}
          <RenewalRecordContent record={selected} order={order} />
          <RenewalContractManagement record={selected} busy={flow.busy} supportPhone={flow.lookup?.brand.support_phone || booking.phone} onRefresh={refresh} />
        </> : <Card><p>{t('renewHistoryEmpty')}</p><Button variant="secondary" onClick={refresh}>{t('renewRefresh')}</Button></Card>}
      </div>;
    }
    return <div className="space-y-3 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <RenewalRecords records={flow.history} order={order} busy={flow.busy} error={flow.error} onRefresh={refresh} onSelect={navigation.openRecord} onExtendAgain={() => void flow.extendAgain()} />
      <ExpectedReturnDateTimePicker
        open={flow.stage === 'conditions'} showTrigger={false}
        value={flow.requested} currentReturnTime={order.current_return_time} maxDays={maxDays}
        timeZone={order.branch_timezone} disabled={flow.busy}
        onChange={flow.setRequested}
        onConfirm={value => { flow.setRequested(value); return flow.quote(value); }}
        onOpenChange={open => { if (!open) flow.cancelDateSelection(); }}
        confirmLabel="renewConfirmReturnTime" error={flow.error}
      />
    </div>;
  }

  if (eligible && flow.stage === 'status' && record?.status === 'EFFECTIVE' && !flow.unknown && order) {
    return <ActiveExtendedBookingPage record={record} order={order} busy={flow.busy}
      error={flow.error} onRefresh={refreshActive} onBack={onBack} />;
  }

  if (eligible && flow.stage === 'detail' && flow.activeQuote && order) {
    return (
      <ExtensionDetailPage
        order={order}
        quote={flow.activeQuote}
        extensionDays={extensionDays}
        maxDays={maxDays}
        requestedReturnTime={flow.requested}
        onReturnTimeChange={flow.setRequested}
        onReturnTimeConfirm={flow.quote}
        error={flow.error}
        onConfirmApply={() => {
          void flow.apply();
        }}
        busy={flow.busy}
      />
    );
  }

  if (eligible && flow.stage === 'conditions' && order) {
    return <OrderOverviewPage
      order={order} maxDays={maxDays} requestedReturnTime={flow.requested} onReturnTimeChange={flow.setRequested}
      onResetLookup={() => { if (flow.originRecord) navigation.back(); else onBack(); }}
      onSearchQuote={value => { flow.setRequested(value); return flow.quote(value); }}
      searching={flow.busy || eligibilityLoading} searchError={flow.error}
    >
      {flow.originRecord && <ActiveExtendedBookingPage record={flow.originRecord} order={order} busy={flow.busy}
        error={null} onRefresh={refreshActive} onBack={onBack} />}
    </OrderOverviewPage>;
  }

  // 2. 智能排单确认中阶段（图 3）
  if (eligible && flow.stage === 'processing' && order) {
    return (
      <>
      <ProcessingPage
        order={order}
        record={record}
        extensionDays={record?.extension_days ?? flow.activeQuote?.extension_days ?? extensionDays}
        newReturnTime={record?.new_return_time ?? flow.activeQuote?.new_return_time ?? returnAt}
        grandTotal={flow.activeQuote?.pricing?.grand_total ?? record?.pricing_snapshot?.grand_total ?? 0}
        currency={flow.activeQuote?.pricing?.currency ?? record?.pricing_snapshot?.currency ?? 'JPY'}
        busy={flow.busy}
        error={flow.error}
        onProceedToPayment={flow.openPayment}
        onRefresh={() => {
          void flow.refresh();
        }}
        onBack={() => {
          onBack();
        }}
      />
      </>
    );
  }

  // 3. 支付阶段（图 4）
  if (eligible && flow.stage === 'payment' && record) {
    return (
      <>
      <RenewalPayment
        key={`${record.id}:${record.deposit_plan?.fingerprint}:${lang}`}
        record={record}
        busy={flow.busy}
        timezone={flow.timezone}
        order={order}
        confirmationNumber={record.confirmation_number}
        extensionDays={record.extension_days}
        newReturnTime={record.new_return_time}
        deliveryEmail={order?.primary_driver?.email || ''}
        paymentUnknown={flow.unknown}
        paymentError={flow.error}
        onPay={(consent) => {
          return flow.pay(consent);
        }}
        onBack={() => { flow.setStage('processing'); navigation.back(); }}
        onCheck={() => {
          void flow.refresh();
        }}
        onRefresh={() => {
          void flow.refresh();
        }}
      />
      </>
    );
  }


  if (flow.stage === 'status' && record && order && record.status === 'PROCESSING' && ['PAID', 'PROCESSING'].includes(record.payment.status) && !flow.unknown) {
    return <ProcessingPage order={order} record={record} extensionDays={record.extension_days}
      newReturnTime={record.new_return_time} grandTotal={record.pricing_snapshot.grand_total} currency={record.pricing_snapshot.currency}
      busy={flow.busy} error={flow.error} onRefresh={() => void flow.refresh()} onBack={onBack} />;
  }

  // 4. 状态与履约确认阶段
  if (flow.stage === 'status' && record) {
    return (
      <>
      {flow.error && <Alert tone="danger">{t(flow.error)}</Alert>}
      <RenewalStatus
        record={record}
        unknown={flow.unknown}
        busy={flow.busy}
        timezone={flow.timezone}
        order={order}
        onRefresh={() => {
          void flow.refresh();
        }}
        onBack={onBack}
      />
      </>
    );
  }

  if (flow.stage === 'status' && !record && flow.unknown) {
    return <RenewalUnresolved busy={flow.busy} onReconnect={() => void flow.reconnect()} />;
  }

  // 首次资格与申请查询期间由入口页保持原画面，不渲染独立过渡页。
  if (eligibilityLoading || (eligible && flow.busy && !flow.lookup && !flow.error)) return null;

  // 4. 未达到续租门槛或入口查询失败
  return (
    <div className="space-y-4 pb-20">
      {!eligible ? (
        <section
          role={eligibilityError ? 'alert' : 'status'}
          className="bg-white rounded-2xl p-5 border border-customer-border shadow-customer-card space-y-3"
        >
          {!eligibilityError && (
            <h2 className="text-sm font-bold text-customer-text">
              {t('renewNotStartedTitle')}
            </h2>
          )}
          <p className="text-xs text-customer-text-secondary leading-relaxed">
            {t(eligibilityError ? 'prepLoadError' : 'prepRenewalWaitingHint')}
          </p>
          {eligibilityError ? (
            <Button variant="secondary" size="md" onClick={onRetryEligibility}>
              {t('prepRetry')}
            </Button>
          ) : (
            <Button variant="secondary" size="md" block onClick={onBack}>
              {t('prepServiceReturn')}
            </Button>
          )}
        </section>
      ) : null}

      {flow.error && (
        <Alert
          tone="danger"
          role="alert"
          action={
            flow.error === 'renewSessionRequired' ? (
              <Button variant="secondary" size="md" disabled={flow.busy} onClick={onReverify}>
                {t('renewReverify')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                disabled={flow.busy}
                onClick={() => {
                  void (record ? flow.refresh() : flow.reconnect());
                }}
              >
                {t(record ? 'renewRefresh' : 'renewReconnect')}
              </Button>
            )
          }
        >
          <p className="text-xs">{t(flow.error)}</p>
        </Alert>
      )}

      <div className="pt-2">
        <a
          className={buttonClass({ variant: 'secondary', size: 'md', block: true })}
          href={`tel:${booking.phone.replace(/\s+/g, '')}`}
        >
          <Phone size={16} aria-hidden="true" />
          <span>{t('prepCallStore')}</span>
        </a>
      </div>
    </div>
  );
}
