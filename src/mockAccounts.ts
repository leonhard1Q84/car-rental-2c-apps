import { CanonicalStatus, OnlineCheckinVerificationStatus, type OnlineCheckinDriverSnapshot } from './types';
import { createDemoDriverSnapshot } from './modules/selfservice-rental/driver-photos/fixtures';

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
  phone: string;
  scenario: MockDemoScenario;
  account: MockAccount;
}

export const DEMO_ACCOUNT_PHONE = '+819012348888';

// Single source of truth for login validation, scenario routing, and the internal demo account list.
export const DEMO_ACCOUNTS: ReadonlyArray<MockDemoAccountDefinition> = [
  {
    orderNo: 'RC10015',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'NORMAL_FLOW',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'RC10016',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'CANCELLED',
    account: {
      canonical_status: CanonicalStatus.CANCELLED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'RC10017',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'REGULAR_RENTAL',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: false,
    },
  },
  {
    orderNo: 'RC10018',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'NOT_ELIGIBLE',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: false,
    },
  },
  {
    orderNo: 'RC10019',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'CHECKIN_NOT_STARTED',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.NOT_SUBMITTED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'RC10020',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'CHECKIN_PENDING',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.PENDING_REVIEW,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'RC10021',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'CHECKIN_REJECTED',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.REJECTED,
      is_selfservice_eligible: true,
    },
  },
  {
    orderNo: 'RC10022',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'INSPECTION_READY',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
      demo_stage: 'INSPECTION_READY',
    },
  },
  {
    orderNo: 'RC10023',
    phone: DEMO_ACCOUNT_PHONE,
    scenario: 'CONTRACT_READY',
    account: {
      canonical_status: CanonicalStatus.CONFIRMED,
      online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
      is_selfservice_eligible: true,
      demo_stage: 'CONTRACT_READY',
    },
  },
  {
    orderNo: 'RC10024',
    phone: DEMO_ACCOUNT_PHONE,
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
      ? createDemoDriverSnapshot(orderNo, orderNo === 'RC10015' || orderNo === 'RC10022')
      : undefined,
  }])
);

export const VALID_ORDER_NOS = DEMO_ACCOUNTS.map(({ orderNo }) => orderNo);

export const isValidMockCredentials = (orderNo: string, phoneLast4: string) => {
  const normalizedOrderNo = orderNo.trim().toUpperCase();
  const normalizedPhoneLast4 = phoneLast4.replace(/\D/g, '');
  if (!/^\d{4}$/.test(normalizedPhoneLast4)) return false;
  const demoAccount = DEMO_ACCOUNTS.find(
    ({ orderNo: candidateOrderNo }) => candidateOrderNo === normalizedOrderNo
  );

  return Boolean(demoAccount) && demoAccount.phone.replace(/\D/g, '').endsWith(normalizedPhoneLast4);
};

// Login-page demo scenario for previewing the first-time Online Check-in flow.
export const ONLINE_CHECKIN_NOT_STARTED_DEMO = {
  orderNo: 'RC10019',
  phoneLast4: '8888',
} as const;

export const RETURN_READY_DEMO = {
  orderNo: 'RC10024',
  phoneLast4: '8888',
} as const;

export const INSPECTION_READY_DEMO = {
  orderNo: 'RC10022',
  phoneLast4: '8888',
} as const;

export const CONTRACT_READY_DEMO = {
  orderNo: 'RC10023',
  phoneLast4: '8888',
} as const;
