import React, { useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { Button } from '../../../design/ui';

interface Props {
  submitting: boolean;
  blocked: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PreparationSigningConfirmContent({ submitting, blocked, onClose, onConfirm }: Props) {
  const { t } = useContext(LanguageContext);
  return <>
    <h2 id="signing-confirm-title" className="text-customer-title">{t('prepSigningConfirmTitle')}</h2>
    <p id="signing-confirm-description" className="mt-3 text-customer-body text-customer-text-secondary">{t('prepSigningConfirmDescription')}</p>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <Button autoFocus variant="secondary" size="md" disabled={submitting} onClick={onClose}>{t('prepSigningConfirmBack')}</Button>
      <Button size="md" disabled={submitting || blocked} loading={submitting} onClick={onConfirm}>
        <span role={submitting ? 'status' : undefined}>{t(submitting ? 'prepSaving' : 'prepSigningConfirmSubmit')}</span>
      </Button>
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
    className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,448px)] max-w-md overflow-y-auto rounded-customer-card bg-customer-card p-5 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim">
    <PreparationSigningConfirmContent {...props} />
  </dialog>;
}
