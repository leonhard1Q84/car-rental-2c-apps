

import React, { useContext, useState } from 'react';
import { AppView, OrderDetails } from '../types';
import { ArrowLeft, Lightbulb, MapPin, CheckCircle, Phone, MessageSquare, Info, X, Bluetooth } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';

interface VehicleStatusScreenProps {
  orderDetails: OrderDetails;
  setView: (view: AppView) => void;
}

// Reusable Fuel Gauge (fractional)
const FuelGaugeDisplay: React.FC<{ percentage: number }> = ({ percentage }) => {
    const levels = 8;
    const filledLevels = Math.round((percentage / 100) * levels);

    return (
        <div className="w-full">
            <div className="flex items-center space-x-1 h-5">
                <span className="text-[10px] font-bold text-gray-400 mr-1 w-2">E</span>
                {[...Array(levels)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`flex-1 h-full rounded-sm ${i < filledLevels ? 'bg-primary' : 'bg-gray-200'}`}
                    />
                ))}
                <span className="text-[10px] font-bold text-gray-400 ml-1 w-2 text-right">F</span>
            </div>
            <div className="text-right text-[10px] text-gray-400 mt-0.5 font-mono">{filledLevels}/8</div>
        </div>
    );
};

const VehicleStatusScreen: React.FC<VehicleStatusScreenProps> = ({ orderDetails, setView }) => {
  const { t } = useContext(LanguageContext);
  const { vehicle } = orderDetails;
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleAction = (action: string) => {
    setActiveAction(action);
    setTimeout(() => setActiveAction(null), 2000);
  };
  
  const handleNavigate = () => {
      // Mock navigation action
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderDetails.pickupLocation)}`, '_blank');
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
      event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
       <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">{t('vehicleDetails')}</h1>
      </header>

      {/* Map Section */}
      <div className="h-64 relative bg-gray-200 w-full flex-shrink-0">
          {/* Mock Map Image */}
          <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('${DEFAULT_RENTAL_CAR_IMAGE}')` }}></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-primary text-white px-3 py-1.5 rounded-full shadow-lg flex items-center animate-bounce">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm font-bold">{vehicle.parkingSpot || 'A-01'}</span>
              </div>
          </div>
          
          {/* Picture Overlay (Clickable) */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-auto">
             <div 
                className="bg-white p-1 rounded-lg shadow-lg cursor-zoom-in active:scale-95 transition-transform"
                onClick={() => setIsImageModalOpen(true)}
             >
                <div className="relative">
                    <img
                      src={getSafeImageSrc(vehicle.image)}
                      alt="Delivery Photo"
                      className="w-32 h-20 object-cover rounded"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black/0 transition-all hover:bg-black/10">
                         {/* Invisible overlay for hover effect */}
                    </div>
                </div>
                <p className="text-[10px] text-center text-gray-500 mt-1 font-medium">{t('tapToZoom')}</p>
             </div>
          </div>
      </div>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto pb-24">
        
        {/* Vehicle Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
             <div className="flex items-center space-x-4 mb-4">
                <img
                  src={getSafeImageSrc(vehicle.image)}
                  alt={vehicle.name}
                  className="w-24 h-auto object-contain"
                  onError={handleImageError}
                />
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{vehicle.name}</h2>
                    <p className="text-gray-500 text-sm">{vehicle.color} • {vehicle.licensePlate}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                    {/* Updated to use mileageLabel with km */}
                    <p className="text-gray-500 text-xs mb-1">{t('mileageLabel')}</p>
                    <p className="font-bold text-gray-800 text-lg">{vehicle.odometer.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex flex-col justify-center">
                     <p className="text-gray-500 text-xs mb-1">{t('fuelLevel')}</p>
                     {/* Using visualized gauge instead of just text */}
                    <FuelGaugeDisplay percentage={vehicle.fuelLevel} />
                </div>
            </div>
        </div>

        {/* Remote Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4">{t('controls')}</h3>
             <div className="grid grid-cols-1 gap-4">
                <button onClick={() => handleAction('flash')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition">
                    <Lightbulb size={24} className="text-orange-500 mb-2" />
                    <span className="text-xs font-medium text-gray-700">{t('actionFlash')}</span>
                </button>
             </div>
             {/* Bluetooth Removed */}
             
             {activeAction && (
                 <div className="mt-4 flex items-center justify-center text-green-600 bg-green-50 py-2 rounded-lg animate-fade-in">
                     <CheckCircle size={16} className="mr-2" />
                     <span className="text-sm font-medium">
                         {t('actionSent')}
                     </span>
                 </div>
             )}
        </div>
        
        {/* Pickup Instruction Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <Info size={16} className="mr-2 text-primary"/>
                {t('pickupInstructionTitle')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 p-3 rounded-lg">
                {t('pickupInstructionText')}
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <a href={`tel:${orderDetails.pickupLocationDetails.phone}`} className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <Phone size={18} />
                    <span className="text-sm font-semibold">{t('callStore')}</span>
                </a>
                <a href="#" className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <MessageSquare size={18} />
                    <span className="text-sm font-semibold">{t('messageStore')}</span>
                </a>
            </div>
        </div>
      </div>
      
      {/* Navigate Button Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20 max-w-md mx-auto">
          <button 
            onClick={handleNavigate}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors shadow-lg flex items-center justify-center relative overflow-hidden"
          >
              <div className="absolute left-4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              {t('navigate')}
          </button>
      </div>

      {/* Full Screen Image Modal */}
      {isImageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in" onClick={() => setIsImageModalOpen(false)}>
              <button 
                onClick={() => setIsImageModalOpen(false)} 
                className="absolute top-4 right-4 rounded-full bg-gray-800/50 p-2 text-white"
              >
                  <X size={24} />
              </button>
              <img 
                src={getSafeImageSrc(vehicle.image)} 
                alt="Delivery Full" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in" 
                onError={handleImageError}
                onClick={(e) => e.stopPropagation()}
              />
          </div>
      )}
    </div>
  );
};

export default VehicleStatusScreen;
