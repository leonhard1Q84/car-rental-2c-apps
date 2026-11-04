import { preparationBookings } from './bookingFixtures';
import type { PreparationDraft, Step } from './model';
import type { PreparationKey } from '../../i18n/preparation';

const pageTitles: Record<Step, PreparationKey | 'myRentalTitle'> = {
  home: 'myRentalTitle', auth: 'prepServiceTitle', booking: 'prepBooking',
  drivers: 'prepIdentityTileTitle', documents: 'prepIdentityTileTitle',
  pickup: 'prepPickupTileTitle', inspection: 'prepOnlineInspection',
  contract: 'prepContractTitle', details: 'prepTripDetails',
  terms: 'prepTerms', notices: 'prepNoticesTitle', renewal: 'prepRenewal',
};

export function preparationPageTitleKey(step: Step) { return pageTitles[step]; }


export function contractMissingServices(draft: PreparationDraft, inspectionConfirmed = false): Array<'drivers' | 'notices' | 'inspection'> {
  if (preparationContractSigned(draft)) return [];
  const missing: Array<'drivers' | 'notices' | 'inspection'> = [];
  if (!inspectionConfirmed) missing.push('inspection');
  return missing;
}

export const PREPARATION_CONTRACT_REVISION = 'demo-contract-v1';
export function preparationContractReady(orderId: string) { return preparationBookings.some(booking => booking.orderId === orderId); }
export function preparationContractSigned(draft: PreparationDraft) {
  const r = draft.contractSignature;
  return Boolean(!draft.contractSignatureSyncPending && r && r.orderId === draft.orderId && r.revision === PREPARATION_CONTRACT_REVISION && r.signedAt && r.signature.startsWith('data:image/png'));
}

export function identityServicePresentation(draft: PreparationDraft, hasPreparation: boolean) {
  if (draft.documentReview?.state === 'REJECTED') return { status: 'prepServiceNeedsUpdate', action: 'prepReviewModify', tone: 'red' } as const;
  if (draft.submittedAt) return draft.documentReview?.state === 'APPROVED'
    ? { status: 'prepServiceApproved', action: 'prepServiceViewResult', tone: 'green' } as const
    : { status: 'prepSubmitted', action: 'prepServiceViewSubmitted', tone: 'submitted' } as const;
  return hasPreparation
    ? { status: 'prepServiceDraft', action: 'prepServiceContinue', tone: 'neutral' } as const
    : { status: 'prepServiceNotStarted', action: 'prepServiceStart', tone: 'neutral' } as const;
}

export function rentalServicesAvailable(orderId: string, file: { orderId: string; orderLifecycleStatus?: string } | null, verified = true) {
  return Boolean(verified && file?.orderId === orderId && file.orderLifecycleStatus === 'PICKED_UP');
}

export type PreparationRestrictedService = 'identity' | 'pickup' | 'selfservice' | 'renewal' | 'more';
export function preparationServiceBlockReason(service: PreparationRestrictedService, state: {
  busy: boolean; identityClosed: boolean; identityReason?: PreparationKey; pickupReady: boolean; rentalActive: boolean;
  pickupState: 'loading' | 'error' | 'empty' | 'ready'; rentalMode?: 'regular' | 'selfservice';
}): PreparationKey | undefined {
  if (state.busy) return 'prepServiceBusy';
  if (service === 'identity') return state.identityClosed ? state.identityReason ?? 'prepIdentityExpired' : undefined;
  if (service === 'renewal') return state.rentalActive ? undefined : 'prepRenewalWaitingHint';
  if (service === 'more') return 'prepMoreAppsPlanned';
  if (service === 'selfservice') return state.rentalMode === 'selfservice' ? undefined : 'prepSelfserviceOrderOnly';
  if (state.rentalMode === 'selfservice') return 'prepQuickPickupRegularOnly';
  if (state.pickupReady) return undefined;
  return state.pickupState === 'error' ? 'prepInspectionLoadError' : state.pickupState === 'loading' ? 'prepLoading' : 'prepPickupWaitingHint';
}
