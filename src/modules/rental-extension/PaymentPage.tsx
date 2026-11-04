import React, { useContext, useEffect, useState } from 'react';
import {
  Check,
  CreditCard,
  ShieldCheck,
  Lock,
  Timer,
} from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { DepositConsent, RequestRecord } from './api';
import type { SanitizedOrder } from './contracts';
import { renewalDepositPlanValid, renewalPayable } from './model';
import { RentalVehicleCard } from './RentalVehicleCard';
import { Alert, Button, CardHeader, IconChip, InfoList, InfoRow } from '../../design/ui';

export interface PaymentPageProps {
  record: RequestRecord;
  order?: SanitizedOrder;
  confirmationNumber?: string;
  extensionDays?: number;
  newReturnTime?: string;
  deliveryEmail?: string;
  busy?: boolean;
  timezone?: string;
  onBack: () => void;
  onPay: (consent?: DepositConsent) => Promise<void> | void;
  paymentUnknown?: boolean;
  unknown?: boolean;
  paymentError?: string | null;
  onCheck?: () => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
}

function RenewalPrices({ record }: { record: RequestRecord }) {
  const { t, lang } = useContext(LanguageContext);
  const p = record.pricing_snapshot;
  const money = (value: number) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: p.currency }).format(value);
  return (
    <InfoList>
      {([
        ['renewRent', p.total_rent],
        ['renewCoverage', p.insurance_amount],
        ['renewAddons', p.addon_amount],
        ['renewTotal', p.grand_total],
      ] as const).map(([label, value]) => (
        <InfoRow key={label} label={t(label)} value={money(value)} total={label === 'renewTotal'} />
      ))}
    </InfoList>
  );
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  record,
  order,
  extensionDays = record.extension_days,
  newReturnTime = record.new_return_time,
  deliveryEmail = order?.primary_driver?.email || '',
  busy = false,
  timezone = order?.branch_timezone || 'Asia/Tokyo',
  onPay,
  paymentUnknown: propPaymentUnknown,
  unknown: propUnknown,
  paymentError,
  onCheck,
  onRefresh,
}) => {
  const paymentUnknown = propPaymentUnknown ?? propUnknown ?? false;
  const { lang, t } = useContext(LanguageContext);
  const [now, setNow] = useState(Date.now);
  const [depositAgreed, setDepositAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const plan = renewalDepositPlanValid(record.deposit_plan, record) ? record.deposit_plan : null;
  const payable = renewalPayable(record, now);
  const consentRequired = Boolean(plan?.consent_required && record.deposit_authorization?.status !== 'SUFFICIENT');
  const depositBlocked = !plan || (consentRequired && (!depositAgreed || !plan.fingerprint || !plan.terms_version));

  const expiresAt = record.allocation.expires_at ? Date.parse(record.allocation.expires_at) : null;
  const remaining = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const countdown = (() => {
    const total = Math.floor(remaining / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const seconds = String(total % 60).padStart(2, '0');
    return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
  })();
  const urgent = Boolean(expiresAt) && remaining < 5 * 60_000;

  // 原生 Stripe Card Element 输入字段 (模拟安全支付表单并支持品牌自动识别)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(
    order?.primary_driver?.full_name || order?.primary_driver?.surname || ''
  );
  const [cardCountry, setCardCountry] = useState('JP');

  const pricing = {
    grand_total: record.pricing_snapshot.grand_total,
    currency: record.pricing_snapshot.currency,
  };

  const money = (value: number, currency: string = pricing.currency) => {
    try {
      return new Intl.NumberFormat(lang, { style: 'currency', currency }).format(value);
    } catch {
      return `${value} ${currency}`;
    }
  };

  const formatDateTime = (value: string) => {
    try {
      return new Intl.DateTimeFormat(lang, {
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  // 格式化卡号输入
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // 格式化有效期
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // 根据卡号前缀自动识别卡组织，跟在卡号后面动态显示
  const detectCardBrand = () => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (
      clean.startsWith('51') ||
      clean.startsWith('52') ||
      clean.startsWith('53') ||
      clean.startsWith('54') ||
      clean.startsWith('55')
    ) {
      return 'MASTERCARD';
    }
    if (clean.startsWith('35')) return 'JCB';
    if (clean.startsWith('34') || clean.startsWith('37')) return 'AMEX';
    return 'GENERIC';
  };

  const cardBrand = detectCardBrand();

  const handlePay = async () => {
    setPayError(null);
    setSubmitting(true);
    try {
      if (paymentUnknown) {
        if (onCheck) await onCheck();
        else if (onRefresh) await onRefresh();
      } else {
        if (depositBlocked || !payable) return;
        const consent: DepositConsent | undefined =
          consentRequired && plan?.fingerprint && plan.terms_version
            ? {
                accepted: true,
                fingerprint: plan.fingerprint,
                terms_version: plan.terms_version,
              }
            : undefined;
        await onPay(consent);
      }
    } catch (err: any) {
      setPayError(err?.message || t('renewPaymentFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 text-customer-text">
      {(paymentUnknown || paymentError || payError) && (
        <div>
          <Alert tone="danger" role="alert">
            {paymentUnknown
              ? t('renewUnknown')
              : paymentError
              ? t(paymentError as any)
              : payError}
          </Alert>
        </div>
      )}
      {!payable && <Alert tone="warning">{t('renewHoldExpired')}</Alert>}
      <div className="space-y-3 pb-32">
        <div className="relative overflow-hidden bg-customer-card rounded-customer-card p-5 border border-customer-border border-t-4 border-t-customer-brand shadow-customer-card text-center space-y-2 motion-safe:animate-rise-in">
          <span className="text-customer-caption text-customer-text-tertiary">{t('renewPayTotal')}</span>
          <div className="text-customer-display text-customer-text tabular-nums tracking-tight">
            {money(pricing.grand_total, pricing.currency)}{' '}
            <span className="text-customer-caption text-customer-text-tertiary">{pricing.currency}</span>
          </div>

          {record.allocation.expires_at && (
            <p className={`inline-flex items-center justify-center gap-1.5 text-customer-caption ${urgent ? 'text-customer-warning-text' : 'text-customer-text-secondary'}`}>
              <Timer size={14} aria-hidden="true" />
              <span aria-hidden="true" className="tabular-nums font-semibold">{countdown}</span>
              <span>· {t('renewPaymentDeadlineLabel')} {formatDateTime(record.allocation.expires_at)}</span>
            </p>
          )}
          <div className="pt-2.5 border-t border-customer-border-subtle flex flex-wrap items-center justify-center gap-3 text-customer-caption text-customer-text-secondary">
            <span>
              {t('renewExtensionTag')} {extensionDays} {t('renewDays')}
            </span>
            <span>·</span>
            <span>
              {t('renewNewReturnTimePrefix')} {formatDateTime(newReturnTime)}
            </span>
          </div>
        </div>
        <div className="motion-safe:animate-rise-in" style={{ animationDelay: '60ms' }}>
        <RentalVehicleCard
          order={order}
          actualModelId={order?.actual_model_id}
          actualModelName={order?.actual_model_name || record.brand_code}
          actualPlate={order?.actual_plate}
          title={t('renewVehicleConfigTitle')}
          showPlate
          showBookedVehicle={false}
        />
        </div>
        <section className="bg-customer-card rounded-customer-card p-4 sm:p-5 border border-customer-border shadow-customer-card space-y-3 motion-safe:animate-rise-in" style={{ animationDelay: '100ms' }}>
          <CardHeader title={t('renewPricingDetailsTitle')} className="mb-0" />
          <RenewalPrices record={record} />
        </section>
        <div className="bg-customer-card rounded-customer-card p-4 sm:p-5 border border-customer-border shadow-customer-card space-y-4 motion-safe:animate-rise-in" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center gap-2.5">
            <IconChip icon={CreditCard} tone="brand" />
            <h2 className="text-customer-title">{t('renewCardDetails')}</h2>
          </div>
          <div className="rounded-customer-inset border border-customer-border-strong divide-y divide-customer-border overflow-hidden bg-customer-card focus-within:border-customer-brand focus-within:ring-4 focus-within:ring-customer-brand-ring transition-all shadow-customer-card">
            <div className="relative p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <label className="block text-customer-caption font-semibold text-customer-text-tertiary mb-0.5">
                  {t('renewCardNumber')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t('renewCardNumber')}
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 1234 1234 1234"
                  className="min-h-11 w-full bg-transparent text-customer-input font-mono text-customer-text outline-none placeholder:text-customer-text-secondary tracking-wide font-medium"
                />
              </div>
              <div key={cardBrand} className="shrink-0 flex items-center motion-safe:animate-pop-in">
                {cardBrand === 'VISA' && (
                  <span className="text-customer-caption font-semibold px-2 py-0.5 rounded-customer-chip bg-customer-info-subtle text-customer-info-text border border-customer-info-border font-serif">
                    VISA
                  </span>
                )}
                {cardBrand === 'MASTERCARD' && (
                  <span className="text-customer-caption font-semibold px-2 py-0.5 rounded-customer-chip bg-customer-danger-subtle text-customer-danger-text border border-customer-danger-border">
                    Mastercard
                  </span>
                )}
                {cardBrand === 'JCB' && (
                  <span className="text-customer-caption font-semibold px-2 py-0.5 rounded-customer-chip bg-customer-success-subtle text-customer-success-text border border-customer-success-border">
                    JCB
                  </span>
                )}
                {cardBrand === 'AMEX' && (
                  <span className="text-customer-caption font-semibold px-2 py-0.5 rounded-customer-chip bg-customer-info-subtle text-customer-info-text border border-customer-info-border">
                    AMEX
                  </span>
                )}
                {cardBrand === 'GENERIC' && (
                  <CreditCard className="w-5 h-5 text-customer-text-secondary" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-customer-border">
              <div className="p-3">
                <label className="block text-customer-caption font-semibold text-customer-text-tertiary mb-0.5">
                  {t('renewCardExpiry')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t('renewCardExpiry')}
                  autoComplete="cc-exp"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  placeholder="MM / YY"
                  maxLength={5}
                  className="min-h-11 w-full bg-transparent text-customer-input font-mono text-customer-text outline-none placeholder:text-customer-text-secondary font-medium"
                />
              </div>
              <div className="p-3">
                <label className="block text-customer-caption font-semibold text-customer-text-tertiary mb-0.5">
                  {t('renewCardCvc')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  aria-label={t('renewCardCvc')}
                  autoComplete="cc-csc"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="min-h-11 w-full bg-transparent text-customer-input font-mono text-customer-text outline-none placeholder:text-customer-text-secondary font-medium"
                />
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-customer-caption font-medium text-customer-text-secondary">
                {t('renewCardholderName')}
              </label>
              <input
                type="text"
                aria-label={t('renewCardholderName')}
                  autoComplete="cc-name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Name on card"
                className="w-full min-h-11 px-3 bg-white border border-customer-border-strong focus:border-customer-brand-border focus:ring-2 focus:ring-customer-brand-ring rounded-customer-control text-customer-input text-customer-text transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-customer-caption font-medium text-customer-text-secondary">
                {t('renewCardCountry')}
              </label>
              <select
                aria-label={t('renewCardCountry')}
                value={cardCountry}
                onChange={(e) => setCardCountry(e.target.value)}
                className="w-full min-h-11 px-3 bg-white border border-customer-border-strong focus:border-customer-brand-border focus:ring-2 focus:ring-customer-brand-ring rounded-customer-control text-customer-input text-customer-text transition-all outline-none cursor-pointer"
              >
                <option value="JP">{t('renewCountryJP')}</option>
                <option value="HK">{t('renewCountryHK')}</option>
                <option value="TW">{t('renewCountryTW')}</option>
                <option value="US">{t('renewCountryUS')}</option>
                <option value="SG">{t('renewCountrySG')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1 text-customer-caption text-customer-text-secondary">
              <Lock className="w-4 h-4 shrink-0 text-customer-text-tertiary" />
              <span>{t('renewCardSecurityNotice')}</span>
            </div>
          </div>
        </div>
          <section aria-labelledby="extension-deposit-title" className="bg-customer-card rounded-customer-card border border-customer-border shadow-customer-card p-4 sm:p-5 space-y-3 text-customer-body motion-safe:animate-rise-in" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-2.5">
              <IconChip icon={ShieldCheck} tone="success" />
              <h2 id="extension-deposit-title" className="text-customer-title">{t('renewDepositTitle')}</h2>
            </div>
            {plan ? (
              <>
                <InfoList><InfoRow stacked label={t('renewDepositThrough')} value={formatDateTime(plan.required_through)} /></InfoList>
                {plan.strategy === 'EXEMPT' ? (
                  <p className="text-customer-text-secondary">{t('renewDepositExempt')}</p>
                ) : (
                  <>
                    <div className="flex justify-between gap-3 text-customer-text">
                      <span>{t(plan.record_type === 'CASH_DEPOSIT' ? 'renewDepositCash' : 'renewDepositCurrent')}</span>
                      <strong>{money(plan.original_amount, plan.currency)}</strong>
                    </div>
                    {plan.required_amount !== plan.original_amount && (
                      <p className="text-customer-text-secondary">
                        {t('renewDepositTarget')}: {money(plan.required_amount, plan.currency)}
                      </p>
                    )}
                    {plan.strategy === 'REAUTHORIZE' && (
                      <p className="text-customer-brand-text">{t('renewDoubleHold')}</p>
                    )}
                  </>
                )}
                {record.deposit_authorization?.status === 'SUFFICIENT' && (
                  <p role="status" className="text-customer-success-text font-medium">
                    {t('renewDepositReady')}
                  </p>
                )}
                {consentRequired && (
                  <label htmlFor="extension-deposit-consent" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-customer-control border border-customer-border-strong bg-customer-inset p-3 transition-colors has-checked:border-customer-brand-border has-checked:bg-customer-brand-subtle">
                    <input
                      id="extension-deposit-consent"
                      type="checkbox"
                      checked={depositAgreed}
                      disabled={submitting || busy || paymentUnknown}
                      onChange={(e) => setDepositAgreed(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-customer-chip border border-customer-border-strong bg-customer-card transition-colors duration-150 peer-checked:border-customer-brand peer-checked:bg-customer-brand peer-focus-visible:ring-2 peer-focus-visible:ring-customer-brand peer-focus-visible:ring-offset-2">
                      <Check size={14} strokeWidth={3} className={`text-customer-text-inverse transition-all duration-150 ${depositAgreed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                    </span>
                    <span className="leading-relaxed text-customer-text">{t('renewDepositAgree')}</span>
                  </label>
                )}
              </>
            ) : (
              <p role="alert" className="text-customer-danger-text font-medium">
                {t('renewAgreementMissing')}
              </p>
            )}
            {paymentUnknown && record.deposit_authorization?.status === 'UNKNOWN' && (
              <p role="status" className="text-customer-brand-text">
                {t('renewDepositUnknown')}
              </p>
            )}
            <p className="flex items-start gap-2 text-customer-caption leading-relaxed text-customer-text-secondary border-t border-customer-border-strong pt-3">
              <Lock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-customer-text-tertiary" />
              <span>
                {t('renewPaymentSecurityNotice')}
                <a href="https://stripe.com/legal/end-users" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-customer-text">
                  {t('renewPaymentTerms')}
                </a>
                {t('renewPaymentTermsConjunction')}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-customer-text">
                  {t('renewPaymentPrivacy')}
                </a>
                {t('renewPaymentTermsEnd')}
              </span>
            </p>
          </section>

        {deliveryEmail && (
          <div className="text-center text-customer-caption text-customer-text-tertiary">
            {t('renewDeliveryEmailPrefix')}
            <span className="font-mono text-customer-text-secondary">{deliveryEmail}</span>
          </div>
        )}
      </div>
      <footer
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-customer-border p-3 sm:p-4 z-40"
      >
        <div className="max-w-customer-content mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-customer-caption text-customer-text-tertiary">{t('renewAmountDue')}</p>
            <p className="text-customer-title tabular-nums text-customer-text">
              {money(pricing.grand_total, pricing.currency)}{' '}
              <span className="text-customer-caption text-customer-text-tertiary">{pricing.currency}</span>
            </p>
          </div>
          <Button
            block={false}
            className="min-w-0 flex-1 whitespace-normal"
            disabled={submitting || busy || (!paymentUnknown && depositBlocked) || !payable}
            loading={submitting || busy}
            onClick={handlePay}
          >
            {paymentUnknown
              ? t('renewCheckPayment')
              : consentRequired && plan?.strategy !== 'REUSE'
              ? t('renewDepositAuthorizePay')
              : pricing.grand_total === 0
              ? t('renewZeroPayAction')
              : `${t('renewPay')} · ${money(pricing.grand_total, pricing.currency)}`}
          </Button>
        </div>
      </footer>
      {submitting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-customer-scrim p-4 backdrop-blur-xs motion-safe:animate-fade-in"
        >
          <div className="w-full max-w-sm space-y-4 rounded-customer-sheet border border-customer-border bg-customer-card p-6 text-center shadow-customer-overlay motion-safe:animate-scale-in sm:p-8">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-customer-brand-ring motion-safe:animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-customer-brand border-t-transparent motion-safe:animate-spin" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-customer-brand-subtle text-customer-brand-text">
                <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-customer-title text-customer-text">
                {t(consentRequired ? 'renewDepositProcessing' : 'renewProcessingPaymentTitle')}
              </h3>
              <p className="text-customer-amount tabular-nums text-customer-text tracking-tight">
                {money(pricing.grand_total, pricing.currency)}{' '}
                <span className="text-customer-caption font-bold text-customer-text-tertiary">{pricing.currency}</span>
              </p>
              <p className="mx-auto max-w-[260px] pt-1 text-customer-caption leading-relaxed text-customer-text-secondary">
                {t('renewProcessingPaymentSubtitle')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 border-t border-customer-border-subtle pt-2 text-customer-caption text-customer-text-tertiary">
              <Lock className="h-3.5 w-3.5 text-customer-text-tertiary" />
              <span>{t('renewStripeEncrypted')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
