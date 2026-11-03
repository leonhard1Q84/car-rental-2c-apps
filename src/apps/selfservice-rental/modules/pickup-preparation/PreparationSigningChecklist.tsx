import React, { useContext } from 'react';
import { ArrowLeft, ArrowRight, Car, Check, FileSignature } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationDraft } from './model';
import { contractMissingServices } from './servicePresentation';
import { formatInspectionTime } from './inspection/model';

export function PreparationSigningChecklist({ draft, inspectionConfirmed, inspectionAvailable = true, inspectionConfirmedAt, onCompleteService, onBack }: {
  draft: PreparationDraft; inspectionConfirmed: boolean; inspectionAvailable?: boolean; inspectionConfirmedAt?: string;
  onCompleteService?: (service: 'drivers' | 'notices' | 'inspection') => void; onBack: () => void;
}) {
  const { t } = useContext(LanguageContext);
  const missing = contractMissingServices(draft, inspectionAvailable && inspectionConfirmed);
  const services = [
    { id: 'inspection', title: 'prepOnlineInspection', description: 'prepSigningInspectionHint', icon: Car },
  ] as const;
  const visibleServices = services.filter(service => service.id === 'inspection');
  return <div className="space-y-5 pb-28">
    <section aria-labelledby="signing-checklist-title" className="pt-2">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary-dark"><FileSignature size={25} aria-hidden="true" /></div>
        <div className="min-w-0"><h2 id="signing-checklist-title" className="text-xl font-bold text-gray-900">{t('prepSigningChecklistTitle')}</h2><p className="mt-1 text-xs font-medium text-gray-500">{t('orderNumber')} · {draft.orderId}</p></div>
      </div>
    </section>
    <div className="space-y-3">{visibleServices.map(({ id, title, description, icon: Icon }) => {
      const completed = !missing.includes(id);
      const statusKey = completed ? 'prepCaptureConfirmed' : inspectionAvailable ? 'prepInspectionAwaitingReview' : 'prepInspectionPending';
      const actionKey = inspectionAvailable ? completed ? 'prepInspectionView' : 'prepInspectionStart' : 'prepViewInfo';
      return <article key={id} data-signing-service={id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 p-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-primary-dark'}`}><Icon size={21} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-gray-900">{t(title)}</h3><span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${completed ? 'border-emerald-600 text-emerald-700' : 'border-gray-400 text-gray-600'}`}>{completed && <Check size={12} aria-hidden="true" />}{t(statusKey)}</span></div>
            <p className="mt-2 text-xs leading-5 text-gray-500">{t(description)}</p>
            {id === 'inspection' && completed && inspectionConfirmedAt && <p className="mt-2 text-xs leading-5 text-emerald-700">{t('prepCaptureConfirmedAt')}：{formatInspectionTime(inspectionConfirmedAt)} ({t('prepJapanTime')})</p>}
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-3"><button type="button" onClick={() => onCompleteService?.(id)} className="inline-flex min-h-11 max-w-full items-center justify-end gap-2 py-2 pl-3 text-sm font-semibold text-primary-dark"><span className="min-w-0 break-words">{t(actionKey)}</span><ArrowRight size={16} className="shrink-0" aria-hidden="true" /></button></div>
      </article>;
    })}</div>
    <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-gray-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3"><button type="button" onClick={onBack} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"><ArrowLeft size={17} className="shrink-0" aria-hidden="true" />{t('prepBackHome')}</button></footer>
  </div>;
}
