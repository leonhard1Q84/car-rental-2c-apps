import { usePublishedInspection } from '../selfservice-rental/pickup/inspection/usePublishedInspection';
import { useCustomerContractFile } from '../selfservice-rental/pickup/useCustomerContractFile';
import { identityDeadlinePassed } from '../online-checkin/identityDeadline';
import { PREPARATION_ONLINE_IDENTITY_ENABLED } from '../../app/customer-journey/releaseScope';
import React, { useContext, useEffect, useId, useState } from 'react';
import { CalendarPlus, CarFront, FileCheck2, Grid2X2, KeyRound, Loader2, MessageSquare, type LucideIcon } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { identityServicePresentation, rentalServicesAvailable } from '../../app/customer-journey/servicePresentation';
import type { PreparationDraft } from '../../app/customer-journey/model';
import { PreparationServiceDialog } from '../../app/customer-journey/PreparationServiceDialog';
import { preparationServiceBlockReason, type PreparationRestrictedService } from '../../app/customer-journey/servicePresentation';
import type { PreparationKey } from '../../i18n/preparation';
import { customerInspectionApiConfigured } from '@shared/services/customerInspectionApi';
import { CUSTOMER_FEEDBACK_URL } from '../../config/feedback';
import { showCustomerToast } from '../../design/ui';

interface ServiceEntriesProps {
  draft: PreparationDraft; hasPreparation: boolean; onIdentity: () => void; onInspection: () => void; onNotices: () => void;
  onPickup: () => void; onSelfservice?: () => void; onRenewal?: () => void; onContract?: () => void; phone: string; disabled?: boolean; renewalLoading?: boolean; pickupReady?: boolean; rentalActive?: boolean; rentalMode?: 'regular' | 'selfservice'; pickupState?: 'loading' | 'error' | 'empty' | 'ready'; onRetry?: () => void;
}

interface ServiceTileProps {
  service: string; title: string; icon: LucideIcon; disabled: boolean; describedBy?: string;
  label?: string; loading?: boolean; onClick?: () => void; href?: string; external?: boolean; onUnavailable?: () => void;
  badge?: React.ReactNode;
}

function ServiceTile({ service, title, icon: Icon, disabled, describedBy, label, loading = false, onClick, href, external, onUnavailable, badge }: ServiceTileProps) {
  const className = `flex min-h-24 w-full min-w-0 flex-col items-center gap-2 rounded-customer-inset px-1 py-2 text-center text-customer-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-customer-brand ${disabled ? 'cursor-pointer text-customer-text-tertiary hover:bg-customer-inset' : 'text-customer-text hover:bg-customer-inset'}`;
  const content = <>
    <span className="relative inline-flex">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-customer-inset ${disabled ? 'bg-customer-inset text-customer-text-disabled' : 'bg-customer-brand-subtle text-customer-brand-text'}`}>{loading ? <Loader2 size={24} className="animate-spin" aria-hidden="true" /> : <Icon size={24} aria-hidden="true" />}</span>
      {badge}
    </span>
    <span className="w-full break-words leading-5">{title}</span>
  </>;
  return <article data-preparation-service={service} className="min-w-0">
    {href && !disabled
      ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} aria-label={label} aria-describedby={describedBy} className={className}>{content}</a>
      : <button type="button" disabled={loading} aria-busy={loading || undefined} aria-haspopup={disabled ? 'dialog' : undefined} onClick={disabled ? onUnavailable : onClick} aria-label={label} aria-describedby={describedBy} className={className}>{content}</button>}
  </article>;
}

export function PreparationServiceEntries(props: ServiceEntriesProps) {
  const inspection = usePublishedInspection(props.draft.orderId);
  const contract = useCustomerContractFile(props.draft.orderId);
  return <PreparationServiceEntriesContent {...props} pickupReady={inspection.state.status === 'ready'} pickupState={inspection.state.status} onRetry={inspection.retry} rentalActive={props.rentalActive ?? rentalServicesAvailable(props.draft.orderId, contract.file, contract.verified)} />;
}

export function PreparationServiceEntriesContent({ draft, hasPreparation, onIdentity, onPickup, onSelfservice, onRenewal, phone, disabled = false, renewalLoading = false, pickupReady = false, rentalActive = false, rentalMode = 'regular', pickupState = 'empty', onRetry }: ServiceEntriesProps) {
  const { t } = useContext(LanguageContext);
  const id = useId();
  const [opened, setOpened] = useState<{ orderId: string; service: PreparationRestrictedService } | null>(null);
  const expired = identityDeadlinePassed(draft.orderId) && !draft.submittedAt;
  const identityDemoClosed = !customerInspectionApiConfigured() && draft.orderId === 'RC10014' && !draft.submittedAt;
  const identityReason: PreparationKey = identityDemoClosed ? 'prepIdentityDemoClosed' : 'prepIdentityExpired';
  const blockState = { busy: disabled, identityClosed: expired || identityDemoClosed, identityReason, pickupReady, rentalActive, pickupState, rentalMode };
  const blockReason = opened && opened.orderId === draft.orderId ? preparationServiceBlockReason(opened.service, blockState) : undefined;
  useEffect(() => { if (opened && !blockReason) setOpened(null); }, [blockReason, opened]);
  const dialogTitles: Record<PreparationRestrictedService, PreparationKey> = { identity: 'prepIdentityTileTitle', pickup: 'prepPickupTileTitle', selfservice: 'prepSelfserviceTitle', renewal: 'prepRenewal', more: 'prepMoreAppsTitle' };
  const identity = identityServicePresentation(draft, hasPreparation);
  const rejected = draft.documentReview?.state === 'REJECTED';
  const identityDisabled = disabled || expired || identityDemoClosed;
  const identityStatus = t(identityDisabled && !disabled ? 'prepIdentityClosed' : identity.status);
  const identityAction = t(identityDisabled && !disabled ? 'prepIdentityClosed' : identity.action);
  const identityNote = `${id}-identity`;

  const handleIdentityClick = () => {
    if (rejected) {
      const reason = draft.documentReview?.rejectionReason?.trim() || t(draft.documentReview?.rejectionReasonKey ?? 'prepReviewMissingReason');
      showCustomerToast(reason, 'danger');
    }
    onIdentity();
  };

  const identityBadge = rejected ? (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-customer-danger px-1 text-[10px] font-bold leading-none text-white shadow-2xs">
      {identityStatus}
    </span>
  ) : null;

  return <section aria-labelledby="prep-services-title">
    <h2 id="prep-services-title" className="mb-2 px-1 text-customer-label text-customer-text-secondary">{t('prepSelfServices')}</h2>
    <div className="rounded-customer-card border border-customer-border bg-customer-card p-3 shadow-customer-card">
      <div className="grid grid-cols-3 items-start gap-x-1.5 gap-y-3">
        {PREPARATION_ONLINE_IDENTITY_ENABLED && <ServiceTile service="identity" title={t('prepIdentityTileTitle')} icon={FileCheck2} disabled={identityDisabled} onClick={handleIdentityClick} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'identity' })} label={`${t('prepIdentityTileTitle')} · ${identityStatus} · ${identityAction}`} badge={identityBadge} />}
        <ServiceTile service="pickup" title={t('prepPickupTileTitle')} icon={CarFront} disabled={disabled || rentalMode !== 'regular' || !pickupReady} onClick={onPickup} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'pickup' })} />
        <ServiceTile service="selfservice" title={t('prepSelfserviceTitle')} icon={KeyRound} disabled={disabled || rentalMode !== 'selfservice'} onClick={onSelfservice} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'selfservice' })} />
        <ServiceTile service="renewal" title={t('prepRenewal')} icon={CalendarPlus} disabled={disabled || !rentalActive} loading={renewalLoading} onClick={onRenewal} onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'renewal' })} />
        <ServiceTile service="feedback" title={t('prepFeedbackTitle')} icon={MessageSquare} disabled={disabled} href={CUSTOMER_FEEDBACK_URL} external label={t('prepFeedbackAction')} onUnavailable={() => undefined} />
        <ServiceTile service="more" title={t('prepMoreAppsTitle')} icon={Grid2X2} disabled onUnavailable={() => setOpened({ orderId: draft.orderId, service: 'more' })} />
      </div>
    </div>
    {opened && blockReason && <PreparationServiceDialog title={dialogTitles[opened.service]} reason={blockReason} onClose={() => setOpened(null)} onRetry={opened.service === 'pickup' && blockReason === 'prepInspectionLoadError' ? () => { setOpened(null); onRetry?.(); } : undefined} />}
  </section>;
}
