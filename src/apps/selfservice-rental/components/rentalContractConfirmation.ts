import {
  RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID,
  RENTAL_TERMS_CONFIRMATION_ITEM_ID,
  type PickupContractAttachment,
  type PickupContractConfigSnapshot,
  type PickupContractConfirmationRecord,
  type PickupContractLocale,
  type PickupContractMaterial,
  type PickupContractMaterialGroup,
  type PickupCustomerConfirmationConfigItem,
  type RentalMaterialConfirmation
} from '@shared/contracts';

export type RentalMaterialConfigurationIssue =
  | 'MISSING_SNAPSHOT'
  | 'MISSING_REVISION'
  | 'MISSING_RENTAL_CONTRACT'
  | 'MISSING_RENTAL_GUIDELINES'
  | 'MISSING_RENTAL_CONTRACT_CONFIRMATION'
  | 'MISSING_RENTAL_GUIDELINES_CONFIRMATION';

export interface ResolvedRentalMaterialAttachment {
  id: string;
  title: string;
  url: string;
  mimeType?: string;
  displayOrder: number;
}

export interface ResolvedRentalMaterialGroup {
  materialGroup: PickupContractMaterialGroup;
  attachments: ResolvedRentalMaterialAttachment[];
  confirmationItem: PickupCustomerConfirmationConfigItem;
  confirmationText: string;
  locale: PickupContractLocale;
}

export interface RentalMaterialConfigurationResolution {
  available: boolean;
  revision?: string;
  publishedAt?: string;
  groups: ResolvedRentalMaterialGroup[];
  issue?: RentalMaterialConfigurationIssue;
}

const REQUIRED_GROUPS: Array<{
  materialGroup: PickupContractMaterialGroup;
  itemId: string;
  materialKey: 'rentalContract' | 'rentalGuidelines';
  missingMaterialIssue: RentalMaterialConfigurationIssue;
  missingConfirmationIssue: RentalMaterialConfigurationIssue;
}> = [
  {
    materialGroup: 'RENTAL_CONTRACT',
    itemId: RENTAL_TERMS_CONFIRMATION_ITEM_ID,
    materialKey: 'rentalContract',
    missingMaterialIssue: 'MISSING_RENTAL_CONTRACT',
    missingConfirmationIssue: 'MISSING_RENTAL_CONTRACT_CONFIRMATION'
  },
  {
    materialGroup: 'RENTAL_GUIDELINES',
    itemId: RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID,
    materialKey: 'rentalGuidelines',
    missingMaterialIssue: 'MISSING_RENTAL_GUIDELINES',
    missingConfirmationIssue: 'MISSING_RENTAL_GUIDELINES_CONFIRMATION'
  }
];

const resolveLocalizedText = (
  values: PickupCustomerConfirmationConfigItem['title'],
  requestedLocale: PickupContractLocale,
  defaultLocale?: PickupContractLocale
): { text: string; locale: PickupContractLocale } | null => {
  const locales = [requestedLocale, defaultLocale, 'en' as const]
    .filter((locale): locale is PickupContractLocale => Boolean(locale))
    .filter((locale, index, list) => list.indexOf(locale) === index);

  for (const locale of locales) {
    const text = values[locale]?.trim();
    if (text) return { text, locale };
  }
  return null;
};

const normalizeMaterialAttachments = (
  material: PickupContractMaterial,
  materialGroup: PickupContractMaterialGroup
): ResolvedRentalMaterialAttachment[] | null => {
  const sourceAttachments: PickupContractAttachment[] = material.attachments.length > 0
    ? material.attachments
    : material.url?.trim()
      ? [{
          id: `${materialGroup.toLowerCase()}-legacy-link`,
          title: material.linkLabel,
          url: material.url,
          displayOrder: 1
        }]
      : [];

  if (sourceAttachments.length === 0) return null;

  const normalized = sourceAttachments.map((attachment, sourceIndex) => ({
    id: attachment.id?.trim(),
    title: attachment.title?.trim(),
    url: attachment.url?.trim(),
    mimeType: attachment.mimeType,
    displayOrder: Number.isFinite(attachment.displayOrder)
      ? Number(attachment.displayOrder)
      : sourceIndex + 1,
    sourceIndex,
    uploadStatus: attachment.uploadStatus
  }));

  if (normalized.some((attachment) => (
    !attachment.id
    || !attachment.title
    || !attachment.url
    || attachment.uploadStatus === 'FAILED'
  ))) {
    return null;
  }

  return normalized
    .sort((left, right) => left.displayOrder - right.displayOrder || left.sourceIndex - right.sourceIndex)
    .map(({ sourceIndex: _sourceIndex, uploadStatus: _uploadStatus, ...attachment }) => attachment as ResolvedRentalMaterialAttachment);
};

export const resolveRentalMaterialConfiguration = (
  snapshot: PickupContractConfigSnapshot | undefined,
  requestedLocale: PickupContractLocale
): RentalMaterialConfigurationResolution => {
  if (!snapshot) return { available: false, groups: [], issue: 'MISSING_SNAPSHOT' };
  if (!snapshot.revision.trim() || !snapshot.publishedAt.trim()) {
    return { available: false, groups: [], issue: 'MISSING_REVISION' };
  }

  const groups: ResolvedRentalMaterialGroup[] = [];
  for (const requirement of REQUIRED_GROUPS) {
    const attachments = normalizeMaterialAttachments(
      snapshot[requirement.materialKey],
      requirement.materialGroup
    );
    if (!attachments) {
      return {
        available: false,
        revision: snapshot.revision,
        publishedAt: snapshot.publishedAt,
        groups: [],
        issue: requirement.missingMaterialIssue
      };
    }

    const confirmationItem = snapshot.customerConfirmationItems.find((item) => (
      item.id === requirement.itemId
      && (!item.materialGroup || item.materialGroup === requirement.materialGroup)
    ));
    const localizedText = confirmationItem
      ? resolveLocalizedText(confirmationItem.title, requestedLocale, snapshot.defaultLocale)
      : null;
    if (!confirmationItem || !localizedText) {
      return {
        available: false,
        revision: snapshot.revision,
        publishedAt: snapshot.publishedAt,
        groups: [],
        issue: requirement.missingConfirmationIssue
      };
    }

    groups.push({
      materialGroup: requirement.materialGroup,
      attachments,
      confirmationItem,
      confirmationText: localizedText.text,
      locale: localizedText.locale
    });
  }

  return {
    available: true,
    revision: snapshot.revision,
    publishedAt: snapshot.publishedAt,
    groups
  };
};

const sameAttachmentIds = (actual: string[], expected: string[]): boolean => (
  actual.length === expected.length
  && expected.every((attachmentId, index) => actual[index] === attachmentId)
);

export const isRentalMaterialGroupConfirmed = (
  resolution: RentalMaterialConfigurationResolution,
  record: PickupContractConfirmationRecord | undefined,
  materialGroup: PickupContractMaterialGroup
): boolean => {
  if (
    !resolution.available
    || !record
    || record.configRevision !== resolution.revision
    || record.configPublishedAt !== resolution.publishedAt
  ) {
    return false;
  }

  const group = resolution.groups.find((candidate) => candidate.materialGroup === materialGroup);
  if (!group) return false;

  const confirmation = record.confirmations.find((candidate) => (
    candidate.itemId === group.confirmationItem.id
    && candidate.materialGroup === group.materialGroup
  ));
  return Boolean(
    confirmation?.confirmedAt
    && confirmation.confirmationText
    && sameAttachmentIds(
      confirmation.attachmentIds,
      group.attachments.map((attachment) => attachment.id)
    )
  );
};

export const isPickupContractConfirmationComplete = (
  snapshot: PickupContractConfigSnapshot | undefined,
  record: PickupContractConfirmationRecord | undefined
): boolean => {
  if (!snapshot || !record) return false;
  const resolution = resolveRentalMaterialConfiguration(snapshot, snapshot.defaultLocale ?? 'en');
  if (!resolution.available) return false;
  if (record.configRevision !== resolution.revision || record.configPublishedAt !== resolution.publishedAt) {
    return false;
  }

  return resolution.groups.every((group) => (
    isRentalMaterialGroupConfirmed(resolution, record, group.materialGroup)
  ));
};

export const isLegacyInspectionTermsComplete = (record: {
  verificationStatus?: string;
  termsAgreedAt?: string;
  termsVersion?: string;
  contractConfirmationRecord?: PickupContractConfirmationRecord;
}): boolean => Boolean(
  !record.contractConfirmationRecord
  && record.verificationStatus === 'approved'
  && record.termsAgreedAt
  && record.termsVersion
);

export const updateRentalMaterialConfirmation = ({
  resolution,
  currentRecord,
  materialGroup,
  confirmed,
  confirmedAt = new Date().toISOString()
}: {
  resolution: RentalMaterialConfigurationResolution;
  currentRecord?: PickupContractConfirmationRecord;
  materialGroup: PickupContractMaterialGroup;
  confirmed: boolean;
  confirmedAt?: string;
}): PickupContractConfirmationRecord | undefined => {
  if (!resolution.available || !resolution.revision || !resolution.publishedAt) return currentRecord;
  const group = resolution.groups.find((candidate) => candidate.materialGroup === materialGroup);
  if (!group) return currentRecord;

  const confirmations = (
    currentRecord?.configRevision === resolution.revision
    && currentRecord.configPublishedAt === resolution.publishedAt
    ? currentRecord.confirmations
    : []
  ).filter((confirmation) => confirmation.itemId !== group.confirmationItem.id);

  if (confirmed) {
    const confirmation: RentalMaterialConfirmation = {
      itemId: group.confirmationItem.id,
      materialGroup: group.materialGroup,
      confirmationText: group.confirmationText,
      attachmentIds: group.attachments.map((attachment) => attachment.id),
      locale: group.locale,
      confirmedAt
    };
    confirmations.push(confirmation);
  }

  if (confirmations.length === 0) return undefined;
  return {
    configRevision: resolution.revision,
    configPublishedAt: resolution.publishedAt,
    confirmations
  };
};
