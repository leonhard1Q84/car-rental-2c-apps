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

const VehicleMetricDashboardPhoto: React.FC<{
  config: DashboardPhotoConfig;
  labels: VehicleMetricControlLabels;
}> = ({ config, labels }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 border-t border-gray-200 pt-4" data-vehicle-metric-dashboard-photo>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {labels.dashboardPhoto}
            {config.required ? <span className="ml-1 text-red-600">*</span> : null}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{labels.dashboardPhotoHint}</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3">
        {config.photo ? (
          <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <img src={config.photo} alt={labels.dashboardPhoto} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/55 p-1.5">
              <button
                type="button"
                title={labels.dashboardPhotoReplace}
                aria-label={labels.dashboardPhotoReplace}
                onClick={() => inputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                title={labels.dashboardPhotoRemove}
                aria-label={labels.dashboardPhotoRemove}
                onClick={config.onRemove}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow-sm transition-colors hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-36 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 text-center text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100"
          >
            <Camera size={24} />
            <span className="mt-2 text-xs font-semibold leading-4">{labels.dashboardPhotoAdd}</span>
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
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium leading-5 text-amber-700">
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
  titleClassName = 'text-base font-bold text-gray-900',
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
    className={compact ? 'min-w-0' : 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm'}
    data-unified-vehicle-metric-control
  >
    {!compact && <div className="flex items-start justify-between gap-3">
      <h2 className={titleClassName}>{labels.title}</h2>
      {statusLabel ? (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {statusLabel}
        </span>
      ) : null}
    </div>}

    {dashboardPhoto ? !dashboardAfterSource ? <VehicleMetricDashboardPhoto config={dashboardPhoto} labels={labels} /> : null : evidenceBeforeSource}

    {!compact && <div className="mt-4 border-t border-gray-200 pt-4" data-vehicle-metric-source>
      {sourceContent ?? <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${sourceAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {sourceAvailable ? <Wifi size={15} /> : <TriangleAlert size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-5 text-gray-700">
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
              className="mt-1 text-xs font-semibold text-indigo-600 disabled:opacity-50"
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
      <label className={`${valuesOrder === 'MILEAGE_ENERGY' ? 'order-2 ' : ''}min-w-0 text-xs text-gray-600`} data-vehicle-metric-energy>
        <span className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-1 font-semibold leading-5 text-gray-700 max-[520px]:flex-col max-[520px]:items-start"><span className="break-words">{labels.energy}</span>{energyStatus}</span>
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
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">%</span>
            </div>
          ) : (
            <select
              aria-invalid={Boolean(energyError)}
              value={energyValue}
              onChange={(event) => onEnergyChange(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">{labels.selectPlaceholder}</option>
              {(energyOptions ?? []).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          )
        ) : (
          <div className="min-h-11 rounded-lg bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-900">{energyValue || '-'}</div>
        )}
        {energyError ? <span className="mt-1 block text-xs text-red-600">{energyError}</span> : null}
      </label>

      <label className={`${valuesOrder === 'MILEAGE_ENERGY' ? 'order-1 ' : ''}min-w-0 text-xs text-gray-600`} data-vehicle-metric-mileage>
        <span className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-1 font-semibold leading-5 text-gray-700 max-[520px]:flex-col max-[520px]:items-start"><span className="break-words">{labels.mileage}</span>{mileageStatus}</span>
        {mileageEditable ? (
          <div className="relative">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-invalid={Boolean(mileageError)}
              value={mileage}
              onChange={(event) => onMileageChange(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">km</span>
          </div>
        ) : (
          <div className="min-h-11 rounded-lg bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-900">{mileage ? `${mileage} km` : '-'}</div>
        )}
        {mileageError ? <span className="mt-1 block text-xs text-red-600">{mileageError}</span> : null}
      </label>
    </div>
    </div>

    {comparisonText ? (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-700">
        {comparisonText}
        {comparisonWarning ? <span className="mt-1 block font-semibold text-amber-700">{comparisonWarning}</span> : null}
      </div>
    ) : null}

    {evidenceAfterValues}
    {requiredMessage ? <p className="mt-3 text-xs font-medium text-amber-700">{requiredMessage}</p> : null}
    {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
  </section>
);

export default VehicleMetricControl;
