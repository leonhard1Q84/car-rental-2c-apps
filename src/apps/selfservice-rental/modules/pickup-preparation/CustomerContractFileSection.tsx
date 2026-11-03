import React, { useContext } from 'react';
import type { CustomerContractFile } from '@shared/contracts/customerContractFile';
import { LanguageContext } from '../../contexts/LanguageContext';

export function CustomerContractFileSection({ file, url, refresh }: { file?: CustomerContractFile | null; url?: string; refresh?: () => void }) {
  const { t, lang } = useContext(LanguageContext);
  if (!file || !url) return <section data-customer-contract="waiting" className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-sm leading-6 text-gray-600">{t('prepContractWaiting')}</p>
    <button type="button" onClick={refresh} className="mt-2 min-h-11 text-sm font-semibold text-primary-dark">{t('prepContractRefresh')}</button>
  </section>;
  return <section data-customer-contract="ready" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 className="font-semibold">{t('prepContractFileTitle')}</h2>
    <p className="mt-3 break-words text-sm font-medium">{file.fileName}</p>
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><dt className="text-gray-500">{t('prepContractNumber')}</dt><dd className="break-all">{file.contractNumber}</dd></div>
      <div className="flex flex-wrap justify-between gap-2"><dt className="text-gray-500">{t('prepContractGeneratedAt')}</dt><dd>{new Date(file.generatedAt).toLocaleString(lang)}</dd></div>
    </dl>
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary-dark">{t('prepContractViewFile')}</a>
  </section>;
}
