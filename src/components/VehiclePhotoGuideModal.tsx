import React, { useContext } from 'react';
import { X } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';

interface VehiclePhotoGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VehiclePhotoGuideModal: React.FC<VehiclePhotoGuideModalProps> = ({ isOpen, onClose }) => {
    const { t } = useContext(LanguageContext);

    const photoGuideItems = [
        { img: DEFAULT_RENTAL_CAR_IMAGE, label: t('exteriorFront') },
        { img: DEFAULT_RENTAL_CAR_IMAGE, label: t('exteriorRear') },
        { img: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=600&q=80', label: t('exteriorLeft') },
        { img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80', label: t('exteriorRight') },
        { img: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=600&q=80', label: t('lightsFront') },
        { img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&q=80', label: t('lightsRear') },
        { img: DEFAULT_RENTAL_CAR_IMAGE, label: t('photoDamage') },
    ];

    const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
        if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
            event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-end z-50" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-t-2xl pb-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 relative">
                    <h2 className="text-lg font-bold text-center">{t('photoGuideTitle')}</h2>
                    <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                    <p className="text-sm text-gray-600">{t('photoGuideSubtitle1')}</p>
                    <div className="grid grid-cols-2 gap-4">
                        {photoGuideItems.slice(0, 6).map(item => (
                            <div key={item.label} className="rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={getSafeImageSrc(item.img)}
                                    alt={item.label}
                                    className="w-full h-auto object-cover aspect-[4/3] bg-gray-100"
                                    onError={handleImageError}
                                />
                                <p className="text-center text-xs font-medium text-white bg-gray-700 py-1.5">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-gray-600 mt-2">{t('photoGuideSubtitle2')}</p>
                    <div className="grid grid-cols-2 gap-4">
                        {photoGuideItems.slice(6, 7).map(item => (
                            <div key={item.label} className="rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={getSafeImageSrc(item.img)}
                                    alt={item.label}
                                    className="w-full h-auto object-cover aspect-[4/3] bg-gray-100"
                                    onError={handleImageError}
                                />
                                <p className="text-center text-xs font-medium text-white bg-gray-700 py-1.5">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehiclePhotoGuideModal;
