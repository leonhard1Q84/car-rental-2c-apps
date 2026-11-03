import React, { useContext } from 'react';
import { OrderDetails, AppView } from '../types';
import { FileText, CheckCircle, Car, Power, Clock3, AlertTriangle, RefreshCw, CircleParking } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface CompletionScreenProps {
  orderDetails: OrderDetails;
  setView: (view: AppView) => void;
  onStartRental?: () => void;
  onRetryContractGeneration?: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  orderDetails,
  setView,
  onStartRental,
  onRetryContractGeneration
}) => {
  const { t } = useContext(LanguageContext);
  const attachmentStatus = orderDetails.contract.attachment_status;
  const contractReady = attachmentStatus === 'READY' && orderDetails.isRentalActive;
  const contractFailed = attachmentStatus === 'FAILED';

  const handlePrimaryAction = () => {
    if (contractFailed) {
      if (onRetryContractGeneration) {
        onRetryContractGeneration();
      } else {
        setView(AppView.OVERVIEW);
      }
      return;
    }

    if (onStartRental) {
      onStartRental();
    } else {
      setView(AppView.OVERVIEW);
    }
  };

  const statusContent = contractReady
    ? {
        icon: <Power size={20} />,
        containerClass: 'border-emerald-100 bg-emerald-50',
        iconClass: 'bg-emerald-100 text-emerald-600',
        titleClass: 'text-emerald-900',
        bodyClass: 'text-emerald-800',
        title: t('contractEngineUnlockedTitle'),
        body: t('contractEngineUnlockedBody')
      }
    : contractFailed
      ? {
          icon: <AlertTriangle size={20} />,
          containerClass: 'border-red-100 bg-red-50',
          iconClass: 'bg-red-100 text-red-600',
          titleClass: 'text-red-900',
          bodyClass: 'text-red-800',
          title: t('contractGenerationFailedTitle'),
          body: t('contractGenerationFailedBody')
        }
      : {
          icon: <Clock3 size={20} />,
          containerClass: 'border-amber-100 bg-amber-50',
          iconClass: 'bg-amber-100 text-amber-700',
          titleClass: 'text-amber-900',
          bodyClass: 'text-amber-800',
          title: t('contractGenerationPendingTitle'),
          body: t('contractGenerationPendingBody')
        };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <div className="flex-grow overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6 py-8 text-center">
          <div className="animate-scale-in">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('contractSignedTitle')}</h1>
            <p className="mt-2 text-gray-500">{t('contractSignedSuccess')}</p>
          </div>

          <div className={`w-full rounded-2xl border p-5 text-left shadow-sm ${statusContent.containerClass}`}>
            <div className="flex items-start">
              <div className={`mr-3 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${statusContent.iconClass}`}>
                {statusContent.icon}
              </div>
              <div>
                <h2 className={`text-base font-bold ${statusContent.titleClass}`}>{statusContent.title}</h2>
                <p className={`mt-1 text-sm leading-relaxed ${statusContent.bodyClass}`}>{statusContent.body}</p>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm">
            <div className="mb-4 flex items-center border-b border-gray-100 pb-4">
              <FileText className="mr-3 h-6 w-6 text-primary" />
              <div>
                <h2 className="font-bold text-gray-800">{t('rentalContract')}</h2>
                <p className="text-xs text-gray-400">
                  {contractReady
                    ? t('agreementEmailed')
                    : contractFailed
                      ? t('contractGenerationFailedTitle')
                      : t('contractAttachmentGenerating')}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('contractNumber')}</span>
                <span className="font-medium">{orderDetails.contract.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('signingDate')}</span>
                <span className="font-medium">{orderDetails.contract.date}</span>
              </div>
            </div>
          </div>

          <section
            aria-labelledby="pickup-parking-fee-completion-title"
            className="flex w-full items-start rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-amber-950"
          >
            <CircleParking size={20} className="mr-3 mt-0.5 flex-shrink-0 text-amber-700" />
            <div>
              <h2 id="pickup-parking-fee-completion-title" className="text-sm font-bold">
                {t('pickupParkingFeeCompletionTitle')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                {t('pickupParkingFeeCompletionBody')}
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-white p-4">
        <button
          onClick={handlePrimaryAction}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-bold text-white shadow-lg transition-colors hover:bg-primary-dark"
        >
          {contractFailed ? <RefreshCw size={20} className="mr-2" /> : <Car size={20} className="mr-2" />}
          {contractFailed
            ? t('contractRetry')
            : contractReady
              ? t('contractStartJourney')
              : t('contractCompletionBackToOverview')}
        </button>
      </div>
    </div>
  );
};

export default CompletionScreen;
