/**
 * Stable cross-app contract for the Store Ops pickup inspection publication
 * and the Customer self-service review flow.
 *
 * The UI models intentionally remain app-local. These types describe only
 * the data exchanged by the eventual server adapter.
 */

export type CustomerInspectionPublicationStatus = 'PUBLISHED' | 'SUPERSEDED';
export type CustomerInspectionReviewStatus = 'NOT_VIEWED' | 'VIEWED' | 'CONFIRMED' | 'ISSUE_REPORTED' | 'RECONFIRM_REQUIRED';
export type CustomerInspectionIssueCategory = 'PHOTO_MISMATCH' | 'VEHICLE_CONDITION' | 'MISSING_PHOTO' | 'OTHER';
export type CustomerInspectionIssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type CustomerInspectionPhotoSource = 'CURRENT_PICKUP' | 'HISTORICAL_PICKUP';

/** Same-origin prototype notification; production correctness comes from the API read. */
export const customerInspectionReviewChannelName = 'ix-rental:customer-inspection:review';

export interface CustomerInspectionPhoto {
  photoId: string;
  mediaObjectId: string;
  vehicleId: string;
  category: string;
  capturedAt?: string | null;
  uploadedAt: string;
  source: CustomerInspectionPhotoSource;
  sourceRecordId?: string | null;
  signedUrl?: string;
}

export interface CustomerInspectionPhotoGroup {
  photos: CustomerInspectionPhoto[];
}

export interface CustomerInspectionPublication {
  publicationId: string;
  tenantId: string;
  merchantId: string;
  orderId: string;
  fulfillmentStoreId: string;
  vehicleId: string;
  vehiclePlateNo?: string;
  revision: number;
  reviewRevision?: string | number;
  readyToConfirm?: boolean;
  missingFields?: string[];
  status: CustomerInspectionPublicationStatus;
  publishedAt: string;
  publishedBy?: string;
  changeReason?: string;
  changedGroups?: string[];
  vehicle: { model: string; plate: string };
  groups: Record<string, CustomerInspectionPhotoGroup>;
  metrics: {
    energyType: 'FUEL' | 'BATTERY' | 'UNKNOWN';
    energyPercent?: number | null;
    mileage?: number | null;
    recordedAt?: string | null;
  };
}

export interface CustomerInspectionConfirmation {
  reviewRevision?: string | number;
  confirmationId: string;
  tenantId: string;
  orderId: string;
  vehicleId: string;
  publicationId: string;
  revision: number;
  confirmedAt: string;
  confirmedBy?: string;
  locale: string;
  declarationVersion: string;
  idempotencyKey: string;
}

export interface CustomerInspectionReview {
  reviewRevision?: string | number;
  status: CustomerInspectionReviewStatus;
  confirmedRevision?: number;
  confirmedAt?: string | null;
  confirmation?: CustomerInspectionConfirmation | null;
}

export interface CustomerInspectionCurrentResponse extends CustomerInspectionPublication {
  customerReview?: CustomerInspectionReview;
}

export interface CustomerInspectionIssue {
  issueId: string;
  tenantId: string;
  orderId: string;
  vehicleId: string;
  publicationId: string;
  revision: number;
  category: CustomerInspectionIssueCategory;
  description?: string;
  relatedPhotoIds: string[];
  createdAt: string;
  createdBy?: string;
  status: CustomerInspectionIssueStatus;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export interface CustomerSelfServiceSession {
  sessionId: string;
  expiresAt: string;
  orderId: string;
  tenantId: string;
  fulfillmentStoreId: string;
  vehicleId: string;
}

export interface CustomerOrderVerificationRequest {
  customerReference: string;
  phoneLast4: string;
}

export interface CustomerInspectionDraftRequest {
  draftId: string;
  snapshot: unknown;
  expectedRevision?: number | string | null;
}

export interface CustomerInspectionPublicationRequest {
  draftId: string;
  changeReason: string;
  changedGroups: string[];
}

export interface CustomerInspectionConfirmationRequest {
  locale: string;
  declarationVersion: string;
}

export interface CustomerInspectionIssueRequest {
  category: CustomerInspectionIssueCategory;
  description?: string;
  relatedPhotoIds?: string[];
}

