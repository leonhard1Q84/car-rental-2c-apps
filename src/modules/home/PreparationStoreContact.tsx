import React, { useContext } from 'react';
import { Phone } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';

export function PreparationStoreContact({ phone }: { phone: string }) {
  const { t } = useContext(LanguageContext);
  return <div className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
    <p className="text-customer-body text-customer-text-secondary">{t('prepBookingIssue')}</p>
    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="mt-2 flex min-h-11 w-fit max-w-full items-center gap-2 rounded-customer-control px-2 text-customer-label text-customer-brand-text hover:bg-customer-brand-subtle focus-visible:outline-2 focus-visible:outline-customer-brand">
      <Phone size={18} className="shrink-0" aria-hidden="true" />
      <span className="flex flex-wrap gap-x-2 gap-y-1"><span>{t('prepCallStore')}</span><span className="whitespace-nowrap">{phone}</span></span>
    </a>
  </div>;
}
