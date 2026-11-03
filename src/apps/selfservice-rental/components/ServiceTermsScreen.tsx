import React, { useContext } from 'react';
import { AppView } from '../types';
import { ArrowLeft } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import ServiceTermsContent from './ServiceTermsContent';

interface ServiceTermsScreenProps {
  setView: (view: AppView) => void;
}

const ServiceTermsScreen: React.FC<ServiceTermsScreenProps> = ({ setView }) => {
  const { t } = useContext(LanguageContext);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">{t('serviceTermsTitle')}</h1>
      </header>

      <div className="flex-grow overflow-y-auto p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
        <ServiceTermsContent />
      </div>
    </div>
  );
};

export default ServiceTermsScreen;
