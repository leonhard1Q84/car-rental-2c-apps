import { inspectionReviewRevision } from '../contracts/inspectionReviewBinding';
import { isCustomerPickupSignature, type CustomerPickupSignature } from '../contracts/customerPickupSignature';
import { matchCustomerTermsConfirmation, type CustomerTermsConfirmationSnapshot } from '../contracts/customerTermsConfirmation';
import type { PickupContractConfigSnapshot } from '../contracts/pickupContractConfig';
import { loadCustomerPickupSignatureAdapter, loadCustomerInspectionPublicationAdapter, loadStoreCustomerTermsConfirmationAdapter } from './customerInspectionApi';

export type CustomerSigningResult = CustomerPickupSignature & { termsConfirmation: CustomerTermsConfirmationSnapshot };

/** A legacy terms record is evidence only when paired with a successful signature. */
export function resolveCustomerSigningResult(
  orderId: string,
  config: PickupContractConfigSnapshot | undefined,
  signature: CustomerPickupSignature | null,
  legacyTerms: CustomerTermsConfirmationSnapshot | null,
  inspectionRevision: string | undefined,
): CustomerSigningResult | null {
  if (!config || !isCustomerPickupSignature(signature) || signature.orderId !== orderId
    || signature.configurationRevision !== config.revision || signature.inspectionRevision !== inspectionRevision) return null;
  const terms = signature.termsConfirmation ?? legacyTerms;
  if (!terms || terms.language !== signature.language
    || Date.parse(terms.confirmedAt) > Date.parse(signature.signedAt)
    || terms.items.some(item => Date.parse(item.confirmedAt) > Date.parse(signature.signedAt))) return null;
  const matched = matchCustomerTermsConfirmation(orderId, config, terms);
  const onsiteIds = new Set(['pickup_vehicle_condition_acknowledgement', 'pickup_fuel_mileage_acknowledgement']);
  const required = config.customerConfirmationItems.filter(item => !onsiteIds.has(item.id));
  if (!matched.length || matched.length !== terms.items.length || required.some(item => !matched.some(value => value.id === item.id))) return null;
  return { ...signature, termsConfirmation: terms };
}

export async function loadCustomerSigningResult(orderId: string, config: PickupContractConfigSnapshot | undefined) {
  const [signature, inspection] = await Promise.all([
    loadCustomerPickupSignatureAdapter(orderId), loadCustomerInspectionPublicationAdapter(orderId),
  ]);
  if (!signature) return null;
  const legacyTerms = signature.termsConfirmation ? null : await loadStoreCustomerTermsConfirmationAdapter(orderId);
  return resolveCustomerSigningResult(orderId, config, signature, legacyTerms, inspection ? inspectionReviewRevision(inspection) : undefined);
}
