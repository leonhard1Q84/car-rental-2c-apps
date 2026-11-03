import React, { useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationPrerequisite } from './stepAdmission';

export function PreparationSequenceDialog({ required, onContinue, onDismiss }: { required: PreparationPrerequisite; onContinue: () => void; onDismiss: () => void }) {
  const { t } = useContext(LanguageContext);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={dialogRef} aria-labelledby="prep-sequence-title" aria-describedby="prep-sequence-hint" onCancel={event => { event.preventDefault(); onDismiss(); }} onClick={event => { if (event.target === event.currentTarget) onDismiss(); }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border-0 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50">
    <div className="p-5" onClick={event => event.stopPropagation()}>
      <h2 id="prep-sequence-title" className="text-lg font-bold">{t('prepSequenceTitle')}</h2>
      <p id="prep-sequence-hint" className="mt-3 text-sm leading-relaxed text-gray-600">{t('prepSequenceHint').replace('{step}', t(required === 'booking' ? 'prepBooking' : 'prepIdentityTileTitle'))}</p>
      <div className="mt-5 flex flex-col gap-2">
        <button autoFocus type="button" onClick={onContinue} className="min-h-12 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark">{t(required === 'booking' ? 'prepGoBooking' : 'prepGoDrivers')}</button>
        <button type="button" onClick={onDismiss} className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">{t('prepSequenceDismiss')}</button>
      </div>
    </div>
  </dialog>;
}
