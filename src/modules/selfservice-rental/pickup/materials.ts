import { RENTAL_TERMS_CONFIRMATION_ITEM_ID, RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID, type PickupContractConfigSnapshot } from '@shared/contracts';
import { preparationTranslations, type PreparationLanguage } from '../../../i18n/preparation';
import { resolveRentalMaterialConfiguration, isRentalMaterialGroupConfirmed } from '../../../components/rentalContractConfirmation';
import type { PickupContractMaterialGroup } from '@shared/contracts';
import type { PreparationDraft } from '../../../app/customer-journey/model';

export interface PreparationContractSnapshot extends PickupContractConfigSnapshot {
  preparationConfirmationItemIds: string[];
}
export interface PreparationAdditionalConfirmationRecord {
  configRevision: string;
  configPublishedAt: string;
  language: PreparationLanguage;
  items: Array<{ id: string; text: string; locale: PreparationLanguage; confirmedAt: string }>;
}

export function preparationMaterials(draft: PreparationDraft): PickupContractConfigSnapshot | undefined {
  if (!draft.configurationVersion) return createPreparationMaterials(draft.language);
  const snapshot = draft.contractConfigSnapshot;
  if (!snapshot || typeof snapshot.revision !== 'string' || typeof snapshot.publishedAt !== 'string'
    || !Array.isArray(snapshot.rentalContract?.attachments) || !Array.isArray(snapshot.rentalGuidelines?.attachments)
    || !Array.isArray(snapshot.customerConfirmationItems) || !Array.isArray(snapshot.preparationConfirmationItemIds)
    || snapshot.preparationConfirmationItemIds.some(id => typeof id !== 'string')
    || snapshot.customerConfirmationItems.some(item => !item || typeof item.id !== 'string' || !item.title || typeof item.title !== 'object'
      || Object.values(item.title).some(text => typeof text !== 'string') || !Number.isFinite(item.order))
    || [snapshot.rentalContract, snapshot.rentalGuidelines].some(material => material.attachments.some(item => !item || typeof item.id !== 'string'
      || typeof item.title !== 'string' || typeof item.url !== 'string'))) return undefined;
  return snapshot;
}

export function preparationGroupConfirmed(draft: PreparationDraft, materialGroup: PickupContractMaterialGroup): boolean {
  const resolution = resolveRentalMaterialConfiguration(preparationMaterials(draft), draft.language);
  if (!isRentalMaterialGroupConfirmed(resolution, draft.confirmation, materialGroup)) return false;
  const group = resolution.groups.find(item => item.materialGroup === materialGroup)!;
  const saved = draft.confirmation?.confirmations.find(item => item.itemId === group.confirmationItem.id && item.materialGroup === materialGroup);
  return saved?.locale === group.locale && saved?.confirmationText === group.confirmationText;
}

export function preparationConfirmationItems(draft: PreparationDraft) {
  const snapshot = preparationMaterials(draft);
  const unavailable = { available: false, additional: [], onsite: [] } as const;
  if (!snapshot || !resolveRentalMaterialConfiguration(snapshot, draft.language).available) return unavailable;
  const configured = snapshot.customerConfirmationItems;
  const ids = configured.map(item => item.id);
  if (ids.some(id => !id.trim()) || new Set(ids).size !== ids.length) return unavailable;
  const eligible = draft.contractConfigSnapshot?.preparationConfirmationItemIds
    ?? [RENTAL_TERMS_CONFIRMATION_ITEM_ID, RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID];
  if (eligible.some(id => !ids.includes(id)) || ![RENTAL_TERMS_CONFIRMATION_ITEM_ID, RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID].every(id => eligible.includes(id))) return unavailable;
  const localized = [...configured].sort((a, b) => a.order - b.order).map(item => {
    const locales = [draft.language, draft.contractConfigSnapshot?.defaultLocale, 'en'] as PreparationLanguage[];
    const locale = locales.find(language => item.title[language]?.trim());
    return { id: item.id, text: locale ? item.title[locale]!.trim() : '', locale: locale ?? draft.language };
  });
  if (localized.some(item => !item.text)) return unavailable;
  return { available: true,
    additional: localized.filter(item => eligible.includes(item.id) && ![RENTAL_TERMS_CONFIRMATION_ITEM_ID, RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID].includes(item.id)),
    onsite: localized.filter(item => !eligible.includes(item.id)) };
}

export function preparationTermsComplete(draft: PreparationDraft): boolean {
  const snapshot = preparationMaterials(draft);
  const items = preparationConfirmationItems(draft);
  if (!items.available || !preparationGroupConfirmed(draft, 'RENTAL_CONTRACT') || !preparationGroupConfirmed(draft, 'RENTAL_GUIDELINES')) return false;
  if (!items.additional.length) return true;
  const record = draft.additionalConfirmations;
  return record?.configRevision === snapshot?.revision && record?.configPublishedAt === snapshot?.publishedAt && record?.language === draft.language
    && items.additional.every(item => record.items.some(saved => saved.id === item.id && saved.text === item.text && saved.locale === item.locale && Boolean(saved.confirmedAt)));
}

const xml = (text: string) => text.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]!));
function materialImage(title: string, body: string): string {
  const lines = Array.from(body).reduce<string[]>((all, char, index) => {
    if (index % 35 === 0) all.push('');
    all[all.length - 1] += char;
    return all;
  }, []);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800"><rect width="640" height="800" fill="white"/><rect width="640" height="12" fill="#059669"/><text x="40" y="85" font-size="25" font-family="sans-serif" fill="#111827">${xml(title)}</text>${lines.map((line, index) => `<text x="40" y="${155 + index * 33}" font-size="16" font-family="sans-serif" fill="#374151">${xml(line)}</text>`).join('')}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export function createPreparationMaterials(language: PreparationLanguage): PickupContractConfigSnapshot {
  const t = preparationTranslations[language];
  const title = (key: 'prepAgreeTerms' | 'prepAgreeNotes') => Object.fromEntries(
    Object.entries(preparationTranslations).map(([locale, texts]) => [locale, texts[key]]));
  return {
    schemaVersion: 2, revision: 'pickup-preparation-demo-v1', publishedAt: '2026-10-19T00:00:00Z',
    defaultLocale: language, vendorId: 'demo', storeId: 'narita-demo',
    rentalContract: { attachments: [{ id: `prep-terms-${language}`, title: t.prepSampleTerms,
      displayOrder: 1, url: materialImage(t.prepSampleTerms, t.prepTermsBody), mimeType: 'image/svg+xml', uploadStatus: 'UPLOADED' }] },
    rentalGuidelines: { attachments: [{ id: `prep-notes-${language}`, title: t.prepSampleNotes,
      displayOrder: 1, url: materialImage(t.prepSampleNotes, t.prepNotesBody), mimeType: 'image/svg+xml', uploadStatus: 'UPLOADED' }] },
    customerConfirmationItems: [
      { id: RENTAL_TERMS_CONFIRMATION_ITEM_ID, materialGroup: 'RENTAL_CONTRACT', order: 10, title: title('prepAgreeTerms') },
      { id: RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID, materialGroup: 'RENTAL_GUIDELINES', order: 20, title: title('prepAgreeNotes') }
    ]
  };
}
