import type { InspectionSubmissionRecord, OrderDetails } from '../types';
import { isDriverPhotoConfirmationComplete } from '../modules/selfservice-rental/driver-photos/model';

/** Driver and exception evidence gate contract entry; read-only metrics add no prerequisite. */
export const isInspectionReadyForContract = (record: InspectionSubmissionRecord | null, order?: OrderDetails): boolean => {
  if (!record) return false;
  if (record.driverPhotoConfirmation) {
    const binding = order ? {
      orderId: order.orderNumber, vehicleId: order.vehicle.licensePlate, snapshot: order.onlineCheckinDrivers,
    } : undefined;
    if (record.verificationStatus !== 'uploaded' || !isDriverPhotoConfirmationComplete(record.driverPhotoConfirmation, binding)) return false;
  } else if (record.verificationStatus !== 'approved' || record.verificationPhotos.length === 0) return false;
  if (record.decisionMode === 'report' && !record.exceptionPhotos?.length) return false;
  return true;
};
