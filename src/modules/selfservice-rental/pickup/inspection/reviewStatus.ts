import { inspectionReviewRevision } from '@shared/contracts/inspectionReviewBinding';
import { loadPublishedInspection } from './fixtures';
import { captureRepository } from './captureStorage';
import { assertCaptureRecord, type CaptureBinding, type CaptureRecord, type CaptureRepository } from './capture';
import type { PublishedInspection } from './model';
import { customerInspectionApiConfigured } from '@shared/services/customerInspectionApi';

export type InspectionReviewState =
  | { status: 'loading' | 'empty' | 'error'; orderId: string }
  | { status: 'ready'; orderId: string; snapshot: PublishedInspection; confirmation?: CaptureRecord['confirmation'] };

export async function assertCurrentInspection(binding: CaptureBinding, confirmed = false) {
  try {
    const current = await loadPublishedInspection(binding.orderId);
    if (current && current.orderId === binding.orderId && current.vehicleId === binding.vehicleId
      && inspectionReviewRevision(current) === binding.revision
      && (confirmed || ((!binding.photoRevision || current.revision === binding.photoRevision) && current.readyToConfirm !== false))) return;
  } catch { /* Unreadable publications cannot accept an earlier version's confirmation. */ }
  throw new Error('INSPECTION_OUTDATED');
}

// Homepage and signing read the same version-bound confirmation; viewing is never completion.
export async function loadInspectionReview(orderId: string, repository: CaptureRepository = captureRepository): Promise<InspectionReviewState> {
  const snapshot = await loadPublishedInspection(orderId);
  if (!snapshot) return { status: 'empty', orderId };
  if (customerInspectionApiConfigured()) {
    const review = snapshot.customerReview;
    const confirmedScope = review?.reviewRevision ?? review?.confirmation?.reviewRevision ?? review?.confirmedRevision;
    const sameRevision = (confirmedScope === undefined || String(confirmedScope) === inspectionReviewRevision(snapshot))
      && (!review?.confirmation?.orderId || review.confirmation.orderId === orderId)
      && (!review?.confirmation?.vehicleId || review.confirmation.vehicleId === snapshot.vehicleId);
    if (review?.status === 'CONFIRMED' && sameRevision && review.confirmedAt) {
      const locale = review.confirmation?.locale;
      const language = locale === 'zh-TW' || locale === 'en' || locale === 'ja' || locale === 'ko' || locale === 'th' ? locale : 'zh-CN';
      return { status: 'ready', orderId, snapshot, confirmation: {
        at: review.confirmedAt,
        language,
        statement: review.confirmation?.declarationVersion ?? 'REMOTE_CONFIRMATION',
      } };
    }
    return { status: 'ready', orderId, snapshot };
  }
  const binding = { ...snapshot, revision: inspectionReviewRevision(snapshot) };
  const record = await repository.load(binding);
  if (record) assertCaptureRecord(record, binding);
  // Partial synchronized records are viewable. Completeness is enforced at first confirmation.
  const current = await loadPublishedInspection(orderId);
  if (!current || current.vehicleId !== snapshot.vehicleId || inspectionReviewRevision(current) !== binding.revision) throw new Error('INSPECTION_OUTDATED');
  return { status: 'ready', orderId, snapshot, confirmation: record?.confirmation };
}

export function inspectionReviewPresentation(state: InspectionReviewState) {
  switch (state.status) {
    case 'loading': return { status: 'prepLoading', action: 'prepInspectionView', confirmed: false } as const;
    case 'error': return { status: 'prepInspectionReadFailed', action: 'prepRetry', confirmed: false } as const;
    case 'empty': return { status: 'prepInspectionPending', action: 'prepViewInfo', confirmed: false } as const;
    case 'ready': return { status: state.confirmation ? 'prepCaptureConfirmed' : 'prepInspectionAwaitingReview', action: 'prepInspectionView', confirmed: Boolean(state.confirmation) } as const;
  }
}
