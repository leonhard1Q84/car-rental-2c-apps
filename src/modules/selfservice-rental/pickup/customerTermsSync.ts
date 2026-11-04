import {
  canonicalCustomerTermsConfirmationItemId,
  type CustomerTermsConfirmationItem,
  type CustomerTermsConfirmationSnapshot
} from '@shared/contracts';
import { preparationConfirmationItems, preparationMaterials, preparationTermsComplete, type PreparationContractSnapshot } from './materials';
import { preparationFulfillmentOrderId } from '../../../app/customer-journey/bookingFixtures';
import type { PreparationDraft } from '../../../app/customer-journey/model';

const uniqueConfirmedItems = (items: CustomerTermsConfirmationItem[]) => {
  const byId = new Map<string, CustomerTermsConfirmationItem>();
  items.forEach((item) => {
    const id = canonicalCustomerTermsConfirmationItemId(item.id);
    if (!byId.has(id)) byId.set(id, { ...item, id });
  });
  return [...byId.values()];
};

/**
 * Build the terms portion of a signing submission. This does not publish
 * draft checkboxes; only the complete signature commit exposes this snapshot.
 */
export function buildCustomerTermsConfirmationSnapshot(draft: PreparationDraft): CustomerTermsConfirmationSnapshot | null {
  const config = preparationMaterials(draft);
  const configured = preparationConfirmationItems(draft);
  if (!config || !configured.available || !preparationTermsComplete(draft)) return null;

  const materialItems = (draft.confirmation?.confirmations ?? []).map((item) => ({
    id: item.itemId,
    text: item.confirmationText.trim(),
    confirmedAt: item.confirmedAt
  }));
  const additionalItems = (draft.additionalConfirmations?.items ?? []).map((item) => ({
    id: item.id,
    text: item.text.trim(),
    confirmedAt: item.confirmedAt
  }));
  const items = uniqueConfirmedItems([...materialItems, ...additionalItems])
    .filter((item) => item.text && Number.isFinite(Date.parse(item.confirmedAt)));
  const eligibleIds = new Set((config as PreparationContractSnapshot).preparationConfirmationItemIds.map(canonicalCustomerTermsConfirmationItemId));
  const eligibleItems = items.filter((item) => eligibleIds.has(item.id));
  if (!eligibleItems.length || eligibleItems.length !== eligibleIds.size) return null;
  const confirmedAt = eligibleItems
    .map((item) => Date.parse(item.confirmedAt))
    .reduce((latest, current) => Math.max(latest, current), 0);
  if (!Number.isFinite(confirmedAt) || confirmedAt <= 0) return null;

  return {
    orderId: preparationFulfillmentOrderId(draft.orderId),
    sourceOrderId: draft.orderId,
    configurationRevision: config.revision,
    configurationPublishedAt: config.publishedAt,
    language: draft.language,
    confirmedAt: new Date(confirmedAt).toISOString(),
    items: eligibleItems
  };
}
