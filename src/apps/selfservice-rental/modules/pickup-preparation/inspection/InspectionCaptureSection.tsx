import React, { useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, Clock3, Info, Loader2, MessageCircle } from 'lucide-react';
import type { PreparationKey } from '../../../i18n/preparation';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { InspectionCaptureSession, type CaptureBinding, type CaptureState } from './capture';
import { captureRepository } from './captureStorage';
import { InspectionPhotoImage, InspectionPhotoViewer } from './InspectionPhotos';
import { formatInspectionTime, type InspectionPhoto } from './model';
import { InspectionIssueDialog } from './InspectionIssueDialog';
import { InspectionConfirmDialog } from './InspectionConfirmDialog';
import { confirmInspectionAndContinue } from './sequentialConfirmation';
import { assertCurrentInspection, loadInspectionReview } from './reviewStatus';
import { confirmCustomerInspection, customerInspectionApiConfigured } from '@shared/services/customerInspectionApi';

// Historical customer photos stay readable; new photo capture is no longer part of this flow.
export function InspectionCaptureControls({ state, onConfirm, onRetry, onBack, onContract, phone, publishedAt, returnToContract = false, sequential = false, readyToConfirm = true, missingFields = [] }: {
  state: CaptureState; onConfirm: () => Promise<void> | void; onRetry: () => void; onBack: () => void;
  onContract?: () => void; phone?: string; publishedAt?: string | null; returnToContract?: boolean; sequential?: boolean; readyToConfirm?: boolean; missingFields?: string[];
}) {
  const { t } = useContext(LanguageContext);
  const fieldLabels: Record<string, PreparationKey> = {
    exterior: 'prepInspectionExterior', light: 'prepInspectionLights', tire: 'prepInspectionTires', interior: 'prepInspectionInterior',
    inspectionAndPaperChecklist: 'prepInspectionPhotoCertificate', keyStoragePhotos: 'prepInspectionKeyStorage',
    etcDevicePhotos: 'prepInspectionEtcPhotos', dashboardPhoto: 'prepInspectionMetrics', mileage: 'prepInspectionMileage', fuelLevel: 'prepInspectionFuel',
    actualDeliveryPlate: 'prepInspectionPlate', actualDeliveryModel: 'prepInspectionModel', inspectionPublication: 'prepInspectionVehicle',
  };
  const footer = useRef<HTMLElement>(null);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { record, loading, saving, error } = state;
  const confirmed = record.confirmation;
  const photosUpdatedAt = formatInspectionTime(publishedAt ?? null);
  const busy = loading || saving;
  const blocked = busy || Boolean(error);
  const selectedIndex = photos.findIndex(photo => photo.id === selectedId);
  const photoLabel = (index: number) => `${t('prepInspectionHistoricalPhotos')} · ${index + 1}`;
  useEffect(() => {
    const values = record.photos.map(photo => ({ id: photo.id, vehicleId: record.vehicleId, url: URL.createObjectURL(photo.blob) }));
    setPhotos(values);
    return () => values.forEach(photo => URL.revokeObjectURL(photo.url));
  }, [record.photos, record.vehicleId]);
  useLayoutEffect(() => {
    const element = footer.current;
    if (!element) return;
    const container = element.closest("main");
    if (!container) return;
    const measure = () => container.style.setProperty("--inspection-footer-space", `${element.getBoundingClientRect().height + 24}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); container.style.removeProperty("--inspection-footer-space"); };
  }, []);
  const errorKey = error === 'outdated' ? 'prepInspectionOutdated' : error === 'conflict' ? 'prepCaptureConflict'
    : error === 'load' ? 'prepInspectionReviewLoadError' : 'prepInspectionReviewSaveError';
  return <section aria-labelledby="inspection-review-title" data-inspection-review>
    <h2 id="inspection-review-title" className="sr-only">{t("prepInspectionReviewTitle")}</h2>
    <div data-inspection-review-hint className="flex items-start gap-2.5 border-l-2 border-primary/40 py-1 pl-3">
      {confirmed ? <CheckCircle2 size={18} aria-hidden="true" className="mt-1 shrink-0 text-primary-dark" /> : <Info size={18} aria-hidden="true" className="mt-1 shrink-0 text-primary-dark" />}
      <div className="min-w-0 flex-1">
        <p className="text-pretty break-words text-sm font-medium leading-6 text-gray-700">{t(confirmed ? 'prepInspectionReviewComplete' : !readyToConfirm ? 'prepInspectionPreparing' : 'prepInspectionReviewHint')}</p>
        {confirmed && <p className="mt-1 text-xs leading-5 text-gray-500">{t('prepCaptureConfirmedAt')}：{formatInspectionTime(confirmed.at)} ({t('prepJapanTime')})</p>}
      </div>
    </div>
    {photosUpdatedAt && <p data-inspection-photos-updated-at className="mt-2 flex items-start gap-2 pl-3 text-xs leading-5 text-gray-500">
      <Clock3 size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{t('prepInspectionPhotosUpdatedAt')}：<time dateTime={publishedAt!}>{photosUpdatedAt}</time>（{t('prepJapanTime')}）</span>
    </p>}
    {!confirmed && !readyToConfirm && missingFields.length > 0 && <ul className="mt-2 list-inside list-disc text-xs leading-5 text-gray-600">{missingFields.map(field => <li key={field}>{t(fieldLabels[field] ?? 'prepInspectionVehicle')}</li>)}</ul>}
    <p role="status" className="sr-only">{busy ? t(loading ? 'prepLoading' : 'prepSaving') : !error && confirmed ? t('prepCaptureSaved') : ''}</p>
    {photos.length > 0 && <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{t('prepInspectionHistoricalPhotos')}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo, index) => <InspectionPhotoImage key={photo.id} photo={photo} label={photoLabel(index)} onOpen={() => setSelectedId(photo.id)} />)}</div>
    </div>}
    <footer ref={footer} className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-gray-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
      {error && <div role="alert" className="mb-3 break-words text-sm leading-5 text-red-700"><p>{t(errorKey)}</p><button type="button" disabled={busy} onClick={onRetry} className="min-h-11 font-semibold underline disabled:opacity-50">{t(error === 'conflict' || error === 'outdated' ? 'prepCaptureReload' : 'prepRetry')}</button></div>}
      {!confirmed && <p className="mb-3 text-xs leading-5 text-gray-600">{t('prepCaptureStatement')}</p>}
      <button type="button" disabled={blocked || (!confirmed && !readyToConfirm)} onClick={confirmed ? sequential ? onContract : onBack : () => setConfirmOpen(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">{busy && <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" />}<span>{t(busy ? loading ? 'prepLoading' : 'prepSaving' : confirmed ? sequential ? 'prepContinueSigning' : returnToContract ? 'prepReturnSigning' : 'prepBackHome' : sequential ? 'prepPickupReviewNext' : 'prepCaptureConfirm')}</span></button>
      {!confirmed && <button type="button" disabled={busy} onClick={() => setIssueOpen(true)} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"><MessageCircle size={17} aria-hidden="true" />{t('prepInspectionIssue')}</button>}
      {confirmed && onContract && !sequential && <button type="button" disabled={blocked} onClick={onContract} className="mt-2 min-h-11 w-full text-sm font-semibold text-primary-dark disabled:opacity-50">{t('prepContinueSigning')}</button>}
    </footer>
    {confirmOpen && <InspectionConfirmDialog sequential={sequential} onClose={() => setConfirmOpen(false)} onConfirm={onConfirm} />}
    {issueOpen && <InspectionIssueDialog phone={phone} onClose={() => setIssueOpen(false)} />}
    {selectedIndex >= 0 && <InspectionPhotoViewer photo={photos[selectedIndex]} label={photoLabel(selectedIndex)} position={selectedIndex + 1} total={photos.length}
      onPrevious={() => setSelectedId(photos[Math.max(0, selectedIndex - 1)].id)} onNext={() => setSelectedId(photos[Math.min(photos.length - 1, selectedIndex + 1)].id)} onClose={() => setSelectedId(null)} />}
  </section>;
}

export const InspectionCaptureSection: React.FC<{ binding: CaptureBinding; publicationId?: string; readyToConfirm?: boolean; missingFields?: string[]; publishedAt?: string | null; onBack: () => void; onContract?: () => void; onReload: () => void; phone?: string; sequential?: boolean; onConfirmed?: () => Promise<void>; onBusy?: (busy: boolean) => void }> = ({ binding, publicationId, readyToConfirm, missingFields, publishedAt, onBack, onContract, onReload, phone, sequential, onConfirmed, onBusy }) => {
  const { t, lang } = useContext(LanguageContext);
  const [session] = useState(() => new InspectionCaptureSession(binding, customerInspectionApiConfigured() ? {
    ...captureRepository,
    async load(current) {
      const review = await loadInspectionReview(current.orderId);
      const record = await captureRepository.load(current);
      return review.status === 'ready' && review.confirmation
        ? { ...current, version: 1 as const, sequence: record?.sequence || 1, photos: record?.photos ?? [], confirmation: review.confirmation } : record;
    },
  } : captureRepository, assertCurrentInspection,
    customerInspectionApiConfigured() ? async (currentBinding, language, statement) => {
      if (!publicationId) throw new Error('PUBLICATION_NOT_FOUND');
      const result = await confirmCustomerInspection(currentBinding.orderId, publicationId, currentBinding.photoRevision ?? currentBinding.revision, { locale: language, declarationVersion: statement });
      return { at: result.confirmedAt, language, statement };
    } : undefined));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useEffect(() => { void session.load(); }, [session]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (session.hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; }
    };
    const leave = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (link && session.hasUnsavedChanges() && !window.confirm(t('prepCaptureLeave'))) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true); };
  }, [session, t]);
  const [continuationError, setContinuationError] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const confirming = useRef(false);
  async function confirmOrRetry(retry = false) {
    if (confirming.current) return;
    confirming.current = true; setContinuing(true);
    setContinuationError(false); onBusy?.(true);
    try {
      await confirmInspectionAndContinue(session, lang, t('prepCaptureStatement'), onConfirmed, retry);
    } catch { setContinuationError(true); }
    finally { confirming.current = false; setContinuing(false); onBusy?.(false); }
  }
  return <InspectionCaptureControls readyToConfirm={readyToConfirm} missingFields={missingFields} sequential={sequential} state={{ ...state, saving: state.saving || continuing, error: continuationError ? 'save' : state.error }} publishedAt={publishedAt}
    onConfirm={() => confirmOrRetry()} onRetry={() => { if (state.error === 'outdated') onReload(); else void confirmOrRetry(true); }}
    onBack={onBack} onContract={sequential ? () => { void confirmOrRetry(true); } : onContract} phone={phone} returnToContract={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('returnTo') === 'contract'} />;
};
