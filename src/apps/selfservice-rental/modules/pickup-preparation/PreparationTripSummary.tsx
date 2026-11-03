import React, { useContext } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import ReservationDetailsScreen from '../../components/ReservationDetailsScreen';
import vehiclePlaceholder from '../../assets/vehicle-placeholder.svg';
import type { VehicleAssignment, VehicleFuelType } from './bookingFixtures';
import regularSign from '../../assets/fuel-signs/jp-regular.svg';
import premiumSign from '../../assets/fuel-signs/jp-premium.svg';
import dieselSign from '../../assets/fuel-signs/jp-diesel.svg';

const fuelDisplay: Record<VehicleFuelType, { label: 'prepFuelTypeRegular' | 'prepFuelTypeHighOctane' | 'prepFuelTypeDiesel' | 'prepFuelTypeElectric'; image?: string }> = {
  regular: { label: 'prepFuelTypeRegular', image: regularSign },
  highOctane: { label: 'prepFuelTypeHighOctane', image: premiumSign },
  diesel: { label: 'prepFuelTypeDiesel', image: dieselSign },
  electric: { label: 'prepFuelTypeElectric' },
};

type Reservation = React.ComponentProps<typeof ReservationDetailsScreen>['orderDetails'];

export function PreparationTripSummary({ reservation, vehicleModel, vehicleAssignment = { status: 'UNASSIGNED' }, onDetails, vehicleNotice }: { vehicleNotice?: React.ReactNode; reservation: Reservation; vehicleModel: string; vehicleAssignment?: VehicleAssignment; onDetails: () => void }) {
  const { t } = useContext(LanguageContext);
  const fuel = vehicleAssignment.status === 'ASSIGNED' && vehicleAssignment.fuelType && Object.prototype.hasOwnProperty.call(fuelDisplay, vehicleAssignment.fuelType)
    ? fuelDisplay[vehicleAssignment.fuelType] : undefined;
  return <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="p-4">
      <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-gray-700"><span>{t('orderNumber')}</span><span className="break-all text-lg font-semibold tracking-wide text-gray-900">{reservation.orderNumber}</span></p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3"><dt className="text-gray-500">{t('driverName')}</dt><dd className="min-w-0 break-words text-right font-medium text-gray-900">{reservation.customer.name}</dd></div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3"><dt className="text-gray-500">{t('contactPhone')}</dt><dd className="min-w-0 break-all text-right font-medium text-gray-900">{reservation.customer.phone}</dd></div>
      </dl>
      {vehicleNotice ?? <div data-vehicle-assignment={vehicleAssignment.status} className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-start gap-3">
          <div className="w-32 shrink-0 max-[399px]:w-[104px]">
          <img src={vehicleAssignment.status === 'ASSIGNED' ? vehicleAssignment.imageUrl || vehiclePlaceholder : vehiclePlaceholder} alt="" width={128} height={88} className="h-[88px] w-32 shrink-0 rounded-lg bg-gray-50 object-contain max-[399px]:h-[72px] max-[399px]:w-[104px]" onError={event => { if (event.currentTarget.getAttribute('src') !== vehiclePlaceholder) event.currentTarget.src = vehiclePlaceholder; }} />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            {vehicleAssignment.status === 'UNASSIGNED' && <p className="text-xs text-gray-500">{t('prepBookedVehicle')}</p>}
            {vehicleAssignment.status === 'ASSIGNED' ? <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1.5 text-sm">
              <div className="contents"><dt className="text-xs leading-5 text-gray-500">{t('prepVehicleModel')}</dt><dd className="min-w-0 break-words font-semibold leading-5 text-gray-900">{vehicleAssignment.model || t('prepInspectionMissing')}</dd></div>
              <div className="contents"><dt className="text-xs leading-5 text-gray-500">{t('prepVehiclePlate')}</dt><dd className="min-w-0 break-words font-medium leading-5 text-gray-700">{vehicleAssignment.plate || t('prepInspectionMissing')}</dd></div>
              <div className="contents">
                <dt className="self-center text-xs leading-5 text-gray-500">{t('prepVehicleFuel')}</dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5">
                  <span className="min-w-0 break-words font-medium text-gray-900">{fuel ? t(fuel.label) : t('prepInspectionMissing')}</span>
                  {fuel?.image && <img key={fuel.image} data-fuel-sign={vehicleAssignment.fuelType} src={fuel.image} alt={t(fuel.label)} width={72} height={27} className="h-auto w-[72px] max-w-full object-contain" onError={event => { event.currentTarget.hidden = true; }} />}
                </dd>
              </div>
            </dl> : <><h2 className="mt-1 break-words text-sm font-semibold leading-6 text-gray-900">{vehicleModel}</h2><p className="mt-0.5 break-words text-xs font-normal leading-5 text-gray-500">{t('prepSimilarVehicle')}</p><p className="mt-2 text-xs text-gray-500">{t('prepVehicleUnassigned')}</p></>}
          </div>
        </div>

      </div>}
      <dl className="mt-5 space-y-4">
        {[
          { timeLabel: 'pickupTime', locationLabel: 'pickupLocation', time: reservation.rentalPeriod.start, location: reservation.pickupLocation },
          { timeLabel: 'returnTime', locationLabel: 'returnLocation', time: reservation.rentalPeriod.end, location: reservation.returnLocation },
        ].map(item => <div key={item.timeLabel} className="border-l-2 border-primary/30 pl-3">
          <dt className="text-xs font-medium text-primary-dark">{t(item.timeLabel as 'pickupTime' | 'returnTime')}</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-gray-900">{item.time}</dd>
          <dd className="mt-1 flex items-start gap-1 text-sm text-gray-600"><MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0" /><span><span className="sr-only">{t(item.locationLabel as 'pickupLocation' | 'returnLocation')} </span>{item.location}</span></dd>
        </div>)}
      </dl>
    </div>
    <button type="button" onClick={onDetails} className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-primary-dark hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
      {t('prepViewTripDetails')}<ChevronRight size={17} aria-hidden="true" className="shrink-0" />
    </button>
  </section>;
}
