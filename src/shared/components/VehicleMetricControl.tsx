import React, { useRef, type ChangeEvent, type ReactNode } from 'react';
import { Camera, RefreshCw, Trash2, TriangleAlert, Wifi } from 'lucide-react';

export interface VehicleMetricControlLabels {
  title: string;
  dashboardPhoto: string;
  dashboardPhotoHint: string;
  dashboardPhotoAdd: string;
  dashboardPhotoReplace: string;
  dashboardPhotoRemove: string;
  dashboardPhotoRequired: string;
  energy: string;
  mileage: string;
  selectPlaceholder: string;
}

interface DashboardPhotoConfig {
  photo?: string;
  required: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export interface VehicleMetricControlProps {
  labels: VehicleMetricControlLabels;
  compact?: boolean;
  valuesOrder?: 'ENERGY_MILEAGE' | 'MILEAGE_ENERGY';
  titleClassName?: string;
  sourceText: string;
  sourceTimestamp?: string;
  sourceAvailable: boolean;
  sourceContent?: ReactNode;
  dashboardAfterSource?: boolean;
  dashboardActions?: ReactNode;
  evidenceValuesLayout?: 'STACKED' | 'TABLET_INLINE';
  energyStatus?: ReactNode;
  mileageStatus?: ReactNode;
  energyKind: 'FUEL' | 'BATTERY';
  energyValue: string;
  mileage: string;
  energyOptions?: string[];
  energyEditable?: boolean;
  mileageEditable?: boolean;
  energyError?: string;
  mileageError?: string;
  dashboardPhoto?: DashboardPhotoConfig;
  evidenceBeforeSource?: ReactNode;
  evidenceAfterValues?: ReactNode;
  comparisonText?: string;
  comparisonWarning?: string;
  statusLabel?: string;
  retryAction?: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
  };
  requiredMessage?: string;
  actions?: ReactNode;
  onEnergyChange: (value: string) => void;
  onMileageChange: (value: string) => void;
}

const metricInputClass = 'min-h-11 w-full rounded-customer-control border border-customer-border-strong bg-customer-card px-3 py-2.5 text-customer-input text-customer-text outline-none focus:border-customer-brand focus:ring-4 focus:ring-customer-brand-ring';

const VehicleMetricDashboardPhoto: React.FC<{
  config: DashboardPhotoConfig;
  labels: VehicleMetricControlLabels;
}> = ({ config, labels }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 border-t border-customer-border pt-4" data-vehicle-metric-dashboard-photo>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-customer-body-strong text-customer-text">
            {labels.dashboardPhoto}
            {config.required ? <span className="ml-1 text-customer-danger">*</span> : null}
          </p>
          <p className="mt-1 text-customer-caption text-customer-text-tertiary">{labels.dashboardPhotoHint}</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3">
        {config.photo ? (
          <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-customer-inset border border-customer-border bg-customer-inset">
            <img src={config.photo} alt={labels.dashboardPhoto} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-customer-scrim p-1.5">
              <button
                type="button"
                title={labels.dashboardPhotoReplace}
                aria-label={labels.dashboardPhotoReplace}
                onClick={() => inputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-customer-card text-customer-text-secondary shadow-sm transition-colors hover:bg-customer-inset"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                title={labels.dashboardPhotoRemove}
                aria-label={labels.dashboardPhotoRemove}
                onClick={config.onRemove}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-customer-card text-customer-danger shadow-sm transition-colors hover:bg-customer-danger-subtle"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-36 shrink-0 flex-col items-center justify-center rounded-customer-inset border-2 border-dashed border-customer-border-strong bg-customer-inset px-3 text-center text-customer-text-secondary transition-colors hover:border-customer-border-strong hover:bg-customer-fill-disabled"
          >
            <Camera size={24} />
            <span className="mt-2 text-customer-label">{labels.dashboardPhotoAdd}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={config.onChange}
        />
      </div>

      {config.required && !config.photo ? (
        <p className="mt-3 flex items-start gap-1.5 text-customer-caption text-customer-warning-text">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          {labels.dashboardPhotoRequired}
        </p>
      ) : null}
    </div>
  );
};

export const VehicleMetricControl: React.FC<VehicleMetricControlProps> = ({
  labels,
  compact = false,
  valuesOrder = 'ENERGY_MILEAGE',
  titleClassName = 'text-customer-title',
  sourceText,
  sourceTimestamp,
  sourceAvailable,
  sourceContent,
  dashboardAfterSource = false,
  dashboardActions,
  evidenceValuesLayout = 'STACKED',
  energyStatus,
  mileageStatus,
  energyKind,
  energyValue,
  mileage,
  energyOptions,
  energyEditable = true,
  mileageEditable = true,
  energyError,
  mileageError,
  dashboardPhoto,
  evidenceBeforeSource,
  evidenceAfterValues,
  comparisonText,
  comparisonWarning,
  statusLabel,
  retryAction,
  requiredMessage,
  actions,
  onEnergyChange,
  onMileageChange
}) => (
  <section
    className={compact ? 'min-w-0' : 'rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card'}
    data-unified-vehicle-metric-control
  >
    {!compact && <div className="flex items-start justify-between gap-3">
      <h2 className={titleClassName}>{labels.title}</h2>
      {statusLabel ? (
        <span className="shrink-0 rounded-full border border-customer-success-border bg-customer-success-subtle px-2.5 py-1 text-customer-caption font-semibold text-customer-success-text">
          {statusLabel}
        </span>
      ) : null}
    </div>}

    {dashboardPhoto ? !dashboardAfterSource ? <VehicleMetricDashboardPhoto config={dashboardPhoto} labels={labels} /> : null : evidenceBeforeSource}

    {!compact && <div className="mt-4 border-t border-customer-border pt-4" data-vehicle-metric-source>
      {sourceContent ?? <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${sourceAvailable ? 'bg-customer-success-subtle text-customer-success-text' : 'bg-customer-warning-subtle text-customer-warning-text'}`}>
          {sourceAvailable ? <Wifi size={15} /> : <TriangleAlert size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-customer-caption text-customer-text-secondary">
            {sourceText}
            {sourceAvailable && sourceTimestamp
              ? ` · ${new Date(sourceTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </p>
          {retryAction ? (
            <button
              type="button"
              onClick={retryAction.onClick}
              disabled={retryAction.disabled}
              className="mt-1 min-h-customer-touch-min text-customer-label text-customer-brand-text disabled:text-customer-text-disabled"
            >
              {retryAction.label}
            </button>
          ) : null}
        </div>
      </div>}
    </div>}

    {dashboardPhoto && dashboardAfterSource ? <VehicleMetricDashboardPhoto config={dashboardPhoto} labels={labels} /> : null}
    <div data-vehicle-metric-evidence-values-layout={evidenceValuesLayout}
      className={evidenceValuesLayout === 'TABLET_INLINE' ? 'mt-4 grid min-w-0 gap-4 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-start' : undefined}>
    {dashboardActions}

    <div className={`${evidenceValuesLayout === 'TABLET_INLINE' ? '' : 'mt-4 '}grid min-w-0 grid-cols-2 gap-3 max-[380px]:grid-cols-1`} data-vehicle-metric-values>
      <label className={`${valuesOrder === 'MILEAGE_ENERGY' ? 'order-2 ' : ''}min-w-0 text-customer-caption text-customer-text-secondary`} data-vehicle-metric-energy>
        <span className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-customer-label text-customer-text-secondary max-[520px]:flex-col max-[520px]:items-start"><span className="break-words">{labels.energy}</span>{energyStatus}</span>
        {energyEditable ? (
          energyKind === 'BATTERY' ? (
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                aria-invalid={Boolean(energyError)}
                value={energyValue.replace('%', '')}
                onChange={(event) => onEnergyChange(event.target.value)}
                className={`${metricInputClass} pr-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-customer-caption text-customer-text-tertiary">%</span>
            </div>
          ) : (
            <select
              aria-invalid={Boolean(energyError)}
              value={energyValue}
              onChange={(event) => onEnergyChange(event.target.value)}
              className={metricInputClass}
            >
              <option value="">{labels.selectPlaceholder}</option>
              {(energyOptions ?? []).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          )
        ) : (
          <div className="min-h-11 rounded-customer-control bg-customer-inset px-3 py-2.5 text-customer-body-strong text-customer-text">{energyValue || '-'}</div>
        )}
        {energyError ? <span className="mt-1 block text-customer-caption text-customer-danger-text">{energyError}</span> : null}
      </label>

      <label className={`${valuesOrder === 'MILEAGE_ENERGY' ? 'order-1 ' : ''}min-w-0 text-customer-caption text-customer-text-secondary`} data-vehicle-metric-mileage>
        <span className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-customer-label text-customer-text-secondary max-[520px]:flex-col max-[520px]:items-start"><span className="break-words">{labels.mileage}</span>{mileageStatus}</span>
        {mileageEditable ? (
          <div className="relative">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-invalid={Boolean(mileageError)}
              value={mileage}
              onChange={(event) => onMileageChange(event.target.value)}
              className={`${metricInputClass} pr-10`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-customer-caption text-customer-text-tertiary">km</span>
          </div>
        ) : (
          <div className="min-h-11 rounded-customer-control bg-customer-inset px-3 py-2.5 text-customer-body-strong text-customer-text">{mileage ? `${mileage} km` : '-'}</div>
        )}
        {mileageError ? <span className="mt-1 block text-customer-caption text-customer-danger-text">{mileageError}</span> : null}
      </label>
    </div>
    </div>

    {comparisonText ? (
      <div className="mt-4 rounded-customer-inset border border-customer-border bg-customer-inset px-3 py-2 text-customer-caption text-customer-text-secondary">
        {comparisonText}
        {comparisonWarning ? <span className="mt-1 block text-customer-label text-customer-warning-text">{comparisonWarning}</span> : null}
      </div>
    ) : null}

    {evidenceAfterValues}
    {requiredMessage ? <p className="mt-3 text-customer-label text-customer-warning-text">{requiredMessage}</p> : null}
    {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
  </section>
);

export default VehicleMetricControl;
