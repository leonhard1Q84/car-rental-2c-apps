import React, { useContext } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

export default function OverviewHeader() {
  const { lang, setLang, t } = useContext(LanguageContext);
  return (
    <header className="sticky top-0 z-20 bg-primary text-white shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-20 items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight tracking-tight">{t('prepOverviewBrand')}</p>
          <h1 className="mt-1 text-xs font-medium text-white/90">{t('myRentalTitle')}</h1>
        </div>
        <div className="relative shrink-0">
          <Languages aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            aria-label={t('prepLanguage')}
            value={lang}
            onChange={(event) => setLang(event.target.value as typeof lang)}
            className="min-h-11 max-w-40 appearance-none rounded-lg border border-white/25 bg-primary-dark py-2 pl-9 pr-8 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="th">ไทย</option>
          </select>
          <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </header>
  );
}
