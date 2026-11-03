import type { Photo, PreparationDraft, PreparationReview, RejectedDocumentType } from './model';

export function preparationDriverStepLabel(draft: PreparationDraft, completed: boolean) {
  if (draft.documentReview?.state === 'REJECTED') return 'prepStepRejected';
  if (draft.submittedAt) {
    return draft.documentReview?.state === 'APPROVED' ? 'prepStepApproved' : 'prepSubmitted';
  }
  return completed ? 'prepCompleted' : 'prepTodo';
}

export function isPreparationCorrection(draft: PreparationDraft): boolean {
  return draft.documentReview?.state === 'REJECTED' && Boolean(draft.correctionStartedAt) && !draft.submittedAt;
}

export function reopenPreparation(draft: PreparationDraft, photos: Photo[], now: string): PreparationDraft {
  if (draft.documentReview?.state !== 'REJECTED' || !draft.submittedAt || draft.correctionStartedAt) {
    throw new Error('PREPARATION_NOT_REJECTED');
  }
  return { ...draft, submittedAt: undefined, correctionStartedAt: now, identityConfirmed: false,
    submittedSteps: { booking: true, drivers: false, terms: true },
    reviewHistory: [...(draft.reviewHistory ?? []), {
      submittedAt: draft.submittedAt, review: { ...draft.documentReview },
      drivers: structuredClone(draft.drivers), photos: photos.map(photo => ({ ...photo }))
    }] };
}


const rejectedDocumentLabels = {
  licence: 'prepReviewLicence', passport: 'prepPassport',
  idp: 'prepReviewIdp', other: 'prepReviewOther'
} as const;

export function preparationReviewIssues(review?: PreparationReview) {
  // Only the known legacy demo has a deterministic category; actual reasons are never parsed.
  const raw = review?.rejectedDocumentTypes
    ?? (review?.rejectionReasonKey === 'prepReviewSampleReason' ? ['licence'] : []);
  const types = Array.isArray(raw) ? raw.filter((item): item is RejectedDocumentType =>
    typeof item === 'string' && Object.prototype.hasOwnProperty.call(rejectedDocumentLabels, item)) : [];
  return [...new Set(types)].map(type => ({ type, label: rejectedDocumentLabels[type] }));
}
