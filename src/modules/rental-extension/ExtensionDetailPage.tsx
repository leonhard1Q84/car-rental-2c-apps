import React, { useContext, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Edit3,
  Layers,
  Loader2,
} from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';
import type { SanitizedOrder } from './contracts';
import type { Quote } from './api';
import { RentalVehicleCard } from './RentalVehicleCard';
import { ExpectedReturnDateTimePicker } from './ExpectedReturnDateTimePicker';

export interface ExtensionDetailPageProps {
  order: SanitizedOrder;
  quote: Quote;
  extensionDays: number;
  maxDays?: number;
  requestedReturnTime: string;
  onReturnTimeChange: (value: string) => void;
  onReturnTimeConfirm: (value: string) => Promise<boolean>;
  onConfirmApply: () => void;
  busy?: boolean;
  error?: PreparationKey | null;
}

export const ExtensionDetailPage: React.FC<ExtensionDetailPageProps> = ({
  order,
  quote,
  extensionDays,
  maxDays = 15,
  requestedReturnTime,
  onReturnTimeChange,
  onReturnTimeConfirm,
  onConfirmApply,
  busy = false,
  error,
}) => {
  const { lang, t } = useContext(LanguageContext);
  const [isPriceDetailOpen, setIsPriceDetailOpen] = useState(true);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDateTime = (value: string) => {
    try {
      const dateObj = new Date(value);
      if (Number.isNaN(dateObj.getTime())) return value;
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: order.branch_timezone || 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(dateObj);
      const get = (type: string) => parts.find((p) => p.type === type)?.value;
      const y = get('year');
      const m = get('month');
      const d = get('day');
      const hr = get('hour');
      const min = get('minute');
      if (lang.startsWith('zh')) {
        return `${y}年${Number(m)}月${Number(d)}日 ${hr}:${min}`;
      }
      return `${y}-${m}-${d} ${hr}:${min}`;
    } catch {
      return value;
    }
  };

  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: currency || 'JPY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const p = quote.pricing;
  const insurance = order.insurance;
  const addons = quote.addon_details ?? order.addons ?? [];
  const isOtaInsuranceCannotExtend = !insurance?.can_extend;

  return (
    <div className="space-y-3.5 pb-28">
      {error && (
        <div role="alert" className="rounded-customer-inset border border-customer-danger-border bg-customer-danger-subtle p-3 text-customer-caption text-customer-danger-text">
          {t(error)}
        </div>
      )}
      <RentalVehicleCard
        order={order}
        title={t('renewVehicleConfigTitle')}
        showPlate
        showBookedVehicle={false}
      />
      <section className="bg-white rounded-customer-card p-4 sm:p-5 border border-customer-border shadow-customer-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-customer-caption font-bold text-customer-text">{t('renewPeriodTitle')}</h2>
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            disabled={busy}
            className="text-customer-caption font-medium text-customer-brand-text hover:text-customer-brand-text flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="size-3.5" />
            <span>{t('renewEditDays')}</span>
          </button>
        </div>

        <div className="p-3.5 bg-customer-brand-subtle rounded-customer-inset border border-customer-brand-border flex items-center justify-between text-customer-caption">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-customer-text-secondary">{t('renewPeriodDays')}</span>
              <span className="font-bold text-customer-text text-customer-body">
                {extensionDays} {t('renewDays')}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-customer-text-secondary">{t('renewNewReturnTimePrefix')}</span>
              <span className="font-black text-customer-brand-text text-customer-body">
                {formatDateTime(quote.new_return_time || requestedReturnTime)}
              </span>
            </div>
          </div>

          <div className="text-right pl-3 border-l border-customer-brand-border max-w-[160px]">
            <span className="text-customer-caption text-customer-text-tertiary block">{t('renewReturnLocation')}</span>
            <span className="font-medium text-customer-text text-customer-caption mt-0.5 block truncate">
              {order.return_branch_name}
            </span>
          </div>
        </div>
        {isDatePickerOpen && (
          <div className="pt-2">
            <ExpectedReturnDateTimePicker
              open showTrigger={false}
              onOpenChange={setIsDatePickerOpen}
              value={requestedReturnTime}
              currentReturnTime={order.current_return_time}
              maxDays={maxDays}
              timeZone={order.branch_timezone}
              disabled={busy}
              error={error}
              onChange={onReturnTimeChange}
              onConfirm={async value => {
                const confirmed = await onReturnTimeConfirm(value);
                if (confirmed) setIsDatePickerOpen(false);
                return confirmed;
              }}
            />
          </div>
        )}
      </section>
      <section className="bg-white rounded-customer-card p-4 sm:p-5 border border-customer-border shadow-customer-card space-y-3">
        <h2 className="text-customer-caption font-bold text-customer-text">{t('renewCoverageTitle')}</h2>

        <div className="p-3.5 bg-customer-inset rounded-customer-inset border border-customer-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-customer-control bg-customer-success-subtle text-customer-success-text flex items-center justify-center font-bold text-customer-caption">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-customer-caption font-bold text-customer-text">
                  {insurance?.name || 'Standard CDW'}
                </h3>
                <p className="text-customer-caption text-customer-text-tertiary mt-0.5">
                  {t('renewDailyRate')}
                  {formatMoney(insurance?.daily_rate ?? 2000, p.currency)}
                  {t('renewPerDay')}
                </p>
              </div>
            </div>
            <span className="text-customer-caption font-bold text-customer-text font-mono">
              {formatMoney(p.insurance_amount, p.currency)}
            </span>
          </div>
        </div>

        {isOtaInsuranceCannotExtend && (
          <div className="p-3 bg-customer-warning-subtle border border-customer-warning-border rounded-customer-inset text-customer-caption text-customer-warning-text leading-relaxed">
            {t('renewCoverageUnavailable')}
          </div>
        )}
      </section>
      {addons && addons.length > 0 && (
        <section className="bg-white rounded-customer-card p-4 sm:p-5 border border-customer-border shadow-customer-card space-y-3">
          <h2 className="text-customer-caption font-bold text-customer-text">{t('renewAddonsTitle')}</h2>

          <div className="divide-y divide-customer-border-subtle">
            {addons.map((item) => (
              <div key={item.code} className="py-2.5 flex items-center justify-between text-customer-caption">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-customer-inset flex items-center justify-center text-customer-text-secondary">
                    <Layers className="size-3.5 text-customer-text-tertiary" />
                  </div>
                  <div>
                    <span className="font-semibold text-customer-text">
                      {item.code === 'GPS'
                        ? t('addonGps')
                        : item.code === 'CHILD_SEAT'
                        ? t('addonChildSeat')
                        : item.name}
                    </span>
                    <p className="text-customer-caption text-customer-text-tertiary mt-0.5">
                      {t('renewBooking')}: {item.quantity} · {formatMoney(item.unit_price, p.currency)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-customer-text font-mono">
                  {formatMoney(
                    item.charge_type === 'DAILY'
                      ? item.unit_price * item.quantity * extensionDays
                      : item.unit_price * item.quantity,
                    p.currency
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="bg-white rounded-customer-card p-4 sm:p-5 border border-customer-border shadow-customer-card space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsPriceDetailOpen(!isPriceDetailOpen)}
        >
          <h2 className="text-customer-caption font-bold text-customer-text">{t('renewPricingDetailsTitle')}</h2>
          {isPriceDetailOpen ? (
            <ChevronUp className="size-4 text-customer-text-tertiary" />
          ) : (
            <ChevronDown className="size-4 text-customer-text-tertiary" />
          )}
        </div>

        {isPriceDetailOpen && (
          <div className="divide-y divide-customer-border-subtle text-customer-caption text-customer-text-secondary">
            <div className="py-2.5 space-y-1">
              <div className="flex items-center justify-between font-semibold text-customer-text">
                <span>{t('renewBaseRent')}</span>
                <span className="font-mono">{formatMoney(p.total_rent, p.currency)}</span>
              </div>
              <div className="pl-2 space-y-0.5 text-customer-caption text-customer-text-tertiary">
                <div className="flex justify-between">
                  <span>
                    {formatMoney(p.base_daily_rate, p.currency)} × {extensionDays} {t('renewDays')}
                  </span>
                  <span className="font-mono">{formatMoney(p.total_rent, p.currency)}</span>
                </div>
              </div>
            </div>
            <div className="py-2.5 space-y-1">
              <div className="flex items-center justify-between font-semibold text-customer-text">
                <span>{t('renewCoverageTitle')}</span>
                <span className="font-mono">{formatMoney(p.insurance_amount, p.currency)}</span>
              </div>
              <div className="pl-2 space-y-0.5 text-customer-caption text-customer-text-tertiary">
                <div className="flex justify-between">
                  <span>
                    {insurance?.name || 'Standard CDW'} ({formatMoney(insurance?.daily_rate ?? 2000, p.currency)} × {extensionDays} {t('renewDays')})
                  </span>
                  <span className="font-mono">{formatMoney(p.insurance_amount, p.currency)}</span>
                </div>
              </div>
            </div>
            {p.addon_amount > 0 && (
              <div className="py-2.5 space-y-1">
                <div className="flex items-center justify-between font-semibold text-customer-text">
                  <span>{t('renewAddonsTitle')}</span>
                  <span className="font-mono">{formatMoney(p.addon_amount, p.currency)}</span>
                </div>
                <div className="pl-2 space-y-0.5 text-customer-caption text-customer-text-tertiary">
                  {addons.map((a) => (
                    <div key={a.code} className="flex justify-between">
                      <span>
                        {a.code === 'GPS'
                          ? t('addonGps')
                          : a.code === 'CHILD_SEAT'
                          ? t('addonChildSeat')
                          : a.name}{' '}
                        × {a.quantity}
                      </span>
                      <span className="font-mono">
                        {formatMoney(
                          a.charge_type === 'DAILY'
                            ? a.unit_price * a.quantity * extensionDays
                            : a.unit_price * a.quantity,
                          p.currency
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <footer
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-customer-border p-3 sm:p-4 z-40"
      >
        <div className="max-w-customer-content mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-customer-caption text-customer-text-tertiary">{t('renewTotal')}</p>
            <p className="text-customer-title font-black text-customer-text font-mono">
              {formatMoney(p.grand_total, p.currency)}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirmApply}
            className="flex-1 max-w-xs h-11 px-6 rounded-customer-inset bg-customer-brand hover:bg-customer-brand-subtle active:bg-customer-brand-subtle text-white text-customer-caption font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t('prepSaving')}</span>
              </>
            ) : (
              <>
                <span>{t('renewConfirmApply')}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
