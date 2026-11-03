import type { PreparationLanguage } from '../../../i18n/preparation';
import type { InspectionCaptureSession } from './capture';

// Advance only after a successful transaction; read-back failures stay recoverable.
export async function confirmInspectionAndContinue(session: InspectionCaptureSession, language: PreparationLanguage, statement: string, onConfirmed?: () => Promise<void>, retry = false) {
  if (retry) await session.retry();
  else await session.confirm(language, statement);
  const latest = session.getSnapshot();
  if (latest.loading || latest.saving || latest.error || !latest.record.confirmation) return false;
  await onConfirmed?.();
  return true;
}
