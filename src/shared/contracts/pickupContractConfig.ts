export const RENTAL_TERMS_CONFIRMATION_ITEM_ID = 'rental_terms_acknowledgement';
export const RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID = 'rental_notes_acknowledgement';

export type PickupContractLocale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'th';

export type PickupLocalizedText = Partial<Record<PickupContractLocale, string>>;

export type PickupContractRequirementPolicy = 'NOT_COLLECTED' | 'OPTIONAL' | 'REQUIRED';

export type PickupContractConfigCondition =
  | 'FOREIGN_CUSTOMER'
  | 'ETC_ADDON'
  | {
      code: 'FOREIGN_CUSTOMER' | 'ETC_ADDON';
    };

export interface PickupContractConfigItem {
  id: string;
  pickupVisible?: boolean;
  requirementPolicy?: PickupContractRequirementPolicy;
  maxItems?: number;
  condition?: PickupContractConfigCondition;
}

export interface PickupContractAttachment {
  id: string;
  title?: string;
  originalFileName?: string;
  displayOrder?: number;
  name?: string;
  url: string;
  mimeType?: string;
  uploadStatus?: 'UPLOADED' | 'FAILED';
}

export interface PickupContractMaterial {
  url?: string;
  linkLabel?: string;
  attachments: PickupContractAttachment[];
}

export type PickupContractMaterialGroup = 'RENTAL_CONTRACT' | 'RENTAL_GUIDELINES';

export interface PickupCustomerConfirmationConfigItem {
  id: string;
  title: PickupLocalizedText;
  description?: PickupLocalizedText;
  order: number;
  materialGroup?: PickupContractMaterialGroup;
}

export interface PickupContractConfigSnapshot {
  schemaVersion: number;
  revision: string;
  publishedAt: string;
  defaultLocale?: PickupContractLocale;
  vendorId?: string;
  storeId?: string;
  pickupItems?: PickupContractConfigItem[];
  vehicleEvidenceOrder?: string[];
  rentalContract: PickupContractMaterial;
  rentalGuidelines: PickupContractMaterial;
  customerConfirmationItems: PickupCustomerConfirmationConfigItem[];
}

export type PickupCustomerConfirmationState =
  | 'NO_CONFIGURED_CONFIRMATIONS'
  | 'PENDING_CONFIRMATIONS'
  | 'READY_FOR_SIGNATURE';

export interface PickupCustomerConfirmationResultItem {
  item_id: string;
  language?: PickupContractLocale;
  title: string;
  description?: string;
  order: number;
  confirmed: boolean;
  confirmed_at?: string;
}

export interface RentalMaterialConfirmation {
  itemId: string;
  materialGroup: PickupContractMaterialGroup;
  confirmationText: string;
  attachmentIds: string[];
  locale: string;
  confirmedAt: string;
}

export interface PickupContractConfirmationRecord {
  configRevision: string;
  configPublishedAt: string;
  confirmations: RentalMaterialConfirmation[];
}
