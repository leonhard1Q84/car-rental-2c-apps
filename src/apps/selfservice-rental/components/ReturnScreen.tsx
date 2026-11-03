import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppView, OrderDetails, PhotoFile } from '../types';
import {
  ArrowLeft,
  Car,
  MapPin,
  Key,
  CheckCircle,
  AlertTriangle,
  X,
  Gauge,
  HelpCircle,
  Camera,
  MessageSquare,
  Info,
  RefreshCw,
  Phone,
  Check,
} from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';
import ReturnParkingExampleModal from './ReturnParkingExampleModal';
import VehiclePhotoGuideModal from './VehiclePhotoGuideModal';

interface ReturnScreenProps {
  setView: (view: AppView) => void;
  orderDetails: OrderDetails;
  onReturnComplete: () => void;
}

const buildPhotoFiles = (files: FileList): PhotoFile[] =>
  Array.from(files).map((file: File) => ({
    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    preview: URL.createObjectURL(file),
  }));

const PhotoUpload: React.FC<{ label: string; onFilesChange: (files: PhotoFile[]) => void; large?: boolean }> = ({ label, onFilesChange, large }) => {
  const { t } = useContext(LanguageContext);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const updatedPhotos = [...photos, ...buildPhotoFiles(event.target.files)].slice(0, 1);
      setPhotos(updatedPhotos);
      onFilesChange(updatedPhotos);
      event.target.value = '';
    }
  };

  const removePhoto = (id: string) => {
    const updatedPhotos = photos.filter((photo) => photo.id !== id);
    setPhotos(updatedPhotos);
    onFilesChange(updatedPhotos);
  };

  if (large) {
    return (
      <div className="w-full">
        {photos.length > 0 ? (
          <div className="relative aspect-video w-full">
            <img
              src={getSafeImageSrc(photos[0].preview)}
              alt="preview"
              className="h-full w-full rounded-lg border border-gray-200 object-cover"
              onError={(event) => {
                if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
                  event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
                }
              }}
            />
            <button onClick={() => removePhoto(photos[0].id)} className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-md">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={32} className="mb-2 text-gray-400" />
            <span className="text-sm font-semibold text-gray-500">{t('takePhoto')}</span>
            <span className="mt-1 text-xs text-gray-400">{label}</span>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
      {photos.length > 0 ? (
        <div className="relative h-full w-full">
          <img
            src={getSafeImageSrc(photos[0].preview)}
            alt="preview"
            className="h-28 w-full rounded-md object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
                event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
              }
            }}
          />
          <button onClick={() => removePhoto(photos[0].id)} className="absolute -right-2 -top-2 z-10 rounded-full bg-red-500 p-1 text-white shadow-sm">
            <X size={12} />
          </button>
          <div className="mt-1 w-full truncate text-center text-[10px] font-medium text-gray-600">{label}</div>
        </div>
      ) : (
        <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Camera size={20} className="text-gray-400" />
          </div>
          <span className="text-center text-xs font-semibold text-gray-500">{label}</span>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
    </div>
  );
};

const DamagePhotoUploader: React.FC<{
  label: string;
  photos: PhotoFile[];
  onChange: (files: PhotoFile[]) => void;
  max?: number;
}> = ({ label, photos, onChange, max = 4 }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const onPickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    onChange([...photos, ...buildPhotoFiles(event.target.files)].slice(0, max));
    event.target.value = '';
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id));
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl border border-[#DDE2EE] bg-white">
            <img src={getSafeImageSrc(photo.preview)} alt="damage upload" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              className="absolute right-1.5 top-1.5 z-10 rounded-full bg-black/60 p-1 text-white shadow-sm transition-colors hover:bg-black/80"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DDE2EE] bg-white text-primary transition-colors hover:bg-primary/10"
            onClick={() => inputRef.current?.click()}
          >
            <Camera size={22} />
            <span className="mt-2 px-2 text-center text-xs font-semibold leading-tight">{label}</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" className="hidden" accept="image/*" capture="environment" multiple onChange={onPickFiles} />
    </>
  );
};

const FuelGauge: React.FC<{ percentage: number }> = ({ percentage }) => {
  const levels = 8;
  const filledLevels = Math.round((percentage / 100) * levels);

  return (
    <div className="w-full">
      <div className="flex h-6 items-center space-x-1">
        <span className="mr-1 w-3 text-xs font-bold text-gray-400">E</span>
        {[...Array(levels)].map((_, index) => (
          <div key={index} className={`h-full flex-1 rounded-sm transition-all duration-300 ${index < filledLevels ? 'bg-primary' : 'bg-gray-200'}`} />
        ))}
        <span className="ml-1 w-3 text-right text-xs font-bold text-gray-400">F</span>
      </div>
      <div className="mt-1 text-right font-mono text-xs text-gray-400">{filledLevels}/8</div>
    </div>
  );
};

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const ReturnScreen: React.FC<ReturnScreenProps> = ({ setView, orderDetails, onReturnComplete }) => {
  const { t } = useContext(LanguageContext);
  const [step, setStep] = useState(1);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isParkingExampleOpen, setIsParkingExampleOpen] = useState(false);
  const [locationNotes, setLocationNotes] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [keyReturnPhotos, setKeyReturnPhotos] = useState<PhotoFile[]>([]);
  const [damageReportPhotos, setDamageReportPhotos] = useState<PhotoFile[]>([]);
  const [checklistState, setChecklistState] = useState({
    lightsOff: false,
    lockAcknowledged: false,
  });

  const [retryCount, setRetryCount] = useState(0);
  const [displayDistance, setDisplayDistance] = useState<number>(0);

  const [vehicleStats] = useState({
    fuel: 68,
    mileage: orderDetails.vehicle.odometer + 150,
  });

  const checkLocation = () => {
    setIsCheckingLocation(true);

    const targetReturn = orderDetails.returnCoordinates || { lat: 35.6895, lng: 139.6917 };
    const targetStore = orderDetails.storeCoordinates || { lat: 35.6895, lng: 139.6917 };

    setTimeout(() => {
      const currentLoc =
        retryCount === 0
          ? { lat: targetReturn.lat + 0.007, lng: targetReturn.lng }
          : { lat: targetReturn.lat + 0.0001, lng: targetReturn.lng };

      const distToReturn = getDistanceInMeters(currentLoc.lat, currentLoc.lng, targetReturn.lat, targetReturn.lng);
      const distToStore = getDistanceInMeters(currentLoc.lat, currentLoc.lng, targetStore.lat, targetStore.lng);
      const isValid = distToReturn <= 500 || distToStore <= 100;

      setDisplayDistance(Math.min(distToReturn, distToStore));
      setIsLocationValid(isValid);
      setIsCheckingLocation(false);
    }, 1500);
  };

  useEffect(() => {
    checkLocation();
  }, [retryCount]);

  const handleRetryLocation = () => setRetryCount((prev) => prev + 1);

  const handleConfirmReturn = () => {
    setShowModal(false);
    onReturnComplete();
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      setView(AppView.OVERVIEW);
    }
  };

  const storePhone = orderDetails.pickupLocationDetails.phone;
  const sanitizedStorePhone = storePhone.replace(/\s+/g, '');
  const canProceedToVehicleCondition = isLocationValid && keyReturnPhotos.length > 0;
  const canConfirmReturn = checklistState.lightsOff && checklistState.lockAcknowledged;

  const toggleChecklist = (key: keyof typeof checklistState) => {
    setChecklistState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center bg-white p-4 shadow-sm">
        <button onClick={handleBack} className="mr-4">
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="flex-1 text-lg font-bold">{step === 1 ? t('returnStep1Title') : t('returnStep2Title')}</h1>
      </header>

      <div className="flex-grow space-y-6 overflow-y-auto p-4 pb-20">
        {step === 1 && (
          <>
            <div className="animate-fade-in rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center font-bold text-gray-800">
                <MapPin className="mr-2 text-primary" />
                {t('parkingPhotoTitle')}
              </h2>

              <div className={`mb-2 flex items-center rounded-lg p-3 text-sm font-medium ${isCheckingLocation ? 'bg-yellow-50 text-yellow-700' : isLocationValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isCheckingLocation ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    {t('checkLocation')}
                  </>
                ) : isLocationValid ? (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    {t('locationConfirmed')}
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="mr-2" />
                    {t('locationError')}
                  </>
                )}
              </div>

              {!isCheckingLocation && !isLocationValid && (
                <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3">
                  <h4 className="mb-1 text-sm font-bold text-red-800">{t('locationDistanceErrorTitle')}</h4>
                  <p className="mb-2 text-xs text-red-700">{t('locationDistanceErrorBody')}</p>
                  <p className="mb-3 font-mono text-xs text-red-800">{t('currentDistance')} {Math.round(displayDistance)}m</p>

                  <button
                    onClick={handleRetryLocation}
                    className="flex w-full items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                  >
                    <RefreshCw size={14} className="mr-2" />
                    {t('retryLocation')}
                  </button>
                </div>
              )}

              {!isCheckingLocation && !isLocationValid && (
                <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start">
                    <Phone className="mr-2 mt-0.5 flex-shrink-0 text-yellow-700" size={18} />
                    <div>
                      <h3 className="text-sm font-bold text-yellow-800">{t('locationError')}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-yellow-700">
                        {t('returnOutsideFenceAlert')}{' '}
                        <a href={`tel:${sanitizedStorePhone}`} className="font-semibold underline">
                          {storePhone}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start">
                  <Info className="mr-2 mt-0.5 flex-shrink-0 text-yellow-600" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-yellow-800">{t('returnDisclaimerTitle')}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-yellow-700">{t('returnDisclaimerBody')}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">{t('parkingPhotoGuide')}</p>
                  <button
                    type="button"
                    onClick={() => setIsParkingExampleOpen(true)}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                  >
                    {t('viewExample')}
                  </button>
                </div>
                <PhotoUpload label={t('parkingPhotoTitle')} large onFilesChange={() => {}} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">{t('locationNotesTitle')}</label>
                <textarea
                  value={locationNotes}
                  onChange={(event) => setLocationNotes(event.target.value)}
                  placeholder={t('locationNotesPlaceholder')}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="animate-fade-in rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-gray-800">{t('returnChecklistTitle')}</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-3 rounded-full bg-primary/10 p-2">
                    <Key className="text-primary" size={18} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">{t('returnKeyInstruction')}</p>
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                        {t('returnKeyPhotoRequiredLabel')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{t('returnKeyPhotoGuide')}</p>
                  </div>
                </div>

                <PhotoUpload label={t('returnKeyPhotoUpload')} large onFilesChange={setKeyReturnPhotos} />

                {keyReturnPhotos.length === 0 && (
                  <div className="rounded-lg border border-[#F0D7A4] bg-[#FFF8EC] px-3 py-2 text-xs font-medium text-[#8B6420]">
                    {t('returnKeyPhotoValidation')}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="animate-fade-in rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-4 flex items-center font-bold text-gray-800">
                <Gauge className="mr-2 text-primary" />
                {t('dashboardTitle')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <span className="mb-1 block text-xs text-gray-500">{t('mileageLabel')}</span>
                  <span className="block text-lg font-bold text-gray-800 font-mono">{vehicleStats.mileage.toLocaleString()}</span>
                </div>
                <div className="flex flex-col justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <span className="mb-1 block text-xs text-gray-500">{t('fuelLevelLabel')}</span>
                  <FuelGauge percentage={vehicleStats.fuel} />
                </div>
              </div>
              <div className="mt-3 flex items-start rounded-lg border border-orange-100 bg-orange-50 p-3 text-left">
                <AlertTriangle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                <p className="text-xs font-medium leading-relaxed text-orange-800">{t('dataMismatchWarning')}</p>
              </div>
            </div>

            <div className="animate-fade-in rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center font-bold text-gray-800">
                  <Car className="mr-2 text-primary" />
                  {t('exteriorTitle')}
                </h2>
                <button type="button" onClick={() => setIsGuideOpen(true)} className="flex items-center text-sm font-semibold text-primary">
                  <HelpCircle size={16} className="mr-1" />
                  {t('photoGuide')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PhotoUpload label={t('exteriorFront')} onFilesChange={() => {}} />
                <PhotoUpload label={t('exteriorRear')} onFilesChange={() => {}} />
                <PhotoUpload label={t('exteriorLeft')} onFilesChange={() => {}} />
                <PhotoUpload label={t('exteriorRight')} onFilesChange={() => {}} />
              </div>
            </div>

            <div className="animate-fade-in rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-4 flex items-center font-bold">
                <MessageSquare className="mr-2 text-primary" />
                {t('carIssuesTitle')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('additionalComments')}</label>
                  <textarea
                    value={additionalComments}
                    onChange={(event) => setAdditionalComments(event.target.value)}
                    placeholder={t('additionalCommentsPlaceholder')}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-sm"
                  />
                </div>

                {additionalComments.trim().length > 0 && (
                  <div>
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#5B6278]">{t('returnDamagePhotoTitle')}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{t('returnDamagePhotoPrompt')}</p>
                    </div>
                    <DamagePhotoUploader
                      label={t('returnDamagePhotoUpload')}
                      photos={damageReportPhotos}
                      onChange={setDamageReportPhotos}
                      max={4}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="animate-fade-in rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-gray-800">{t('returnVehicleChecklistTitle')}</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleChecklist('lightsOff')}
                  className={`flex w-full items-start rounded-xl border p-4 text-left transition-colors ${checklistState.lightsOff ? 'border-[#C7E2D0] bg-[#ECF6EE]' : 'border-[#DDE2EE] bg-white hover:bg-[#F7F9FD]'}`}
                >
                  <span className={`mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 ${checklistState.lightsOff ? 'border-[#45AF66] bg-[#45AF66] text-white' : 'border-[#C9D1E1] bg-white text-transparent'}`}>
                    <Check size={12} />
                  </span>
                  <span className="text-sm font-medium text-gray-700">{t('returnLightsInstruction')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChecklist('lockAcknowledged')}
                  className={`flex w-full items-start rounded-xl border p-4 text-left transition-colors ${checklistState.lockAcknowledged ? 'border-[#C7E2D0] bg-[#ECF6EE]' : 'border-[#DDE2EE] bg-white hover:bg-[#F7F9FD]'}`}
                >
                  <span className={`mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 ${checklistState.lockAcknowledged ? 'border-[#45AF66] bg-[#45AF66] text-white' : 'border-[#C9D1E1] bg-white text-transparent'}`}>
                    <Check size={12} />
                  </span>
                  <span className="text-sm font-medium text-gray-700">{t('returnLockInstruction')}</span>
                </button>
              </div>

              {!canConfirmReturn && (
                <div className="mt-4 rounded-lg border border-[#F0D7A4] bg-[#FFF8EC] px-3 py-2 text-xs font-medium text-[#8B6420]">
                  {t('returnVehicleChecklistValidation')}
                </div>
              )}
            </div>

            <div className="animate-fade-in rounded-xl border border-primary/20 bg-primary/10 p-4">
              <h3 className="mb-1 text-sm font-bold text-primary-dark">{t('confirmDropoffTitle')}</h3>
              <p className="mb-3 text-xs leading-relaxed text-primary-dark">{t('confirmDropoffBody')}</p>
              <div className="flex space-x-2">
                <a href={`tel:${sanitizedStorePhone}`} className="flex flex-1 items-center justify-center rounded border border-primary/20 bg-white py-2 text-xs font-semibold text-primary transition hover:bg-primary/10">
                  <Phone size={14} className="mr-1.5" />
                  {t('call')}
                </a>
                <a href={`sms:${sanitizedStorePhone}`} className="flex flex-1 items-center justify-center rounded border border-primary/20 bg-white py-2 text-xs font-semibold text-primary transition hover:bg-primary/10">
                  <MessageSquare size={14} className="mr-1.5" />
                  {t('message')}
                </a>
              </div>
            </div>

            <div className="animate-fade-in rounded-r-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <h3 className="text-sm font-bold text-yellow-800">{t('postRentalChargesTitle')}</h3>
              <p className="mt-1 text-xs leading-relaxed text-yellow-700">{t('postRentalChargesBody')}</p>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 z-20 border-t bg-white p-4">
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedToVehicleCondition}
            className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white shadow-lg transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('nextStep')}
          </button>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            disabled={!canConfirmReturn}
            className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white shadow-lg transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('confirmEndTrip')}
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-scale-in">
            <h3 className="mb-2 text-lg font-bold text-gray-900">{t('endTripModalTitle')}</h3>
            <p className="mb-4 text-sm text-gray-600">{t('endTripModalBody')}</p>

            <ul className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-left text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                {t('endTripModalPoint1')}
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                {t('endTripModalPoint2')}
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                {t('endTripModalPoint3')}
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 font-bold text-gray-700 transition-colors hover:bg-gray-50">
                {t('cancel')}
              </button>
              <button onClick={handleConfirmReturn} className="rounded-lg bg-primary px-4 py-2.5 font-bold text-white transition-colors hover:bg-primary-dark">
                {t('endTrip')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReturnParkingExampleModal isOpen={isParkingExampleOpen} onClose={() => setIsParkingExampleOpen(false)} />
      <VehiclePhotoGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export default ReturnScreen;
