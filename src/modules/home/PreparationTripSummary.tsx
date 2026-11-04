import React, { useContext, useState } from 'react';
import { ChevronRight, MapPin, Check, Copy, User, Clock, HelpCircle, CarFront, Luggage, SlidersHorizontal } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import ReservationDetailsScreen from '../../components/ReservationDetailsScreen';
import type { VehicleAssignment, VehicleFuelType } from '../../app/customer-journey/bookingFixtures';
import { getVehiclePhoto } from './vehicleImages';
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

export function PreparationTripSummary({
  reservation,
  vehicleModel,
  vehicleAssignment = { status: 'UNASSIGNED' },
  onDetails,
  vehicleNotice,
  orderStatus = 'CONFIRMED',
}: {
  vehicleNotice?: React.ReactNode;
  reservation: Reservation;
  vehicleModel: string;
  vehicleAssignment?: VehicleAssignment;
  onDetails: () => void;
  orderStatus?: 'CONFIRMED' | 'IN_RENTAL' | 'RETURNED' | 'READY_FOR_PICKUP';
}) {
  const { t } = useContext(LanguageContext);
  const [orderNumberCopied, setOrderNumberCopied] = useState(false);
  const [orderNumberCopyFailed, setOrderNumberCopyFailed] = useState(false);
  const fuel = vehicleAssignment.status === 'ASSIGNED' && vehicleAssignment.fuelType && Object.prototype.hasOwnProperty.call(fuelDisplay, vehicleAssignment.fuelType)
    ? fuelDisplay[vehicleAssignment.fuelType] : undefined;

  const vehiclePhoto = getVehiclePhoto(
    vehicleAssignment.status === 'ASSIGNED' ? vehicleAssignment.model : vehicleModel,
    vehicleModel,
    vehicleAssignment.status === 'ASSIGNED' ? vehicleAssignment.imageUrl : undefined
  );

  const durationDays = reservation.rentalPeriod.duration || '3';

  const statusLabel = orderStatus === 'IN_RENTAL'
    ? t('prepStatusInRental')
    : orderStatus === 'RETURNED'
      ? t('prepStatusReturned')
      : orderStatus === 'READY_FOR_PICKUP'
        ? t('prepStatusReadyForPickup')
        : t('prepStatusConfirmed');

  const copyOrderNumber = async () => {
    setOrderNumberCopied(false);
    setOrderNumberCopyFailed(false);
    try {
      await navigator.clipboard.writeText(reservation.orderNumber);
      setOrderNumberCopied(true);
      setTimeout(() => setOrderNumberCopied(false), 2000);
    } catch {
      setOrderNumberCopyFailed(true);
    }
  };

  return (
    <section className="overflow-hidden rounded-customer-card border border-customer-border bg-customer-card shadow-customer-card space-y-4">
      <div className="p-5 pb-4">
        {/* 顶部单据资料与状态徽章 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-customer-border-subtle">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={onDetails}
                aria-label={`${t('prepViewTripDetails')} ${reservation.orderNumber}`}
                className="group inline-flex min-h-11 items-center gap-1 rounded-customer-control pr-1 font-mono text-xl font-black tracking-tight text-customer-text focus-visible:outline-2 focus-visible:outline-customer-brand"
              >
                <span>{reservation.orderNumber}</span>
                <ChevronRight className="h-4 w-4 text-customer-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-customer-brand-text" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={copyOrderNumber}
                aria-label={t(orderNumberCopied ? 'prepOrderNumberCopied' : 'prepCopyOrderNumber')}
                className={`inline-flex items-center gap-1 rounded-customer-control px-2 py-0.5 text-customer-caption font-medium hover:bg-customer-inset focus-visible:outline-2 focus-visible:outline-customer-brand ${orderNumberCopied ? 'text-customer-success-text' : 'text-customer-text-secondary'}`}
              >
                {orderNumberCopied
                  ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{t(orderNumberCopied ? 'prepOrderNumberCopied' : 'prepCopyOrderNumber')}</span>
              </button>
            </div>
            {orderNumberCopyFailed && (
              <p role="alert" className="mt-1 text-customer-caption text-customer-danger-text">
                {t('prepCopyFailed')}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-customer-caption font-semibold text-emerald-700 shadow-2xs">
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{statusLabel}</span>
          </span>
        </div>

        {/* 主驾驶人卡片 */}
        <div className="mt-3.5 flex items-center gap-3 rounded-customer-inset border border-customer-border-subtle bg-customer-inset p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-customer-border bg-customer-card text-customer-text-secondary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-customer-body-strong text-customer-text">
                {reservation.customer.name}
              </span>
              <span className="text-customer-caption text-customer-text-tertiary">
                {t('mainDriver')}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono text-customer-caption text-customer-text-secondary">
              {reservation.customer.phone} {reservation.customer.email && `· ${reservation.customer.email}`}
            </p>
          </div>
        </div>

        {/* 车辆信息卡片 */}
        {vehicleNotice ?? (
          <div data-vehicle-assignment={vehicleAssignment.status} className="mt-4 rounded-customer-inset border border-customer-border-subtle bg-customer-inset/50 p-3.5">
            <div className="flex items-start gap-3.5">
              <div className="w-28 shrink-0 max-[399px]:w-24">
                <img
                  src={vehiclePhoto}
                  alt={vehicleAssignment.status === 'ASSIGNED' ? vehicleAssignment.model : vehicleModel}
                  width={112}
                  height={76}
                  className="h-[76px] w-28 shrink-0 rounded-lg border border-customer-border bg-white object-cover shadow-2xs max-[399px]:h-[64px] max-[399px]:w-24"
                  onError={event => {
                    if (event.currentTarget.src !== vehiclePhoto) {
                      event.currentTarget.src = vehiclePhoto;
                    }
                  }}
                />
                {vehicleAssignment.status === 'ASSIGNED' && (
                  <div className="mt-1.5 text-center">
                    {vehicleAssignment.plate ? (
                      <span className="inline-block max-w-full break-words rounded border border-customer-border-strong bg-customer-card px-1.5 py-0.5 font-mono text-[11px] font-bold leading-4 text-customer-text shadow-2xs">
                        {vehicleAssignment.plate}
                      </span>
                    ) : (
                      <span className="text-customer-caption text-customer-text-tertiary">{t('prepInspectionMissing')}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {vehicleAssignment.status === 'ASSIGNED' ? (
                  <div className="space-y-1.5">
                    <h3 className="break-words text-customer-body-strong leading-snug text-customer-text">
                      {vehicleAssignment.model || t('prepInspectionMissing')}
                    </h3>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-customer-caption">
                      <span className="font-semibold text-customer-text">
                        {fuel ? t(fuel.label) : t('prepInspectionMissing')}
                      </span>
                      {fuel?.image && (
                        <img
                          key={fuel.image}
                          data-fuel-sign={vehicleAssignment.fuelType}
                          src={fuel.image}
                          alt={t(fuel.label)}
                          width={72}
                          height={27}
                          className="h-auto w-[68px] max-w-full object-contain"
                          onError={event => { event.currentTarget.hidden = true; }}
                        />
                      )}
                    </div>
                    {vehicleAssignment.specs && (
                      <ul className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-0.5 text-[11px] font-medium text-customer-text-secondary">
                        <li data-vehicle-spec="doors" className="inline-flex items-center gap-1 whitespace-nowrap">
                          <CarFront className="h-3.5 w-3.5 text-customer-text-tertiary" strokeWidth={1.8} aria-hidden="true" />
                          <span>{vehicleAssignment.specs.doors}{t('prepDoors')}</span>
                        </li>
                        <li data-vehicle-spec="luggage" className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Luggage className="h-3.5 w-3.5 text-customer-text-tertiary" strokeWidth={1.8} aria-hidden="true" />
                          <span>{vehicleAssignment.specs.luggage}{t('prepLuggage')}</span>
                        </li>
                        <li data-vehicle-spec="transmission" className="inline-flex items-center gap-1 whitespace-nowrap">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-customer-text-tertiary" strokeWidth={1.8} aria-hidden="true" />
                          <span>{t(vehicleAssignment.specs.transmission === 'automatic' ? 'prepAutomatic' : 'prepManual')}</span>
                        </li>
                      </ul>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-customer-caption text-customer-text-tertiary">
                      {t('prepBookedVehicle')}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <h3 className="break-words text-customer-body-strong text-customer-text">
                        {vehicleModel}
                      </h3>
                      <span className="inline-flex items-center gap-0.5 rounded border border-customer-border bg-customer-card px-1.5 py-0.5 text-customer-caption text-customer-text-secondary shadow-2xs">
                        <span>{t('prepSimilarVehicle')}</span>
                        <HelpCircle className="h-3 w-3 text-customer-text-tertiary" />
                      </span>
                    </div>
                    <p className="mt-1.5 text-customer-caption text-customer-text-tertiary">
                      {t('prepVehicleUnassigned')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 纵向旅程时间轴 (Journey Timeline) */}
        <div className="relative mt-5 pl-6 pt-1">
          {/* 左侧垂直连接虚线 */}
          <div className="absolute bottom-5 left-2 top-4 w-0.5 border-l-2 border-dashed border-customer-border" />

          {/* 取车节点 */}
          <div className="relative pb-4">
            <span className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-blue-600 bg-white ring-4 ring-blue-100" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-customer-label font-bold text-customer-text">
                  {t('pickupTime')}
                </span>
                <span className="font-mono text-customer-body-strong tabular-nums text-customer-text">
                  {reservation.rentalPeriod.start}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 rounded-customer-inset border border-customer-border-subtle bg-customer-inset p-2.5 text-customer-body text-customer-text-secondary">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-customer-text-tertiary" />
                <span className="break-words">
                  <span className="sr-only">{t('pickupLocation')} </span>
                  {reservation.pickupLocation}
                </span>
              </div>
            </div>
          </div>

          {/* 租期天数胶囊 */}
          <div className="relative -ml-2 py-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-customer-border-subtle bg-customer-card px-2.5 py-0.5 text-customer-caption font-medium text-customer-text-secondary shadow-2xs">
              <Clock className="h-3 w-3 text-customer-text-tertiary" />
              <span>{t('prepRentalDuration')}{durationDays}{t('prepDays')}{t('prepLocalTimeBasis')}</span>
            </span>
          </div>

          {/* 还车节点 */}
          <div className="relative pt-3">
            <span className="absolute -left-6 top-4 h-3 w-3 rounded-full border-2 border-emerald-600 bg-white ring-4 ring-emerald-100" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-customer-label font-bold text-customer-text">
                  {t('returnTime')}
                </span>
                <span className="font-mono text-customer-body-strong tabular-nums text-customer-text">
                  {reservation.rentalPeriod.end}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 rounded-customer-inset border border-customer-border-subtle bg-customer-inset p-2.5 text-customer-body text-customer-text-secondary">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-customer-text-tertiary" />
                <span className="break-words">
                  <span className="sr-only">{t('returnLocation')} </span>
                  {reservation.returnLocation}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
