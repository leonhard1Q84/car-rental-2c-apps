import React, { useContext } from 'react';
import { AlertTriangle, Gauge } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import {
  resolveCustomerVehicleMetricSource,
  type CustomerVehicleMetricSourceInput,
} from './customerVehicleMetricSubmission';

/** Read-only vehicle source readings; unavailable values add no pickup prerequisite. */
export default function PickupDashboardCard({ sourceInput }: { sourceInput: CustomerVehicleMetricSourceInput }) {
  const { lang, t } = useContext(LanguageContext);
  const source = resolveCustomerVehicleMetricSource(sourceInput);
  const electric = source.energyKind === 'BATTERY' || /electric|\bev\b|battery/i.test(sourceInput.fuelType ?? '');
  const energyLabel = t(electric ? 'pickupDashboardBattery' : 'pickupDashboardFuel');
  const filledBars = source.energyPercent === undefined ? undefined : Math.round(source.energyPercent / 12.5);

  return (
    <section data-pickup-dashboard className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <Gauge aria-hidden="true" className="shrink-0 text-primary" size={22} />
        {t('pickupDashboardTitle')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-100 p-3 sm:p-4">
          <p className="mb-2 break-words text-xs font-medium text-gray-500">{t('pickupDashboardMileage')}</p>
          <p className="break-words text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
            {source.mileage === undefined ? t('pickupDashboardUnavailable') : source.mileage.toLocaleString(lang)}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-100 p-3 sm:p-4">
          <p className="mb-2 break-words text-xs font-medium text-gray-500">{energyLabel}</p>
          {source.energyPercent === undefined ? (
            <p className="break-words text-sm text-gray-500">{t('pickupDashboardUnavailable')}</p>
          ) : electric ? (
            <p className="text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{source.energyPercent.toLocaleString(lang)}%</p>
          ) : (
            <div role="img" aria-label={`${energyLabel}: ${filledBars}/8`} className="flex h-6 items-center gap-1 sm:h-7">
              <span aria-hidden="true" className="text-xs font-bold text-gray-500">E</span>
              {Array.from({ length: 8 }, (_, index) => (
                <span aria-hidden="true" key={index} className={`h-full min-w-0 flex-1 rounded-sm ${index < filledBars! ? 'bg-primary' : 'bg-gray-200'}`} />
              ))}
              <span aria-hidden="true" className="text-xs font-bold text-gray-500">F</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-orange-50 p-3 text-sm font-medium leading-relaxed text-orange-800">
        <AlertTriangle aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-primary" />
        <p>{t(electric ? 'pickupDashboardBatteryNotice' : 'pickupDashboardFuelNotice')}</p>
      </div>
    </section>
  );
}
