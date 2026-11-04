import type { InspectionReviewState } from './inspection/reviewStatus';

export function pickupJourneyState(review: InspectionReviewState, signed: boolean, selected: 1 | 2 | null, previousRevision?: string) {
  const confirmed = review.status === 'ready' && Boolean(review.confirmation);
  const canSign = signed || confirmed;
  return {
    confirmed, canSign, current: (canSign ? selected ?? 2 : 1) as 1 | 2,
    changed: review.status === 'ready' && previousRevision !== undefined && review.snapshot.revision !== previousRevision && !confirmed && !signed,
  };
}
