import React, { useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { LanguageContext } from '../../../../contexts/LanguageContext';
import { Button } from '../../../../design/ui';

export function InspectionConfirmDialogContent({ submitting, onClose, onConfirm, sequential = false }: {
  submitting: boolean; onClose: () => void; onConfirm: () => void; sequential?: boolean;
}) {
  const { t } = useContext(LanguageContext);
  return <>
    <div className="flex items-start gap-3">
      <CheckCircle2 size={24} aria-hidden="true" className="mt-1 shrink-0 text-customer-brand-text" />
      <div className="min-w-0 flex-1"><h2 id="inspection-confirm-title" className="text-customer-title">{t('prepInspectionConfirmTitle')}</h2>
        <p id="inspection-confirm-description" className="mt-3 text-customer-body text-customer-text-secondary">{t('prepInspectionConfirmDescription')}</p></div>
      <button type="button" disabled={submitting} onClick={onClose} aria-label={t('prepInspectionIssueClose')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-customer-control hover:bg-customer-inset focus-visible:outline-2 focus-visible:outline-customer-brand disabled:text-customer-text-disabled"><X size={20} aria-hidden="true" /></button>
    </div>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <Button autoFocus variant="secondary" size="md" disabled={submitting} onClick={onClose}>{t('prepInspectionIssueReturn')}</Button>
      <Button size="md" disabled={submitting} loading={submitting} onClick={onConfirm}><span role={submitting ? 'status' : undefined}>{t(submitting ? 'prepSaving' : sequential ? 'prepPickupConfirmNext' : 'prepInspectionConfirmSubmit')}</span></Button>
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
    className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,448px)] max-w-md overflow-y-auto rounded-customer-card bg-customer-card p-5 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim">
    <InspectionConfirmDialogContent sequential={sequential} submitting={submitting} onClose={close} onConfirm={() => { void submit(); }} />
  </dialog>;
}
