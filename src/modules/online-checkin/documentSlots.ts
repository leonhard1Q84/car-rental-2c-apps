import type { PreparationKey } from '../../i18n/preparation';
import type { DocumentKind, DocumentPage } from '../../app/customer-journey/model';

export interface DocumentSlotDefinition {
  kind: DocumentKind;
  page: DocumentPage;
  title: PreparationKey;
  pageTitle?: PreparationKey;
  hint: PreparationKey;
  required: boolean;
}
export const DOCUMENT_SLOTS: DocumentSlotDefinition[] = [
  { kind: 'licence', page: 'front', title: 'prepLicence', pageTitle: 'prepFront', hint: 'prepLicenceFrontHint', required: true },
  { kind: 'licence', page: 'back', title: 'prepLicence', pageTitle: 'prepBackPage', hint: 'prepLicenceBackHint', required: true },
  { kind: 'passport', page: 'info', title: 'prepPassport', pageTitle: 'prepInfoPage', hint: 'prepPassportHint', required: true },
  { kind: 'idp', page: 'cover', title: 'prepIdp', pageTitle: 'prepCover', hint: 'prepIdpCoverHint', required: true },
  { kind: 'idp', page: 'info', title: 'prepIdp', pageTitle: 'prepInfoPage', hint: 'prepIdpInfoHint', required: true },
  { kind: 'idp', page: 'classes', title: 'prepIdp', pageTitle: 'prepClasses', hint: 'prepIdpClassesHint', required: true },
  { kind: 'translation', page: 'supplement', title: 'prepTranslation', hint: 'prepSupportingHint', required: false },
  { kind: 'entry', page: 'supplement', title: 'prepEntryProof', hint: 'prepSupportingHint', required: false },
  { kind: 'other', page: 'supplement', title: 'prepOtherDocument', hint: 'prepSupportingHint', required: false }
];
export const PHONE_REGIONS: Array<{ code: string; label: PreparationKey }> = [
  { code: '+852', label: 'prepRegionHK' }, { code: '+86', label: 'prepRegionCN' },
  { code: '+886', label: 'prepRegionTW' }, { code: '+81', label: 'prepRegionJP' },
  { code: '+82', label: 'prepRegionKR' }, { code: '+66', label: 'prepRegionTH' },
  { code: '+65', label: 'prepRegionSG' }, { code: '+60', label: 'prepRegionMY' },
  { code: '+1', label: 'prepRegionUS' }, { code: '+44', label: 'prepRegionUK' },
  { code: '+61', label: 'prepRegionAU' }
];
export function splitPhone(phone: string, savedCode?: string) {
  const compact = phone.replace(/[\s()-]/g, '');
  const code = savedCode || [...PHONE_REGIONS].sort((a, b) => b.code.length - a.code.length)
    .find(region => compact.startsWith(region.code))?.code || '+852';
  return { code, number: compact.startsWith(code) ? compact.slice(code.length) : compact };
}
