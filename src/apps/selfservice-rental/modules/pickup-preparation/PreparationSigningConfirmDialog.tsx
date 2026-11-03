import React, { useContext, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';

interface Props {
  submitting: boolean;
  blocked: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PreparationSigningConfirmContent({ submitting, blocked, onClose, onConfirm }: Props) {
  const { t } = useContext(LanguageContext);
  return <>
    <h2 id="signing-confirm-title" className="text-base font-semibold">{t('prepSigningConfirmTitle')}</h2>
    <p id="signing-confirm-description" className="mt-3 text-sm leading-6 text-gray-600">{t('prepSigningConfirmDescription')}</p>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button type="button" autoFocus disabled={submitting} onClick={onClose} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">{t('prepSigningConfirmBack')}</button>
      <button type="button" disabled={submitting || blocked} onClick={onConfirm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
        {submitting && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
        <span role={submitting ? 'status' : undefined}>{t(submitting ? 'prepSaving' : 'prepSigningConfirmSubmit')}</span>
      </button>
    </div>
  </>;
}

export function PreparationSigningConfirmDialog(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
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
  return <dialog ref={dialog} aria-labelledby="signing-confirm-title" aria-describedby="signing-confirm-description" aria-busy={props.submitting}
    onCancel={event => { event.preventDefault(); if (!props.submitting) props.onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !props.submitting) props.onClose(); }}
    className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,448px)] max-w-md overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/50">
    <PreparationSigningConfirmContent {...props} />
  </dialog>;
}
