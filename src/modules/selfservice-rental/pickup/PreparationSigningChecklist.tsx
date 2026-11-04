import React, { useContext } from 'react';
import { ArrowLeft, ArrowRight, Car, Check, FileSignature } from 'lucide-react';
import { LanguageContext } from '../../../contexts/LanguageContext';
import type { PreparationDraft } from '../../../app/customer-journey/model';
import { contractMissingServices } from '../../../app/customer-journey/servicePresentation';
import { formatInspectionTime } from './inspection/model';
import { Badge, BottomBar, Button, IconChip } from '../../../design/ui';

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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-customer-control border border-customer-brand-border bg-customer-brand-subtle text-customer-brand-text"><FileSignature size={25} aria-hidden="true" /></div>
        <div className="min-w-0"><h2 id="signing-checklist-title" className="text-customer-headline">{t('prepSigningChecklistTitle')}</h2><p className="mt-1 text-customer-caption text-customer-text-tertiary">{t('orderNumber')} · {draft.orderId}</p></div>
      </div>
    </section>
    <div className="space-y-3">{visibleServices.map(({ id, title, description, icon: Icon }) => {
      const completed = !missing.includes(id);
      const statusKey = completed ? 'prepCaptureConfirmed' : inspectionAvailable ? 'prepInspectionAwaitingReview' : 'prepInspectionPending';
      const actionKey = inspectionAvailable ? completed ? 'prepInspectionView' : 'prepInspectionStart' : 'prepViewInfo';
      return <article key={id} data-signing-service={id} className="overflow-hidden rounded-customer-card border border-customer-border bg-customer-card shadow-customer-card">
        <div className="flex items-start gap-3 p-4">
          <IconChip icon={Icon} tone={completed ? 'success' : 'brand'} className="size-10" />
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-customer-body-strong">{t(title)}</h3><Badge tone={completed ? 'success' : 'neutral'} icon={completed ? Check : undefined}>{t(statusKey)}</Badge></div>
            <p className="mt-2 text-customer-caption text-customer-text-secondary">{t(description)}</p>
            {id === 'inspection' && completed && inspectionConfirmedAt && <p className="mt-2 text-customer-caption text-customer-success-text">{t('prepCaptureConfirmedAt')}：{formatInspectionTime(inspectionConfirmedAt)} ({t('prepJapanTime')})</p>}
          </div>
        </div>
        <div className="flex justify-end border-t border-customer-border-subtle px-3"><button type="button" onClick={() => onCompleteService?.(id)} className="inline-flex min-h-11 max-w-full items-center justify-end gap-2 py-2 pl-3 text-customer-label text-customer-brand-text"><span className="min-w-0 break-words">{t(actionKey)}</span><ArrowRight size={16} className="shrink-0" aria-hidden="true" /></button></div>
      </article>;
    })}</div>
    <BottomBar>
      <Button variant="secondary" block icon={ArrowLeft} onClick={onBack}>{t('prepBackHome')}</Button>
    </BottomBar>
  </div>;
}
