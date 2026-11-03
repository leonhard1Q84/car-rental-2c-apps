import type { PickupContractLocale } from './pickupContractConfig';
import type { PickupContractConfigSnapshot } from './pickupContractConfig';

/**
 * Order-level fact shared by the Customer and Store Ops prototypes.
 * Production implementations must replace the browser storage adapter with
 * the order API; the fields and validation semantics remain the same.
 */
export interface CustomerTermsConfirmationItem {
  id: string;
  text: string;
  confirmedAt: string;
}

export interface CustomerTermsConfirmationSnapshot {
  orderId: string;
  /** The identifier used by the Customer demo before server verification. */
  sourceOrderId?: string;
  configurationRevision: string;
  configurationPublishedAt: string;
  language: PickupContractLocale;
  confirmedAt: string;
  items: CustomerTermsConfirmationItem[];
}

export const CUSTOMER_TERMS_CONFIRMATION_ITEM_ALIASES: Record<string, string> = {
  rental_terms_acknowledgement: 'confirm-rental-details',
  rental_notes_acknowledgement: 'confirm-return-requirements',
  accident_emergency_acknowledgement: 'confirm-emergency-process'
};

export function canonicalCustomerTermsConfirmationItemId(itemId: string): string {
  return CUSTOMER_TERMS_CONFIRMATION_ITEM_ALIASES[itemId] ?? itemId;
}

export function matchCustomerTermsConfirmation(orderId: string, config: PickupContractConfigSnapshot, snapshot: CustomerTermsConfirmationSnapshot | null): CustomerTermsConfirmationItem[] {
  if (!snapshot || snapshot.orderId !== orderId || snapshot.configurationRevision !== config.revision
    || snapshot.configurationPublishedAt !== config.publishedAt) return [];
  return config.customerConfirmationItems.flatMap(item => {
    const saved = snapshot.items.find(value => canonicalCustomerTermsConfirmationItemId(value.id) === canonicalCustomerTermsConfirmationItemId(item.id));
    const text = item.title[snapshot.language] ?? item.title[config.defaultLocale ?? 'zh-CN'] ?? item.title.en;
    return saved && text?.trim() === saved.text.trim() && Number.isFinite(Date.parse(saved.confirmedAt))
      ? [{ ...saved, id: item.id }] : [];
  });
}

export function isCustomerTermsConfirmationSnapshot(value: unknown): value is CustomerTermsConfirmationSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<CustomerTermsConfirmationSnapshot>;
  return typeof snapshot.orderId === 'string'
    && snapshot.orderId.trim().length > 0
    && typeof snapshot.configurationRevision === 'string'
    && snapshot.configurationRevision.trim().length > 0
    && typeof snapshot.configurationPublishedAt === 'string'
    && Number.isFinite(Date.parse(snapshot.configurationPublishedAt))
    && typeof snapshot.language === 'string'
    && typeof snapshot.confirmedAt === 'string'
    && Number.isFinite(Date.parse(snapshot.confirmedAt))
    && Array.isArray(snapshot.items)
    && snapshot.items.length > 0
    && snapshot.items.every((item) => Boolean(item)
      && typeof item.id === 'string'
      && item.id.trim().length > 0
      && typeof item.text === 'string'
      && item.text.trim().length > 0
      && typeof item.confirmedAt === 'string'
      && Number.isFinite(Date.parse(item.confirmedAt)));
}
