import type { FulfillmentStage } from './stage';

export interface FulfillmentOrderCore {
  orderId: string;
  feOrderNo: string;
  platformOrderNo?: string;
  canonicalStatus: string;
  fulfillmentStage: FulfillmentStage;
  isSelfService: boolean;
  pickupTimeLocal?: string;
  returnTimeLocal?: string;
  pickupStoreId?: string;
  returnStoreId?: string;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
}

export interface InspectionExceptionDraft {
  hasException: boolean;
  exceptionType?: string;
  description?: string;
  evidencePhotos: string[];
}

export interface RuntimeCapabilities {
  camera: boolean;
  location: boolean;
  upload: boolean;
  digitalKey: boolean;
  bridge: 'HOST_APP' | 'BROWSER';
}
