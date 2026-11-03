import type { PreparationKey } from '../../i18n/preparation';
import type { Step } from './model';

export function preparationPrimaryLabel(step: Step, done: { booking: boolean; drivers: boolean; terms: boolean }, busy: boolean, readOnly: boolean): PreparationKey {
  if (busy) return 'prepSaving';
  if (readOnly) return 'prepBackHome';
  if (step === 'booking' || step === 'drivers' || step === 'terms') return 'prepSubmitNext';
  if (step === 'home' && Object.values(done).every(Boolean)) return 'prepSubmit';
  return Object.values(done).some(Boolean) ? 'prepContinue' : 'prepStart';
}
