import React, { useContext, useEffect, useRef, useState } from 'react';
import type { SignatureDrawing } from './signatureDrawing';
import { PreparationSignatureCanvas } from './PreparationSignatureCanvas';
import { PreparationSigningConfirmDialog } from './PreparationSigningConfirmDialog';
import { LanguageContext } from '../../../contexts/LanguageContext';
import type { PreparationDraft } from '../../../app/customer-journey/model';
import { preparationBooking } from '../../../app/customer-journey/bookingFixtures';
import { PREPARATION_CONTRACT_REVISION, preparationContractReady, preparationContractSigned, contractMissingServices } from '../../../app/customer-journey/servicePresentation';
import { savePreparationSignature } from '../../../app/customer-journey/storage';
import { loadInspectionReview } from './inspection/reviewStatus';
import { PreparationSigningChecklist } from './PreparationSigningChecklist';
import { useCustomerContractFile } from './useCustomerContractFile';
import { CustomerContractFileSection } from './CustomerContractFileSection';
import { PreparationTerms } from './PreparationTerms';
import { preparationTermsComplete } from './materials';
import type { CustomerContractFile } from '@shared/contracts/customerContractFile';
import { Button } from '../../../design/ui';

export function PreparationContractContent({ draft, onBack, onSaved, onBusy, onDirty, onCompleteService, onTermsChange, termsSaving = false, termsSaveError = false, onTermsRetry, inspectionConfirmed = false, inspectionAvailable = true, inspectionConfirmedAt, contractFile, contractUrl, onRefreshContract, onSigned, active = true }: {
  active?: boolean; onSigned?: () => void;
  onTermsChange?: (patch: Partial<PreparationDraft>) => void; termsSaving?: boolean; termsSaveError?: boolean; onTermsRetry?: () => void;
  contractFile?: CustomerContractFile | null; contractUrl?: string; onRefreshContract?: () => void;
  draft: PreparationDraft; onBack: () => void; onSaved: () => void; onBusy: (busy: boolean) => void; onDirty: (dirty: boolean) => void;
  onCompleteService?: (service: 'drivers' | 'notices' | 'inspection') => void;
  inspectionConfirmed?: boolean;
  inspectionAvailable?: boolean;
  inspectionConfirmedAt?: string;
}) {
  const { t, lang } = useContext(LanguageContext);
  const canvas = useRef<SignatureDrawing>(null);
  const saving = useRef(false);
  const [signed, setSigned] = useState(draft.contractSignatureSyncPending ? undefined : draft.contractSignature);
  const [hasStroke, setHasStroke] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const termsDraft = { ...draft, language: lang };
  const termsComplete = preparationTermsComplete(termsDraft);
  const fileReady = Boolean(contractFile?.orderId === draft.orderId && contractUrl);
  const complete = preparationContractSigned({ ...draft, contractSignature: signed, contractSignatureSyncPending: false });
  const booking = preparationBooking(draft.orderId);
  useEffect(() => {
    if (active && !complete && draft.language !== lang) onTermsChange?.({ language: lang });
  }, [active, complete, draft.language, lang, onTermsChange]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (hasStroke && !complete) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [hasStroke, complete]);
  async function submit() {
    if (!confirmOpen || !active || saving.current || complete || termsSaving || termsSaveError || !termsComplete || !canvas.current || canvas.current.isEmpty()) return;
    saving.current = true; setBusy(true); onBusy(true); setError(false);
    try {
      const signature = canvas.current.toDataURL('image/png');
      const record = { orderId: draft.orderId, revision: PREPARATION_CONTRACT_REVISION, signature, language: lang, signedAt: new Date().toISOString() };
      const saved = await savePreparationSignature(draft.orderId, record);
      setSigned(saved.contractSignature); onDirty(false); onSigned?.();
    } catch { setError(true); }
    finally { saving.current = false; setBusy(false); onBusy(false); setConfirmOpen(false); }
  }
  const back = () => { if (complete) onSaved(); else onBack(); };
  async function download() {
    if (!fileReady || downloading) return;
    setDownloading(true); setDownloadError(false);
    try {
      const response = contractFile!.blob ? null : await fetch(contractUrl!, { credentials: 'include' });
      if (response && !response.ok) throw new Error('DOWNLOAD_FAILED');
      const blob = contractFile!.blob ?? await response!.blob();
      if (blob.type !== 'application/pdf' || !blob.size) throw new Error('INVALID_PDF');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = contractFile!.fileName;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { setDownloadError(true); onRefreshContract?.(); }
    finally { setDownloading(false); }
  }
  if (!preparationContractReady(draft.orderId)) return <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
    <p className="text-customer-body text-customer-text-secondary">{t('prepContractUnavailable')}</p>
    <button type="button" onClick={onBack} className="mt-3 min-h-11 text-customer-label text-customer-brand-text">{t('prepBackHome')}</button>
  </section>;
  const currentInspectionConfirmed = inspectionAvailable && inspectionConfirmed;
  const missing = contractMissingServices(draft, currentInspectionConfirmed);
  if (!complete && !fileReady && missing.length) return <PreparationSigningChecklist draft={draft} inspectionConfirmed={currentInspectionConfirmed} inspectionAvailable={inspectionAvailable} inspectionConfirmedAt={inspectionConfirmedAt} onCompleteService={onCompleteService} onBack={onBack} />;
  return <div className="space-y-4 pb-64">
    {(complete || fileReady) && <CustomerContractFileSection file={fileReady ? contractFile : null} url={contractUrl} refresh={onRefreshContract} />}
    <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
      <h2 className="mb-3 text-customer-title">{t('prepContractInfo')}</h2>
      <dl className="space-y-3">{[
        [t('orderNumber'), draft.orderId], [t('mainDriver'), `${booking.first} ${booking.last}`],
        [t('carModel'), t('prepGroup')], [t('pickupTime'), `2026-11-01 10:00 (${t('prepJapanTime')})`],
        [t('returnTime'), `2026-11-04 10:00 (${t('prepJapanTime')})`], [t('pickupLocation'), t('prepStore')],
      ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-customer-border-subtle pb-2"><dt className="text-customer-label text-customer-text-tertiary">{label}</dt><dd className="break-words text-customer-body-strong">{value}</dd></div>)}</dl>
    </section>
    <PreparationTerms draft={termsDraft} readOnly={complete || fileReady || busy || termsSaving} onChange={patch => onTermsChange?.({ ...patch, language: lang })} />
    {complete ? <section className="rounded-customer-card border border-customer-success-border bg-customer-card p-4 shadow-customer-card" role="status">
      <h2 className="text-customer-title text-customer-success-text">{t('prepSignatureCompleted')}</h2>
      <p className="mt-2 text-customer-body text-customer-text-secondary tabular-nums">{new Date(signed!.signedAt).toLocaleString(lang)}</p>
      <img src={signed!.signature} alt={t('prepContractSignature')} className="mt-3 h-40 w-full object-contain" />
    </section> : fileReady ? null : <>
      <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
        <div className="flex items-center justify-between gap-2"><h2 className="text-customer-title">{t('prepContractSignature')}</h2><button type="button" disabled={busy} onClick={() => { canvas.current?.clear(); setHasStroke(false); onDirty(false); }} className="min-h-11 px-2 text-customer-label text-customer-brand-text disabled:text-customer-text-disabled">{t('prepContractClear')}</button></div>
        <div className={`rounded-customer-control border border-customer-border-strong ${busy ? 'pointer-events-none' : ''}`}>
        <PreparationSignatureCanvas canvasRef={canvas} active={active} disabled={busy} label={t('prepContractSignature')} onEnd={() => { const filled = !canvas.current!.isEmpty(); setHasStroke(filled); onDirty(filled); }} />
        </div>
      </section>
    </>}
    {confirmOpen && active && !complete && !fileReady && <PreparationSigningConfirmDialog submitting={busy} blocked={!hasStroke || !termsComplete || termsSaving || termsSaveError}
      onClose={() => { if (!saving.current) setConfirmOpen(false); }} onConfirm={() => { void submit(); }} />}
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-customer-border bg-customer-card/95 shadow-customer-raised backdrop-blur-md">
      <div className="mx-auto max-w-customer-content px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      {error && <p role="alert" className="mb-2 text-customer-body text-customer-danger-text">{t('prepContractSaveError')}</p>}
      {downloadError && <p role="alert" className="mb-2 text-customer-body text-customer-danger-text">{t('prepContractDownloadError')}</p>}
      {!complete && !fileReady && termsSaveError && <p role="alert" className="mb-2 text-customer-body text-customer-danger-text">{t('prepStorageError')}<button type="button" onClick={onTermsRetry} className="ml-2 min-h-11 text-customer-body-strong underline">{t('prepRetry')}</button></p>}
      {fileReady ? <><Button block loading={downloading} onClick={() => void download()}>{t(downloading ? 'prepLoading' : 'prepContractDownload')}</Button><Button block variant="text" onClick={back} className="mt-1">{t('prepBackHome')}</Button></> : <Button block loading={busy || termsSaving} disabled={busy || (!complete && (!hasStroke || !termsComplete || termsSaving || termsSaveError))} onClick={() => { if (complete) back(); else setConfirmOpen(true); }}>{t(complete ? 'prepBackHome' : busy || termsSaving ? 'prepSaving' : error ? 'prepContractRetry' : 'prepContractSubmit')}</Button>}
      </div>
    </footer>
  </div>;
}

export function PreparationContractPage(props: React.ComponentProps<typeof PreparationContractContent>) {
  const { t } = useContext(LanguageContext);
  const contract = useCustomerContractFile(props.draft.orderId);
  const fileProps = { contractFile: contract.file, contractUrl: contract.url, onRefreshContract: contract.refresh };
  const [state, setState] = useState<{ orderId: string; status: 'loading' | 'error' | 'ready'; confirmedAt?: string; available?: boolean }>({ orderId: props.draft.orderId, status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const orderId = props.draft.orderId;
    setState({ orderId, status: 'loading' });
    loadInspectionReview(orderId).then(value => { if (active) setState({ orderId, status: 'ready', available: value.status === 'ready', confirmedAt: value.status === 'ready' ? value.confirmation?.at : undefined }); }, () => { if (active) setState({ orderId, status: 'error' }); });
    return () => { active = false; };
  }, [props.draft.orderId, attempt]);
  if (contract.url || preparationContractSigned(props.draft) || !preparationContractReady(props.draft.orderId)) return <PreparationContractContent key={props.draft.orderId} {...props} {...fileProps} />;
  if (state.orderId !== props.draft.orderId || state.status === 'loading') return <p role="status" className="py-6 text-customer-body text-customer-text-secondary">{t('prepLoading')}</p>;
  if (state.status === 'error') return <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
    <p role="alert" className="text-customer-body text-customer-danger-text">{t('prepInspectionLoadError')}</p>
    <button type="button" onClick={() => setAttempt(value => value + 1)} className="min-h-11 text-customer-label text-customer-brand-text">{t('prepRetry')}</button>
  </section>;
  return <PreparationContractContent key={props.draft.orderId} {...props} {...fileProps} inspectionAvailable={Boolean(state.available)} inspectionConfirmed={Boolean(state.confirmedAt)} inspectionConfirmedAt={state.confirmedAt} />;
}
