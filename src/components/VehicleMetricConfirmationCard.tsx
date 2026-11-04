import React, { useMemo } from 'react';
import type { VehicleMetricCheckpoint } from '@shared/contracts';
import VehicleMetricControl from '@shared/components/VehicleMetricControl';
import {
  hasCompleteCustomerVehicleMetricValues,
  resolveCustomerVehicleMetricSource,
  type CustomerVehicleMetricSourceInput
} from './customerVehicleMetricSubmission';

interface VehicleMetricConfirmationCardProps {
  sourceInput: CustomerVehicleMetricSourceInput;
  mileage: string;
  energyPercent: string;
  evidencePhoto?: string;
  initialCheckpoint?: VehicleMetricCheckpoint;
  labels: {
    title: string;
    mileage: string;
    energy: string;
    source: string;
    noDevice: string;
    offline: string;
    failed: string;
    required: string;
    evidenceLabel: string;
    evidenceRequiredMessage: string;
    evidenceHint: string;
    evidenceAdd: string;
    evidenceReplace: string;
    evidenceRemove: string;
    selectPlaceholder: string;
  };
  onValuesChange: (values: { mileage: string; energyPercent: string }) => void;
  onEvidenceChange: (photo: string) => void;
}

export const VehicleMetricConfirmationCard: React.FC<VehicleMetricConfirmationCardProps> = ({
  sourceInput,
  mileage,
  energyPercent,
  evidencePhoto,
  initialCheckpoint,
  labels,
  onValuesChange,
  onEvidenceChange
}) => {
  const source = useMemo(
    () => resolveCustomerVehicleMetricSource(sourceInput),
    [sourceInput]
  );
  const hasAnyReading = source.mileage !== undefined || source.energyPercent !== undefined;
  const valuesValid = hasCompleteCustomerVehicleMetricValues(mileage, energyPercent);
  const sourceText = hasAnyReading
    ? labels.source
    : source.unavailableReason === 'NO_DEVICE'
      ? labels.noDevice
      : source.unavailableReason === 'DEVICE_OFFLINE'
        ? labels.offline
        : labels.failed;
  const sourceTimestamp = source.capturedAt ?? initialCheckpoint?.telemetrySnapshot?.capturedAt;
  const electric = source.energyKind === 'BATTERY'
    || /electric|\bev\b|battery/i.test(sourceInput.fuelType ?? '');
  const displayEnergyValue = electric
    ? energyPercent
    : energyPercent.trim() && Number.isFinite(Number(energyPercent))
      ? `${Math.max(0, Math.min(8, Math.round(Number(energyPercent) / 12.5)))}/8`
      : '';

  const handleEvidenceFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onEvidenceChange(String(reader.result ?? ''));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div data-customer-vehicle-metrics>
      <VehicleMetricControl
        labels={{
          title: labels.title,
          dashboardPhoto: labels.evidenceLabel,
          dashboardPhotoHint: labels.evidenceHint,
          dashboardPhotoAdd: labels.evidenceAdd,
          dashboardPhotoReplace: labels.evidenceReplace,
          dashboardPhotoRemove: labels.evidenceRemove,
          dashboardPhotoRequired: labels.evidenceRequiredMessage,
          energy: labels.energy,
          mileage: labels.mileage,
          selectPlaceholder: labels.selectPlaceholder
        }}
        sourceText={sourceText}
        sourceTimestamp={sourceTimestamp}
        sourceAvailable={hasAnyReading}
        energyKind={electric ? 'BATTERY' : 'FUEL'}
        energyValue={displayEnergyValue}
        mileage={mileage}
        energyOptions={electric ? undefined : Array.from({ length: 9 }, (_, index) => `${index}/8`)}
        dashboardPhoto={{
          photo: evidencePhoto,
          required: true,
          onChange: handleEvidenceFile,
          onRemove: () => onEvidenceChange('')
        }}
        requiredMessage={!valuesValid ? labels.required : undefined}
        onEnergyChange={(value) => onValuesChange({
          mileage,
          energyPercent: electric
            ? value
            : value
              ? String(Number(value.replace('/8', '')) * 12.5)
              : ''
        })}
        onMileageChange={(value) => onValuesChange({ mileage: value, energyPercent })}
      />
    </div>
  );
};

export default VehicleMetricConfirmationCard;
