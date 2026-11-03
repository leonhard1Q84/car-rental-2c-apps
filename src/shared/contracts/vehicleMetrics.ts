export type VehicleMetricCheckpointType =
  | 'REGULAR_PICKUP'
  | 'REGULAR_RETURN'
  | 'SELF_SERVICE_DELIVERY'
  | 'SELF_SERVICE_CUSTOMER_PICKUP'
  | 'SELF_SERVICE_CUSTOMER_RETURN'
  | 'SELF_SERVICE_COLLECTION';

export type VehicleMetricFieldStatus =
  | 'VALID'
  | 'MISSING'
  | 'STALE'
  | 'OUT_OF_RANGE'
  | 'UNSUPPORTED'
  | 'ERROR';

export type VehicleMetricUnavailableReason =
  | 'NO_DEVICE'
  | 'DEVICE_OFFLINE'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'STALE_READING'
  | 'INVALID_READING'
  | 'FIELD_UNSUPPORTED'
  | 'DEVICE_VEHICLE_BINDING_MISMATCH';

export interface VehicleMetricReading {
  status: VehicleMetricFieldStatus;
  rawValue?: number;
  rawUnit?: string;
  normalizedKm?: number;
  normalizedPercent?: number;
  kind?: 'FUEL' | 'BATTERY';
}

export interface VehicleMetricTelemetrySnapshot {
  provider: string;
  deviceId?: string;
  capturedAt: string;
  receivedAt: string;
  mileage?: VehicleMetricReading;
  energy?: VehicleMetricReading;
}

export interface VehicleMetricCheckpoint {
  checkpointId: string;
  checkpointType: VehicleMetricCheckpointType;
  orderId: string;
  vehicleId: string;
  deviceId?: string;
  readingStatus: 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
  unavailableReason?: VehicleMetricUnavailableReason;
  telemetrySnapshot?: VehicleMetricTelemetrySnapshot;
  decision: 'CONFIRMED' | 'CORRECTED' | 'MANUAL_REQUIRED';
  finalMetrics: {
    mileageKm: number;
    energyKind: 'FUEL' | 'BATTERY';
    energyPercent: number;
  };
  correctedFields?: Array<'MILEAGE' | 'ENERGY'>;
  correctionReason?: string;
  evidenceAttachmentIds?: string[];
  actorId: string;
  actorRole: 'CUSTOMER' | 'MERCHANT';
  confirmedAt: string;
  version: number;
  idempotencyKey: string;
}

export interface VehicleMetricSource {
  installed: boolean;
  online: boolean;
  provider?: string;
  deviceId?: string;
  mileage?: number;
  energyPercent?: number;
  energyKind?: 'FUEL' | 'BATTERY';
  capturedAt?: string;
  unavailableReason?: VehicleMetricUnavailableReason;
}

export interface VehicleMetricDraft {
  mileage: string;
  energyPercent: string;
  source: VehicleMetricSource;
  decision: 'PENDING' | 'CONFIRMED' | 'CORRECTED' | 'MANUAL_REQUIRED';
  confirmedAt?: string;
}

const MAX_READING_AGE_MS = 120_000;

export const isFreshVehicleMetric = (capturedAt: string | undefined, now = Date.now()): boolean => {
  if (!capturedAt) return false;
  const timestamp = Date.parse(capturedAt);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= MAX_READING_AGE_MS;
};

export const resolveVehicleMetricSource = (input: {
  hasTelematics?: boolean;
  telematicsStatus?: string;
  mileage?: number;
  fuelLevel?: number;
  fuelType?: string;
  deviceId?: string;
  provider?: string;
  capturedAt?: string;
}): VehicleMetricSource => {
  const installed = input.telematicsStatus
    ? input.telematicsStatus !== 'NOT_INSTALLED'
    : input.hasTelematics === true;
  const online = input.telematicsStatus
    ? input.telematicsStatus === 'INSTALLED_ONLINE'
    : installed;
  const energyKind = /electric|ev|battery/i.test(input.fuelType ?? '') ? 'BATTERY' : 'FUEL';
  let unavailableReason: VehicleMetricUnavailableReason | undefined;
  if (!installed) unavailableReason = 'NO_DEVICE';
  else if (!online) unavailableReason = 'DEVICE_OFFLINE';
  else if (!isFreshVehicleMetric(input.capturedAt)) unavailableReason = 'STALE_READING';

  const mileageValid = typeof input.mileage === 'number' && Number.isFinite(input.mileage) && input.mileage >= 0;
  const energyValid = typeof input.fuelLevel === 'number'
    && Number.isFinite(input.fuelLevel)
    && input.fuelLevel >= 0
    && input.fuelLevel <= 100;

  return {
    installed,
    online,
    provider: input.provider ?? 'demo-telematics',
    deviceId: input.deviceId,
    mileage: mileageValid && !unavailableReason ? input.mileage : undefined,
    energyPercent: energyValid && !unavailableReason ? input.fuelLevel : undefined,
    energyKind,
    capturedAt: input.capturedAt,
    unavailableReason: unavailableReason ?? (mileageValid || energyValid ? undefined : 'INVALID_READING')
  };
};

export const getReadingStatus = (source: VehicleMetricSource, field: 'mileage' | 'energy'): VehicleMetricFieldStatus => {
  const value = field === 'mileage' ? source.mileage : source.energyPercent;
  if (value === undefined) return source.unavailableReason === 'STALE_READING' ? 'STALE' : source.unavailableReason === 'NO_DEVICE' ? 'UNSUPPORTED' : 'ERROR';
  if (field === 'mileage') return value >= 0 ? 'VALID' : 'OUT_OF_RANGE';
  return value >= 0 && value <= 100 ? 'VALID' : 'OUT_OF_RANGE';
};

export const createVehicleMetricCheckpoint = (args: {
  checkpointType: VehicleMetricCheckpointType;
  orderId: string;
  vehicleId: string;
  source: VehicleMetricSource;
  mileage: number;
  energyPercent: number;
  decision: VehicleMetricCheckpoint['decision'];
  actorId: string;
  actorRole: VehicleMetricCheckpoint['actorRole'];
  correctedFields?: VehicleMetricCheckpoint['correctedFields'];
  correctionReason?: string;
  evidenceAttachmentIds?: VehicleMetricCheckpoint['evidenceAttachmentIds'];
  now?: string;
}): VehicleMetricCheckpoint => {
  const now = args.now ?? new Date().toISOString();
  const mileageStatus = getReadingStatus(args.source, 'mileage');
  const energyStatus = getReadingStatus(args.source, 'energy');
  const validCount = [mileageStatus, energyStatus].filter((status) => status === 'VALID').length;
  const telemetrySnapshot: VehicleMetricTelemetrySnapshot | undefined = args.source.mileage !== undefined || args.source.energyPercent !== undefined
    ? {
        provider: args.source.provider ?? 'unknown',
        deviceId: args.source.deviceId,
        capturedAt: args.source.capturedAt ?? now,
        receivedAt: now,
        mileage: { status: mileageStatus, rawValue: args.source.mileage, rawUnit: 'km', normalizedKm: args.source.mileage },
        energy: { status: energyStatus, rawValue: args.source.energyPercent, rawUnit: '%', normalizedPercent: args.source.energyPercent, kind: args.source.energyKind ?? 'FUEL' }
      }
    : undefined;
  return {
    checkpointId: `${args.orderId}-${args.checkpointType}-${Date.now()}`,
    checkpointType: args.checkpointType,
    orderId: args.orderId,
    vehicleId: args.vehicleId,
    deviceId: args.source.deviceId,
    readingStatus: validCount === 2 ? 'FULL' : validCount === 1 ? 'PARTIAL' : 'UNAVAILABLE',
    unavailableReason: validCount === 2 ? undefined : args.source.unavailableReason,
    telemetrySnapshot,
    decision: args.decision,
    finalMetrics: {
      mileageKm: args.mileage,
      energyKind: args.source.energyKind ?? 'FUEL',
      energyPercent: args.energyPercent
    },
    correctedFields: args.correctedFields,
    correctionReason: args.correctionReason,
    evidenceAttachmentIds: args.evidenceAttachmentIds,
    actorId: args.actorId,
    actorRole: args.actorRole,
    confirmedAt: now,
    version: 1,
    idempotencyKey: `${args.orderId}:${args.checkpointType}:${now}`
  };
};
