import { CanonicalStatus, OnlineCheckinVerificationStatus, type OnlineCheckinDriverSnapshot } from './types';
import { createDemoDriverSnapshot } from './modules/driver-photos/fixtures';

export type MockDemoStage = 'INSPECTION_READY' | 'CONTRACT_READY' | 'RETURN_READY';
export type MockDemoScenario =
  | 'NORMAL_FLOW'
  | 'CANCELLED'
  | 'REGULAR_RENTAL'
  | 'NOT_ELIGIBLE'
  | 'CHECKIN_NOT_STARTED'
  | 'CHECKIN_PENDING'
  | 'CHECKIN_REJECTED'
  | 'INSPECTION_READY'
  | 'CONTRACT_READY'
  | 'RETURN_READY';

export interface MockAccount {
  onlineCheckinDrivers?: OnlineCheckinDriverSnapshot;
  canonical_status: CanonicalStatus;
  online_checkin_verification_status: OnlineCheckinVerificationStatus;
  is_selfservice_eligible: boolean;
  demo_stage?: MockDemoStage;
}

export interface MockDemoAccountDefinition {
  orderNo: string;
  lastName: string;
  scenario: MockDemoScenario;
  account: MockAccount;
}

export const DEMO_ACCOUNT_LAST_NAME = 'Smith';

// Single source of truth for login validation, scenario routing, and the internal demo account list.
export const DEMO_ACCOUNTS: ReadonlyArray<MockDemoAccountDefinition> = [
  {
    orderNo: 'DEMO',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'NORMAL_FLOW',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'CANCEL01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'CANCELLED',
    account: {
      canonical_status: CanonicalStatus.CANCELLED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'REGULAR01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'REGULAR_RENTAL',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: false,
    },
  },
  {
    orderNo: 'NOT_ELIGIBLE',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'NOT_ELIGIBLE',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: false,
    },
  },
  {
    orderNo: 'NOT_STARTED01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'CHECKIN_NOT_STARTED',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.NOT_SUBMITTED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'PENDING01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'CHECKIN_PENDING',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.PENDING_REVIEW,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'REJECT01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'CHECKIN_REJECTED',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.REJECTED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'INSPECT01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'INSPECTION_READY',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
      demo_stage: 'INSPECTION_READY',
    },
  },
  {
    orderNo: 'CONTRACT01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'CONTRACT_READY',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
      demo_stage: 'CONTRACT_READY',
    },
  },
  {
    orderNo: 'RETURN01',
    lastName: DEMO_ACCOUNT_LAST_NAME,
    scenario: 'RETURN_READY',
    account: {
      canonical_status: CanonicalStatus.PICKED_UP,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
      demo_stage: 'RETURN_READY',
    },
  },
];

export const MOCK_ACCOUNTS: Record<string, MockAccount> = Object.fromEntries(
  DEMO_ACCOUNTS.map(({ orderNo, account }) => [orderNo, {
    ...account,
    onlineCheckinDrivers: account.online_checkin_verification_status === OnlineCheckinVerificationStatus.APPROVED
      ? createDemoDriverSnapshot(orderNo, orderNo === 'DEMO' || orderNo === 'INSPECT01')
      : undefined,
  }])
);

export const VALID_ORDER_NOS = DEMO_ACCOUNTS.map(({ orderNo }) => orderNo);

export const isValidMockCredentials = (orderNo: string, lastName: string) => {
  const normalizedOrderNo = orderNo.trim().toUpperCase();
  const normalizedLastName = lastName.trim().toLowerCase();
  const demoAccount = DEMO_ACCOUNTS.find(
    ({ orderNo: candidateOrderNo }) => candidateOrderNo === normalizedOrderNo
  );

  return demoAccount?.lastName.toLowerCase() === normalizedLastName;
};

// Login-page demo scenario for previewing the first-time Online Check-in flow.
export const ONLINE_CHECKIN_NOT_STARTED_DEMO = {
  orderNo: 'NOT_STARTED01',
  lastName: DEMO_ACCOUNT_LAST_NAME,
} as const;

export const RETURN_READY_DEMO = {
  orderNo: 'RETURN01',
  lastName: DEMO_ACCOUNT_LAST_NAME,
} as const;

export const INSPECTION_READY_DEMO = {
  orderNo: 'INSPECT01',
  lastName: DEMO_ACCOUNT_LAST_NAME,
} as const;

export const CONTRACT_READY_DEMO = {
  orderNo: 'CONTRACT01',
  lastName: DEMO_ACCOUNT_LAST_NAME,
} as const;
