
export enum CanonicalStatus {
  CREATED = 'CREATED',
  RESERVED = 'RESERVED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum OnlineCheckinVerificationStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type ResidencyStatus = 'local' | 'international';
export type ContractSignStatus = 'UNSIGNED' | 'SIGNED';
export type ContractAttachmentStatus = 'GENERATING' | 'READY';
export type ContractDocKey =
  | 'home_country_license_front'
  | 'home_country_license_back'
  | 'passport_front'
  | 'passport_back'
  | 'idp'
  | 'certified_translation'
  | 'entry_exit_records';

export interface DriverContractForm {
  first_name: string;
  last_name: string;
  residency_status: ResidencyStatus;
  documents: Record<ContractDocKey, File | null>;
  signatureDataUrl: string | null;
}

export interface ContractFormState {
  additional_driver_count: number;
  primary_driver: DriverContractForm;
  additional_drivers: DriverContractForm[];
  agreed: boolean;
}

export type InspectionVerificationStatus = 'idle' | 'pending_review' | 'approved' | 'rejected';
export type InspectionExteriorKey = 'front' | 'rear' | 'left' | 'right';
export type InspectionLightKey = 'front' | 'rear';
export type InspectionDecisionMode = 'skip' | 'report';

export interface InspectionBaselineSnapshot {
  exterior: Record<InspectionExteriorKey, string>;
  interior: {
    frontArea: string;
    rearArea: string;
  };
  damage: {
    issues: string[];
    image: string;
  };
}

export interface InspectionSubmissionRecord {
  submittedAt: string;
  vehicleStats: {
    mileage: number;
    fuel: number;
  };
  verificationStatus: InspectionVerificationStatus;
  verificationReviewReason?: string;
  verificationPhotos: string[];
  exteriorPhotos: Record<InspectionExteriorKey, string[]>;
  lightPhotos: Record<InspectionLightKey, string[]>;
  damageDescription: string;
  decisionMode?: InspectionDecisionMode;
  exceptionPhotos?: string[];
  exceptionNote?: string;
  termsAgreedAt?: string;
  termsVersion?: string;
  baselineSnapshot?: InspectionBaselineSnapshot;
}

export enum AppView {
  AUTH = 'AUTH',
  OVERVIEW = 'OVERVIEW',
  INSPECTION = 'INSPECTION',
  INSPECTION_DETAILS = 'INSPECTION_DETAILS',
  CONTRACT = 'CONTRACT',
  RESERVATION_DETAILS = 'RESERVATION_DETAILS',
  COMPLETION = 'COMPLETION',
  DEPOSIT = 'DEPOSIT',
  VEHICLE_STATUS = 'VEHICLE_STATUS',
  RETURN = 'RETURN',
  TRIP_ENDED = 'TRIP_ENDED',
  RETURN_DETAILS = 'RETURN_DETAILS',
  SERVICE_TERMS = 'SERVICE_TERMS',
  AUTH_BLOCKED_CANCELLED = 'AUTH_BLOCKED_CANCELLED',
  AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED = 'AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED',
  AUTH_BLOCKED_NOT_ELIGIBLE = 'AUTH_BLOCKED_NOT_ELIGIBLE',
}

export interface OrderDetails {
  orderNumber: string;
  confirmationCode: string;
  canonical_status: CanonicalStatus;
  online_checkin_verification_status: OnlineCheckinVerificationStatus;
  contract_sign_status: ContractSignStatus;
  rentalPeriod: {
    start: string;
    end: string;
    duration: string;
  };
  totalPrice: number; // Added total rental price
  vehicle: {
    name: string;
    image: string;
    licensePlate: string;
    state: string;
    color: string;
    fuelLevel: number; // percentage
    range: number; // km
    odometer: number; // km
    parkingSpot?: string;
    isLocked: boolean; // Add lock state
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  pickupLocation: string;
  pickupLocationDetails: {
    name: string;
    phone: string;
  };
  pickupInstructions: string; // Add explicit instruction field
  returnLocation: string;
  returnCoordinates?: { // Coordinates for the designated return parking spot
    lat: number;
    lng: number;
  };
  storeCoordinates?: { // Coordinates for the rental branch/store
    lat: number;
    lng: number;
  };
  customer: {
    name: string;
    phone: string;
    email?: string; // Added email field
  };
  contract: {
    number: string;
    date: string;
    attachment_status: ContractAttachmentStatus;
    attachment_url?: string;
    content?: string; // HTML content for the contract
  };
  deposit: {
    amount: number;
    currency: string;
    status: number; // 1=Pending, 2=RequiresAction, 3=Authorized, 4=Captured Pending, 5=Captured, 6=Canceled, 7=Expired
  };
  pickupStatus: string;
  preparationStatus: string;
  is_selfservice_eligible: boolean; // Add eligibility flag
  isIdentityVerified: boolean;
  isDepositPaid: boolean; // Computed as status IN (3, 4, 5)
  isRentalActive: boolean; // True after contract sign and user clicks "Start Use"
  isReturned: boolean; // True after return flow is complete
}

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
}

export interface OrderRating {
  nps_score: number;      // 1-10, required
  comment: string;        // current UI limit: 50 chars
  source: string;         // 'H5'
  tags?: string[];        // optional reason tags (reserved for future extension)
}
