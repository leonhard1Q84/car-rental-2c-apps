import React, { useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { LanguageContext } from '../../../contexts/LanguageContext';

export function InspectionConfirmDialogContent({ submitting, onClose, onConfirm, sequential = false }: {
  submitting: boolean; onClose: () => void; onConfirm: () => void; sequential?: boolean;
}) {
  const { t } = useContext(LanguageContext);
  return <>
    <div className="flex items-start gap-3">
      <CheckCircle2 size={24} aria-hidden="true" className="mt-1 shrink-0 text-primary-dark" />
      <div className="min-w-0 flex-1"><h2 id="inspection-confirm-title" className="text-base font-semibold">{t('prepInspectionConfirmTitle')}</h2>
        <p id="inspection-confirm-description" className="mt-3 text-sm leading-6 text-gray-600">{t('prepInspectionConfirmDescription')}</p></div>
      <button type="button" disabled={submitting} onClick={onClose} aria-label={t('prepInspectionIssueClose')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"><X size={20} aria-hidden="true" /></button>
    </div>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button type="button" autoFocus disabled={submitting} onClick={onClose} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">{t('prepInspectionIssueReturn')}</button>
      <button type="button" disabled={submitting} onClick={onConfirm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">{submitting && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}<span role={submitting ? 'status' : undefined}>{t(submitting ? 'prepSaving' : sequential ? 'prepPickupConfirmNext' : 'prepInspectionConfirmSubmit')}</span></button>
    </div>
  </>;
}

export function InspectionConfirmDialog({ onClose, onConfirm, sequential = false }: { onClose: () => void; onConfirm: () => Promise<void> | void; sequential?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const close = () => { if (!active.current) onClose(); };
  const submit = async () => {
    if (active.current) return;
    active.current = true;
    setSubmitting(true);
    try { await onConfirm(); }
    finally { active.current = false; onClose(); }
  };
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} aria-labelledby="inspection-confirm-title" aria-describedby="inspection-confirm-description" aria-busy={submitting}
    onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}
    className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,448px)] max-w-md overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/50">
    <InspectionConfirmDialogContent sequential={sequential} submitting={submitting} onClose={close} onConfirm={() => { void submit(); }} />
  </dialog>;
}
