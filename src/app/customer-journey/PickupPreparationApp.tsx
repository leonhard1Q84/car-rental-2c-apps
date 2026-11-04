import { PreparationContractPage, PreparationPickupJourney, PreparationInspectionPage } from '../../modules/selfservice-rental/public-api';
import { PreparationVerification, findPreparationBooking } from '../../modules/auth/public-api';
import { PreparationDrivers, PreparationReviewStatus } from '../../modules/online-checkin/public-api';
import { identityDeadlinePassed } from '../../modules/online-checkin/identityDeadline';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Languages, Loader2 } from 'lucide-react';
import { LanguageContext, LanguageProvider } from '../../contexts/LanguageContext';
import ReservationDetailsScreen from '../../components/ReservationDetailsScreen';
import { PreparationTerms } from '../../modules/selfservice-rental/pickup/PreparationTerms';
import { PublishedPreparationTripSummary as PreparationTripSummary } from '../../modules/home/PublishedPreparationTripSummary';
import { PreparationTripVehicle } from '../../modules/home/PreparationTripVehicle';
import { PreparationServiceEntries } from '../../modules/home/PreparationServiceEntries';
import { BrandMark } from '../../modules/home/BrandMark';
import type { PreparationKey, PreparationLanguage } from '../../i18n/preparation';
import { canSubmitIdentity, completion, type Step } from './model';
import { usePreparation } from './usePreparation';
import { clearCustomerSession, createCustomerAuthApi, customerAuthConfigured, CustomerAuthError, setCustomerSession } from '@shared/services/customerAuthApi';
import { preparationBooking } from './bookingFixtures';
import { PreparationStickyHeader } from './PreparationStickyHeader';
import './preparation.css';
import { PreparationStoreContact } from '../../modules/home/PreparationStoreContact';
import { PreparationExtras } from '../../modules/home/PreparationExtras';
import { PreparationInsurance } from '../../modules/home/PreparationInsurance';
import { PreparationSequenceDialog } from './PreparationSequenceDialog';
import { isPreparationCorrection } from '../../modules/online-checkin/review';
import { serviceCompletionDestination } from './serviceNavigation';
import { preparationPageTitleKey } from './servicePresentation';
import { PreparationRenewal } from '../../modules/rental-extension/PreparationRenewal';
import { localRenewalDemoScenario } from '../../modules/rental-extension/localDemoGate';
import { Alert, Button } from '../../design/ui';

const languages = [['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย']] as const;

function PreparationContent() {
  const { lang, setLang, t } = useContext(LanguageContext);
  const renewalBack = useRef<(() => void) | null>(null);
  const [renewalTitle, setRenewalTitle] = useState<PreparationKey>('prepRenewal');
  const [renewalBusy, setRenewalBusy] = useState(false);
  const [renewalReady, setRenewalReady] = useState(false);
  const renewalNavigation = useCallback((title: PreparationKey, back: () => void, busy: boolean) => {
    renewalBack.current = back;
    setRenewalTitle(title);
    setRenewalBusy(busy);
  }, []);
  const [contractDirty, setContractDirty] = useState(false);
  const [contractBusy, setContractBusy] = useState(false);
  const app = usePreparation(setLang, () => !contractBusy && (!contractDirty || window.confirm(t('prepContractLeave'))));
  const { draft, photos, navigate, update } = app;
  const booking = preparationBooking(draft.orderId);
  const step = app.step === 'documents' ? 'drivers' : app.step;
  const displayStep = step === 'renewal' && !renewalReady ? 'home' : step;
  const [formError, setFormError] = useState<PreparationKey | null>(null);
  const [authOrder, setAuthOrder] = useState('');
  const [authPhoneLast4, setAuthPhoneLast4] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const switchingOrder = useRef(false);
  const [languageReset, setLanguageReset] = useState(false);
  const completed = completion(draft, photos);
  const done = { booking: completed.booking, drivers: completed.drivers && completed.documents, terms: completed.terms };
  const readOnly = Boolean(draft.submittedAt);
  const correction = isPreparationCorrection(draft);
  const rejected = draft.documentReview?.state === 'REJECTED';
  const busy = app.saving || submitting || contractBusy;
  const showFooter = ['booking', 'drivers', 'terms', 'notices'].includes(displayStep);
  const title = t(displayStep === 'renewal' ? renewalTitle : preparationPageTitleKey(displayStep));
  useEffect(() => { if (step !== 'renewal') setRenewalReady(false); }, [step]);
  function go(next: Step, replace = false, returnTo?: 'contract' | 'pickup') { if (contractBusy || ((step === 'contract' || step === 'pickup') && contractDirty && !window.confirm(t('prepContractLeave')))) return; setContractDirty(false); setFormError(null); if ((next === 'notices' || next === 'terms') && lang !== draft.language) update({ language: lang }); if (step === 'contract' || step === 'pickup') app.retry(); navigate(next, replace, draft.orderId, returnTo); }
  function languageChange(language: PreparationLanguage) {
    setLang(language);
    if (step === 'details' || step === 'inspection' || step === 'contract' || step === 'pickup') return;
    if (step === 'terms' || step === 'notices') { setLanguageReset(Boolean(draft.confirmation)); update({ language }); }
  }
  async function editPreparation() {
    if (app.identityExpired || busy || app.error || !rejected) return;
    setFormError(null);
    if (correction) { go('drivers'); return; }
    setSubmitting(true);
    try { await app.reopen(); } catch { setFormError('prepStorageError'); }
    finally { setSubmitting(false); }
  }
  async function verifyAnotherOrder() {
    if (busy || app.loading || switchingOrder.current) return;
    switchingOrder.current = true;
    setSubmitting(true); setFormError(null);
    try {
      await app.resetCurrentDemo();
      setAuthOrder(''); setAuthPhoneLast4(''); setLanguageReset(false);
      go('auth', true);
    } catch { setFormError('prepStorageError'); }
    finally { switchingOrder.current = false; setSubmitting(false); }
  }
  async function next() {
    setFormError(null);
    if (step === 'auth') {
      if (app.loading || app.error || submitting) return;
      if (!customerAuthConfigured()) {
        const matched = findPreparationBooking(authOrder, authPhoneLast4);
        if (!matched) { setFormError('prepAuthError'); return; }
        clearCustomerSession();
        setFormError(null); setLanguageReset(false);
        navigate('home', true, matched.orderId); return;
      }
      setSubmitting(true);
      try {
        const session = await createCustomerAuthApi().lookup(authOrder, authPhoneLast4);
        // 准备数据仍来自本地 fixture：服务端订单无本地数据时按验证失败处理（实现缺口，待准备数据服务接入）。
        if (!findPreparationBooking(session.orderId, authPhoneLast4)) throw new CustomerAuthError('LOOKUP_MISMATCH');
        setCustomerSession(session);
        setFormError(null); setLanguageReset(false);
        navigate('home', true, session.orderId);
      } catch (failure) {
        const code = failure instanceof CustomerAuthError ? failure.code : 'SERVICE_UNAVAILABLE';
        setFormError(code === 'RATE_LIMITED' ? 'prepAuthRateLimited' : code === 'SERVICE_UNAVAILABLE' ? 'prepAuthUnavailable' : 'prepAuthError');
      } finally { setSubmitting(false); }
      return;
    }
    const destination = serviceCompletionDestination(window.location.search);
    if (step === 'drivers') {
      if (identityDeadlinePassed(draft.orderId)) { go(destination, true); return; }
      if (rejected && readOnly) { await editPreparation(); return; }
      if (readOnly) { go(destination, true); return; }
      if (!canSubmitIdentity(draft, photos)) { setFormError('prepValidation'); return; }
      setSubmitting(true);
      try { await app.submit(); go(destination, true); } catch { setFormError(identityDeadlinePassed(draft.orderId) ? 'prepIdentityExpired' : 'prepStorageError'); }
      finally { setSubmitting(false); }
      return;
    }
    if (step === 'terms' || step === 'notices') {
      if (!done.terms) { setFormError('prepValidation'); return; }
      go(destination, true); return;
    }
    if (step === 'booking') {
      if (!done.booking) { setFormError('prepValidation'); return; }
      setSubmitting(true);
      try { await app.completeStep('booking'); go('home', true); } catch { setFormError('prepStorageError'); }
      finally { setSubmitting(false); }
    }
  }
  const primaryLabel: PreparationKey = busy ? 'prepSaving'
    : step === 'drivers' ? app.identityExpired ? 'prepServiceReturn' : rejected && readOnly ? 'prepReviewEdit' : readOnly ? 'prepServiceReturn' : correction ? 'prepReviewResubmit' : 'prepSubmitIdentity'
    : step === 'terms' || step === 'notices' ? 'prepSaveNotices' : 'prepServiceReturn';
  function completeForContract(service: 'drivers' | 'notices' | 'inspection') {
    if (service === 'notices' && lang !== draft.language) update({ language: lang });
    app.navigate(service, false, draft.orderId, 'contract');
    if (service === 'drivers' && rejected) void editPreparation();
  }
  const reservation = {
    orderNumber: booking.customerReference, confirmationCode: booking.confirmationCode,
    rentalPeriod: { start: '2026-11-01 10:00', end: '2026-11-04 10:00', duration: '3' },
    pickupLocation: t('prepStore'), returnLocation: t('prepStore'), vehicle: { name: t('prepGroup') },
    customer: { name: `${booking.first} ${booking.last}`, phone: booking.phone, email: booking.email }
  };
  if (step === 'auth') return <PreparationVerification
    reference={authOrder} phoneLast4={authPhoneLast4}
    onReferenceChange={value => { setAuthOrder(value); setFormError(null); }}
    onPhoneLast4Change={value => { setAuthPhoneLast4(value); setFormError(null); }}
    onSubmit={() => { void next(); }} loading={app.loading || submitting} loadError={Boolean(app.error)}
    error={formError ? t(formError) : undefined} onRetry={app.retry}
  />;
  return <div className="pickup-preparation mx-auto min-h-dvh w-full max-w-customer-content bg-customer-page text-customer-text antialiased">
    <PreparationStickyHeader>
    <header className="flex min-h-customer-header items-center justify-between gap-3 border-b border-customer-border bg-customer-card/95 px-4 py-3 text-customer-text backdrop-blur-md shadow-2xs">
      {displayStep === 'home' ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark brandCode={booking.brandCode} />
          <div className="min-w-0">
            <h1 className="truncate text-customer-label font-bold tracking-tight text-customer-text leading-none">
              {booking.brandCode === 'TG' ? 'TRUST GO' : 'IX RENTAL'}
            </h1>
            <p className="mt-0.5 truncate text-[11px] text-customer-text-tertiary font-medium">
              {t('prepPortalSubtitle')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <a
            href="/"
            aria-label={t(step === 'renewal' ? 'prepBack' : 'prepHome')}
            aria-disabled={step === 'renewal' && renewalBusy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-customer-text hover:bg-customer-inset active:bg-customer-border transition-colors cursor-pointer"
            onClick={event => {
              event.preventDefault();
              if (step === 'renewal' && renewalBack.current) { if (!renewalBusy) renewalBack.current(); return; }
              go(step === 'inspection' || step === 'contract' ? serviceCompletionDestination(window.location.search) : 'home', true);
            }}
          >
            <ArrowLeft size={18} />
          </a>
          <BrandMark brandCode={booking.brandCode} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-xs font-bold tracking-tight text-customer-text leading-none">
                {booking.brandCode === 'TG' ? 'TRUST GO' : 'IX RENTAL'}
              </span>
              <span className="text-customer-border-strong text-[11px] leading-none shrink-0">·</span>
              <h1 data-renewal-title={step === 'renewal' ? true : undefined} tabIndex={step === 'renewal' ? -1 : undefined} className="truncate text-xs font-semibold text-customer-brand-text leading-none">
                {title}
              </h1>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-customer-text-tertiary font-mono">
              {booking.confirmationCode}
            </p>
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <label className="relative flex items-center">
          <Languages size={16} className="pointer-events-none absolute left-2 text-customer-text-tertiary" />
          <select
            aria-label={t('prepLanguage')}
            value={lang}
            disabled={busy || app.loading || (displayStep === 'renewal' && renewalBusy)}
            onChange={event => languageChange(event.target.value as PreparationLanguage)}
            className="min-h-9 max-w-32 appearance-none rounded-full border border-customer-border bg-customer-card py-2 pl-8 pr-2 text-customer-label text-customer-text focus:outline-none focus:ring-2 focus:ring-[var(--customer-color-brand-ring)] focus:border-[var(--customer-color-brand-border)] cursor-pointer"
          >
            {languages.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
    </PreparationStickyHeader>
    {app.loading ? <main className="flex min-h-80 flex-col items-center justify-center gap-3" role="status"><Loader2 className="animate-spin text-customer-brand-text" /><p className="text-customer-body text-customer-text-secondary">{t('prepLoading')}</p></main>
      : app.error === 'load' ? <main className="p-5"><p role="alert" className="text-customer-body text-customer-danger-text">{t('prepLoadError')}</p><Button onClick={app.retry} size="md" className="mt-4">{t('prepRetry')}</Button></main>
      : <>
      <main className={`space-y-3 px-4 pt-4 ${showFooter ? 'pb-44' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]'}`}>
        {displayStep === 'home' && <PreparationTripSummary orderId={draft.orderId} reservation={reservation} vehicleModel="Toyota Yaris" vehicleAssignment={booking.vehicleAssignment} onDetails={() => go('details')} />}
        {displayStep === 'home' && <PreparationServiceEntries rentalMode={booking.rentalMode} renewalLoading={step === 'renewal' && !renewalReady} rentalActive={localRenewalDemoScenario(draft.orderId) ? true : undefined} onRenewal={() => { if (step === 'renewal') return; setRenewalReady(false); go('renewal'); }} onPickup={() => go('pickup')} onSelfservice={() => { window.location.assign('/selfservice.html?flow=selfservice'); }} draft={draft} hasPreparation={draft.bookingConfirmed || photos.length > 0 || Boolean(draft.identityConfirmed)} onContract={() => go('contract')} onNotices={() => go('notices')} onInspection={() => go('inspection')} onIdentity={() => {
          if (rejected && !app.identityExpired) { void editPreparation(); return; }
          go('drivers');
        }} phone={booking.storePhone} disabled={busy || Boolean(app.error)} />}
        {step === 'renewal' && <div className={renewalReady ? undefined : 'hidden'}><PreparationRenewal onNavigation={renewalNavigation} onEntryReady={() => setRenewalReady(true)} key={draft.orderId} booking={{ orderId: draft.orderId, confirmationNumber: booking.confirmationCode, brand: booking.brandCode, customerName: `${booking.first} ${booking.last}`, vehicleName: booking.vehicleAssignment.status === 'ASSIGNED' ? booking.vehicleAssignment.model : t('prepGroup'), plate: booking.vehicleAssignment.status === 'ASSIGNED' ? booking.vehicleAssignment.plate : undefined, returnAt: booking.returnAt, timezone: booking.timezone, phone: booking.storePhone }} onBack={() => go('home', true)} onReverify={() => go('auth', true)} /></div>}
        {step !== 'renewal' && step !== 'pickup' && step !== 'details' && step !== 'inspection' && step !== 'home' && step !== 'contract' && step !== 'notices' && (step !== 'drivers' || draft.documentReview?.state === 'APPROVED') && <PreparationReviewStatus draft={draft} disabled={busy || Boolean(app.error)}
          onEdit={!app.identityExpired && rejected && !(correction && step === 'drivers') ? () => { void editPreparation(); } : undefined} />}
        {languageReset && step !== 'renewal' && step !== 'inspection' && <Alert tone="info">{t('prepLanguageReset')}</Alert>}
        {displayStep === 'home' && <>
          {formError && <Alert tone="danger">{t(formError)}</Alert>}
          <button type="button" disabled={busy || app.loading} onClick={() => { void verifyAnotherOrder(); }} className="min-h-11 w-full text-customer-label text-customer-text-tertiary underline underline-offset-4 disabled:opacity-50">{t(submitting ? 'prepSaving' : 'prepSwitch')}</button>
        </>}
        {step === 'details' && <>
          <ReservationDetailsScreen embedded customerInfoFirst beforeBookingInfo={<PreparationTripVehicle orderId={draft.orderId} assignment={booking.vehicleAssignment} />} afterBookingInfo={<><PreparationExtras items={booking.extras} /><PreparationInsurance planKey={booking.insurancePlanKey} /></>} orderDetails={reservation} setView={() => go('home')} />
        </>}
        {step === 'pickup' && <PreparationPickupJourney key={draft.orderId} draft={draft} disabled={busy || Boolean(app.error)} onTermsChange={update} termsSaving={app.saving} termsSaveError={app.error === 'save'} onTermsRetry={app.retry} onBack={() => go('home', true)} onSaved={() => { setContractDirty(false); navigate('home', true); app.retry(); }} onDirty={setContractDirty} onBusy={setContractBusy} />}
        {step === 'contract' && <PreparationContractPage draft={draft} onTermsChange={update} termsSaving={app.saving} termsSaveError={app.error === 'save'} onTermsRetry={app.retry} onBack={() => go(serviceCompletionDestination(window.location.search), true)} onSaved={() => { setContractDirty(false); navigate(serviceCompletionDestination(window.location.search), true); app.retry(); }} onDirty={setContractDirty} onBusy={setContractBusy} onCompleteService={completeForContract} />}
        {step === 'inspection' && <PreparationInspectionPage orderId={draft.orderId} onBack={() => go(serviceCompletionDestination(window.location.search), true)} onContract={() => go('contract')} />}
        {step === 'booking' && <>
          <div className="overflow-hidden rounded-customer-card border border-customer-border bg-customer-card shadow-customer-card"><ReservationDetailsScreen embedded afterBookingInfo={<><PreparationExtras items={booking.extras} /><PreparationInsurance planKey={booking.insurancePlanKey} /></>} orderDetails={reservation} setView={() => go('home')} /></div>
          <PreparationStoreContact phone={booking.storePhone} />
          <label className="flex min-h-14 items-start gap-3 rounded-customer-card border border-customer-border bg-customer-card p-4 text-customer-body shadow-customer-card"><input type="checkbox" checked={draft.bookingConfirmed} disabled={readOnly || busy || app.lockedSteps.booking} onChange={event => update({ bookingConfirmed: event.target.checked })} className="mt-0.5 size-5 shrink-0 accent-[var(--customer-color-orange-500)]" />{t('prepBookingConfirm')}</label>
        </>}
        {step === 'drivers' && <p role="status" className="text-customer-body text-customer-text-secondary">{t(app.identityExpired ? 'prepIdentityExpired' : 'prepIdentityDeadline')}</p>}
        {step === 'drivers' && <PreparationDrivers drivers={draft.drivers} onChange={drivers => update({ drivers })} onRemove={app.removeDriver} clearAdditional={app.clearAdditionalDrivers} photos={photos} addPhotos={app.addPhotos} removePhoto={app.removePhoto} readOnly={app.identityExpired || readOnly || busy || app.lockedSteps.drivers} />}
        {(step === 'terms' || step === 'notices') && <><p className="text-customer-body text-customer-text-secondary">{t('prepTermsNote')}</p>{<PreparationTerms draft={draft} readOnly={busy} onChange={update} />}</>}
      </main>
      {showFooter && <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-customer-border bg-customer-card/95 shadow-customer-raised backdrop-blur-md">
        <div className="mx-auto max-w-customer-content px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3">
        {(formError || app.error === 'save') && <div role="alert" className="mb-3 text-customer-body text-customer-danger-text">{t(app.error === 'save' ? 'prepStorageError' : formError!)}{app.error === 'save' && <button onClick={app.retry} className="ml-2 min-h-11 text-customer-body-strong underline">{t('prepRetry')}</button>}</div>}
        <Button block loading={busy} disabled={busy || Boolean(app.error) || ((step === 'terms' || step === 'notices') && !done.terms) || (step === 'drivers' && !app.identityExpired && !readOnly && !canSubmitIdentity(draft, photos)) || (step === 'booking' && !done.booking)} onClick={() => { void next(); }}>{t(primaryLabel)}</Button>
        </div>
      </footer>}
    </>}
    {app.blockedPrerequisite && <PreparationSequenceDialog required={app.blockedPrerequisite} onDismiss={app.dismissPrerequisite} onContinue={() => go(app.blockedPrerequisite!)} />}
  </div>;
}
export function PickupPreparationApp() {
  return <LanguageProvider initialLang="zh-CN"><PreparationContent /></LanguageProvider>;
}
