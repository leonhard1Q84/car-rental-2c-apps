import type { Step } from './model';
import type { PreparationStepLocks } from './stepLocks';

export type PreparationPrerequisite = 'booking' | 'drivers';
export function requiredPreparationStep(step: Step, saved: PreparationStepLocks): PreparationPrerequisite | null {
  return null;
}
