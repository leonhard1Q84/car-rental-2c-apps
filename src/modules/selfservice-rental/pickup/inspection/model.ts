import type { PreparationKey, PreparationLanguage } from '../../../../i18n/preparation';

// Group ids preserve the evidence mapping; display order follows the customer view.
export const inspectionGroupTitles = {
  inspectionAndPaperChecklist: 'prepInspectionPhotoCertificate',
  keyStoragePhotos: 'prepInspectionKeyStorage',
  etcDevicePhotos: 'prepInspectionEtcPhotos',
  metrics: 'prepInspectionMetrics',
  lightPhotos: 'prepInspectionLights',
  tirePhotos: 'prepInspectionTires',
  interiorPhotos: 'prepInspectionInterior',
  exteriorAndDamage: 'prepInspectionExterior',
} as const satisfies Record<string, PreparationKey>;
export type InspectionGroupId = keyof typeof inspectionGroupTitles;
export const inspectionGroupOrder: InspectionGroupId[] = [
  'exteriorAndDamage', 'lightPhotos', 'tirePhotos', 'interiorPhotos',
  'metrics', 'keyStoragePhotos', 'etcDevicePhotos', 'inspectionAndPaperChecklist',
];
export interface InspectionPhoto { id: string; vehicleId: string; url: string; labelKey?: PreparationKey }
export interface PublishedInspection {
  orderId: string;
  vehicleId: string;
  publicationId?: string;
  revision: string;
  reviewRevision?: string;
  readyToConfirm?: boolean;
  missingFields?: string[];
  source: 'DEMO' | 'STORE_OPS';
  preparedAt: string | null;
  publishedAt: string | null;
  vehicle: { id: string; model: string; plate: string };
  metrics: { mileage: number | null; energyType: 'FUEL' | 'BATTERY'; energyPercent: number | null; recordedAt: string | null };
  groups: Partial<Record<InspectionGroupId, { photos: InspectionPhoto[]; noteKey?: PreparationKey }>>;
  customerReview?: { reviewRevision?: string | number; status: string; confirmedRevision?: number; confirmedAt?: string | null; confirmation?: { reviewRevision?: string | number; orderId?: string; vehicleId?: string; locale?: string; declarationVersion?: string; confirmedAt?: string } | null };
}
export type InspectionLoadState =
  | { status: 'loading'; orderId: string }
  | { status: 'error'; orderId: string }
  | { status: 'empty'; orderId: string }
  | { status: 'ready'; orderId: string; snapshot: PublishedInspection; refreshError?: boolean };

export function assertInspectionOwnership(snapshot: PublishedInspection, orderId: string): void {
  if (!snapshot || snapshot.orderId !== orderId || !snapshot.vehicleId || !snapshot.revision?.trim()
    || snapshot.vehicle?.id !== snapshot.vehicleId || !snapshot.groups || !snapshot.metrics
    || Object.values(snapshot.groups).some(group => group?.photos.some(photo => photo.vehicleId !== snapshot.vehicleId))) {
    throw new Error('INSPECTION_OWNERSHIP_MISMATCH');
  }
}

export function formatInspectionTime(value: string | null): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value;
  return `${part('year')}/${part('month')}/${part('day')} ${part('hour')}:${part('minute')}`;
}

export function formatInspectionValue(value: number | null, language: PreparationLanguage, maximum?: number): string | null {
  if (value === null || !Number.isFinite(value) || value < 0 || (maximum !== undefined && value > maximum)) return null;
  return new Intl.NumberFormat(language).format(value);
}
