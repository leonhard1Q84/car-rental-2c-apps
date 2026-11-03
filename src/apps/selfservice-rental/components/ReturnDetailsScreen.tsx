

import React, { useContext } from 'react';
import { AppView, OrderDetails } from '../types';
import { ArrowLeft, Car, MapPin, Gauge, MessageSquare, Key } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';

interface ReturnDetailsScreenProps {
  setView: (view: AppView) => void;
  orderDetails: OrderDetails;
}

const ReadOnlyPhoto: React.FC<{ label: string; src?: string | null; large?: boolean }> = ({ label, src, large }) => (
    <div className={`border border-gray-200 rounded-lg p-2 bg-white ${large ? 'w-full' : ''}`}>
         <div className={`relative ${large ? 'aspect-video' : 'h-24'} rounded-md overflow-hidden bg-gray-100`}>
             <img
                src={getSafeImageSrc(src)}
                alt={label}
                className="w-full h-full object-cover"
                onError={(event) => {
                    if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
                        event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
                    }
                }}
             />
         </div>
         <p className="mt-1 text-[10px] text-gray-500 font-medium text-center">{label}</p>
    </div>
);

const ReturnDetailsScreen: React.FC<ReturnDetailsScreenProps> = ({ setView, orderDetails }) => {
  const { t } = useContext(LanguageContext);

  // Mocked Return Data (In a real app, this would be passed from a parent state or fetched)
  const mockReturnData = {
      mileage: 12600,
      fuel: 68,
      notes: "Parked near pillar B-12, Level B2",
      damageNote: "No new damage found. Slight scratch on left bumper pre-existed.",
      photos: {
          front: DEFAULT_RENTAL_CAR_IMAGE,
          rear: DEFAULT_RENTAL_CAR_IMAGE,
          left: DEFAULT_RENTAL_CAR_IMAGE,
          right: DEFAULT_RENTAL_CAR_IMAGE,
          parking: DEFAULT_RENTAL_CAR_IMAGE,
          keyReturn: DEFAULT_RENTAL_CAR_IMAGE
      }
  };

  const fuelLevels = Math.round((mockReturnData.fuel / 100) * 8);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">{t('returnDetailsTitle')}</h1>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-10">
         
         {/* 1. Parking & Location Notes (Moved to Top) */}
         <div className="bg-white p-4 rounded-xl shadow-sm">
             <h2 className="font-bold flex items-center mb-4 text-gray-800"><MapPin className="mr-2 text-primary"/>{t('parkingPhotoTitle')}</h2>
             <div className="mb-4">
                 <ReadOnlyPhoto label={t('parkingPhotoTitle')} src={mockReturnData.photos.parking} large />
             </div>
             
             <div>
                <span className="block text-xs font-bold text-gray-500 mb-1">{t('locationNotesTitle')}</span>
                <p className="text-sm bg-gray-50 p-2 rounded border border-gray-100 text-gray-700">{mockReturnData.notes}</p>
             </div>
         </div>

         {/* 2. Stats (Dashboard) */}
         <div className="bg-white p-4 rounded-xl shadow-sm">
             <h2 className="font-bold flex items-center mb-4 text-gray-800"><Gauge className="mr-2 text-primary"/>{t('dashboardTitle')}</h2>
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <span className="block text-xs text-gray-500 mb-1">{t('mileageLabel')}</span>
                     <span className="block text-lg font-mono font-bold text-gray-800">{mockReturnData.mileage.toLocaleString()}</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <span className="block text-xs text-gray-500 mb-1">{t('fuelLevelLabel')}</span>
                     <span className="block text-lg font-mono font-bold text-gray-800">{fuelLevels}/8</span>
                 </div>
             </div>
         </div>

         {/* 3. Exterior Photos */}
         <div className="bg-white p-4 rounded-xl shadow-sm">
             <h2 className="font-bold flex items-center mb-4 text-gray-800"><Car className="mr-2 text-primary"/>{t('exteriorTitle')}</h2>
             <div className="grid grid-cols-2 gap-3">
                 <ReadOnlyPhoto label={t('exteriorFront')} src={mockReturnData.photos.front} />
                 <ReadOnlyPhoto label={t('exteriorRear')} src={mockReturnData.photos.rear} />
                 <ReadOnlyPhoto label={t('exteriorLeft')} src={mockReturnData.photos.left} />
                 <ReadOnlyPhoto label={t('exteriorRight')} src={mockReturnData.photos.right} />
             </div>
         </div>

         {/* 4. Key Return Confirmation */}
         <div className="bg-white p-4 rounded-xl shadow-sm">
             <h2 className="font-bold flex items-center mb-4 text-gray-800"><Key className="mr-2 text-primary"/>{t('returnChecklistTitle')}</h2>
             <ReadOnlyPhoto label={t('returnKeyPhotoEvidenceLabel')} src={mockReturnData.photos.keyReturn} large />
         </div>

         {/* 5. Damage Report */}
         <div className="bg-white p-4 rounded-xl shadow-sm">
             <h2 className="font-bold flex items-center mb-4 text-gray-800"><MessageSquare className="mr-2 text-primary"/>{t('carIssuesTitle')}</h2>
             <div>
                <span className="block text-xs font-bold text-gray-500 mb-1">{t('additionalComments')}</span>
                <p className="text-sm bg-gray-50 p-2 rounded border border-gray-100 text-gray-700">{mockReturnData.damageNote}</p>
             </div>
         </div>

      </div>
    </div>
  );
};

export default ReturnDetailsScreen;
