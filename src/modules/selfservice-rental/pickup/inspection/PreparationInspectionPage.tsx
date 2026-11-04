import { inspectionReviewRevision } from '@shared/contracts/inspectionReviewBinding';
import React, { useContext, useEffect, useState } from 'react';
import { Car, ClipboardList, Images, Loader2 } from 'lucide-react';
import { LanguageContext } from '../../../../contexts/LanguageContext';
import { InspectionPhotoImage, InspectionPhotoViewer } from './InspectionPhotos';
import { formatInspectionValue, inspectionGroupOrder, inspectionGroupTitles, type InspectionGroupId, type InspectionLoadState, type PublishedInspection } from './model';
import { usePublishedInspection } from './usePublishedInspection';
import { adjacentPhotoIndex, inspectionGallery } from './gallery';
import { InspectionCaptureSection } from './InspectionCaptureSection';
import { captureKey } from './capture';
import { preparationBooking } from '../../../../app/customer-journey/bookingFixtures';
import { Button } from '../../../../design/ui';

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 py-1"><dt className="text-customer-label text-customer-text-tertiary">{label}</dt><dd className="min-w-0 break-words text-right text-customer-body-strong">{value}</dd></div>;
}

const ReadyInspection: React.FC<{ snapshot: PublishedInspection; review?: (snapshot: PublishedInspection) => React.ReactNode }> = ({ snapshot, review }) => {
  const { t, lang } = useContext(LanguageContext);
  const [selected, setSelected] = useState<{ group: InspectionGroupId; index: number } | null>(null);
  const [visibleSnapshot, setVisibleSnapshot] = useState(snapshot);
  const [pendingSnapshot, setPendingSnapshot] = useState<PublishedInspection | null>(null);
  useEffect(() => {
    if (snapshot.revision === visibleSnapshot.revision) return;
    if (selected) setPendingSnapshot(snapshot);
    else setVisibleSnapshot(snapshot);
  }, [selected, snapshot, visibleSnapshot.revision]);
  useEffect(() => {
    if (selected || !pendingSnapshot) return;
    setVisibleSnapshot(pendingSnapshot);
    setPendingSnapshot(null);
  }, [pendingSnapshot, selected]);
  const activeSnapshot = visibleSnapshot;
  const selectedPhoto = selected && activeSnapshot.groups[selected.group]?.photos[selected.index];
  const gallery = inspectionGallery(activeSnapshot);
  const galleryIndex = selected ? gallery.findIndex(item => item.group === selected.group && item.index === selected.index) : -1;
  function movePhoto(direction: -1 | 1) {
    setSelected(current => {
      const index = gallery.findIndex(item => item.group === current?.group && item.index === current?.index);
      const next = adjacentPhotoIndex(index, direction, gallery.length);
      return next === null ? current : { group: gallery[next].group, index: gallery[next].index };
    });
  }
  const vehiclePhoto = activeSnapshot.groups.exteriorAndDamage?.photos[0];
  const photoLabel = (group: InspectionGroupId, index: number) => {
    const photo = activeSnapshot.groups[group]?.photos[index];
    return photo?.labelKey ? t(photo.labelKey) : `${t(inspectionGroupTitles[group])} · ${index + 1}`;
  };
  const mileage = formatInspectionValue(activeSnapshot.metrics.mileage, lang);
  const energy = formatInspectionValue(activeSnapshot.metrics.energyPercent, lang, 100);
  return <>
    <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
      <div className="mb-3 flex items-center gap-2"><Car size={20} className="text-customer-brand-text" aria-hidden="true" /><h2 className="min-w-0 flex-1 text-customer-title">{t('prepInspectionVehicle')}</h2></div>
      <div className="flex items-start gap-3">
        <div className="w-20 shrink-0 min-[380px]:w-24" data-inspection-vehicle-photo>
          {vehiclePhoto ? <InspectionPhotoImage photo={vehiclePhoto} label={photoLabel('exteriorAndDamage', 0)} onOpen={() => setSelected({ group: 'exteriorAndDamage', index: 0 })} />
            : <p className="flex aspect-[4/3] items-center justify-center rounded-customer-inset bg-customer-inset p-2 text-center text-customer-caption text-customer-text-tertiary">{t('prepInspectionNoPhotos')}</p>}
        </div>
      <dl className="min-w-0 flex-1">
        <Row label={t('prepInspectionModel')} value={activeSnapshot.vehicle.model} />
        <Row label={t('prepInspectionPlate')} value={activeSnapshot.vehicle.plate} />
      </dl>
      </div>
    </section>
    {review?.(activeSnapshot)}
    {inspectionGroupOrder.map(groupId => {
      const group = activeSnapshot.groups[groupId];
      return <section key={groupId} data-inspection-group={groupId} className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
        <div className="mb-3 flex items-start gap-2"><Images size={18} className="mt-0.5 shrink-0 text-customer-brand-text" aria-hidden="true" /><h2 className="min-w-0 text-customer-body-strong">{t(inspectionGroupTitles[groupId])}</h2></div>
        {group?.photos.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{group.photos.map((photo, index) => <figure key={photo.id} className="min-w-0">
          <InspectionPhotoImage photo={photo} label={photoLabel(groupId, index)} onOpen={() => setSelected({ group: groupId, index })} />
          {!['keyStoragePhotos', 'etcDevicePhotos', 'inspectionAndPaperChecklist'].includes(groupId) && <figcaption className="mt-1.5 break-words text-customer-caption text-customer-text-secondary">{photoLabel(groupId, index)}</figcaption>}
        </figure>)}</div>
          : <p className="text-customer-body text-customer-text-tertiary">{t('prepInspectionNoPhotos')}</p>}
        {groupId === 'metrics' && <dl className="mt-3">
          <Row label={t('prepInspectionMileage')} value={mileage ?? t('prepInspectionMissing')} />
          <Row label={t(activeSnapshot.metrics.energyType === 'BATTERY' ? 'prepInspectionBattery' : 'prepInspectionFuel')} value={energy === null ? t('prepInspectionMissing') : `${energy}%`} />
        </dl>}
      </section>;
    })}
    {review && <div data-inspection-footer-space aria-hidden="true" style={{ height: "var(--inspection-footer-space, 240px)" }} />}
    {selected && selectedPhoto && <InspectionPhotoViewer photo={selectedPhoto} label={photoLabel(selected.group, selected.index)}
      position={galleryIndex + 1} total={gallery.length} onPrevious={() => movePhoto(-1)} onNext={() => movePhoto(1)} onClose={() => setSelected(null)} />}
  </>;
};

export function InspectionPageContent({ state, onRetry, onBack = () => {}, onContract, onConfirmed, onBusy, sequential }: { state: InspectionLoadState; onRetry: () => void; onBack?: () => void; onContract?: () => void; onConfirmed?: () => Promise<void>; onBusy?: (busy: boolean) => void; sequential?: boolean }) {
  const { t } = useContext(LanguageContext);
  if (state.status === 'loading') return <div className="flex min-h-64 items-center justify-center gap-2 text-customer-body text-customer-text-secondary" role="status"><Loader2 size={20} className="animate-spin text-customer-brand-text" aria-hidden="true" />{t('prepLoading')}</div>;
  return <>
      {state.status === 'ready' ? <>
      {state.refreshError && <p role="alert" className="text-customer-body text-customer-danger-text">{t('prepInspectionLoadError')}<button type="button" className="min-h-11 px-3 underline" onClick={onRetry}>{t('prepRetry')}</button></p>}
      <ReadyInspection snapshot={state.snapshot} review={(snapshot) => <InspectionCaptureSection key={captureKey(snapshot)} binding={{ orderId: snapshot.orderId, vehicleId: snapshot.vehicleId, revision: inspectionReviewRevision(snapshot), photoRevision: snapshot.revision }} readyToConfirm={!state.refreshError && snapshot.readyToConfirm !== false} missingFields={snapshot.missingFields} sequential={sequential} onConfirmed={onConfirmed} onBusy={onBusy} publicationId={snapshot.publicationId} publishedAt={snapshot.publishedAt} onBack={onBack} onContract={onContract} onReload={onRetry} phone={preparationBooking(state.orderId).storePhone} />} />
    </> : <section className="rounded-customer-card border border-customer-border bg-customer-card p-5 text-center shadow-customer-card">
      <ClipboardList size={30} className="mx-auto mb-3 text-customer-brand-text" aria-hidden="true" />
      <p className="text-customer-body text-customer-text-secondary" role={state.status === 'error' ? 'alert' : 'status'}>{t(state.status === 'error' ? 'prepInspectionLoadError' : 'prepInspectionEmpty')}</p>
      {state.status === 'error' && <Button size="md" onClick={onRetry} className="mt-3">{t('prepRetry')}</Button>}
    </section>}
  </>;
}

export function PreparationInspectionPage({ orderId, onBack, onContract, onConfirmed, onBusy, sequential }: { orderId: string; onBack: () => void; onContract?: () => void; onConfirmed?: () => Promise<void>; onBusy?: (busy: boolean) => void; sequential?: boolean }) {
  const { state, retry } = usePublishedInspection(orderId);
  return <InspectionPageContent state={state} onRetry={retry} onBack={onBack} onContract={onContract} onConfirmed={onConfirmed} onBusy={onBusy} sequential={sequential} />;
}
