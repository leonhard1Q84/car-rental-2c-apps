import { useContext, useEffect, useState } from 'react';
import { Car, CheckCircle2, Clock3, Loader2, Timer, ArrowRight, type LucideIcon } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { SanitizedOrder } from './contracts';
import type { RequestRecord } from './api';
import type { PreparationKey } from '../../i18n/preparation';
import { Alert, Badge, BottomBar, Button, Card, InfoList, InfoRow } from '../../design/ui';
import { renewalPayable } from './model';
import { RentalVehicleCard } from './RentalVehicleCard';
import { RenewalProgress } from './RenewalProgress';

function countdownText(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function ProcessingPage({ order, record, extensionDays, newReturnTime, grandTotal, currency,
  busy = false, error, onProceedToPayment, onRefresh, onBack,
}: {
  order: SanitizedOrder; record?: RequestRecord | null; extensionDays: number; newReturnTime: string;
  grandTotal: number; currency: string; busy?: boolean; error?: PreparationKey | null;
  onProceedToPayment?: () => void; onRefresh?: () => void; onBack?: () => void;
}) {
  const { lang, t } = useContext(LanguageContext);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  // 占位安排的视觉过渡与参考实现对齐：仅对刚提交的申请短暂展示“正在安排车辆”动效；
  // 恢复既有申请（如已占位、待付款）直接呈现真实状态，业务结果始终完全以服务端状态为准。
  const [settling, setSettling] = useState(() => {
    if (!record || record.status === 'CLOSED') return false;
    const createdAt = Date.parse(record.created_at ?? '');
    return !Number.isFinite(createdAt) || Date.now() - createdAt < 4200;
  });
  useEffect(() => {
    if (record?.status === 'CLOSED') { setSettling(false); return; }
    const timer = window.setTimeout(() => setSettling(false), 4200);
    return () => window.clearTimeout(timer);
  }, [record?.status]);
  const ready = Boolean(record && renewalPayable(record, now));
  const waiting = record?.manual_review.status === 'PENDING';
  const paid = record?.payment.status === 'PAID';
  const paymentProcessing = record?.payment.status === 'PROCESSING';
  const confirming = Boolean(paid || paymentProcessing);
  const arranging = !ready && !waiting && !confirming;
  const settlingActive = settling && record?.status !== 'CLOSED';
  const showReady = ready && !settlingActive;
  const date = (value: string) => new Intl.DateTimeFormat(lang, { timeZone: order.branch_timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const money = new Intl.NumberFormat(lang, { style: 'currency', currency }).format(paid ? record.payment.amount : grandTotal);

  const expiresAt = ready && record?.allocation.expires_at ? Date.parse(record.allocation.expires_at) : null;
  const remaining = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const urgent = Boolean(expiresAt) && remaining < 5 * 60_000;

  const icon: { Icon: LucideIcon; tone: 'success' | 'brand'; animated: boolean } = showReady
    ? { Icon: CheckCircle2, tone: 'success', animated: false }
    : confirming
    ? { Icon: Loader2, tone: 'brand', animated: true }
    : waiting
    ? { Icon: Clock3, tone: 'brand', animated: false }
    : { Icon: Car, tone: 'brand', animated: true };
  const Icon = icon.Icon;

  return <div className="space-y-3 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
    {error && <Alert tone="danger">{t(error)}</Alert>}
    <Card as="section" className="relative overflow-hidden border-t-4 border-t-customer-brand text-center motion-safe:animate-rise-in">
      <div role="status" className="space-y-3 py-3">
        <span className="relative mx-auto flex size-16 items-center justify-center">
          {settlingActive ? (
            <>
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-customer-brand-subtle opacity-60 motion-safe:animate-ping" />
              <span aria-hidden="true" className="absolute inset-2 rounded-full bg-customer-brand-subtle motion-safe:animate-pulse" />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-customer-brand text-customer-text-inverse shadow-lg">
                <Car size={28} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </>
          ) : (
            <>
              {icon.tone === 'success' && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-customer-success-border motion-safe:animate-halo-in" />}
              {icon.tone === 'brand' && icon.animated && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-customer-brand-subtle motion-safe:animate-ping" />}
              <span className={`relative flex size-16 items-center justify-center rounded-full ${icon.tone === 'success' ? 'bg-customer-success-subtle text-customer-success-text motion-safe:animate-pop-in' : 'bg-customer-brand-subtle text-customer-brand-text'}`}>
                <Icon size={32} aria-hidden="true" className={icon.animated && confirming ? 'motion-safe:animate-spin' : undefined} />
              </span>
            </>
          )}
        </span>
        <h2 className="text-customer-headline">{t(showReady ? 'renewVehicleReserved' : waiting ? 'renewAwaitingStoreTitle' : paid ? 'renewConfirmingTitle' : paymentProcessing ? 'renewProcessingPaymentTitle' : 'renewArrangingVehicle')}</h2>
        {showReady && expiresAt !== null ? (
          <div aria-hidden="true" className={`mx-auto max-w-sm flex items-center justify-between gap-3 rounded-customer-inset border p-3 transition-colors duration-300 ${urgent ? 'border-customer-warning-border bg-customer-warning-subtle' : 'border-customer-brand-border bg-customer-brand-subtle'}`}>
            <span className={`flex items-center gap-2 text-customer-label ${urgent ? 'text-customer-warning-text' : 'text-customer-brand-text'}`}>
              <Timer size={16} />{t('renewTimeLeftToPay')}
            </span>
            <span className={`text-customer-title tabular-nums ${urgent ? 'text-customer-warning-text' : 'text-customer-brand-text'}`}>{countdownText(remaining)}</span>
          </div>
        ) : !showReady ? (
          <p className="text-customer-body text-customer-text-secondary">{t(waiting ? 'renewAwaitingStore' : paid ? 'renewProcessing' : paymentProcessing ? 'renewUnknown' : 'renewSmartDispatchSubtitle')}</p>
        ) : null}
      </div>
      <RenewalProgress reserved={showReady || paid || paymentProcessing} paid={paid} effective={false} paymentProcessing={paymentProcessing || arranging || settlingActive} />
    </Card>
    {!confirming && <div className="motion-safe:animate-rise-in" style={{ animationDelay: '80ms' }}><RentalVehicleCard order={order} title={t('renewVehicleConfigTitle')} showPlate showBookedVehicle={false} /></div>}
    {record && <Card className="motion-safe:animate-rise-in" style={{ animationDelay: '140ms' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-customer-caption text-customer-text-tertiary">{t(paid ? 'renewPaidAmount' : 'renewTotal')}</p><p className="mt-1 text-customer-amount tabular-nums">{money}</p></div>
        <Badge tone={paid ? 'success' : 'neutral'}>{t(paid ? 'renewPaid' : 'renewStepPendingPayment')}</Badge>
      </div>
      <InfoList>
        <InfoRow label={t('renewRequestedReturn')} value={date(newReturnTime)} emphasis />
        <InfoRow label={t('renewExtensionDays')} value={`${extensionDays} ${t('renewDays')}`} />
        <InfoRow label={t('renewCurrentReturn')} value={date(order.current_return_time)} />
        {ready && record.allocation.expires_at && <InfoRow label={t('renewPaymentDeadlineLabel')} value={date(record.allocation.expires_at)} emphasis />}
        <InfoRow label={t('renewRequest')} value={<span className="break-all font-mono text-customer-caption">{record.id}</span>} />
      </InfoList>
      {!showReady && expiresAt !== null && (
        <div aria-hidden="true" className={`mt-4 flex items-center justify-between gap-3 rounded-customer-inset border p-3 transition-colors duration-300 ${urgent ? 'border-customer-warning-border bg-customer-warning-subtle' : 'border-customer-brand-border bg-customer-brand-subtle'}`}>
          <span className={`flex items-center gap-2 text-customer-label ${urgent ? 'text-customer-warning-text' : 'text-customer-brand-text'}`}>
            <Timer size={16} />{t('renewTimeLeftToPay')}
          </span>
          <span className={`text-customer-title tabular-nums ${urgent ? 'text-customer-warning-text' : 'text-customer-brand-text'}`}>{countdownText(remaining)}</span>
        </div>
      )}
    </Card>}
    {waiting && record?.manual_review.notification_status === 'FAILED' && <Alert tone="warning">{t('renewNotificationFailed')}</Alert>}
    {record?.status === 'AWAITING_PAYMENT' && !ready && !confirming && <Alert tone="warning">{t('renewHoldExpired')}</Alert>}
    {settlingActive ? (
      <div className="pt-2 text-center">
        <p className="inline-flex items-center gap-1.5 text-customer-caption text-customer-text-tertiary">
          <Loader2 size={14} aria-hidden="true" className="animate-spin text-customer-brand-text" />
          <span>{t(confirming ? 'renewProcessingShort' : 'renewStepAllocatingVehicle')}</span>
        </p>
      </div>
    ) : (
      <BottomBar summary={showReady ? { label: t('renewTotal'), value: money } : undefined}>
        {showReady ? <Button block icon={ArrowRight} disabled={busy} onClick={onProceedToPayment}>{t('renewGoToPayment')}</Button>
          : <Button block loading={busy} onClick={record ? onRefresh : onBack}>{t(record ? 'renewRefresh' : 'prepServiceReturn')}</Button>}
      </BottomBar>
    )}
  </div>;
}
