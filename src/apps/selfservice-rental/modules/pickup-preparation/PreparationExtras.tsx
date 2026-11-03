import React, { useContext } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationExtra } from './bookingFixtures';

export function PreparationExtras({ items }: { items: readonly PreparationExtra[] }) {
  const { t } = useContext(LanguageContext);
  return <section className="rounded-lg bg-white p-4 shadow-sm">
    <h2 className="mb-3 font-bold text-gray-800">{t('prepExtras')}</h2>
    {items.length === 0 ? <p className="text-sm text-gray-500">{t('prepNoExtras')}</p> : <div className="space-y-4">
      {(['equipment', 'service'] as const).map(kind => {
        const group = items.filter(item => item.kind === kind);
        return group.length > 0 && <div key={kind}>
          <h3 className="text-xs font-semibold text-gray-500">{t(kind === 'equipment' ? 'prepEquipment' : 'prepServices')}</h3>
          <ul className="mt-1 divide-y divide-gray-100">{group.map(item => <li key={item.nameKey} className="flex items-start justify-between gap-3 py-3 text-sm">
            <span className="font-medium text-gray-800">{t(item.nameKey)}</span>
            {item.quantity !== undefined && <span className="shrink-0 text-gray-500">{t('prepQuantity')} {item.quantity}</span>}
          </li>)}</ul>
        </div>;
      })}
    </div>}
  </section>;
}
