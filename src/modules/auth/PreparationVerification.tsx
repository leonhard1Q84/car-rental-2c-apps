import React, { useContext, useEffect, useState } from 'react';
import { ArrowRight, Car, ChevronDown, FileCheck2, Globe2, KeyRound, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey, PreparationLanguage } from '../../i18n/preparation';
import { Alert, Button, Card, CardHeader, Field, IconChip, Input } from '../../design/ui';
import { FleetCarSilhouette } from './FleetCarSilhouette';
import './verification.css';

const languages = [['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย']] as const;

const trustItems: { icon: LucideIcon; title: PreparationKey; text: PreparationKey }[] = [
  { icon: Zap, title: 'prepTrustFastTitle', text: 'prepTrustFastText' },
  { icon: KeyRound, title: 'prepTrustSelfDriveTitle', text: 'prepTrustSelfDriveText' },
  { icon: FileCheck2, title: 'prepTrustContractTitle', text: 'prepTrustContractText' },
];

interface Props {
  reference: string;
  phoneLast4: string;
  onReferenceChange: (value: string) => void;
  onPhoneLast4Change: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  loadError: boolean;
  error?: string;
  onRetry: () => void;
}

export function PreparationVerification({ reference, phoneLast4, onReferenceChange, onPhoneLast4Change, onSubmit, loading, loadError, error, onRetry }: Props) {
  const { lang, setLang, t } = useContext(LanguageContext);
  const disabled = !reference.trim() || !/^\d{4}$/.test(phoneLast4.trim()) || loading || loadError;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) { setSlow(false); return; }
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="customer-auth min-h-dvh bg-customer-page text-customer-text antialiased">
      <div className="mx-auto w-full max-w-customer-content px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-5">
        <header className="flex min-h-customer-header items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-customer-control bg-customer-brand text-customer-text-inverse" aria-hidden="true">
              <Car size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-customer-label font-semibold leading-tight text-customer-text">{t('prepPortalBadge')}</p>
              <p className="mt-0.5 truncate text-customer-caption text-customer-text-tertiary">{t('prepPortalTagline')}</p>
            </div>
          </div>
          <label className="relative inline-flex shrink-0 items-center">
            <Globe2 size={16} aria-hidden="true" className="pointer-events-none absolute left-3 text-customer-text-secondary" />
            <select
              aria-label={t('prepLanguage')}
              value={lang}
              disabled={loading}
              onChange={event => setLang(event.target.value as PreparationLanguage)}
              className="min-h-11 max-w-40 cursor-pointer appearance-none rounded-full border border-customer-border bg-customer-card py-2 pl-9 pr-8 text-customer-label text-customer-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-customer-brand disabled:opacity-50"
            >
              {languages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 text-customer-text-tertiary" />
          </label>
        </header>

        <main aria-labelledby="preparation-verification-title">
          <section className="pt-10 text-center sm:pt-12">
            <FleetCarSilhouette className="mx-auto h-16 w-64 sm:h-20 sm:w-72" />
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-customer-brand-border bg-customer-brand-subtle px-3.5 py-1.5 text-customer-caption font-semibold text-customer-brand-text">
              <span className="size-2 rounded-full bg-customer-brand motion-safe:animate-pulse" aria-hidden="true" />
              {t('prepHeroBadge')}
            </p>
            <h1 id="preparation-verification-title" className="mt-4 text-balance text-customer-display font-bold tracking-tight">{t('prepServiceTitle')}</h1>
          </section>

          <Card as="form" aria-busy={loading} className="mt-6" onSubmit={event => {
            event.preventDefault();
            if (!disabled) onSubmit();
          }}>
            <CardHeader title={t('prepFormTitle')} divider />
            <div className="space-y-5">
              <Field label={t('prepReference')} htmlFor="prep-booking-reference">
                <Input
                  id="prep-booking-reference" name="booking-reference" value={reference}
                  onChange={event => onReferenceChange(event.target.value)}
                  placeholder={t('prepReferenceHint')} required disabled={loading}
                  autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="next"
                  aria-invalid={Boolean(error)}
                  className="scroll-mb-8"
                />
              </Field>
              <Field label={t('prepPhoneLast4')} htmlFor="prep-booking-phone-last4">
                <Input
                  id="prep-booking-phone-last4" name="phone-last4" type="tel" inputMode="numeric" maxLength={4} pattern="[0-9]{4}"
                  value={phoneLast4} onChange={event => onPhoneLast4Change(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={t('prepPhoneLast4Hint')} required disabled={loading} autoComplete="off" enterKeyHint="go"
                  aria-invalid={Boolean(error)}
                  className="scroll-mb-8 tabular-nums"
                />
              </Field>
            </div>

            {loading && <p role="status" className="sr-only">{t('prepVerifying')}</p>}
            {loadError && (
              <Alert
                tone="danger" className="mt-4"
                action={<Button type="button" variant="text" size="md" onClick={onRetry}>{t('prepRetry')}</Button>}
              >
                {t('prepLoadError')}
              </Alert>
            )}
            {error && !loadError && <Alert tone="danger" className="mt-4">{error}</Alert>}

            <Button type="submit" block disabled={disabled} loading={loading} trailingIcon={ArrowRight} className="customer-auth-submit mt-5">
              {t(loading ? 'prepVerifying' : 'prepViewJourney')}
            </Button>
            {slow && <p role="status" className="mt-2 text-center text-customer-caption text-customer-text-tertiary">{t('prepVerifyWaiting')}</p>}
          </Card>

          <div className="mt-4 flex items-start gap-2 px-1">
            <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-customer-text-tertiary" />
            <p className="text-pretty text-customer-caption text-customer-text-tertiary">{t('prepEntryHelp')}</p>
          </div>

          <Card padding="compact" className="mt-3 grid grid-cols-3 divide-x divide-customer-border-subtle text-center">
            {trustItems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex min-w-0 flex-col items-center gap-1.5 px-2">
                <IconChip icon={Icon} />
                <p className="text-customer-caption font-semibold text-customer-text">{t(title)}</p>
                <p className="text-pretty text-customer-caption text-customer-text-tertiary">{t(text)}</p>
              </div>
            ))}
          </Card>

          <footer className="mt-6 text-center text-customer-caption text-customer-text-disabled">{t('prepPortalFooter')}</footer>
        </main>
      </div>
    </div>
  );
}
