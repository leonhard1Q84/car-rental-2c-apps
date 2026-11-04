import type { Step } from './model';

// Document submission and review are independent of pickup signing.
export const PREPARATION_ONLINE_IDENTITY_ENABLED = true;

export function availablePreparationStep(step: Step): Step {
  return !PREPARATION_ONLINE_IDENTITY_ENABLED && (step === 'drivers' || step === 'documents') ? 'home' : step;
}
