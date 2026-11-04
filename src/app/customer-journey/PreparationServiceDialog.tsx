import React, { useContext, useEffect, useId, useRef } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';
import { Button } from '../../design/ui';

export function PreparationServiceDialogContent({ title, reason, onClose, onRetry }: {
  title: PreparationKey; reason: PreparationKey; onClose: () => void; onRetry?: () => void;
}) {
  const { t } = useContext(LanguageContext);
  return <>
    <h2 className="text-customer-title">{t(title)}</h2>
    <p className="mt-3 break-words text-customer-body text-customer-text-secondary">{t(reason)}</p>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      {onRetry && <Button variant="secondary" size="md" onClick={onRetry}>{t('prepRetry')}</Button>}
      <Button autoFocus size="md" onClick={onClose}>{t('prepInspectionIssueAcknowledge')}</Button>
    </div>
  </>;
}

export function PreparationServiceDialog(props: React.ComponentProps<typeof PreparationServiceDialogContent>) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { t } = useContext(LanguageContext);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} aria-label={t(props.title)} aria-describedby={id}
    onCancel={event => { event.preventDefault(); props.onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) props.onClose(); }}
    className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100vw_-_48px)] max-w-[320px] overflow-y-auto rounded-customer-card bg-customer-card p-5 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim">
    <div id={id}><PreparationServiceDialogContent {...props} /></div>
  </dialog>;
}
