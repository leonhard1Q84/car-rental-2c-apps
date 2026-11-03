import { completion, type Photo, type PreparationDraft } from './model';

export interface PreparationStepLocks { booking: boolean; drivers: boolean; terms: boolean }

// Only call with a successfully loaded or persisted record, never an optimistic draft.
export function savedPreparationLocks(draft: PreparationDraft, photos: Photo[]): PreparationStepLocks {
  if (draft.submittedAt) return { booking: true, drivers: true, terms: false };
  const done = completion(draft, photos);
  const submitted = draft.submittedSteps;
  const booking = submitted?.booking === true && done.booking;
  const drivers = submitted?.drivers === true && done.drivers && done.documents;
  return { booking, drivers, terms: false };
}

export function prepareStepSubmission(draft: PreparationDraft, photos: Photo[], step: 'booking' | 'drivers'): PreparationDraft {
  if (draft.submittedAt) throw new Error('PREPARATION_ALREADY_SUBMITTED');
  const done = completion(draft, photos);
  if (step === 'booking' ? !done.booking : !savedPreparationLocks(draft, photos).booking || !done.drivers || !done.documents) {
    throw new Error('PREPARATION_INCOMPLETE');
  }
  return { ...draft, submittedSteps: { ...draft.submittedSteps, [step]: true } };
}

export function canEditPreparationPatch(locks: PreparationStepLocks, patch: Partial<PreparationDraft>): boolean {
  if ('documentReview' in patch || 'correctionStartedAt' in patch || 'reviewHistory' in patch) return false;
  if ('contractConfigSnapshot' in patch || 'configurationVersion' in patch || 'submittedSteps' in patch || 'submittedAt' in patch) return false;
  if (locks.booking && 'bookingConfirmed' in patch) return false;
  if (locks.drivers && ('drivers' in patch || 'identityConfirmed' in patch)) return false;
  if (locks.terms && ('confirmation' in patch || 'additionalConfirmations' in patch || 'language' in patch)) return false;
  return true;
}
