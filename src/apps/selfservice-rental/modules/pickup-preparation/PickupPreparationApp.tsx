import { identityDeadlinePassed } from './identityDeadline';
import React, { useContext, useState } from 'react';
import { ArrowLeft, Languages, Loader2 } from 'lucide-react';
import { LanguageContext, LanguageProvider } from '../../contexts/LanguageContext';
import ReservationDetailsScreen from '../../components/ReservationDetailsScreen';
import { PreparationContractPage } from './PreparationContractPage';
import { PreparationTerms } from './PreparationTerms';
import { PublishedPreparationTripSummary as PreparationTripSummary } from './PublishedPreparationTripSummary';
import { PreparationTripVehicle } from './PreparationTripVehicle';
import { PreparationServiceEntries } from './PreparationServiceEntries';
import { PreparationPickupJourney } from './PreparationPickupJourney';
import { PreparationInspectionPage } from './inspection/PreparationInspectionPage';
import type { PreparationKey, PreparationLanguage } from '../../i18n/preparation';
import { canSubmitIdentity, completion, type Step } from './model';
import { usePreparation } from './usePreparation';
import { PreparationVerification } from './PreparationVerification';
import { findPreparationBooking } from './verification';
import { preparationBooking } from './bookingFixtures';
import { PreparationStickyHeader } from './PreparationStickyHeader';
import './preparation.css';
import { PreparationStoreContact } from './PreparationStoreContact';
import { PreparationExtras } from './PreparationExtras';
import { PreparationInsurance } from './PreparationInsurance';
import { PreparationSequenceDialog } from './PreparationSequenceDialog';
import { PreparationDrivers } from './PreparationDrivers';
import { isPreparationCorrection } from './review';
import { PreparationReviewStatus } from './PreparationReviewStatus';
import { serviceCompletionDestination } from './serviceNavigation';
import { preparationPageTitleKey } from './servicePresentation';

const languages = [['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย']] as const;

function PreparationContent() {
  const { lang, setLang, t } = useContext(LanguageContext);
  const [contractDirty, setContractDirty] = useState(false);
  const [contractBusy, setContractBusy] = useState(false);
  const app = usePreparation(setLang, () => !contractBusy && (!contractDirty || window.confirm(t('prepContractLeave'))));
  const { draft, photos, navigate, update } = app;
  const booking = preparationBooking(draft.orderId);
  const step = app.step === 'documents' ? 'drivers' : app.step;
  const [formError, setFormError] = useState<PreparationKey | null>(null);
  const [authOrder, setAuthOrder] = useState('');
  const [authPhoneLast4, setAuthPhoneLast4] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [languageReset, setLanguageReset] = useState(false);
  const completed = completion(draft, photos);
  const done = { booking: completed.booking, drivers: completed.drivers && completed.documents, terms: completed.terms };
  const readOnly = Boolean(draft.submittedAt);
  const correction = isPreparationCorrection(draft);
  const rejected = draft.documentReview?.state === 'REJECTED';
  const busy = app.saving || submitting || contractBusy;
  const showFooter = ['booking', 'drivers', 'terms', 'notices'].includes(step);
  const title = t(preparationPageTitleKey(step));
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
  async function next() {
    setFormError(null);
    if (step === 'auth') {
      if (app.loading || app.error) return;
      const matched = findPreparationBooking(authOrder, authPhoneLast4);
      if (!matched) { setFormError('prepAuthError'); return; }
      setFormError(null); setLanguageReset(false);
      navigate('home', true, matched.orderId); return;
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
    rentalPeriod: { start: `2026-11-01 10:00 (${t('prepJapanTime')})`, end: `2026-11-04 10:00 (${t('prepJapanTime')})`, duration: '3' },
    pickupLocation: t('prepStore'), returnLocation: t('prepStore'), vehicle: { name: t('prepGroup') },
    customer: { name: `${booking.first} ${booking.last}`, phone: booking.phone, email: booking.email }
  };
  if (step === 'auth') return <PreparationVerification
    reference={authOrder} phoneLast4={authPhoneLast4}
    onReferenceChange={value => { setAuthOrder(value); setFormError(null); }}
    onPhoneLast4Change={value => { setAuthPhoneLast4(value); setFormError(null); }}
    onSubmit={() => { void next(); }} loading={app.loading} loadError={Boolean(app.error)}
    error={formError ? t(formError) : undefined} onRetry={app.retry}
  />;
  return <div className="pickup-preparation mx-auto min-h-dvh w-full max-w-md bg-gray-50 text-gray-900 shadow-sm">
    <PreparationStickyHeader>
    <header className="flex min-h-16 items-center gap-3 bg-primary px-4 py-3 text-white shadow-sm">
      <a href="/" aria-label={t(step === 'home' ? 'prepDirectory' : 'prepHome')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10" onClick={event => { if (step !== 'home') { event.preventDefault(); go(step === 'inspection' || step === 'contract' ? serviceCompletionDestination(window.location.search) : 'home', true); } }}><ArrowLeft size={21} /></a>
      <h1 className="min-w-0 flex-1 text-lg font-bold">{title}</h1>
      <label className="relative flex items-center"><Languages size={16} className="pointer-events-none absolute left-2" /><select aria-label={t('prepLanguage')} value={lang} disabled={busy || app.loading} onChange={event => languageChange(event.target.value as PreparationLanguage)} className="min-h-11 max-w-32 appearance-none rounded-lg bg-primary-dark py-2 pl-8 pr-2 text-sm text-white">{languages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
    </header>
    </PreparationStickyHeader>
    {app.loading ? <main className="flex min-h-80 flex-col items-center justify-center gap-3" role="status"><Loader2 className="animate-spin text-primary" /><p className="text-sm text-gray-600">{t('prepLoading')}</p></main>
      : app.error === 'load' ? <main className="p-5"><p role="alert" className="text-sm text-red-700">{t('prepLoadError')}</p><button onClick={app.retry} className="mt-4 min-h-11 rounded-lg bg-primary px-5 text-white">{t('prepRetry')}</button></main>
      : <>
      <main className={`space-y-5 px-4 pt-5 ${showFooter ? 'pb-44' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]'}`}>
        {step === 'home' && <PreparationTripSummary orderId={draft.orderId} reservation={reservation} vehicleModel="Toyota Yaris" vehicleAssignment={booking.vehicleAssignment} onDetails={() => go('details')} />}
        {step === 'home' && <PreparationServiceEntries onPickup={() => go('pickup')} draft={draft} hasPreparation={draft.bookingConfirmed || photos.length > 0 || Boolean(draft.identityConfirmed)} onContract={() => go('contract')} onNotices={() => go('notices')} onInspection={() => go('inspection')} onIdentity={() => {
          if (rejected && !app.identityExpired) { void editPreparation(); return; }
          go('drivers');
        }} phone={booking.storePhone} disabled={busy || Boolean(app.error)} />}
        {step !== 'pickup' && step !== 'details' && step !== 'inspection' && step !== 'home' && step !== 'contract' && step !== 'notices' && (step !== 'drivers' || draft.documentReview?.state === 'APPROVED') && <PreparationReviewStatus draft={draft} disabled={busy || Boolean(app.error)}
          onEdit={!app.identityExpired && rejected && !(correction && step === 'drivers') ? () => { void editPreparation(); } : undefined} />}
        {languageReset && step !== 'inspection' && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900" role="status">{t('prepLanguageReset')}</p>}
        {step === 'home' && <>
          <button type="button" onClick={() => go('auth')} className="min-h-11 w-full text-sm text-gray-500 underline underline-offset-4">{t('prepSwitch')}</button>
        </>}
        {step === 'details' && <>
          <ReservationDetailsScreen embedded customerInfoFirst beforeBookingInfo={<PreparationTripVehicle orderId={draft.orderId} assignment={booking.vehicleAssignment} />} afterBookingInfo={<><PreparationExtras items={booking.extras} /><PreparationInsurance planKey={booking.insurancePlanKey} /></>} orderDetails={reservation} setView={() => go('home')} />
        </>}
        {step === 'pickup' && <PreparationPickupJourney key={draft.orderId} draft={draft} disabled={busy || Boolean(app.error)} onTermsChange={update} termsSaving={app.saving} termsSaveError={app.error === 'save'} onTermsRetry={app.retry} onBack={() => go('home', true)} onSaved={() => { setContractDirty(false); navigate('home', true); app.retry(); }} onDirty={setContractDirty} onBusy={setContractBusy} />}
        {step === 'contract' && <PreparationContractPage draft={draft} onTermsChange={update} termsSaving={app.saving} termsSaveError={app.error === 'save'} onTermsRetry={app.retry} onBack={() => go(serviceCompletionDestination(window.location.search), true)} onSaved={() => { setContractDirty(false); navigate(serviceCompletionDestination(window.location.search), true); app.retry(); }} onDirty={setContractDirty} onBusy={setContractBusy} onCompleteService={completeForContract} />}
        {step === 'inspection' && <PreparationInspectionPage orderId={draft.orderId} onBack={() => go(serviceCompletionDestination(window.location.search), true)} onContract={() => go('contract')} />}
        {step === 'booking' && <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white"><ReservationDetailsScreen embedded afterBookingInfo={<><PreparationExtras items={booking.extras} /><PreparationInsurance planKey={booking.insurancePlanKey} /></>} orderDetails={reservation} setView={() => go('home')} /></div>
          <PreparationStoreContact phone={booking.storePhone} />
          <label className="flex min-h-14 items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm"><input type="checkbox" checked={draft.bookingConfirmed} disabled={readOnly || busy || app.lockedSteps.booking} onChange={event => update({ bookingConfirmed: event.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />{t('prepBookingConfirm')}</label>
        </>}
        {step === 'drivers' && <p role="status" className="text-sm leading-6 text-gray-600">{t(app.identityExpired ? 'prepIdentityExpired' : 'prepIdentityDeadline')}</p>}
        {step === 'drivers' && <PreparationDrivers drivers={draft.drivers} onChange={drivers => update({ drivers })} onRemove={app.removeDriver} clearAdditional={app.clearAdditionalDrivers} photos={photos} addPhotos={app.addPhotos} removePhoto={app.removePhoto} readOnly={app.identityExpired || readOnly || busy || app.lockedSteps.drivers} />}
        {(step === 'terms' || step === 'notices') && <><p className="text-sm leading-relaxed text-gray-600">{t('prepTermsNote')}</p>{<PreparationTerms draft={draft} readOnly={busy} onChange={update} />}</>}
      </main>
      {showFooter && <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-lg backdrop-blur">
        {(formError || app.error === 'save') && <div role="alert" className="mb-3 text-sm text-red-700">{t(app.error === 'save' ? 'prepStorageError' : formError!)}{app.error === 'save' && <button onClick={app.retry} className="ml-2 min-h-11 font-semibold underline">{t('prepRetry')}</button>}</div>}
        <button type="button" disabled={busy || Boolean(app.error) || ((step === 'terms' || step === 'notices') && !done.terms) || (step === 'drivers' && !app.identityExpired && !readOnly && !canSubmitIdentity(draft, photos)) || (step === 'booking' && !done.booking)} onClick={() => { void next(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy && <Loader2 size={18} className="animate-spin" />}{t(primaryLabel)}</button>
      </footer>}
    </>}
    {app.blockedPrerequisite && <PreparationSequenceDialog required={app.blockedPrerequisite} onDismiss={app.dismissPrerequisite} onContinue={() => go(app.blockedPrerequisite!)} />}
  </div>;
}
export function PickupPreparationApp() {
  return <LanguageProvider initialLang="zh-CN"><PreparationContent /></LanguageProvider>;
}
