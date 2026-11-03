import { isCustomerTermsConfirmationSnapshot, type CustomerTermsConfirmationSnapshot } from './customerTermsConfirmation';

export interface CustomerPickupSignature {
  orderId: string; configurationRevision: string; inspectionRevision: string;
  signature: string; signedAt: string; language: string;
  /** Present together on new, atomically committed signing results. */
  submissionId?: string;
  primaryDriverId?: string;
  termsConfirmation?: CustomerTermsConfirmationSnapshot;
}
export function isCustomerPickupSignature(value: unknown): value is CustomerPickupSignature {
  const item = value as CustomerPickupSignature | null;
  return Boolean(item && item.orderId && item.configurationRevision && item.inspectionRevision
    && typeof item.signature === 'string' && item.signature.startsWith('data:image/png;base64,')
    && Number.isFinite(Date.parse(item.signedAt)) && ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th'].includes(item.language)
    && (item.submissionId === undefined && item.termsConfirmation === undefined && item.primaryDriverId === undefined
      || typeof item.submissionId === 'string' && Boolean(item.submissionId.trim())
        && typeof item.primaryDriverId === 'string' && Boolean(item.primaryDriverId.trim())
        && isCustomerTermsConfirmationSnapshot(item.termsConfirmation)
        && item.termsConfirmation.orderId === item.orderId
        && item.termsConfirmation.configurationRevision === item.configurationRevision
        && item.termsConfirmation.language === item.language
        && Date.parse(item.termsConfirmation.confirmedAt) <= Date.parse(item.signedAt)
        && item.termsConfirmation.items.every(value => Date.parse(value.confirmedAt) <= Date.parse(item.signedAt))));
}
