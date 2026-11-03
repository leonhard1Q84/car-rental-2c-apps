import React, { useContext } from 'react';
import { Phone } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';

export function PreparationStoreContact({ phone }: { phone: string }) {
  const { t } = useContext(LanguageContext);
  return <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-sm leading-relaxed text-gray-600">{t('prepBookingIssue')}</p>
    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="mt-2 flex min-h-11 w-fit max-w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-primary">
      <Phone size={18} className="shrink-0" aria-hidden="true" />
      <span className="flex flex-wrap gap-x-2 gap-y-1"><span>{t('prepCallStore')}</span><span className="whitespace-nowrap">{phone}</span></span>
    </a>
  </div>;
}
