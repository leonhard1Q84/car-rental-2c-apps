import React, { useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationPrerequisite } from './stepAdmission';
import { Button } from '../../design/ui';

export function PreparationSequenceDialog({ required, onContinue, onDismiss }: { required: PreparationPrerequisite; onContinue: () => void; onDismiss: () => void }) {
  const { t } = useContext(LanguageContext);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={dialogRef} aria-labelledby="prep-sequence-title" aria-describedby="prep-sequence-hint" onCancel={event => { event.preventDefault(); onDismiss(); }} onClick={event => { if (event.target === event.currentTarget) onDismiss(); }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-customer-card border-0 bg-customer-card p-0 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim">
    <div className="p-5" onClick={event => event.stopPropagation()}>
      <h2 id="prep-sequence-title" className="text-customer-title">{t('prepSequenceTitle')}</h2>
      <p id="prep-sequence-hint" className="mt-3 text-customer-body text-customer-text-secondary">{t('prepSequenceHint').replace('{step}', t(required === 'booking' ? 'prepBooking' : 'prepIdentityTileTitle'))}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button autoFocus block onClick={onContinue}>{t(required === 'booking' ? 'prepGoBooking' : 'prepGoDrivers')}</Button>
        <Button variant="text" block onClick={onDismiss}>{t('prepSequenceDismiss')}</Button>
      </div>
    </div>
  </dialog>;
}
