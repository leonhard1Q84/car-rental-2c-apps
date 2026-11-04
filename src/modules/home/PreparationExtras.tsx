import React, { useContext } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationExtra } from '../../app/customer-journey/bookingFixtures';

export function PreparationExtras({ items }: { items: readonly PreparationExtra[] }) {
  const { t } = useContext(LanguageContext);
  return <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
    <h2 className="mb-3 text-customer-title">{t('prepExtras')}</h2>
    {items.length === 0 ? <p className="text-customer-body text-customer-text-tertiary">{t('prepNoExtras')}</p> : <div className="space-y-4">
      {(['equipment', 'service'] as const).map(kind => {
        const group = items.filter(item => item.kind === kind);
        return group.length > 0 && <div key={kind}>
          <h3 className="text-customer-label text-customer-text-tertiary">{t(kind === 'equipment' ? 'prepEquipment' : 'prepServices')}</h3>
          <ul className="mt-1 divide-y divide-customer-border-subtle">{group.map(item => <li key={item.nameKey} className="flex items-start justify-between gap-3 py-3 text-customer-body">
            <span className="text-customer-text">{t(item.nameKey)}</span>
            {item.quantity !== undefined && <span className="shrink-0 text-customer-text-tertiary">{t('prepQuantity')} {item.quantity}</span>}
          </li>)}</ul>
        </div>;
      })}
    </div>}
  </section>;
}
