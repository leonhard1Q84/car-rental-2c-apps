import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import { Camera, CheckCircle2, Info, Loader2, RefreshCw, X } from 'lucide-react';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { isDriverSnapshotValid, type DriverPhotoBinding } from './model';
import { useDriverPhotos } from './useDriverPhotos';
import { Alert, Card } from '../../../design/ui';

const PhotoDialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  const { t } = useContext(LanguageContext);
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); trigger?.focus(); };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-customer-card bg-customer-card p-5 shadow-customer-overlay backdrop:bg-customer-scrim">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 id={headingId} className="min-w-0 break-words pt-2 text-customer-title">{title}</h3>
        <button type="button" onClick={onClose} aria-label={t('driverPhotoClose')} className="flex min-h-11 min-w-11 items-center justify-center rounded-customer-control text-customer-text-secondary hover:bg-customer-inset"><X size={20} /></button>
      </div>
      {children}
      <button type="button" onClick={onClose} className="mt-4 min-h-11 w-full rounded-customer-control border border-customer-border-strong px-3 py-2 text-customer-label">{t('driverPhotoClose')}</button>
    </dialog>
  );
};

export const DriverPhotoSection: React.FC<{
  binding: DriverPhotoBinding;
  capture: ReturnType<typeof useDriverPhotos>;
}> = ({ binding, capture }) => {
  const { t } = useContext(LanguageContext);
  const [preview, setPreview] = useState<{ name: string; src: string } | null>(null);
  const [example, setExample] = useState(false);
  const inputPrefix = useId();
  const valid = isDriverSnapshotValid(binding.snapshot);
  const drivers = valid ? [...binding.snapshot.drivers].sort((a, b) => Number(b.role === 'primary') - Number(a.role === 'primary')) : [];
  const count = capture.photos.length;
  return (
    <Card as="section" aria-labelledby={`${inputPrefix}-heading`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 id={`${inputPrefix}-heading`} className="min-w-0 border-l-4 border-customer-brand pl-2 pt-1 text-customer-title">{t('driverPhotoTitle')}</h2>
        <button type="button" onClick={() => setExample(true)} className="min-h-11 shrink-0 rounded-full bg-customer-brand-subtle px-3 text-customer-caption font-semibold text-customer-brand-text">{t('driverPhotoExample')}</button>
      </div>
      <Alert tone="warning" role={false} className="mb-4">
        <p className="text-customer-body-strong">{t('driverPhotoCarryTitle')}</p>
        <p className="mt-1">{t('driverPhotoCarryBody')}</p>
      </Alert>
      <p className="text-customer-body text-customer-text-secondary">{t('driverPhotoIntro')}</p>
      {!valid ? <Alert tone="warning" className="mt-4">{t('driverPhotoRosterMissing')}</Alert>
        : capture.loading ? <p role="status" className="mt-4 flex items-center gap-2 text-customer-body text-customer-text-secondary"><Loader2 size={16} className="animate-spin" />{t('driverPhotoLoading')}</p>
          : capture.loadError ? <Alert tone="warning" className="mt-4" action={<button type="button" onClick={capture.reload} className="min-h-11 rounded-customer-control border border-customer-warning-border px-4 text-customer-label">{t('driverPhotoRetry')}</button>}>
            <p>{t('driverPhotoLoadError')}</p>
          </Alert> : <>
            <p className="mt-4 text-customer-body-strong" role="status">{t('driverPhotoProgress').replace('{count}', String(count)).replace('{total}', String(drivers.length))}</p>
            <div className="mt-2 divide-y divide-customer-border-subtle">
              {drivers.map((driver, index) => {
                const photo = capture.photos.find(item => item.id === driver.id);
                const uploading = capture.uploading.includes(driver.id);
                const error = capture.errors[driver.id];
                const inputId = `${inputPrefix}-${index}`;
                return <div key={driver.id} className="py-4" data-driver-photo-id={driver.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-customer-body-strong">{driver.name}</p>
                      <p className="mt-0.5 text-customer-caption text-customer-text-tertiary">{t(driver.role === 'primary' ? 'driverPhotoPrimary' : 'driverPhotoAdditional')}</p>
                    </div>
                    <p className={`flex shrink-0 items-center gap-1 text-customer-caption ${error ? 'text-customer-danger-text' : photo && !uploading ? 'text-customer-success-text' : 'text-customer-text-tertiary'}`} role="status">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : photo && !error ? <CheckCircle2 size={14} /> : null}
                      {t(uploading ? 'driverPhotoUploading' : error ? 'driverPhotoFailed' : photo ? 'driverPhotoUploaded' : 'driverPhotoPending')}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {photo && <button type="button" onClick={() => setPreview({ name: driver.name, src: photo.photo })} aria-label={`${driver.name} · ${t('driverPhotoView')}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-customer-inset border border-customer-border">
                      <img src={photo.photo} alt={`${driver.name} · ${t('driverPhotoTitle')}`} className="h-full w-full object-cover" />
                    </button>}
                    <label htmlFor={inputId} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-customer-inset border-2 border-dashed border-customer-brand/50 bg-customer-brand-subtle px-3 py-4 text-customer-label text-customer-brand-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-customer-brand ${uploading ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}>
                      <Camera size={20} aria-hidden="true" />{t(photo ? 'driverPhotoRetake' : 'driverPhotoTake')}
                      <input id={inputId} type="file" accept="image/*" capture="environment" disabled={uploading}
                        aria-label={`${driver.name} · ${t(photo ? 'driverPhotoRetake' : 'driverPhotoTake')}`}
                        className="sr-only" onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) void capture.capture(driver, file);
                          event.target.value = '';
                        }} />
                    </label>
                  </div>
                  {error && <div role="alert" className="mt-3 rounded-customer-inset bg-customer-danger-subtle p-3 text-customer-caption text-customer-danger-text">
                    <p>{t(error === 'invalid' ? 'driverPhotoInvalid' : 'driverPhotoSaveError')}</p>
                    {error === 'save' && <button type="button" disabled={uploading} onClick={() => void capture.capture(driver)} className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-customer-control px-2 text-customer-label"><RefreshCw size={14} />{t('driverPhotoRetry')}</button>}
                  </div>}
                </div>;
              })}
            </div>
          </>}
      <p className="mt-2 rounded bg-customer-inset p-2.5 text-center text-customer-caption text-customer-text-tertiary">{t('driverPhotoPrivacy')}</p>
      {preview && <PhotoDialog title={`${preview.name} · ${t('driverPhotoView')}`} onClose={() => setPreview(null)}>
        <img src={preview.src} alt={preview.name} className="max-h-[60dvh] w-full rounded-customer-inset object-contain" />
      </PhotoDialog>}
      {example && <PhotoDialog title={t('driverPhotoExample')} onClose={() => setExample(false)}>
        <svg viewBox="0 0 400 230" role="img" aria-label={t('driverPhotoTitle')} className="w-full rounded-customer-inset bg-customer-inset">
          <rect x="18" y="18" width="364" height="194" rx="14" fill="var(--customer-color-slate-200)" />
          <path d="M180 76h148l28 47v51H154v-51z" fill="var(--customer-color-slate-500)" />
          <path d="M192 87h122l17 32H176z" fill="var(--customer-color-slate-300)" />
          <rect x="214" y="145" width="84" height="27" rx="3" fill="var(--customer-color-card)" />
          <path d="M225 154h10m7 0h10m7 0h10m7 0h10m-61 9h61" stroke="var(--customer-color-slate-700)" strokeWidth="4" />
          <rect x="41" y="104" width="131" height="88" rx="8" fill="var(--customer-color-card)" stroke="var(--customer-color-orange-500)" strokeWidth="3" />
          <circle cx="69" cy="131" r="12" fill="var(--customer-color-slate-400)" /><path d="M50 166q19-39 38 0" fill="var(--customer-color-slate-400)" />
          <path d="M99 126h58m-58 16h43m-43 16h52m-97 22h100" stroke="var(--customer-color-slate-400)" strokeWidth="5" />
        </svg>
        <p className="mt-3 text-customer-body text-customer-text-secondary">{t('driverPhotoIntro')}</p>
      </PhotoDialog>}
    </Card>
  );
};
