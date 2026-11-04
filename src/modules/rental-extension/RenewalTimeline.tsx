import React, { useContext } from 'react';
import { Circle, CircleDot, Clock3 } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { RequestRecord } from './api';
import type { SanitizedOrder } from './contracts';

export function RenewalTimeline({ record, order }: { record: RequestRecord; order: SanitizedOrder }) {
  const { t, lang } = useContext(LanguageContext);
  const date = (value?: string) => value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat(lang, { timeZone: order.branch_timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  const effective = record.status === 'EFFECTIVE';
  return <div>
    <p className="mb-4 text-customer-caption text-customer-text-tertiary">{order.branch_timezone}</p>
    <ol aria-label={t('renewPeriodTitle')}>
      <li className="relative ml-2 border-l border-customer-border pb-6 pl-6">
        <Circle size={18} aria-hidden="true" className="absolute -left-2.5 top-0 bg-customer-card text-customer-text-tertiary" />
        <p className="text-customer-caption text-customer-text-tertiary">{t('pickupTime')}</p>
        <p className="mt-1 text-customer-body tabular-nums text-customer-text-secondary">{date(record.allocation.pickup_time)}</p>
      </li>
      <li className="relative ml-2 border-l-2 border-customer-brand pb-6 pl-6">
        <Circle size={18} aria-hidden="true" className="absolute -left-2.5 top-0 bg-customer-card text-customer-text-secondary" />
        <p className="text-customer-label text-customer-text-secondary">{t('renewBeforeExtension')}</p>
        <p className="mt-1 text-customer-body-strong tabular-nums">{date(record.original_return_time)}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-customer-chip bg-customer-brand-subtle px-3 py-2 text-customer-label text-customer-brand-text motion-safe:animate-rise-in">
          <Clock3 size={18} aria-hidden="true" />{t('renewThisExtension').replace('{count}', new Intl.NumberFormat(lang).format(record.extension_days))}
        </p>
      </li>
      <li className="relative ml-2 pl-6">
        <CircleDot size={18} aria-hidden="true" className="absolute -left-2.5 top-0 bg-customer-card text-customer-brand-text" />
        <p className="text-customer-label text-customer-text-secondary">{t('renewRequestedReturn')}</p>
        <p className={`mt-1 text-customer-title tabular-nums ${effective ? 'text-customer-brand-text' : 'text-customer-text'}`}>{date(record.new_return_time)}</p>
      </li>
    </ol>
  </div>;
}
