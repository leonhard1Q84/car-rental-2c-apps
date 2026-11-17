import React, { useContext, useState } from 'react';
import {
  AlertTriangle,
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
import { CoverageDetailsDrawer } from './CoverageDetailsDrawer';

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
  const [isCoverageDrawerOpen, setIsCoverageDrawerOpen] = useState(false);
  const [hasConsentedCoverage, setHasConsentedCoverage] = useState(false);
  const [consentError, setConsentError] = useState<PreparationKey | null>(null);

  const formatDateTime = (value: string) => {
    try {
      const dateObj = new Date(value);
      if (Number.isNaN(dateObj.getTime())) return value;
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = dateObj.getFullYear();
      const m = pad(dateObj.getMonth() + 1);
      const d = pad(dateObj.getDate());
      const hr = pad(dateObj.getHours());
      const min = pad(dateObj.getMinutes());
      if (lang.startsWith('zh')) {
        return `${y}年${m}月${d}日 ${hr}:${min}`;
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

  const isPlatformInsurance = Boolean(
    !insurance ||
    !insurance.can_extend ||
    ['OTA', 'PLATFORM'].includes((insurance.provider || '').toUpperCase()) ||
    (insurance.provider || '').toUpperCase().includes('PLATFORM') ||
    (insurance.provider || '').toUpperCase().includes('OTA') ||
    (insurance.code || '').toUpperCase().includes('PLATFORM') ||
    (insurance.code || '').toUpperCase().includes('OTA') ||
    (insurance.name || '').toLowerCase().includes('平台') ||
    (insurance.name || '').toLowerCase().includes('platform') ||
    (insurance.name || '').toLowerCase().includes('ota')
  );

  const displayInsuranceDailyRate = isPlatformInsurance
    ? (extensionDays > 0 && p.insurance_amount > 0 ? Math.round(p.insurance_amount / extensionDays) : (insurance?.daily_rate || 1000))
    : (insurance?.daily_rate ?? 1000);
  const displayInsuranceName = isPlatformInsurance
    ? (t('renewCoverageDrawerTitle') || 'Standard coverage')
    : (insurance?.name || 'Standard CDW');

  return (
    <div className="space-y-3.5 pb-36">
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
                  {displayInsuranceName}
                </h3>
                <p className="text-customer-caption text-customer-text-tertiary mt-0.5">
                  {t('renewDailyRate')}
                  {formatMoney(displayInsuranceDailyRate, p.currency)}
                  {t('renewPerDay')}
                </p>
              </div>
            </div>
            <span className="text-customer-caption font-bold text-customer-text font-mono">
              {formatMoney(p.insurance_amount, p.currency)}
            </span>
          </div>
        </div>

        {isPlatformInsurance && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-customer-inset flex items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
              <span className="truncate">{t('renewCoverageCardNotice')}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCoverageDrawerOpen(true)}
              className="text-xs font-semibold text-customer-brand-text hover:underline shrink-0 cursor-pointer"
            >
              {t('renewCoverageViewDetails')} &gt;
            </button>
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
                    {displayInsuranceName} ({formatMoney(displayInsuranceDailyRate, p.currency)} × {extensionDays} {t('renewDays')})
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
        <div className="max-w-customer-content mx-auto space-y-2.5">
          {isPlatformInsurance && (
            <div className="space-y-1">
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  id="coverage-consent-checkbox"
                  type="checkbox"
                  checked={hasConsentedCoverage}
                  onChange={(e) => {
                    setHasConsentedCoverage(e.target.checked);
                    if (consentError) setConsentError(null);
                  }}
                  className="mt-0.5 size-4 rounded border-customer-border text-customer-brand focus:ring-customer-brand cursor-pointer"
                />
                <label
                  htmlFor="coverage-consent-checkbox"
                  className="text-xs text-customer-text-secondary leading-snug cursor-pointer select-none"
                >
                  {t('renewCoverageConsentCheckbox')}
                </label>
              </div>
              {consentError && (
                <p className="text-[11px] text-customer-danger-text font-medium pl-6">
                  {t(consentError)}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-customer-caption text-customer-text-tertiary">{t('renewTotal')}</p>
              <p className="text-customer-title font-black text-customer-text font-mono">
                {formatMoney(p.grand_total, p.currency)}
              </p>
            </div>

            <button
              type="button"
              disabled={busy || (isPlatformInsurance && !hasConsentedCoverage)}
              onClick={() => {
                if (isPlatformInsurance && !hasConsentedCoverage) {
                  setConsentError('renewCoverageConsentRequired');
                  return;
                }
                onConfirmApply();
              }}
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
        </div>
      </footer>

      <CoverageDetailsDrawer
        open={isCoverageDrawerOpen}
        onClose={() => setIsCoverageDrawerOpen(false)}
        brandName={order.brand_name || 'IX RENTAL'}
        dailyRate={displayInsuranceDailyRate}
        currency={p.currency}
      />
    </div>
  );
};
