import { CanonicalStatus, OnlineCheckinVerificationStatus } from './types';

export interface MockAccount {
  canonical_status: CanonicalStatus;
  online_checkin_verification_status: OnlineCheckinVerificationStatus;
  is_selfservice_eligible: boolean;
}

// Mock order scenarios (all require last name "Smith" in AuthScreen)
// DEMO         -> self-service order, approved, enters normal flow
// CANCEL01     -> cancelled order, blocked
// REGULAR01    -> regular rental order (not self-service), blocked
// NOT_ELIGIBLE -> alias for REGULAR01 (kept for backward compatibility)
// PENDING01 / REJECT01 -> should be handled in Online Check-In app, blocked here
export const MOCK_ACCOUNTS: Record<string, MockAccount> = {
  DEMO: {
    canonical_status: CanonicalStatus.CONFIRMED,
    online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
    is_selfservice_eligible: true,
  },
  CANCEL01: {
    canonical_status: CanonicalStatus.CANCELLED,
    online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
    is_selfservice_eligible: true,
  },
  REGULAR01: {
    canonical_status: CanonicalStatus.CONFIRMED,
    online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
    is_selfservice_eligible: false,
  },
  NOT_ELIGIBLE: {
    canonical_status: CanonicalStatus.CONFIRMED,
    online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
    is_selfservice_eligible: false,
  },
  PENDING01: {
    canonical_status: CanonicalStatus.CONFIRMED,
    online_checkin_verification_status: OnlineCheckinVerificationStatus.PENDING_REVIEW,
    is_selfservice_eligible: true,
  },
  REJECT01: {
    canonical_status: CanonicalStatus.CONFIRMED,
    online_checkin_verification_status: OnlineCheckinVerificationStatus.REJECTED,
    is_selfservice_eligible: true,
  },
};

export const VALID_ORDER_NOS = Object.keys(MOCK_ACCOUNTS);
