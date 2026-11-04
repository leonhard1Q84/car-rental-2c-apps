import type {
  VehicleMetricCheckpoint,
  VehicleMetricCheckpointType,
  VehicleMetricSource
} from '@shared/contracts';
import { createVehicleMetricCheckpoint, resolveVehicleMetricSource } from '@shared/contracts';

export interface CustomerVehicleMetricSourceInput {
  vehicleId: string;
  mileage?: number;
  energyPercent?: number;
  fuelType?: string;
  telematicsStatus?: 'INSTALLED_ONLINE' | 'INSTALLED_OFFLINE' | 'NOT_INSTALLED';
  capturedAt?: string;
}

export const resolveCustomerVehicleMetricSource = (
  input: CustomerVehicleMetricSourceInput
): VehicleMetricSource => resolveVehicleMetricSource({
  hasTelematics: input.telematicsStatus
    ? input.telematicsStatus !== 'NOT_INSTALLED'
    : false,
  telematicsStatus: input.telematicsStatus,
  mileage: input.mileage,
  fuelLevel: input.energyPercent,
  fuelType: input.fuelType,
  deviceId: `device-${input.vehicleId}`,
  capturedAt: input.capturedAt
});

export const getCustomerVehicleMetricInitialValues = (args: {
  sourceInput: CustomerVehicleMetricSourceInput;
  checkpoint?: VehicleMetricCheckpoint;
}): { mileage: string; energyPercent: string } => {
  if (args.checkpoint) {
    return {
      mileage: String(args.checkpoint.finalMetrics.mileageKm),
      energyPercent: String(Math.round(args.checkpoint.finalMetrics.energyPercent))
    };
  }
  const source = resolveCustomerVehicleMetricSource(args.sourceInput);
  return {
    mileage: source.mileage === undefined ? '' : String(source.mileage),
    energyPercent: source.energyPercent === undefined ? '' : String(Math.round(source.energyPercent))
  };
};

export const hasCompleteCustomerVehicleMetricValues = (
  mileage: string,
  energyPercent: string
): boolean => {
  if (!mileage.trim() || !energyPercent.trim()) return false;
  const mileageValue = Number(mileage);
  const energyValue = Number(energyPercent);
  return Number.isFinite(mileageValue)
    && mileageValue >= 0
    && Number.isFinite(energyValue)
    && energyValue >= 0
    && energyValue <= 100;
};

const getCorrectedFields = (
  source: VehicleMetricSource,
  mileage: number,
  energyPercent: number
): NonNullable<VehicleMetricCheckpoint['correctedFields']> => {
  const fields: NonNullable<VehicleMetricCheckpoint['correctedFields']> = [];
  if (source.mileage !== undefined && mileage !== source.mileage) fields.push('MILEAGE');
  if (source.energyPercent !== undefined && Math.abs(energyPercent - source.energyPercent) > 0.01) {
    fields.push('ENERGY');
  }
  return fields;
};

export const buildCustomerVehicleMetricCheckpoint = (args: {
  checkpointType: Extract<
    VehicleMetricCheckpointType,
    'SELF_SERVICE_CUSTOMER_PICKUP' | 'SELF_SERVICE_CUSTOMER_RETURN'
  >;
  orderId: string;
  sourceInput: CustomerVehicleMetricSourceInput;
  mileage: string;
  energyPercent: string;
  actorId: string;
  now?: string;
}): VehicleMetricCheckpoint | undefined => {
  if (!hasCompleteCustomerVehicleMetricValues(args.mileage, args.energyPercent)) return undefined;
  const source = resolveCustomerVehicleMetricSource(args.sourceInput);
  const mileage = Number(args.mileage);
  const energyPercent = Number(args.energyPercent);
  const correctedFields = getCorrectedFields(source, mileage, energyPercent);
  const hasAnyReading = source.mileage !== undefined || source.energyPercent !== undefined;
  const hasFullReading = source.mileage !== undefined && source.energyPercent !== undefined;
  const decision: VehicleMetricCheckpoint['decision'] = hasAnyReading
    ? correctedFields.length > 0 || !hasFullReading
      ? 'CORRECTED'
      : 'CONFIRMED'
    : 'MANUAL_REQUIRED';

  return createVehicleMetricCheckpoint({
    checkpointType: args.checkpointType,
    orderId: args.orderId,
    vehicleId: args.sourceInput.vehicleId,
    source,
    mileage,
    energyPercent,
    decision,
    actorId: args.actorId,
    actorRole: 'CUSTOMER',
    correctedFields: correctedFields.length > 0 ? correctedFields : undefined,
    now: args.now
  });
};
