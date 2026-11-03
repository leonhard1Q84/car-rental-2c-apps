import React, { useContext } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';

export function PreparationInsurance({ planKey }: { planKey?: PreparationKey }) {
  const { t } = useContext(LanguageContext);
  return <section className="rounded-lg bg-white p-4 shadow-sm">
    <h2 className="mb-3 font-bold text-gray-800">{t('prepInsurance')}</h2>
    {planKey ? <>
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-3 text-sm"><span className="shrink-0 text-gray-500">{t('prepInsurancePlan')}</span><span className="text-right font-medium text-gray-800">{t(planKey)}</span></div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">{t('prepInsuranceTermsNote')}</p>
    </> : <p className="text-sm text-gray-500">{t('prepNoInsurance')}</p>}
  </section>;
}
