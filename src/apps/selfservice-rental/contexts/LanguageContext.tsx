import React, { createContext, useState, ReactNode } from 'react';
import { translations, TranslationKeys } from '../translations';

type Language = 'en' | 'zh-TW' | 'ja' | 'ko' | 'th';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: () => '',
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');

  const t = (key: TranslationKeys): string => {
    return translations[lang][key] || translations['en'][key];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
