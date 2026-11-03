import React, { useContext, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  X
} from 'lucide-react';
import type {
  PickupContractConfigSnapshot,
  PickupContractConfirmationRecord
} from '@shared/contracts';
import { LanguageContext } from '../contexts/LanguageContext';
import {
  isRentalMaterialGroupConfirmed,
  resolveRentalMaterialConfiguration,
  updateRentalMaterialConfirmation,
  type ResolvedRentalMaterialAttachment
} from './rentalContractConfirmation';

interface RentalTermsConfirmationSectionProps {
  snapshot?: PickupContractConfigSnapshot;
  value?: PickupContractConfirmationRecord;
  onChange: (value: PickupContractConfirmationRecord | undefined) => void;
  readOnly?: boolean;
  confirmationTitle?: string;
  confirmationContent?: React.ReactNode;
}

type PreviewStatus = 'loading' | 'ready' | 'error';

const RentalTermsConfirmationSection: React.FC<RentalTermsConfirmationSectionProps> = ({
  snapshot,
  value,
  onChange,
  readOnly = false,
  confirmationTitle,
  confirmationContent
}) => {
  const { lang, t } = useContext(LanguageContext);
  const resolution = useMemo(
    () => resolveRentalMaterialConfiguration(snapshot, lang),
    [lang, snapshot]
  );
  const [previewAttachment, setPreviewAttachment] = useState<ResolvedRentalMaterialAttachment | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('loading');
  const [previewAttempt, setPreviewAttempt] = useState(0);

  const openAttachment = (attachment: ResolvedRentalMaterialAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewStatus('loading');
    setPreviewAttempt(0);
  };

  const closePreview = () => {
    setPreviewAttachment(null);
    setPreviewStatus('loading');
  };

  const retryPreview = () => {
    setPreviewStatus('loading');
    setPreviewAttempt((attempt) => attempt + 1);
  };

  return (
    <>
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="border-l-4 border-primary pl-3">
          <h2 className="text-base font-bold text-gray-900">{t('rentalMaterialsTitle')}</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{t('rentalMaterialsIntro')}</p>
        </div>

        {!resolution.available ? (
          <div className="mt-4 flex items-start rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
            <AlertTriangle size={18} className="mr-3 mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">{t('rentalMaterialsUnavailableTitle')}</p>
              <p className="mt-1 text-xs leading-relaxed text-red-700">{t('rentalMaterialsUnavailable')}</p>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div className="divide-y divide-gray-200" data-rental-materials-list>
              {resolution.groups.map((group) => {
                const groupTitle = group.materialGroup === 'RENTAL_CONTRACT'
                  ? t('rentalContractMaterialTitle')
                  : t('rentalGuidelinesMaterialTitle');
                return (
                  <div key={group.materialGroup} className="py-5 first:pt-0">
                    <h3 className="text-sm font-bold text-gray-900">{groupTitle}</h3>

                    <div className="mt-3 space-y-2">
                      {group.attachments.map((attachment) => {
                        const isPdf = attachment.mimeType?.includes('pdf') || /\.pdf(?:$|\?)/i.test(attachment.url);
                        return (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => openAttachment(attachment)}
                            className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
                            </span>
                            <span className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-800">
                              {attachment.title}
                            </span>
                            <ChevronRight size={18} className="shrink-0 text-gray-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 pt-5" data-rental-customer-confirmations>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{confirmationTitle ?? t('rentalCustomerConfirmationsTitle')}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {t('rentalCustomerConfirmationsIntro')}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary">{t('required')}</span>
              </div>

              {confirmationContent ?? <div className="mt-3 space-y-2">
                {[...resolution.groups].sort((a, b) => a.confirmationItem.order - b.confirmationItem.order).map((group) => {
                  const checked = isRentalMaterialGroupConfirmed(resolution, value, group.materialGroup);
                  return (
                    <label
                      key={group.confirmationItem.id}
                      className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg bg-gray-50 px-3 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly}
                        onChange={(event) => onChange(updateRentalMaterialConfirmation({
                          resolution,
                          currentRecord: value,
                          materialGroup: group.materialGroup,
                          confirmed: event.target.checked
                        }))}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-primary accent-[var(--customer-color-brand-primary)]"
                      />
                      <span className="text-sm font-semibold leading-relaxed text-gray-800">
                        {group.confirmationText}
                      </span>
                      {checked && <Check size={18} className="ml-auto mt-0.5 shrink-0 text-green-600" aria-hidden="true" />}
                    </label>
                  );
                })}
              </div>}
            </div>
          </div>
        )}
      </section>

      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={previewAttachment.title}
          onClick={closePreview}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <h3 className="min-w-0 break-words text-base font-bold text-gray-900">{previewAttachment.title}</h3>
              <button
                type="button"
                onClick={closePreview}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label={t('rentalMaterialPreviewClose')}
              >
                <X size={22} />
              </button>
            </div>

            <div className="relative min-h-72 flex-1 overflow-auto bg-gray-100">
              {previewStatus === 'error' ? (
                <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
                  <AlertTriangle size={34} className="text-amber-500" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">{t('rentalMaterialPreviewFailed')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{t('rentalMaterialPreviewFailedHint')}</p>
                  <button
                    type="button"
                    onClick={retryPreview}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
                  >
                    <RotateCcw size={16} />
                    {t('rentalMaterialPreviewRetry')}
                  </button>
                </div>
              ) : (
                <>
                  {previewAttachment.mimeType?.includes('pdf') || /\.pdf(?:$|\?)/i.test(previewAttachment.url) ? (
                    <iframe
                      key={`${previewAttachment.id}-${previewAttempt}`}
                      src={previewAttachment.url}
                      title={previewAttachment.title}
                      className="h-[68vh] w-full border-0 bg-white"
                      onLoad={() => setPreviewStatus('ready')}
                      onError={() => setPreviewStatus('error')}
                    />
                  ) : (
                    <img
                      key={`${previewAttachment.id}-${previewAttempt}`}
                      src={previewAttachment.url}
                      alt={previewAttachment.title}
                      className="mx-auto max-h-[68vh] w-full object-contain"
                      onLoad={() => setPreviewStatus('ready')}
                      onError={() => setPreviewStatus('error')}
                    />
                  )}
                  {previewStatus === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                      <div className="text-center text-gray-600">
                        <Loader2 size={30} className="mx-auto animate-spin text-primary" />
                        <p className="mt-3 text-sm font-semibold">{t('rentalMaterialPreviewLoading')}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RentalTermsConfirmationSection;
