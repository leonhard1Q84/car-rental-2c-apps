import React, { useContext } from 'react';
import { X } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';

interface ReturnParkingExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RETURN_PARKING_EXAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80';

const ReturnParkingExampleModal: React.FC<ReturnParkingExampleModalProps> = ({ isOpen, onClose }) => {
  const { t } = useContext(LanguageContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">{t('returnParkingExampleTitle')}</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <img
            src={getSafeImageSrc(RETURN_PARKING_EXAMPLE_IMAGE)}
            alt={t('returnParkingExampleTitle')}
            className="aspect-video w-full rounded-xl border border-gray-200 object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
                event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
              }
            }}
          />
          <p className="text-sm leading-relaxed text-gray-600">{t('returnParkingExampleBody')}</p>
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            {t('returnParkingExampleCaption')}
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white transition hover:bg-primary-dark"
          >
            {t('inspectionDecisionGuideAcknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnParkingExampleModal;
