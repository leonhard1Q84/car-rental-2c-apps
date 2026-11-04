import React, { useContext } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { VehicleAssignment } from '../../app/customer-journey/bookingFixtures';
import type { InspectionLoadState } from '../selfservice-rental/pickup/inspection/model';
import { usePublishedInspection } from '../selfservice-rental/pickup/inspection/usePublishedInspection';
import { PreparationTripSummary } from './PreparationTripSummary';

export function publishedTripAssignment(orderId: string, state: InspectionLoadState, assignment: VehicleAssignment): VehicleAssignment | undefined {
  if (state.orderId !== orderId || state.status === 'loading' || state.status === 'error') return undefined;
  if (state.status === 'empty') return assignment;
  if (state.snapshot.orderId !== orderId) return undefined;
  const { model, plate } = state.snapshot.vehicle;
  const sameVehicle = assignment.status === 'ASSIGNED' && Boolean(plate.trim()) && assignment.plate === plate;
  const cleanModel = model.replace(/\s+or\s+similar\s*$/i, '').trim();
  const matchingImage = sameVehicle && assignment.model.toLowerCase() === cleanModel.toLowerCase();
  const imageUrl = matchingImage ? assignment.imageUrl : undefined;
  const imageCredit = imageUrl && matchingImage ? assignment.imageCredit : undefined;
  return { status: 'ASSIGNED', ...(imageUrl ? { imageUrl } : {}), ...(imageCredit ? { imageCredit } : {}), model: model.replace(/\s+or\s+similar\s*$/i, '').trim(), plate, ...(sameVehicle ? { fuelType: assignment.fuelType, specs: assignment.specs } : {}) };
}

export function PublishedPreparationTripSummary({ orderId, ...props }: React.ComponentProps<typeof PreparationTripSummary> & { orderId: string }) {
  const { t } = useContext(LanguageContext);
  const { state, retry } = usePublishedInspection(orderId);
  const assignment = publishedTripAssignment(orderId, state, props.vehicleAssignment ?? { status: 'UNASSIGNED' });
  const notice = assignment ? undefined : <div className="mt-4 border-t border-customer-border-subtle pt-4 text-customer-body text-customer-text-secondary" role={state.status === 'error' ? 'alert' : 'status'}>
    <p>{t(state.status === 'loading' ? 'prepLoading' : 'prepInspectionLoadError')}</p>
    {state.status !== 'loading' && <button type="button" onClick={retry} className="mt-2 min-h-11 rounded-customer-control border border-customer-brand px-4 text-customer-label text-customer-brand-text">{t('prepRetry')}</button>}
  </div>;
  return <PreparationTripSummary {...props} vehicleAssignment={assignment} vehicleNotice={notice} />;
}
