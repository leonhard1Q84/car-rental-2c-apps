import { loadInspectionReview } from './reviewStatus';

export async function loadSigningInspectionConfirmation(orderId: string) {
  const state = await loadInspectionReview(orderId);
  return state.status === 'ready' ? state.confirmation : undefined;
}

export async function loadSigningInspectionConfirmed(orderId: string): Promise<boolean> {
  return Boolean(await loadSigningInspectionConfirmation(orderId));
}
