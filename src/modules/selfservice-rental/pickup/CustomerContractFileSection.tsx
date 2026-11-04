import React, { useContext } from 'react';
import type { CustomerContractFile } from '@shared/contracts/customerContractFile';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { Card, InfoList, InfoRow, buttonClass } from '../../../design/ui';

export function CustomerContractFileSection({ file, url, refresh }: { file?: CustomerContractFile | null; url?: string; refresh?: () => void }) {
  const { t, lang } = useContext(LanguageContext);
  if (!file || !url) return <Card data-customer-contract="waiting" padding="compact">
    <p className="text-customer-body text-customer-text-secondary">{t('prepContractWaiting')}</p>
    <button type="button" onClick={refresh} className="mt-2 min-h-11 text-customer-label text-customer-brand-text">{t('prepContractRefresh')}</button>
  </Card>;
  return <Card data-customer-contract="ready" padding="compact">
    <h2 className="text-customer-title">{t('prepContractFileTitle')}</h2>
    <p className="mt-3 break-words text-customer-body-strong">{file.fileName}</p>
    <InfoList className="mt-3">
      <InfoRow label={t('prepContractNumber')} value={<span className="break-all">{file.contractNumber}</span>} />
      <InfoRow label={t('prepContractGeneratedAt')} value={new Date(file.generatedAt).toLocaleString(lang)} />
    </InfoList>
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${buttonClass({ variant: 'secondary', size: 'md' })} mt-3 flex w-full`}>{t('prepContractViewFile')}</a>
  </Card>;
}
