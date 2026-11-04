// Customer protocol types adapted from codex/rental-extension-connection@ee9635a.
export interface DriverInfo {
  surname: string;
  full_name: string;
  email: string;
  phone: string;
}
export interface SanitizedOrder {
  id: string;
  confirmation_number: string;
  brand_code: string;
  brand_name: string;
  primary_driver: DriverInfo;
  status: string;
  pickup_time: string;
  pickup_branch_id: string;
  pickup_branch_name: string;
  current_return_time: string;
  return_branch_id: string;
  return_branch_name: string;
  branch_timezone: string;
  booked_model_id: string;
  booked_model_name: string;
  actual_vehicle_id: string;
  actual_plate: string;
  actual_model_id: string;
  actual_model_name: string;
  currency: string;
  daily_base_rate: number;
  insurance: {
    code: string;
    name: string;
    daily_rate: number;
    can_extend: boolean;
    provider: string;
  } | null;
  addons: Array<{
    code: string;
    name: string;
    charge_type: string;
    unit_price: number;
    quantity: number;
  }>;
  deposit_status: string;
  atp_status: string;
  conflict_status: string;
  active_request_id: string | null;
}
export interface ExtensionRequest {
  id: string;
  order_id: string;
  confirmation_number: string;
  brand_code: string;
  created_at: string;
  expires_at: string;
  status: 'DRAFT' | 'AWAITING_CUSTOMER_CONFIRMATION' | 'PENDING_STORE_CONFIRMATION' | 'AWAITING_PAYMENT' | 'PROCESSING' | 'EFFECTIVE' | 'CLOSED';
  closed_reason?: string;
  extension_days: number;
  new_return_time: string;
  pricing_snapshot: {
    rental_days: number;
    base_daily_rate: number;
    markup_rate: number;
    markup_amount: number;
    total_rent: number;
    insurance_amount: number;
    addon_amount: number;
    grand_total: number;
    currency: string;
  };
  // Legacy signed agreements remain readable; new renewals do not collect signatures.
  agreement_draft?: {
    version: string;
    signed_at: string;
    signature_data_url: string;
    agreement_hash: string;
  };
  payment: {
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
    amount: number;
    currency: string;
    payment_intent_id: string;
    paid_at?: string;
  };
  schedule: {
    status: 'PENDING_DISPATCH' | 'LOCKED_CURRENT' | 'REASSIGNED' | 'REJECTED';
    vehicle_locked: boolean;
    target_vehicle_id: string;
  };
  guarantee: {
    status: string;
    deposit_id: string;
  };
  refund: {
    status: 'NOT_APPLICABLE' | 'PROCESSING' | 'ACCEPTED' | 'SETTLED' | 'FAILED';
    id?: string;
    version?: number;
    amount: number;
    currency?: string;
    reason?: string;
    provider_reference?: string;
    accepted_at?: string;
    settled_at?: string;
    failed_at?: string;
  };
}

export interface BrandConfig {
  code: string;
  name: string;
  logo_url: string;
  primary_color: string;
  support_phone: string;
  support_email: string;
  currency: string;
  extension_enabled: boolean;
}

export interface LookupSuccessResponse {
  code: 'SUCCESS';
  // The unified customer session token is reused via Authorization; no new token is issued.
  has_active_request: boolean;
  active_request_id: string | null;
  active_request: ExtensionRequest | null;
  order: SanitizedOrder;
  brand: BrandConfig;
  limits: {
    max_single_extension_days: number;
    current_return_time: string;
    branch_timezone: string;
    atp_status: string;
    daily_base_rate: number;
    currency: string;
  };
}

export interface LookupErrorResponse {
  code: 'PARAM_MISSING' | 'LOOKUP_MISMATCH' | 'LOOKUP_LOCKED' | 'BRAND_MISMATCH' | 'ORDER_NOT_ACTIVE' | 'INTERNAL_ERROR';
  message: string;
  remaining_seconds?: number;
  status?: string;
}
