import React, { useContext } from 'react';
import { CarFront, ChevronDown, ClipboardCheck, FileCheck2, Globe2, Info, Loader2, Search } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationLanguage } from '../../i18n/preparation';

const languages = [['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย']] as const;
const serviceNotes = [
  [ClipboardCheck, 'prepEntryPreparation', 'prepEntryPreparationHint'],
  [FileCheck2, 'prepEntryStatus', 'prepEntryStatusHint'],
] as const;

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
  const inputClass = 'mt-2 min-h-12 w-full scroll-mb-8 rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 aria-invalid:border-red-500 aria-invalid:focus:ring-red-100';
  return <div className="min-h-dvh bg-white text-gray-900">
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-5">
      <header className="flex min-h-14 items-center justify-end px-1">
        <label className="relative flex min-h-11 items-center rounded-lg border border-gray-200 bg-white text-gray-600 focus-within:ring-2 focus-within:ring-primary/20">
          <Globe2 size={16} aria-hidden="true" className="pointer-events-none absolute left-3 text-primary" />
          <select aria-label={t('prepLanguage')} value={lang} disabled={loading} onChange={event => setLang(event.target.value as PreparationLanguage)} className="min-h-11 max-w-44 appearance-none rounded-lg bg-transparent py-2 pl-9 pr-8 text-xs font-medium focus-visible:outline-2 focus-visible:outline-primary">
            {languages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3" />
        </label>
      </header>
      <main className="pt-8">
        <section aria-labelledby="preparation-verification-title" className="text-center">
          <p aria-label={t('prepOverviewBrand')} className="text-balance text-center text-[36px] font-black leading-10"><span className="text-red-600">IX</span> <span className="text-gray-900">RENTAL</span></p>
          <h1 id="preparation-verification-title" className="mt-3 text-balance text-center text-[28px] font-bold leading-tight">{t('prepServiceTitle')}</h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-gray-600">{t('prepServiceIntro')}</p>
        </section>
        <form onSubmit={event => { event.preventDefault(); if (!disabled) onSubmit(); }} className="mt-7 overflow-hidden rounded-xl border border-gray-200 border-t-4 border-t-primary bg-white shadow-sm">
          <div className="flex items-center gap-3 px-5 pb-1 pt-5 text-gray-900">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><CarFront size={20} strokeWidth={1.75} aria-hidden="true" /></span>
            <h2 className="text-balance text-base font-semibold">{t('prepFindBooking')}</h2>
          </div>
          <div className="p-5">
          <div className="space-y-5">
            <div>
              <label htmlFor="prep-booking-reference" className="text-sm font-medium text-gray-700">{t('prepReference')}</label>
              <input id="prep-booking-reference" name="booking-reference" value={reference} onChange={event => onReferenceChange(event.target.value)} placeholder={t('prepReference')} required autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-describedby={error ? 'prep-reference-hint prep-query-error' : 'prep-reference-hint'} aria-invalid={Boolean(error)} className={inputClass} />
              <p id="prep-reference-hint" className="mt-1 text-xs leading-5 text-gray-500">{t('prepReferenceHint')}</p>
            </div>
            <div>
              <label htmlFor="prep-booking-phone-last4" className="text-sm font-medium text-gray-700">{t('prepPhoneLast4')}</label>
              <input id="prep-booking-phone-last4" name="phone" type="tel" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" value={phoneLast4} onChange={event => onPhoneLast4Change(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder={t('prepPhoneLast4Placeholder')} required autoComplete="tel" aria-describedby={error ? 'prep-phone-last4-hint prep-query-error' : 'prep-phone-last4-hint'} aria-invalid={Boolean(error)} className={inputClass} />
              <p id="prep-phone-last4-hint" className="mt-1 text-xs leading-5 text-gray-500">{t('prepPhoneLast4Hint')}</p>
            </div>
          </div>
          {loading && <p role="status" className="mt-3 text-sm text-gray-500">{t('prepLoading')}</p>}
          {loadError && <div role="alert" className="mt-3 text-sm text-red-700"><p>{t('prepLoadError')}</p><button type="button" onClick={onRetry} className="min-h-11 font-semibold underline">{t('prepRetry')}</button></div>}
          {error && <p id="prep-query-error" role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-pretty text-sm leading-5 text-red-700">{error}</p>}
          <button type="submit" disabled={disabled} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white enabled:hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary/20 disabled:text-primary-dark">
            {loading ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}{t('prepViewJourney')}
          </button>
          </div>
        </form>
        <section aria-label={t('prepServiceTitle')} className="mt-5 space-y-1 px-1">
          {serviceNotes.map(([Icon, titleKey, hintKey]) => <div key={titleKey} className="flex items-start gap-3 py-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-dark"><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span><div className="min-w-0"><p className="text-sm font-medium text-gray-800">{t(titleKey)}</p><p className="mt-1 text-pretty text-xs leading-5 text-gray-600">{t(hintKey)}</p></div></div>)}
        </section>
        <div className="mt-2 flex items-start gap-2 px-1 pt-4"><Info size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-500" /><p className="text-pretty text-xs leading-5 text-gray-500">{t('prepEntryHelp')}</p></div>
      </main>
    </div>
  </div>;
}
