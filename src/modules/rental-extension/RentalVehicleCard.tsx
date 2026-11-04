import React, { useContext } from 'react';
import { Users, Briefcase, Sparkles } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { SanitizedOrder } from './contracts';
import { getVehiclePhoto } from './vehicleImages';
import { getVehicleSpecs } from './vehicleSpecs';

export interface RentalVehicleCardProps {
  actualModelId?: string;
  actualModelName?: string;
  actualPlate?: string;
  bookedModelId?: string;
  bookedModelName?: string;
  order?: SanitizedOrder;
  title?: string;
  className?: string;
  showPlate?: boolean;
  showBookedVehicle?: boolean;
  showUpgradeBadge?: boolean;
  children?: React.ReactNode;
}

export const RentalVehicleCard: React.FC<RentalVehicleCardProps> = ({
  actualModelId: propActualModelId,
  actualModelName: propActualModelName,
  actualPlate: propActualPlate,
  bookedModelId: propBookedModelId,
  bookedModelName: propBookedModelName,
  order,
  title,
  className = '',
  showPlate = true,
  showBookedVehicle = true,
  showUpgradeBadge = true,
  children,
}) => {
  const { t } = useContext(LanguageContext);

  const actualModelId = propActualModelId ?? order?.actual_model_id;
  const actualModelName = propActualModelName ?? order?.actual_model_name ?? '';
  const actualPlate = propActualPlate ?? order?.actual_plate;
  const bookedModelId = propBookedModelId ?? order?.booked_model_id;
  const bookedModelName = propBookedModelName ?? order?.booked_model_name;

  const specs = getVehicleSpecs(actualModelId, actualModelName, t);

  const isUpgrade = Boolean(
    bookedModelId &&
    actualModelId &&
    bookedModelId !== actualModelId
  );

  const displayPlate = showPlate && Boolean(actualPlate?.trim());
  const displayBookedVehicle = showBookedVehicle && isUpgrade;

  const extractModelOnly = (name: string) => {
    if (!name) return '';
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1].replace(/or similar/gi, '').trim() : name;
  };

  return (
    <section className={`rounded-2xl border border-customer-border bg-customer-card p-4 sm:p-5 shadow-customer-card space-y-3 ${className}`}>
      {/* 头部标题与升级标识 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-customer-text block">
          {title ?? t('renewVehicleCardTitle')}
        </span>
        {isUpgrade && showUpgradeBadge && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shadow-2xs">
            <Sparkles className="size-3 text-emerald-600 shrink-0" />
            <span>{t('renewFreeUpgrade')}</span>
          </span>
        )}
      </div>

      <div className="flex gap-3.5 items-start">
        {/* 车辆缩略图 */}
        <img
          src={getVehiclePhoto(actualModelId, actualModelName)}
          alt={actualModelName}
          className="w-20 h-14 object-cover rounded-xl border border-customer-border shrink-0 bg-white shadow-2xs mt-0.5"
          onError={(e) => {
            // fallback if needed
            e.currentTarget.style.display = 'none';
          }}
        />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* 主视觉层级：车型名 + 车牌号 */}
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-customer-text text-sm sm:text-base leading-snug">
                  {extractModelOnly(actualModelName)}
                </h3>
                <span className="sr-only">{actualModelName}</span>
              </div>
              {displayPlate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-customer-inset text-customer-text border border-customer-border-strong shadow-2xs tracking-wide">
                  {actualPlate}
                </span>
              )}
            </div>
          </div>

          {/* 原预订车型（仅在升级时展示） */}
          {displayBookedVehicle && (
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-customer-text-secondary bg-customer-inset px-2.5 py-1.5 rounded-lg border border-customer-border-subtle">
              <span className="text-customer-text-tertiary text-[11px] font-normal shrink-0">
                {t('prepBookedVehicle')}:
              </span>
              <span className="font-medium text-customer-text text-xs">
                {extractModelOnly(bookedModelName || '')}
              </span>
            </div>
          )}

          {/* 辅助规格层级：座位、行李、排挡、空调 */}
          <div className="flex items-center gap-2 text-[11px] text-customer-text-secondary font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="size-3 text-customer-text-tertiary" />
              <span>{specs.seats} {t('prepSeats')}</span>
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="size-3 text-customer-text-tertiary" />
              <span>{specs.luggage} {t('prepLuggage')}</span>
            </span>
            <span className="text-customer-border-strong">·</span>
            <span className="text-customer-text-secondary">{specs.transmission}</span>
            <span className="text-customer-border-strong">·</span>
            <span className="text-customer-text-secondary">{specs.airConditioning}</span>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
};
