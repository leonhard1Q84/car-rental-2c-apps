import React, { useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, X, Loader2, ChevronRight, FileImage } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { type Driver, type Photo } from './model';
import { DOCUMENT_SLOTS, type DocumentSlotDefinition } from './documentSlots';

const PhotoPreview: React.FC<{ photo: Photo; onRemove: () => void; readOnly: boolean }> = ({ photo, onRemove, readOnly }) => {
  const { t } = useContext(LanguageContext);
  const [url, setUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const value = URL.createObjectURL(photo.blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [photo.blob]);
  return <>
    <div className="relative w-24">
      <button type="button" onClick={() => setExpanded(true)} className="h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {url && <img src={url} alt={photo.name} className="h-full w-full object-cover" />}
      </button>
      {!readOnly && <button type="button" onClick={onRemove} aria-label={t('prepRemove')} className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow"><X size={16} /></button>}
    </div>
    {expanded && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={photo.name} onClick={() => setExpanded(false)} onKeyDown={event => { if (event.key === 'Escape') setExpanded(false); }}>
      <div className="w-full max-w-xl" onClick={event => event.stopPropagation()}>
        <button autoFocus type="button" onClick={() => setExpanded(false)} className="mb-3 flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-gray-800"><X size={18} />{t('prepBack')}</button>
        <img src={url} alt={photo.name} className="max-h-[75dvh] w-full object-contain" />
      </div>
    </div>}
  </>;
};

const DocumentSlot: React.FC<{
  driver: Driver; slot: DocumentSlotDefinition; photos: Photo[];
  addPhotos: (photos: Photo[]) => Promise<void>; removePhoto: (id: string) => void; readOnly: boolean;
}> = ({ driver, slot, photos, addPhotos, removePhoto, readOnly }) => {
  const { t } = useContext(LanguageContext);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = photos.filter(photo => photo.driverId === driver.id && photo.kind === slot.kind && photo.page === slot.page);
  const title = `${t(slot.title)}${slot.pageTitle ? ` · ${t(slot.pageTitle)}` : ''}`;
  async function choose(files: File[]) {
    if (files.length === 0) return;
    if (files.some(file => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
      setError(t('prepFileError')); return;
    }
    setError(''); setBusy(true);
    try {
      await addPhotos(files.map(file => ({ id: crypto.randomUUID(), name: file.name, driverId: driver.id, kind: slot.kind, page: slot.page, blob: file })));
    } catch { setError(t('prepStorageError')); }
    finally { setBusy(false); }
  }
  return <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
    {selected.length === 0 && !readOnly ? <button type="button" disabled={busy} aria-label={`${t('prepChoose')} · ${title}`} onClick={() => input.current?.click()} className="flex min-h-36 w-full flex-col items-center justify-center text-center disabled:opacity-50">
      {busy ? <Loader2 size={29} className="mb-3 animate-spin text-primary" /> : <ImagePlus size={29} strokeWidth={1.7} className="mb-3 text-primary" />}
      <span className="text-sm font-semibold text-gray-800">{t(slot.title)}<span className={slot.required ? 'ml-1 text-red-500' : 'ml-1 font-normal text-gray-500'}>{slot.required ? '*' : `(${t('prepOptional')})`}</span></span>
      {slot.pageTitle && <span className="mt-1 text-xs text-gray-600">{t(slot.pageTitle)}</span>}
      <span className="mt-2 max-w-xs text-xs leading-relaxed text-gray-400">{t(slot.hint)}</span>
    </button> : <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-gray-800">{title}</h4>{selected.length > 0 && <CheckCircle2 size={16} className="text-emerald-600" />}</div>
      {selected.length === 0
        ? <p className="text-sm text-gray-500">{t('prepNoImage')}</p>
        : <div className="flex flex-wrap gap-3">{selected.map(photo => <PhotoPreview key={photo.id} photo={photo} readOnly={readOnly || busy} onRemove={() => removePhoto(photo.id)} />)}</div>}
      {!readOnly && <button type="button" disabled={busy} onClick={() => input.current?.click()} className="mt-3 flex min-h-11 items-center gap-2 text-xs font-semibold text-primary">{busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}{t(busy ? 'prepSaving' : 'prepChoose')}</button>}
    </>}
    <input ref={input} type="file" accept="image/*" multiple aria-label={title} className="hidden" onChange={event => { void choose(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
};

export interface DriverDocumentsProps {
  driver: Driver; photos: Photo[]; addPhotos: (photos: Photo[]) => Promise<void>;
  removePhoto: (id: string) => void; readOnly: boolean;
}
export function DriverDocuments(props: DriverDocumentsProps) {
  const { t } = useContext(LanguageContext);
  const [examples, setExamples] = useState(false);
  const required = DOCUMENT_SLOTS.filter(slot => slot.required && (props.driver.mode === 'international' || slot.kind === 'licence'));
  const legacy = props.photos.filter(photo => photo.driverId === props.driver.id && !photo.page);
  return <div id={`driver-documents-${props.driver.id}`} className="mt-3 scroll-mt-36 space-y-3">
    <div className="flex justify-end"><button type="button" onClick={() => setExamples(true)} className="flex min-h-11 items-center gap-1 text-xs font-medium text-primary underline underline-offset-4">{t('prepExamples')}<ChevronRight size={14} /></button></div>
    {legacy.length > 0 && <section className="rounded-lg border border-amber-100 bg-amber-50 p-3"><h4 className="mb-3 text-xs text-amber-900">{t('prepUnclassified')}</h4><div className="flex flex-wrap gap-3">{legacy.map(photo => <PhotoPreview key={photo.id} photo={photo} readOnly={props.readOnly} onRemove={() => props.removePhoto(photo.id)} />)}</div></section>}
    {required.map(slot => <DocumentSlot key={`${slot.kind}-${slot.page}`} {...props} slot={slot} />)}
    <section className="rounded-lg border border-gray-200 bg-white p-3"><h3 className="mb-3 text-sm font-bold text-gray-800">{t('prepSupporting')}</h3><div className="space-y-3">{DOCUMENT_SLOTS.filter(slot => !slot.required).map(slot => <DocumentSlot key={slot.kind} {...props} slot={slot} />)}</div></section>
    {examples && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={t('prepExamples')} onClick={() => setExamples(false)} onKeyDown={event => { if (event.key === 'Escape') setExamples(false); }}>
      <div className="max-h-[85dvh] w-full max-w-md overflow-auto rounded-xl bg-white p-5" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="font-bold">{t('prepExamples')}</h2><button autoFocus type="button" aria-label={t('prepBack')} onClick={() => setExamples(false)} className="flex h-11 w-11 items-center justify-center"><X size={20} /></button></div>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">{t('prepExampleNotice')}</p>
        <div className="space-y-4">{required.map(slot => <section key={`${slot.kind}-${slot.page}`} className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex h-28 items-center justify-center gap-4 rounded-lg border border-dashed border-primary/30 bg-orange-50"><FileImage size={34} strokeWidth={1.5} className="text-primary" /><div className="space-y-2"><div className="h-2 w-24 rounded bg-orange-200" /><div className="h-2 w-16 rounded bg-orange-200" /><div className="h-2 w-20 rounded bg-orange-200" /></div></div>
          <h3 className="text-sm font-semibold">{t(slot.title)} · {slot.pageTitle && t(slot.pageTitle)}</h3><p className="mt-1 text-xs leading-relaxed text-gray-500">{t(slot.hint)}</p>
        </section>)}</div>
      </div>
    </div>}
  </div>;
}
