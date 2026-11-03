import React, { useContext, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { LanguageContext } from '../../../contexts/LanguageContext';

export function inspectionContactHref(phone?: string): string | undefined {
  const value = phone?.replace(/[\s()-]/g, '');
  return value && /^\+?\d{6,15}$/.test(value) ? `tel:${value}` : undefined;
}

export function InspectionIssueDialogContent({ onClose }: { phone?: string; onClose: () => void }) {
  const { t } = useContext(LanguageContext);
  return <>
    <div className="flex items-start gap-3">
      <MessageCircle size={24} aria-hidden="true" className="mt-1 shrink-0 text-primary-dark" />
      <h2 id="inspection-issue-title" className="min-w-0 flex-1 break-words text-base font-semibold">{t('prepInspectionIssueTitle')}</h2>
      <button type="button" onClick={onClose} aria-label={t('prepInspectionIssueClose')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary"><X size={20} aria-hidden="true" /></button>
    </div>
    <p id="inspection-issue-description" className="mt-3 break-words text-sm leading-6 text-gray-600">{t('prepInspectionIssueDescription')}</p>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button type="button" autoFocus onClick={onClose} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-primary">{t('prepInspectionIssueAcknowledge')}</button>
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
    className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100vw_-_48px)] max-w-[360px] overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/50">
    <InspectionIssueDialogContent phone={phone} onClose={onClose} />
  </dialog>;
}
