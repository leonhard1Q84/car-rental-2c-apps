import etcDevice from '../../../assets/pickup-inspection-demo/delivery-etc-device.jpg';
import certificate from '../../../assets/pickup-inspection-demo/delivery-inspection-certificate.jpg';
import keyStorage from '../../../assets/pickup-inspection-demo/delivery-key-storage.jpg';
import dashboard from '../../../assets/pickup-inspection-demo/delivery-dashboard.jpg';
import lights from '../../../assets/pickup-inspection-demo/delivery-light.jpg';
import tire from '../../../assets/pickup-inspection-demo/delivery-tire.jpg';
import interiorFront from '../../../assets/pickup-inspection-demo/delivery-interior-front.jpg';
import interiorRear from '../../../assets/pickup-inspection-demo/delivery-interior-rear.jpg';
import front from '../../../assets/pickup-inspection-demo/delivery-condition-front.jpg';
import rear from '../../../assets/pickup-inspection-demo/delivery-condition-rear.jpg';
import left from '../../../assets/pickup-inspection-demo/delivery-condition-left.jpg';
import right from '../../../assets/pickup-inspection-demo/delivery-condition-right.jpg';
import { preparationBooking } from '../bookingFixtures';
import type { PreparationKey } from '../../../i18n/preparation';
import { assertInspectionOwnership, type InspectionPhoto, type PublishedInspection } from './model';
import { readLegacyCustomerInspectionPublication } from '@shared/services/customerInspectionPublicationStorage';
import { customerInspectionApiConfigured, loadCustomerInspectionPublicationAdapter, recordCustomerInspectionView } from '@shared/services/customerInspectionApi';

function preparedDemo(orderId: 'PREP01' | 'PREP02' | 'PREP04'): PublishedInspection {
  const vehicleId = `DEMO-${orderId}-VEHICLE`;
  const photos = (...items: Array<[string, PreparationKey]>): InspectionPhoto[] => items.map(([url, labelKey], index) => ({ id: `${orderId}-${labelKey}-${index}`, vehicleId, url, labelKey }));
  return {
    orderId, vehicleId, revision: orderId === "PREP01" ? "DEMO-PREP01-PREPARED-2" : `DEMO-${orderId}-PREPARED-1`, source: 'DEMO',
    preparedAt: '2026-10-20T02:30:00Z', publishedAt: '2026-10-20T02:35:00Z',
    vehicle: { id: vehicleId, model: 'Toyota Yaris', plate: '成田330あ1234' },
    metrics: { mileage: 45280, energyType: 'FUEL', energyPercent: 75, recordedAt: '2026-10-20T02:30:00Z' },
    groups: {
      inspectionAndPaperChecklist: { photos: photos([certificate, 'prepInspectionPhotoCertificate']) },
      keyStoragePhotos: { photos: photos([keyStorage, 'prepInspectionKeyStorage']) },
      etcDevicePhotos: { photos: photos([etcDevice, 'prepInspectionEtc']) },
      metrics: { photos: photos([dashboard, 'prepInspectionPhotoDashboard']) },
      lightPhotos: { photos: photos([lights, 'prepInspectionLights']) },
      tirePhotos: { photos: photos([tire, 'prepInspectionTires']) },
      interiorPhotos: { photos: photos([interiorFront, 'prepInspectionPhotoInteriorFront'], [interiorRear, 'prepInspectionPhotoInteriorRear']) },
      exteriorAndDamage: { photos: photos([front, 'prepInspectionPhotoFront'], [rear, 'prepInspectionPhotoRear'], [left, 'prepInspectionPhotoLeft'], [right, 'prepInspectionPhotoRight']), noteKey: 'prepInspectionDemoCondition' },
    },
  };
}

export function inspectionAvailability(orderId: string): 'ready' | 'empty' {
  return publishedInspection(orderId) ? 'ready' : 'empty';
}

function normalizeRemotePublication(value: unknown, orderId: string): PublishedInspection {
  if (!value || typeof value !== 'object') throw new Error('INVALID_INSPECTION_PUBLICATION');
  const raw = value as Record<string, any>;
  const rawGroups = raw.groups && typeof raw.groups === 'object' ? raw.groups as Record<string, any> : {};
  const groups = Object.fromEntries(Object.entries(rawGroups).map(([groupId, group]) => {
    const photos = group && Array.isArray(group.photos) ? group.photos.map((photo: any) => ({
      id: String(photo.photoId ?? photo.id ?? ''),
      vehicleId: String(photo.vehicleId ?? raw.vehicleId ?? ''),
      url: String(photo.signedUrl ?? photo.url ?? photo.mediaObjectId ?? ''),
    })) : [];
    return [groupId, { photos }];
  })) as PublishedInspection['groups'];
  const metrics = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {};
  const energyType = metrics.energyType === 'BATTERY' ? 'BATTERY' : 'FUEL';
  const review = raw.customerReview && typeof raw.customerReview === 'object' ? raw.customerReview : undefined;
  return {
    orderId: String(raw.orderId ?? orderId),
    vehicleId: String(raw.vehicleId ?? raw.vehicle?.id ?? ''),
    publicationId: typeof raw.publicationId === 'string' ? raw.publicationId : undefined,
    revision: String(raw.revision ?? ''),
    ...(raw.reviewRevision !== undefined ? { reviewRevision: String(raw.reviewRevision) } : {}),
    ...(typeof raw.readyToConfirm === 'boolean' ? { readyToConfirm: raw.readyToConfirm } : {}),
    ...(Array.isArray(raw.missingFields) ? { missingFields: raw.missingFields.filter((v: unknown) => typeof v === 'string') } : {}),
    source: raw.source === 'DEMO' ? 'DEMO' : 'STORE_OPS',
    preparedAt: typeof raw.preparedAt === 'string' ? raw.preparedAt : null,
    publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : null,
    vehicle: { id: String(raw.vehicle?.id ?? raw.vehicleId ?? ''), model: String(raw.vehicle?.model ?? ''), plate: String(raw.vehicle?.plate ?? raw.vehiclePlateNo ?? '') },
    metrics: {
      mileage: typeof metrics.mileage === 'number' ? metrics.mileage : null,
      energyType,
      energyPercent: typeof metrics.energyPercent === 'number' ? metrics.energyPercent : null,
      recordedAt: typeof metrics.recordedAt === 'string' ? metrics.recordedAt : null,
    },
    groups,
    ...(review ? { customerReview: review } : {}),
  };
}

// Prototype provider only. Production must authorize and bind the order/vehicle server-side.
function publishedInspection(orderId: string): PublishedInspection | null {
  preparationBooking(orderId);
  if (typeof window !== 'undefined') {
    const published = window.localStorage.getItem(`ix-rental:customer-inspection:${orderId}`);
    if (published !== null) {
      const snapshot = JSON.parse(published) as PublishedInspection;
      if (snapshot.source !== 'STORE_OPS') throw new Error('INVALID_INSPECTION_SOURCE');
      assertInspectionOwnership(snapshot, orderId);
      return structuredClone(snapshot);
    }
  }
  if (orderId !== 'PREP01' && orderId !== 'PREP02' && orderId !== 'PREP04') return null;
  const snapshot = preparedDemo(orderId);
  assertInspectionOwnership(snapshot, orderId);
  return snapshot;
}

export async function loadPublishedInspection(orderId: string): Promise<PublishedInspection | null> {
  preparationBooking(orderId);
  const published = await loadCustomerInspectionPublicationAdapter(orderId);
  if (published !== null) {
    const snapshot = normalizeRemotePublication(published, orderId);
    if (snapshot.source !== 'STORE_OPS') throw new Error('INVALID_INSPECTION_SOURCE');
    assertInspectionOwnership(snapshot, orderId);
    if (customerInspectionApiConfigured() && snapshot.publicationId) {
      void recordCustomerInspectionView(orderId, snapshot.publicationId, snapshot.revision).catch(() => {});
    }
    return structuredClone(snapshot);
  }
  if (customerInspectionApiConfigured()) return null;
  const legacy = readLegacyCustomerInspectionPublication(orderId);
  if (legacy !== null) {
    const snapshot = legacy as PublishedInspection;
    if (snapshot.source !== 'STORE_OPS') throw new Error('INVALID_INSPECTION_SOURCE');
    assertInspectionOwnership(snapshot, orderId);
    return structuredClone(snapshot);
  }
  return publishedInspection(orderId);
}
