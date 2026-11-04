import React, { useContext } from 'react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';

export function PreparationInsurance({ planKey }: { planKey?: PreparationKey }) {
  const { t } = useContext(LanguageContext);
  return <section className="rounded-customer-card border border-customer-border bg-customer-card p-4 shadow-customer-card">
    <h2 className="mb-3 text-customer-title">{t('prepInsurance')}</h2>
    {planKey ? <>
      <div className="flex items-start justify-between gap-3 border-b border-customer-border-subtle py-3 text-customer-body"><span className="shrink-0 text-customer-text-tertiary">{t('prepInsurancePlan')}</span><span className="text-right text-customer-body-strong">{t(planKey)}</span></div>
      <p className="mt-3 text-customer-caption text-customer-text-tertiary">{t('prepInsuranceTermsNote')}</p>
    </> : <p className="text-customer-body text-customer-text-tertiary">{t('prepNoInsurance')}</p>}
  </section>;
}
