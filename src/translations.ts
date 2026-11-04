import enTranslations from './i18n/locales/en';
import zhTWTranslations from './i18n/locales/zh-TW';
import jaTranslations from './i18n/locales/ja';
import koTranslations from './i18n/locales/ko';
import thTranslations from './i18n/locales/th';

export const translations = {
  'en': enTranslations,
  'zh-TW': zhTWTranslations,
  'ja': jaTranslations,
  'ko': koTranslations,
  'th': thTranslations,
};

export type TranslationKeys = keyof typeof translations.en;
