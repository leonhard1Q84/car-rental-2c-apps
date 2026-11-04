import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LanguageContext } from '../../../../contexts/LanguageContext';
import type { InspectionPhoto } from './model';
import { inspectionSwipeDirection } from './gallery';

export const InspectionPhotoImage: React.FC<{ photo: InspectionPhoto; label: string; onOpen?: () => void }> = ({ photo, label, onOpen }) => {
  const { t } = useContext(LanguageContext);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const url = attempt && !/^(blob:|data:)/.test(photo.url) ? `${photo.url}${photo.url.includes('?') ? '&' : '?'}retry=${attempt}` : photo.url;
  const image = <img key={attempt} src={url} alt={label} loading={onOpen ? 'lazy' : 'eager'} onError={() => setFailed(true)} className={onOpen ? 'h-full w-full object-contain' : 'mx-auto max-h-[70dvh] max-w-full object-contain'} />;
  if (failed) return <div className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-customer-inset border border-customer-border bg-customer-inset p-3 text-center text-customer-caption text-customer-text-secondary" role="status">
    <p>{label}</p><p>{t('prepInspectionImageError')}</p>
    <button type="button" className="min-h-11 rounded px-3 text-customer-label text-customer-brand-text focus-visible:outline-2 focus-visible:outline-customer-brand" onClick={() => { setAttempt(value => value + 1); setFailed(false); }}>{t('prepRetry')}</button>
  </div>;
  return onOpen ? <button type="button" onClick={onOpen} aria-label={label} className="block aspect-[4/3] min-h-11 w-full overflow-hidden rounded-customer-inset border border-customer-border bg-customer-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-customer-brand">{image}</button> : image;
};

export function InspectionPhotoViewer({ photo, label, position, total, onPrevious, onNext, onClose }: {
  photo: InspectionPhoto; label: string; position: number; total: number;
  onPrevious: () => void; onNext: () => void; onClose: () => void;
}) {
  const { t } = useContext(LanguageContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const gesture = useRef<{ x: number; y: number; identifier: number } | null>(null);
  const hasPrevious = position > 1;
  const hasNext = position < total;
  function move(direction: -1 | 1) {
    if (direction === -1 && hasPrevious) onPrevious();
    if (direction === 1 && hasNext) onNext();
  }
  function startSwipe(event: React.TouchEvent<HTMLDivElement>) {
    gesture.current = null;
    if (event.touches.length !== 1 || (event.target instanceof Element && event.target.closest('button'))) return;
    const touch = event.touches[0];
    gesture.current = { x: touch.clientX, y: touch.clientY, identifier: touch.identifier };
  }
  function endSwipe(event: React.TouchEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || event.touches.length || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    if (touch.identifier !== start.identifier) return;
    const direction = inspectionSwipeDirection(start, { x: touch.clientX, y: touch.clientY });
    if (direction) move(direction);
  }
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  const navigationClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-customer-border bg-customer-card text-customer-text hover:bg-customer-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-customer-brand disabled:cursor-not-allowed disabled:border-transparent disabled:bg-customer-fill-disabled disabled:text-customer-text-disabled';
  return <dialog ref={dialog} aria-labelledby="inspection-photo-title" onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
  }} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(94vw,960px)] max-w-none overflow-y-auto rounded-customer-card bg-customer-card p-0 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim">
    <div className="flex items-center gap-3 border-b border-customer-border-subtle px-4 py-2">
      <div className="min-w-0 flex-1" aria-live="polite" aria-atomic="true"><h2 id="inspection-photo-title" className="break-words text-customer-body-strong">{label}</h2><p className="mt-0.5 text-customer-caption tabular-nums text-customer-text-tertiary">{position} / {total}</p></div>
      <button type="button" autoFocus onClick={onClose} aria-label={t('prepInspectionClosePhoto')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-customer-control hover:bg-customer-inset focus-visible:outline-2 focus-visible:outline-customer-brand"><X size={20} aria-hidden="true" /></button>
    </div>
    <div className="flex items-center gap-1 p-2 sm:gap-3 sm:p-3 [touch-action:pan-y_pinch-zoom]" onTouchStart={startSwipe}
      onTouchMove={event => { if (event.touches.length !== 1) gesture.current = null; }} onTouchEnd={endSwipe} onTouchCancel={() => { gesture.current = null; }}>
      <button type="button" disabled={!hasPrevious} onClick={onPrevious} aria-label={t('prepInspectionPreviousPhoto')} title={t('prepInspectionPreviousPhoto')} className={navigationClass}><ChevronLeft size={22} aria-hidden="true" /></button>
      <div className="min-w-0 flex-1"><InspectionPhotoImage key={photo.id} photo={photo} label={label} /></div>
      <button type="button" disabled={!hasNext} onClick={onNext} aria-label={t('prepInspectionNextPhoto')} title={t('prepInspectionNextPhoto')} className={navigationClass}><ChevronRight size={22} aria-hidden="true" /></button>
    </div>
  </dialog>;
}
