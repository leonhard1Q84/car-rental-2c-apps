import React, { useContext, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { LanguageContext } from '../../../../contexts/LanguageContext';
import { Button } from '../../../../design/ui';

export function inspectionContactHref(phone?: string): string | undefined {
  const value = phone?.replace(/[\s()-]/g, '');
  return value && /^\+?\d{6,15}$/.test(value) ? `tel:${value}` : undefined;
}

export function InspectionIssueDialogContent({ onClose }: { phone?: string; onClose: () => void }) {
  const { t } = useContext(LanguageContext);
  return <>
    <div className="flex items-start gap-3">
      <MessageCircle size={24} aria-hidden="true" className="mt-1 shrink-0 text-customer-brand-text" />
      <h2 id="inspection-issue-title" className="min-w-0 flex-1 break-words text-customer-title">{t('prepInspectionIssueTitle')}</h2>
      <button type="button" onClick={onClose} aria-label={t('prepInspectionIssueClose')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-customer-control hover:bg-customer-inset focus-visible:outline-2 focus-visible:outline-customer-brand"><X size={20} aria-hidden="true" /></button>
    </div>
    <p id="inspection-issue-description" className="mt-3 break-words text-customer-body text-customer-text-secondary">{t('prepInspectionIssueDescription')}</p>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <Button autoFocus size="md" onClick={onClose}>{t('prepInspectionIssueAcknowledge')}</Button>
    </div>
  </>;
}

export function InspectionIssueDialog({ phone, onClose }: { phone?: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
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
  return <dialog ref={dialog} aria-labelledby="inspection-issue-title" aria-describedby="inspection-issue-description"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100vw_-_48px)] max-w-[360px] overflow-y-auto rounded-customer-card bg-customer-card p-5 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim">
    <InspectionIssueDialogContent phone={phone} onClose={onClose} />
  </dialog>;
}
