import React, { createContext, useState, ReactNode } from 'react';
import { translations, TranslationKeys } from '../translations';
import { returnTranslations, ReturnTranslationKeys } from '../i18n/returnTranslations';

import { pickupDashboardTranslations, PickupDashboardTranslationKeys } from '../i18n/pickupDashboardTranslations';
import { preparationTranslations, preparationChineseLabels, type PreparationKey, type PreparationLanguage } from '../i18n/preparation';
import { customerTripEndedMessages, type CustomerTripEndedKey } from '../i18n/trip-ended';

import { driverPhotoTranslations, type DriverPhotoKey } from '../i18n/driver-photos';

// Retain legacy review lookups and damage codes received from inspection data.
// Their resource coverage remains the same as the imported customer baseline.
type LegacyInspectionTranslationKeys =
  | 'verificationRejected' | 'verificationRejectedDesc'
  | 'verificationApproved' | 'verificationApprovedDesc'
  | 'verificationPending' | 'verificationPendingDesc'
  | 'verificationReasonLabel' | `damage.issue.${string}`;

type CustomerTranslationKeys = DriverPhotoKey | TranslationKeys | ReturnTranslationKeys | PickupDashboardTranslationKeys | PreparationKey | CustomerTripEndedKey | LegacyInspectionTranslationKeys;

type Language = PreparationLanguage;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: CustomerTranslationKeys) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: () => '',
});

export const LanguageProvider: React.FC<{ children: ReactNode; initialLang?: Language }> = ({ children, initialLang = 'en' }) => {
  const [lang, setLang] = useState<Language>(initialLang);

  const t = (key: CustomerTranslationKeys): string => {
    if (key in driverPhotoTranslations.en) return driverPhotoTranslations[lang][key as DriverPhotoKey];
    if (key in customerTripEndedMessages.en) return customerTripEndedMessages[lang][key as CustomerTripEndedKey];
    if (key in preparationTranslations.en) return preparationTranslations[lang][key as PreparationKey];
    if (lang === 'zh-CN' && key in preparationChineseLabels) return preparationChineseLabels[key];
    const resourceLang = lang === 'zh-CN' ? 'zh-TW' : lang;
    if (key in pickupDashboardTranslations.en) {
      return pickupDashboardTranslations[resourceLang][key as PickupDashboardTranslationKeys];
    }
    if (key in returnTranslations.en) {
      return returnTranslations[resourceLang][key as ReturnTranslationKeys];
    }
    return translations[resourceLang][key as TranslationKeys] || translations['en'][key as TranslationKeys];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
