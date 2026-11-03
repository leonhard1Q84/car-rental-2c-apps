import React, { useContext } from 'react';
import { OrderDetails, AppView } from '../types';
import { FileText, CheckCircle, Car, Power } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface CompletionScreenProps {
  orderDetails: OrderDetails;
  setView: (view: AppView) => void;
  onStartRental?: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ orderDetails, setView, onStartRental }) => {
  const { t } = useContext(LanguageContext);

  const handleStart = () => {
    if (onStartRental) {
      onStartRental();
    } else {
      setView(AppView.OVERVIEW);
    }
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

          <div className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm">
            <div className="flex items-start">
              <div className="mr-3 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Power size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-900">{t('contractEngineUnlockedTitle')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800">{t('contractEngineUnlockedBody')}</p>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm">
            <div className="mb-4 flex items-center border-b border-gray-100 pb-4">
              <FileText className="mr-3 h-6 w-6 text-primary" />
              <div>
                <h2 className="font-bold text-gray-800">{t('rentalContract')}</h2>
                <p className="text-xs text-gray-400">{t('agreementEmailed')}</p>
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
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-white p-4">
        <button
          onClick={handleStart}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-bold text-white shadow-lg transition-colors hover:bg-primary-dark"
        >
          <Car size={20} className="mr-2" />
          {t('backToOverview')}
        </button>
      </div>
    </div>
  );
};

export default CompletionScreen;
