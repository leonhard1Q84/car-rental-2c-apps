import React, { useContext, useState } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { usePublishedInspection } from './inspection/usePublishedInspection';
import type { VehicleAssignment } from './bookingFixtures';
import { publishedTripAssignment } from './PublishedPreparationTripSummary';
import type { InspectionLoadState } from './inspection/model';
import { InspectionPhotoImage, InspectionPhotoViewer } from './inspection/InspectionPhotos';

export function TripVehicleContent({ state, assignment, onRetry }: { state: InspectionLoadState; assignment?: VehicleAssignment; onRetry: () => void }) {
  const { t } = useContext(LanguageContext);
  const [viewing, setViewing] = useState(false);
  const snapshot = (assignment === undefined || assignment.status === 'ASSIGNED') && state.status === 'ready' ? state.snapshot : null;
  const currentAssignment = assignment ? publishedTripAssignment(state.orderId, state, assignment) : undefined;
  const credit = currentAssignment?.status === 'ASSIGNED' ? currentAssignment.imageCredit : undefined;
  const photo = snapshot?.groups.exteriorAndDamage?.photos[0];
  const photoLabel = photo?.labelKey ? t(photo.labelKey) : t('prepInspectionVehicle');
  return <section data-trip-vehicle className="rounded-lg bg-white p-4 shadow-sm">
    <h2 className="mb-3 font-bold text-gray-800">{t('prepInspectionVehicle')}</h2>
    {snapshot ? <div className="flex items-start gap-3">
      <div className="w-24 shrink-0">{photo ? <InspectionPhotoImage photo={photo} label={photoLabel} onOpen={() => setViewing(true)} />
        : <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500">{t('prepInspectionNoPhotos')}</p>}</div>
      <dl className="min-w-0 flex-1 space-y-3 text-sm">
        {[[t('prepInspectionModel'), snapshot.vehicle.model], [t('prepInspectionPlate'), snapshot.vehicle.plate]].map(([label, value]) =>
          <div key={label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><dt className="text-gray-500">{label}</dt><dd className="break-words text-right font-medium text-gray-800">{value || t('prepInspectionMissing')}</dd></div>)}
      </dl>
    </div> : <div role={state.status === 'error' ? 'alert' : 'status'} className="text-sm leading-6 text-gray-600">
      <p>{t(state.status === 'loading' ? 'prepLoading' : state.status === 'error' ? 'prepInspectionLoadError' : 'prepInspectionEmpty')}</p>
      {state.status === 'error' && <button type="button" onClick={onRetry} className="mt-2 min-h-11 rounded-lg border border-primary px-4 font-semibold text-primary-dark">{t('prepRetry')}</button>}
    </div>}
    {credit && <a href={credit.source} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center rounded text-xs text-gray-500 underline focus-visible:outline-2 focus-visible:outline-primary">{t('prepVehicleReferencePhoto')} · {credit.author} · {credit.license}</a>}
    {viewing && photo && <InspectionPhotoViewer photo={photo} label={photoLabel} position={1} total={1} onPrevious={() => {}} onNext={() => {}} onClose={() => setViewing(false)} />}
  </section>;
}

export function PreparationTripVehicle({ orderId, assignment }: { orderId: string; assignment?: VehicleAssignment }) {
  const { state, retry } = usePublishedInspection(orderId);
  return <TripVehicleContent key={orderId} state={state} assignment={assignment} onRetry={retry} />;
}
