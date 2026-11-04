import React, { useContext } from 'react';
import { ArrowRight, Briefcase, Check, CheckCircle2, ChevronRight, Clock3, Cog, CreditCard, Download, Eye, FileText, HelpCircle, History, Loader2, Phone, Plus, Users, Wind, XCircle, type LucideIcon } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';
import type { RequestRecord } from './api';
import type { SanitizedOrder } from './contracts';
import { renewalContractUrl, renewalPaymentStatus, renewalRecordStatus } from './model';
import { getVehiclePhoto } from './vehicleImages';
import { getVehicleSpecs } from './vehicleSpecs';
import { Alert, Badge, BottomBar, Button, Card, CardHeader, EmptyState, buttonClass, type StatusTone } from '../../design/ui';

export interface OriginalRentalContract { number: string; url: string }

function useRecordFormat(timezone: string) {
  const { lang, t } = useContext(LanguageContext);
  return {
    t,
    date: (value?: string) => value && Number.isFinite(Date.parse(value))
      ? new Intl.DateTimeFormat(lang, { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—',
    money: (amount: number, currency: string) => new Intl.NumberFormat(lang, { style: 'currency', currency }).format(amount),
  };
}
export function RenewalContractManagement({ record, busy, supportPhone, onRefresh }: {
  record: RequestRecord; supportPhone?: string; busy: boolean; onRefresh: () => void;
}) {
  const { t } = useContext(LanguageContext);
  const url = renewalContractUrl(record);
  const statusKey = record.contract.status === 'FAILED' ? 'renewContractFailed'
    : record.contract.status === 'READY' ? (url ? 'renewContractReady' : 'renewContractUnavailable')
    : record.contract.status === 'GENERATING' ? 'renewContractGenerating' : 'renewContractPending';
  if (record.payment.status !== 'PAID') return null;
  return <Card as="section">
    <CardHeader title={t('renewContractTitle')} />
    <div className="flex items-start gap-3">
      <FileText size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-customer-text-secondary" />
      <div className="min-w-0 flex-1">
        {record.document?.id && <p className="break-all font-mono text-customer-caption text-customer-text-tertiary">{record.document.id}</p>}
        {!url && <p role="status" className="text-customer-body text-customer-text-secondary">{t(statusKey)}</p>}
        {url && <div className="flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary', size: 'md' })} aria-label={`${t('prepContractViewFile')} · ${t('renewContractTitle')}`}><Eye size={18} aria-hidden="true" />{t('prepContractViewFile')}</a>
          <a href={url} download target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary', size: 'md' })} aria-label={`${t('prepContractDownload')} · ${t('renewContractTitle')}`}><Download size={18} aria-hidden="true" />{t('prepContractDownload')}</a>
        </div>}
      </div>
    </div>
    {!url && <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="text" loading={busy} onClick={onRefresh}>{t('renewRefresh')}</Button>
      {record.status === 'EFFECTIVE' && supportPhone && <a href={`tel:${supportPhone.replace(/[^+\d]/g, '')}`} className={buttonClass({ variant: 'text', size: 'md' })}><Phone size={18} aria-hidden="true" />{t('prepCallStore')}</a>}
    </div>}
  </Card>;
}
/** 续租只读详情：以紧凑的租期变化摘要承接生效结果，
 *  避免独立大时间线与下方租期信息重复。 */
export function RenewalRecordContent({ record, order }: { record: RequestRecord; order: SanitizedOrder }) {
  const { t, lang } = useContext(LanguageContext);
  const p = record.pricing_snapshot;
  const insurance = record.insurance_snapshot;
  const addons = record.addon_snapshot;
  const paid = record.payment.status === 'PAID';
  const specs = getVehicleSpecs(order.actual_model_id, order.actual_model_name, t);
  const date = (value?: string) => value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat(lang, { timeZone: order.branch_timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  const money = (value: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: p.currency }).format(value);
  const addonSubtotal = (addon: SanitizedOrder['addons'][number]) =>
    addon.unit_price * addon.quantity * (addon.charge_type === 'DAILY' ? record.extension_days : 1);
  const addonName = (addon: SanitizedOrder['addons'][number]) =>
    addon.code === 'GPS' ? t('addonGps') : addon.code === 'CHILD_SEAT' ? t('addonChildSeat') : addon.name;
  const cardLast4 = paid && /^\d{4}$/.test(record.payment.card_last4 ?? '') ? `•••• ${record.payment.card_last4}` : '—';
  return <div className="space-y-3">
    <Card as="section" className="space-y-3">
      <section className="space-y-3 border-b border-customer-border-subtle pb-4">
        <CardHeader
          title={t(renewalRecordStatus(record))}
          subtitle={<span className="break-all font-mono">{record.id}</span>}
          className="mb-0"
        />
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-customer-inset bg-customer-inset p-3">
          <div className="min-w-0">
            <span className="block text-customer-caption text-customer-text-tertiary">{t('renewOriginalReturn')}</span>
            <span className="mt-1 block text-customer-label tabular-nums text-customer-text-secondary">{date(record.original_return_time)}</span>
          </div>
          <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-customer-brand-text" />
          <div className="min-w-0 text-right">
            <span className="block text-customer-caption text-customer-text-secondary">{t('renewRequestedReturn')}</span>
            <span className="mt-1 block text-customer-body-strong tabular-nums text-customer-brand-text">{date(record.new_return_time)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-customer-caption">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-customer-brand-subtle px-2.5 py-1 font-semibold text-customer-brand-text">
            <Clock3 size={14} aria-hidden="true" />
            {t('renewThisExtension').replace('{count}', new Intl.NumberFormat(lang).format(record.extension_days))}
          </span>
          <span className="text-customer-text-tertiary">{order.branch_timezone}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="shrink-0 text-customer-caption text-customer-text-tertiary">{t('renewReturnLocation')}</span>
          <span className="min-w-0 text-right text-customer-label font-medium text-customer-text">{order.return_branch_name}</span>
        </div>
      </section>
      <section className="space-y-3 rounded-customer-inset bg-customer-inset p-4">
        <h3 className="text-customer-label text-customer-text-secondary">{t('renewRentedVehicle')}</h3>
        <div className="flex items-center gap-3.5">
          <img
            src={getVehiclePhoto(order.actual_model_id, order.actual_model_name)}
            alt={order.actual_model_name}
            className="h-14 w-20 shrink-0 rounded-customer-inset border border-customer-border bg-customer-card object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-customer-body-strong">{order.actual_model_name}</span>
              <span className="inline-flex items-center gap-1 rounded-customer-chip border border-customer-border bg-customer-card px-1.5 py-0.5 text-customer-caption text-customer-text-tertiary">
                <span>{t('renewOrSimilar')}</span>
                <HelpCircle size={12} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-customer-caption text-customer-text-secondary">
              <span className="flex items-center gap-1"><Users size={12} aria-hidden="true" className="text-customer-text-tertiary" />{specs.seats} {t('prepSeats')}</span>
              <span className="flex items-center gap-1"><Briefcase size={12} aria-hidden="true" className="text-customer-text-tertiary" />{specs.luggage} {t('prepLuggage')}</span>
              <span className="flex items-center gap-1"><Cog size={12} aria-hidden="true" className="text-customer-text-tertiary" />{specs.transmission}</span>
              <span className="flex items-center gap-1"><Wind size={12} aria-hidden="true" className="text-customer-text-tertiary" />{specs.airConditioning}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="space-y-2 rounded-customer-inset bg-customer-inset p-4">
        <h3 className="text-customer-label text-customer-text-secondary">{t('renewCoverageTitle')}</h3>
        {insurance ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-customer-body-strong">{insurance.name}</p>
                <p className="mt-0.5 text-customer-caption text-customer-text-tertiary tabular-nums">
                  {money(insurance.daily_rate)}{t('renewPerDay')} × {record.extension_days} {t('renewDays')} = {money(p.insurance_amount)}
                </p>
              </div>
              <span className="shrink-0 text-customer-body-strong tabular-nums">{money(p.insurance_amount)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-customer-border-subtle pt-2 text-customer-caption text-customer-text-secondary">
              <span className="flex items-center gap-1"><Check size={14} aria-hidden="true" className="text-customer-success" />{t('renewCoverageContinues')}</span>
              <span className="flex items-center gap-1"><Check size={14} aria-hidden="true" className="text-customer-success" />{t('renewNoNewLiability')}</span>
            </div>
          </>
        ) : (
          <p className="text-customer-caption text-customer-text-tertiary">{t('renewNoBreakdown')}</p>
        )}
      </section>
      <section className="space-y-2 rounded-customer-inset bg-customer-inset p-4">
        <h3 className="text-customer-label text-customer-text-secondary">{t('renewAddonsTitle')}</h3>
        {addons?.length ? (
          <div className="divide-y divide-customer-border-subtle">
            {addons.map((addon, index) => (
              <div key={`${addon.code}-${index}`} className="flex items-center justify-between gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="text-customer-body text-customer-text">{addonName(addon)}</p>
                  <p className="text-customer-caption text-customer-text-tertiary">
                    × {addon.quantity} · {money(addon.unit_price)}{addon.charge_type === 'DAILY' ? t('renewPerDay') : ''}
                  </p>
                </div>
                <span className="shrink-0 text-customer-caption tabular-nums text-customer-text-secondary">{money(addonSubtotal(addon))}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-customer-caption text-customer-text-tertiary">{t(record.addon_snapshot ? 'renewNoAddons' : 'renewNoBreakdown')}</p>
        )}
      </section>
      <section className="space-y-2.5 rounded-customer-inset bg-customer-inset p-4">
        <h3 className="border-b border-customer-border-subtle pb-1 text-customer-label text-customer-text-secondary">{t('renewPaymentDetails')}</h3>
        <div className="space-y-1.5 text-customer-caption text-customer-text-secondary">
          <div className="flex justify-between gap-3">
            <span>{t('renewBaseRent')}（{money(p.base_daily_rate)} × {record.extension_days} {t('renewDays')}）</span>
            <span className="tabular-nums">{money(p.total_rent)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>{t('renewCoverageTitle')}（{insurance?.name || '—'}）</span>
            <span className="tabular-nums">{money(p.insurance_amount)}</span>
          </div>
          {p.addon_amount > 0 && (
            <div className="flex justify-between gap-3">
              <span>{t('renewAddonsTitle')}</span>
              <span className="tabular-nums">{money(p.addon_amount)}</span>
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-customer-border-subtle pt-2">
          <span className="text-customer-body-strong">{t(paid ? 'renewPaidAmount' : 'renewTotal')}</span>
          <span className="text-customer-title tabular-nums text-customer-brand-text">{money(paid ? record.payment.amount : p.grand_total)}</span>
        </div>
        <div className="mt-1 space-y-1 rounded-customer-control border border-customer-border bg-customer-card p-2.5 font-mono text-customer-caption text-customer-text-tertiary">
          <div className="flex justify-between gap-3">
            <span>{t('renewPaymentMethod')}：</span>
            <span className="font-sans font-medium text-customer-text">{t(paid ? 'renewPaid' : renewalPaymentStatus(record))}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>{t('renewCardLast4')}：</span>
            <span className="text-customer-text">{cardLast4}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="shrink-0">{t('renewReceiptNumber')}：</span>
            <span className="truncate text-customer-text">{paid ? record.payment.payment_intent_id || '—' : '—'}</span>
          </div>
        </div>
      </section>
    </Card>
  </div>;
}

function recordBadge(record: RequestRecord): { key: PreparationKey; tone: StatusTone; icon: LucideIcon } {
  if (record.status === 'EFFECTIVE') return { key: 'renewEffective', tone: 'success', icon: CheckCircle2 };
  if (record.status === 'CLOSED') return record.closed_reason === 'STORE_REJECTED'
    ? { key: 'renewRecordDeclined', tone: 'danger', icon: XCircle }
    : { key: 'renewRecordEnded', tone: 'neutral', icon: XCircle };
  if (record.status === 'PENDING_STORE_CONFIRMATION') return { key: 'renewAwaitingStoreTitle', tone: 'info', icon: Clock3 };
  if (record.status === 'AWAITING_PAYMENT') return { key: 'renewStepPendingPayment', tone: 'warning', icon: CreditCard };
  return { key: 'renewProcessingShort', tone: 'info', icon: Loader2 };
}

export function RenewalRecords({ records, order, busy, error, onRefresh, onSelect, onExtendAgain }: {
  records: RequestRecord[]; order: SanitizedOrder; busy: boolean;
  error?: PreparationKey | null; onRefresh: () => void; onSelect: (id: string) => void; onExtendAgain?: () => void;
}) {
  const { t, date, money } = useRecordFormat(order.branch_timezone);
  return <div className="space-y-3">
    {error && <Alert tone="danger" action={<Button variant="secondary" loading={busy} onClick={onRefresh}>{t('prepRetry')}</Button>}>{t(error)}</Alert>}
    {!records.length && <Card><EmptyState icon={History} title={t('renewHistoryEmpty')} description={t('renewHistoryEmptyHint')} /></Card>}
    {records.map((item, index) => {
      const badge = recordBadge(item);
      return <Card key={item.id} padding="none" className="motion-safe:animate-rise-in" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
        <button type="button" onClick={() => onSelect(item.id)}
          className="group block w-full rounded-customer-card p-4 text-left transition-colors duration-150 hover:bg-customer-inset/60 active:bg-customer-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-customer-brand">
          <span className="flex items-center justify-between gap-3">
            <Badge tone={badge.tone} icon={badge.icon}>{t(badge.key)}</Badge>
            <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-customer-text-tertiary transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
          <span className="mt-3 flex items-center gap-1.5 text-customer-label tabular-nums text-customer-text">
            {date(item.original_return_time)}
            <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-customer-brand-text" />
            {date(item.new_return_time)}
          </span>
          <span className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-customer-border-subtle pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-customer-brand-subtle px-2.5 py-0.5 text-customer-caption font-semibold text-customer-brand-text">
              <Clock3 size={14} aria-hidden="true" />{t('renewThisExtension').replace('{count}', String(item.extension_days))}
            </span>
            <span className="text-customer-body-strong tabular-nums">{money(item.pricing_snapshot.grand_total, item.pricing_snapshot.currency)}</span>
          </span>
        </button>
      </Card>;
    })}
    {onExtendAgain && <BottomBar><Button block loading={busy} icon={Plus} onClick={onExtendAgain}>{t('renewExtendAgain')}</Button></BottomBar>}
  </div>;
}
