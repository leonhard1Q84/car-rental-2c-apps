import React, { useContext, useEffect, useId, useRef } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';

export function PreparationServiceDialogContent({ title, reason, onClose, onRetry }: {
  title: PreparationKey; reason: PreparationKey; onClose: () => void; onRetry?: () => void;
}) {
  const { t } = useContext(LanguageContext);
  return <>
    <h2 className="text-base font-semibold">{t(title)}</h2>
    <p className="mt-3 break-words text-sm leading-6 text-gray-600">{t(reason)}</p>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      {onRetry && <button type="button" onClick={onRetry} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">{t('prepRetry')}</button>}
      <button type="button" autoFocus onClick={onClose} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-primary">{t('prepInspectionIssueAcknowledge')}</button>
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
    className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100vw_-_48px)] max-w-[320px] overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/50">
    <div id={id}><PreparationServiceDialogContent {...props} /></div>
  </dialog>;
}
