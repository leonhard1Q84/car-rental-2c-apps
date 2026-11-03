import { newDraft, requiredDocumentPages, type Photo } from './model';
import { preparationMaterials } from './materials';
import { resolveRentalMaterialConfiguration, updateRentalMaterialConfirmation } from '../../components/rentalContractConfirmation';

// Separate fixture: existing PREP01/PREP02 records are never reset by review demos.
export function rejectedPreparationFixture(orderId = 'PREP03') {
  const draft = newDraft(orderId);
  const resolution = resolveRentalMaterialConfiguration(preparationMaterials(draft), draft.language);
  for (const group of resolution.groups) {
    draft.confirmation = updateRentalMaterialConfirmation({ resolution, currentRecord: draft.confirmation,
      materialGroup: group.materialGroup, confirmed: true });
  }
  draft.bookingConfirmed = true;
  draft.identityConfirmed = true;
  draft.submittedSteps = { booking: true, drivers: true, terms: true };
  draft.submittedAt = '2026-10-19T08:00:00Z';
  draft.documentReview = { state: 'REJECTED', rejectedDocumentTypes: ['licence'], reviewedAt: '2026-10-19T08:10:00Z', rejectionReasonKey: 'prepReviewSampleReason' };
  const photos: Photo[] = requiredDocumentPages(draft.drivers[0]).map(slot => ({
    ...slot, id: `sample-${slot.kind}-${slot.page}`, driverId: 'primary', name: `SAMPLE-${slot.kind}-${slot.page}.svg`,
    blob: new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380"><rect width="600" height="380" fill="#f3f4f6"/><text x="35" y="150" font-family="sans-serif" font-size="30">SAMPLE - ${slot.kind} ${slot.page}</text><text x="35" y="210" font-family="sans-serif" font-size="24">${draft.orderId} - DEMO DOCUMENT</text></svg>`], { type: 'image/svg+xml' })
  }));
  return { draft, photos };
}

export function approvedPreparationFixture() {
  const record = rejectedPreparationFixture('PREP05');
  record.draft.documentReview = { state: 'APPROVED', reviewedAt: '2026-10-19T08:10:00Z' };
  return record;
}
