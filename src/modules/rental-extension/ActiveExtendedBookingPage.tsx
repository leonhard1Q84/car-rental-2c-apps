import React, { useContext } from 'react';
import { Briefcase, CheckCircle2, Download, FileText, Home, Users } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';
import type { SanitizedOrder } from './contracts';
import type { RequestRecord } from './api';
import { renewalContractUrl } from './model';
import { getVehiclePhoto } from './vehicleImages';
import { getVehicleSpecs } from './vehicleSpecs';
import { Alert, Badge, BottomBar, Button, Card, buttonClass } from '../../design/ui';
import { RenewalProgress } from './RenewalProgress';

/** 续租成功页：对齐参考实现 ProcessingPage 生效态 —— 结果标题与三步进度、
 *  实付＋当前车辆＋新还车时间单卡、续租合同下载，底部唯一主操作“返回首页”。
 *  “再次申请续租”不在本页提供，仅在续租记录列表页作为主操作。 */
export function ActiveExtendedBookingPage({ record, order, busy, error, onRefresh, onBack }: {
  record: RequestRecord; order: SanitizedOrder; busy: boolean; error: PreparationKey | null;
  onRefresh: () => void; onBack: () => void;
}) {
  const { t, lang } = useContext(LanguageContext);
  const date = (value?: string) => value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat(lang, { timeZone: order.branch_timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  const specs = getVehicleSpecs(order.actual_model_id, order.actual_model_name, t);
  const contractUrl = renewalContractUrl(record);
  const contractStatus: PreparationKey = record.contract.status === 'FAILED' ? 'renewContractFailed'
    : record.contract.status === 'READY' ? (contractUrl ? 'renewContractArchiveHint' : 'renewContractUnavailable')
    : record.contract.status === 'GENERATING' ? 'renewContractGenerating' : 'renewContractPending';
  return <div className="space-y-3 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
    {error && <Alert tone="danger" action={<Button variant="secondary" disabled={busy} onClick={onRefresh}>{t('renewRefresh')}</Button>}>{t(error)}</Alert>}
    <Card as="section" className="relative overflow-hidden border-t-4 border-t-customer-brand text-center motion-safe:animate-rise-in">
      <div role="status" className="space-y-3 py-4">
        <span className="relative mx-auto flex size-16 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-customer-success-border motion-safe:animate-halo-in" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-customer-success-subtle text-customer-success-text motion-safe:animate-pop-in">
            <CheckCircle2 size={32} aria-hidden="true" />
          </span>
        </span>
        <h2 className="text-customer-headline">{t('renewSuccessTitle')}</h2>
        <p className="text-customer-body text-customer-text-secondary">{t('renewSuccessDescription')}</p>
      </div>
      <RenewalProgress reserved paid effective />
    </Card>
    <Card as="section" className="space-y-3.5 motion-safe:animate-rise-in" style={{ animationDelay: '80ms' }}>
      <div className="flex items-start justify-between gap-3 border-b border-customer-border-subtle pb-3">
        <div>
          <span className="block text-customer-caption text-customer-text-tertiary">{t('renewPaidAmount')}</span>
          <span className="mt-0.5 block text-customer-amount tabular-nums">
            {new Intl.NumberFormat(lang, { style: 'currency', currency: record.payment.currency }).format(record.payment.amount)}
            <span className="ml-1 text-customer-caption font-normal text-customer-text-tertiary">{record.payment.currency}</span>
          </span>
        </div>
        <Badge tone="success" icon={CheckCircle2} className="shrink-0">{t('renewPaid')}</Badge>
      </div>
      <div className="flex items-center gap-3.5">
        <img
          src={getVehiclePhoto(order.actual_model_id, order.actual_model_name)}
          alt={order.actual_model_name}
          className="h-14 w-20 shrink-0 rounded-customer-inset border border-customer-border bg-customer-card object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-customer-body-strong">{order.actual_model_name}</span>
            {order.actual_plate && <span className="rounded-customer-chip border border-customer-border-strong bg-customer-inset px-2 py-0.5 font-mono text-customer-caption font-semibold text-customer-text">{order.actual_plate}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-customer-caption text-customer-text-secondary">
            <span className="flex items-center gap-1"><Users size={14} aria-hidden="true" className="text-customer-text-tertiary" />{specs.seats} {t('prepSeats')}</span>
            <span className="flex items-center gap-1"><Briefcase size={14} aria-hidden="true" className="text-customer-text-tertiary" />{specs.luggage} {t('prepLuggage')}</span>
            <span aria-hidden="true" className="text-customer-border-strong">·</span>
            <span className="font-semibold text-customer-brand-text tabular-nums">{record.extension_days} {t('renewDays')}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-customer-inset border border-customer-brand-border bg-customer-brand-subtle p-3">
        <div className="min-w-0">
          <span className="block text-customer-caption text-customer-text-secondary">{t('renewRequestedReturn')}</span>
          <span className="mt-0.5 block text-customer-body-strong tabular-nums text-customer-brand-text">{date(record.new_return_time)}</span>
        </div>
        <div className="w-36 shrink-0 text-right">
          <span className="block text-customer-caption text-customer-text-tertiary">{t('renewReturnLocation')}</span>
          <span className="mt-0.5 block truncate text-customer-caption font-medium text-customer-text">{order.return_branch_name}</span>
        </div>
      </div>
    </Card>
    <Card as="section" className="motion-safe:animate-rise-in" style={{ animationDelay: '140ms' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-customer-chip bg-customer-brand-subtle text-customer-brand-text">
            <FileText size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-customer-body-strong">{record.document?.title || t('renewContractTitle')}</p>
            <p role={record.contract.status === 'FAILED' ? 'alert' : 'status'} className="mt-0.5 text-customer-caption text-customer-text-tertiary">{t(contractStatus)}</p>
          </div>
        </div>
        {contractUrl && (
          <a href={contractUrl} download target="_blank" rel="noopener noreferrer"
            className={`${buttonClass({ variant: 'secondary', size: 'md' })} shrink-0`}
            aria-label={`${t('renewDownloadPdf')} · ${record.document?.title || t('renewContractTitle')}`}>
            <Download size={18} aria-hidden="true" />{t('renewDownloadPdf')}
          </a>
        )}
      </div>
      {record.contract.status === 'FAILED' && (
        <Button variant="text" loading={busy} onClick={onRefresh}>{t('renewRefresh')}</Button>
      )}
    </Card>
    <BottomBar><Button block disabled={busy} onClick={onBack} icon={Home}>{t('prepBackHome')}</Button></BottomBar>
  </div>;
}
