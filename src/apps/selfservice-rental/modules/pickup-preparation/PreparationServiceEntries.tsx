import { usePublishedInspection } from './inspection/usePublishedInspection';
import { useCustomerContractFile } from './useCustomerContractFile';
import { identityDeadlinePassed } from './identityDeadline';
import { PREPARATION_ONLINE_IDENTITY_ENABLED } from './releaseScope';
import React, { useContext, useEffect, useId, useState } from 'react';
import { CalendarPlus, FileCheck2, KeyRound, MessageSquare, type LucideIcon } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { identityServicePresentation, rentalServicesAvailable } from './servicePresentation';
import type { PreparationDraft } from './model';
import { CUSTOMER_FEEDBACK_URL } from '../../config/feedback';
import { PreparationServiceDialog } from './PreparationServiceDialog';
import { preparationServiceBlockReason, type PreparationRestrictedService } from './servicePresentation';
import type { PreparationKey } from '../../i18n/preparation';
import { customerInspectionApiConfigured } from '@shared/services/customerInspectionApi';

interface ServiceEntriesProps {
  draft: PreparationDraft; hasPreparation: boolean; onIdentity: () => void; onInspection: () => void; onNotices: () => void;
  onPickup: () => void; onContract?: () => void; phone: string; disabled?: boolean; pickupReady?: boolean; rentalActive?: boolean; pickupState?: 'loading' | 'error' | 'empty' | 'ready'; onRetry?: () => void;
}

interface ServiceTileProps {
  service: string; title: string; icon: LucideIcon; disabled: boolean; describedBy?: string;
  label?: string; onClick?: () => void; href?: string; external?: boolean; onUnavailable?: () => void;
}

function ServiceTile({ service, title, icon: Icon, disabled, describedBy, label, onClick, href, external, onUnavailable }: ServiceTileProps) {
  const className = `flex min-h-24 w-full min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${disabled ? 'cursor-pointer text-gray-500 opacity-75 hover:bg-gray-50 active:bg-gray-100' : 'text-gray-900 hover:bg-gray-50 active:bg-gray-100'}`;
  const content = <>
    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary-dark'}`}><Icon size={24} aria-hidden="true" /></span>
    <span className="w-full break-words leading-5">{title}</span>
  </>;
  return <article data-preparation-service={service} className="min-w-0">
    {href && !disabled
      ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} aria-label={label} aria-describedby={describedBy} className={className}>{content}</a>
      : <button type="button" aria-haspopup={disabled ? 'dialog' : undefined} onClick={disabled ? onUnavailable : onClick} aria-label={label} aria-describedby={describedBy} className={className}>{content}</button>}
  </article>;
}

export function PreparationServiceEntries(props: ServiceEntriesProps) {
  const inspection = usePublishedInspection(props.draft.orderId);
  const contract = useCustomerContractFile(props.draft.orderId);
  return <PreparationServiceEntriesContent {...props} pickupReady={inspection.state.status === 'ready'} pickupState={inspection.state.status} onRetry={inspection.retry} rentalActive={rentalServicesAvailable(props.draft.orderId, contract.file, contract.verified)} />;
}

export function PreparationServiceEntriesContent({ draft, hasPreparation, onIdentity, onPickup, phone, disabled = false, pickupReady = false, rentalActive = false, pickupState = 'empty', onRetry }: ServiceEntriesProps) {
  const { t } = useContext(LanguageContext);
  const id = useId();
  const [opened, setOpened] = useState<{ orderId: string; service: PreparationRestrictedService } | null>(null);
  const expired = identityDeadlinePassed(draft.orderId) && !draft.submittedAt;
  const identityDemoClosed = !customerInspectionApiConfigured() && draft.orderId === 'ORD-20260319-012' && !draft.submittedAt;
  const identityReason: PreparationKey = identityDemoClosed ? 'prepIdentityDemoClosed' : 'prepIdentityExpired';
  const blockState = { busy: disabled, identityClosed: expired || identityDemoClosed, identityReason, pickupReady, rentalActive, pickupState };
  const blockReason = opened && opened.orderId === draft.orderId ? preparationServiceBlockReason(opened.service, blockState) : undefined;
  useEffect(() => { if (opened && !blockReason) setOpened(null); }, [blockReason, opened]);
  const dialogTitles: Record<PreparationRestrictedService, PreparationKey> = { identity: 'prepIdentityTileTitle', pickup: 'prepPickupTileTitle', renewal: 'prepRenewal' };
  const identity = identityServicePresentation(draft, hasPreparation);
  const rejected = draft.documentReview?.state === 'REJECTED';
  const identityDisabled = disabled || expired || identityDemoClosed;
  const identityStatus = t(identityDisabled && !disabled ? 'prepIdentityClosed' : identity.status);
  const identityAction = t(identityDisabled && !disabled ? 'prepIdentityClosed' : identity.action);
  const identityNote = `${id}-identity`;
  const showIdentityNote = PREPARATION_ONLINE_IDENTITY_ENABLED && Boolean(expired || hasPreparation || draft.submittedAt || rejected);
  const showNotes = showIdentityNote;
  return <section aria-labelledby="prep-services-title">
    <h2 id="prep-services-title" className="mb-3 px-1 font-bold text-gray-900">{t('prepSelfServices')}</h2>
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,5.5rem),1fr))] items-start gap-x-2 gap-y-3">
        {PREPARATION_ONLINE_IDENTITY_ENABLED && <ServiceTile service="identity" title={t('prepIdentityTileTitle')} icon={FileCheck2} disabled={identityDisabled} onClick={onIdentity} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'identity' })} describedBy={showIdentityNote ? identityNote : undefined} label={`${t('prepIdentityTileTitle')} · ${identityStatus} · ${identityAction}`} />}
        <ServiceTile service="pickup" title={t('prepPickupTileTitle')} icon={KeyRound} disabled={disabled || !pickupReady} onClick={onPickup} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'pickup' })} />
        <ServiceTile service="renewal" title={t('prepRenewal')} icon={CalendarPlus} disabled={disabled || !rentalActive} href={`tel:${phone.replace(/\s+/g, '')}`} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'renewal' })} label={`${t('prepRenewal')} · ${t('prepCallStore')} · ${phone}`} />
        <ServiceTile service="feedback" title={t('prepFeedbackTitle')} icon={MessageSquare} disabled={false} href={CUSTOMER_FEEDBACK_URL} external />
      </div>
    </div>
    {showNotes && <div className="mt-3 space-y-2 px-1 text-xs leading-5 text-gray-500" aria-live="polite">
      {showIdentityNote && <div id={identityNote}>
        {(hasPreparation || draft.submittedAt || rejected) && <p className={rejected ? 'font-medium text-red-800' : 'font-medium text-gray-600'}>{t('prepIdentityTileTitle')} · {identityStatus}</p>}
        {expired && <p>{t('prepIdentityExpired')}</p>}
        {rejected && <p className="break-words text-red-800">{draft.documentReview?.rejectionReason?.trim() || t(draft.documentReview?.rejectionReasonKey ?? 'prepReviewMissingReason')}</p>}
      </div>}
    </div>}
    {opened && blockReason && <PreparationServiceDialog title={dialogTitles[opened.service]} reason={blockReason} onClose={() => setOpened(null)} onRetry={opened.service === 'pickup' && blockReason === 'prepInspectionLoadError' ? () => { setOpened(null); onRetry?.(); } : undefined} />}
  </section>;
}
