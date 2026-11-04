

import React, { useContext, useState } from 'react';
import { AppView, OrderDetails } from '../types';
import { Car, CheckCircle, ShieldCheck, FileSignature, Search, Clipboard, Check, MapPin, Gauge, Fuel, Navigation, Lightbulb, Lock, Unlock, FileText, ChevronRight, Clock, Loader2, UserCheck, BookOpen, CircleParking } from 'lucide-react';
import OverviewHeader from './OverviewHeader';
import OverviewStoreInfoCard from './OverviewStoreInfoCard';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';

interface OverviewScreenProps {
    orderDetails: OrderDetails;
    setView: (view: AppView) => void;
    inspectionCompleted: boolean;
    onRetryContractGeneration?: () => void;
}

interface JourneyStep {
    name: string;
    completed: boolean;
    action?: string;
    enabled: boolean;
    handler?: () => void;
    note?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    disableClickWhenCompleted?: boolean;
    showDisabledAction?: boolean;
}

// Mini Fuel Gauge Component for Overview
const FuelGaugeMini: React.FC<{ percentage: number }> = ({ percentage }) => {
    const levels = 8;
    const filledLevels = Math.round((percentage / 100) * levels);

    return (
        <div className="flex items-center justify-center">
            <Fuel size={14} className="mr-1.5 text-primary" />
            <div className="flex space-x-0.5 h-3">
                {[...Array(levels)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 rounded-sm ${i < filledLevels ? 'bg-primary' : 'bg-gray-200'}`}
                    />
                ))}
            </div>
            {/* Removed percentage text as requested to keep it clean */}
        </div>
    );
};

const OverviewScreen: React.FC<OverviewScreenProps> = ({ orderDetails, setView, inspectionCompleted, onRetryContractGeneration }) => {
    const { vehicle } = orderDetails;
    const { t } = useContext(LanguageContext);
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(vehicle.isLocked);

    const isRentalActive = orderDetails.isRentalActive;
    const isReturned = orderDetails.isReturned;
    const isPickupCompleted =
        orderDetails.canonical_status === 'PICKED_UP' && Boolean(orderDetails.pickup_completed_at);
    const isContractSigned = orderDetails.contract_sign_status === 'SIGNED';
    const contractAttachmentUrl = orderDetails.contract.attachment_url?.trim() || '';
    const isContractDownloadReady =
        isContractSigned &&
        orderDetails.contract.attachment_status === 'READY' &&
        contractAttachmentUrl.length > 0;
    const isContractGenerating = isContractSigned
        && orderDetails.contract.attachment_status === 'GENERATING';
    const isContractFailed = isContractSigned
        && orderDetails.contract.attachment_status === 'FAILED';
    const isPreparing = orderDetails.preparationStatus === 'Preparing';
    const isDepositPaid = [3, 4, 5].includes(orderDetails.deposit.status);
    const showPickupParkingFeeNotice = !isPickupCompleted && !isRentalActive && !isReturned;

    const handleCopy = async () => {
        setCopied(false);
        setCopyFailed(false);
        try {
            await navigator.clipboard.writeText(orderDetails.confirmationCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopyFailed(true);
        }
    };

    const handleAction = (action: string) => {
        setActiveAction(action);
        if (action === 'toggleLock') {
            setTimeout(() => {
                setIsLocked(!isLocked);
                setActiveAction(null);
            }, 1000);
        } else {
            setTimeout(() => setActiveAction(null), 2000);
        }
    };

    const handleContractDownload = () => {
        if (!isContractDownloadReady) return;
        const anchor = document.createElement('a');
        anchor.href = contractAttachmentUrl;
        anchor.download = `${orderDetails.contract.number || 'rental-agreement'}.pdf`;
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    const openServiceTerms = () => setView(AppView.SERVICE_TERMS);

    const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
        if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
            event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
        }
    };

    // Define Steps Flow
    const steps: JourneyStep[] = [
        {
            name: t('stepOnlineCheckIn'),
            completed: true, // Always completed as per requirement (since user is on My Trip)
            action: t('stepOnlineCheckInAction'),
            enabled: true,
            handler: () => { }, // No action needed or maybe view profile
            note: t('stepOnlineCheckInNote'),
            icon: UserCheck,
        },
        {
            name: t('stepDeposit'),
            completed: isDepositPaid,
            action: isDepositPaid ? t('view') : t('stepDepositAction'),
            enabled: !isDepositPaid || isRentalActive || isReturned,
            handler: () => setView(AppView.DEPOSIT),
            note: isDepositPaid ? t('stepDepositNoteAuthorized') : t('stepDepositNote'),
            icon: ShieldCheck,
        },
        {
            name: t('stepInspection'),
            completed: inspectionCompleted,
            action: inspectionCompleted ? t('view') : t('stepInspectionAction'),
            enabled: (isDepositPaid && !inspectionCompleted) || inspectionCompleted,
            handler: () => setView(inspectionCompleted ? AppView.INSPECTION_DETAILS : AppView.INSPECTION),
            icon: Search,
        },
        {
            name: t('stepContract'),
            completed: isContractSigned,
            action: isContractSigned
                ? (isContractDownloadReady ? t('view') : isContractFailed ? t('contractRetry') : t('contractGenerating'))
                : t('stepContractAction'),
            enabled: (isPickupCompleted && !isContractSigned)
                || isContractDownloadReady
                || (isContractSigned && orderDetails.contract.attachment_status === 'FAILED'),
            handler: () => {
                if (isContractSigned) {
                    if (isContractFailed) {
                        onRetryContractGeneration?.();
                        return;
                    }
                    handleContractDownload();
                    return;
                }
                setView(AppView.CONTRACT);
            },
            icon: FileSignature,
            disableClickWhenCompleted: isContractGenerating,
            showDisabledAction: isContractGenerating,
        }
    ];

    if (isRentalActive || isReturned) {
        steps.push({
            name: t('stepReturn'),
            completed: isReturned,
            action: isReturned ? t('view') : t('stepReturnAction'),
            enabled: (isRentalActive && !isReturned) || isReturned,
            handler: () => isReturned ? setView(AppView.RETURN_DETAILS) : setView(AppView.RETURN),
            note: isReturned ? t('completed') : (t('stepReturnNote') + orderDetails.rentalPeriod.end.split(' ')[0] + "\n" + t('stepReturnCounterNote')),
            icon: CheckCircle,
        });
    }

    // Active Rental Dashboard Widget
    const ActiveRentalDashboard = () => (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 animate-fade-in">
            {/* Map Header */}
            <div className="relative h-48 w-full bg-gray-200">
                <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: `url('${DEFAULT_RENTAL_CAR_IMAGE}')` }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary text-white px-3 py-1.5 rounded-full shadow-lg flex items-center animate-pulse">
                        <MapPin size={16} className="mr-1" />
                        <span className="text-sm font-bold">{t('currentLocation')}</span>
                    </div>
                </div>
                {/* Car Overlay */}
                <div className="absolute bottom-[-20px] left-4 border-4 border-white rounded-xl shadow-md bg-white">
                    <img
                        src={getSafeImageSrc(vehicle.image)}
                        alt={vehicle.name}
                        className="w-20 h-14 object-contain p-1"
                        onError={handleImageError}
                    />
                </div>
            </div>

            {/* Stats & Controls */}
            <div className="pt-8 px-5 pb-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{vehicle.name}</h2>
                        <p className="text-gray-500 text-sm">{vehicle.licensePlate}</p>
                    </div>
                    <div className="flex space-x-4 text-center">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">{t('fuelLevel')}</p>
                            {/* Updated to use Mini Fuel Gauge */}
                            <FuelGaugeMini percentage={vehicle.fuelLevel} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">{t('currentMileage')}</p>
                            <p className="text-sm font-bold text-gray-700 flex items-center justify-center"><Gauge size={14} className="mr-1.5 text-green-500" /> {vehicle.range} <span className="text-xs font-normal ml-0.5">{t('km')}</span></p>
                        </div>
                    </div>
                </div>

                {!isReturned ? (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleAction('flash')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition">
                                <Lightbulb size={24} className="text-primary mb-1" />
                                <span className="text-[10px] font-medium text-gray-700">{t('actionFlash')}</span>
                            </button>
                            <button
                                onClick={() => handleAction('toggleLock')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl active:scale-95 transition ${isLocked ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}`}
                            >
                                {isLocked ? (
                                    <>
                                        <Unlock size={24} className="text-green-600 mb-1" />
                                        <span className="text-[10px] font-medium text-gray-700">{t('actionUnlock')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={24} className="text-red-500 mb-1" />
                                        <span className="text-[10px] font-medium text-gray-700">{t('actionLock')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {/* Bluetooth Removed */}
                    </>
                ) : (
                    <div>
                        <div className="flex justify-center text-gray-400 text-xs items-center">
                            <Lock size={12} className="mr-1" />
                            {t('digitalKeyDisabled')}
                        </div>
                    </div>
                )}

                {activeAction && !isReturned && (
                    <div className="mt-3 flex items-center justify-center text-green-600 text-sm bg-green-50 py-1 rounded-lg animate-fade-in">
                        <CheckCircle size={14} className="mr-1.5" />
                        <span>
                            {activeAction === 'toggleLock'
                                ? (isLocked ? t('actionUnlockSent') : t('actionLockSent'))
                                : t('actionSent')
                            }
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    // Pre-Pickup Hero Widget
    const PrePickupHero = () => (
        <div className="relative mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            {/* Title is now external, this is just card content */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <img
                        src={getSafeImageSrc(vehicle.image)}
                        alt={vehicle.name}
                        className={`h-24 w-24 shrink-0 rounded-lg bg-gray-50 object-contain sm:h-28 sm:w-28 ${isPreparing ? 'opacity-80' : ''}`}
                        onError={handleImageError}
                    />
                    <div className="min-w-0 flex-1">
                        <h3 className="break-words text-xl font-bold leading-snug text-gray-900">
                            {vehicle.name} {isPreparing && <span className="text-gray-500 text-sm font-normal">{t('orSimilar')}</span>}
                        </h3>

                        {isPreparing ? (
                            <div className="flex items-center text-sm text-primary font-semibold mt-1">
                                <Loader2 size={14} className="mr-1 animate-spin" />
                                {t('preparingBadge')}
                            </div>
                        ) : (
                            <div className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-relaxed text-primary">
                                <MapPin size={16} className="mt-0.5 shrink-0" />
                                <span className="min-w-0 break-words">{t('parkingSpot')}: {vehicle.parkingSpot || orderDetails.pickupLocation || t('locationInfoPending')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                    <div>
                        <p className="text-xs font-medium text-gray-500">{t('licensePlate')}</p>
                        <p className="mt-1 break-words font-semibold text-gray-900">{isPreparing ? '----' : (vehicle.state + ' ' + vehicle.licensePlate)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">{t('color')}</p>
                        <p className="mt-1 break-words font-semibold text-gray-900">{isPreparing ? '--' : vehicle.color}</p>
                    </div>
                </div>

                {isPreparing ? (
                    <div className="mt-4 bg-primary/10 rounded-lg p-3 flex items-start text-primary">
                        <Clock size={16} className="mr-2 mt-0.5 flex-shrink-0 text-primary" />
                        <p className="text-xs font-medium leading-relaxed">{t('preparingDesc')}</p>
                    </div>
                ) : (
                    <button type="button" onClick={() => setView(AppView.VEHICLE_STATUS)} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-gray-50 p-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">
                        <Navigation size={16} className="mr-2" />
                        {t('findCar')}
                    </button>
                )}
            </div>
        </div>
    );

    // Logic to determine which status title to show OUTSIDE the card
    const getStatusTitle = () => {
        if (isReturned) return t('tripEndedTitle');
        if (isRentalActive) return t('carActiveTitle');
        if (isPreparing) return t('carPreparingTitle');
        return t('carReadyTitle');
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <OverviewHeader />

            <main className="p-4 relative z-10 flex-grow pb-16">

                {/* Order Ref Strip */}
                <div className="mb-5 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-500">{t('confirmationNumberLabel')}</p>
                            <button onClick={() => setView(AppView.RESERVATION_DETAILS)} className="min-h-11 max-w-full break-all py-1 text-left text-base font-semibold leading-snug text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
                                {orderDetails.confirmationCode}
                            </button>
                        </div>
                        <button type="button" onClick={handleCopy} aria-label={t(copied ? 'copied' : 'copy')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-100 text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                            {copied ? <Check size={18} className="text-green-600" /> : <Clipboard size={18} />}
                        </button>
                    </div>
                    <p role="status" className="text-xs text-green-700">{copied ? t('copied') : ''}</p>
                    {copyFailed && <p role="alert" className="mt-2 text-sm text-red-700">{t('prepCopyFailed')}</p>}
                </div>

                {/* External Title for Hero/Dashboard */}
                <h2 className="text-xl font-bold text-gray-800 mb-3 px-1">{getStatusTitle()}</h2>

                {/* Dynamic Hero Section */}
                {isReturned
                    ? <ActiveRentalDashboard /> // Show dashboard with disabled controls
                    : (isRentalActive ? <ActiveRentalDashboard /> : <PrePickupHero />)
                }

                {showPickupParkingFeeNotice && (
                    <section
                        aria-labelledby="pickup-parking-fee-notice-title"
                        className="flex items-start rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
                    >
                        <CircleParking size={20} className="mr-3 mt-0.5 flex-shrink-0 text-amber-700" />
                        <div className="min-w-0 flex-1">
                            <h3 id="pickup-parking-fee-notice-title" className="text-sm font-bold">
                                {t('pickupParkingFeeNoticeTitle')}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-amber-900">
                                {t('pickupParkingFeeNoticeBody')}
                            </p>
                            <button
                                type="button"
                                onClick={openServiceTerms}
                                className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-amber-800 underline decoration-amber-500 decoration-dashed underline-offset-4 transition-colors hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
                            >
                                <span>{t('pickupParkingFeeDetailsLink')}</span>
                                <ChevronRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Journey Timeline - Always Visible */}
                <div className="bg-white p-5 rounded-xl shadow-lg mt-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                        {t('pickupInstructions')}
                    </h3>
                    <div className="space-y-0 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-2 bottom-6 w-0.5 bg-gray-200"></div>

                        {steps.map((step, index) => {
                            let isClickable = step.completed || step.enabled;
                            if (step.disableClickWhenCompleted && step.completed) {
                                isClickable = false;
                            }
                            if (isPreparing && step.name === t('stepInspection')) {
                                isClickable = false;
                            }

                            const isCurrent = step.enabled && !step.completed && (!isPreparing || step.name !== t('stepInspection'));

                            return (
                                <div
                                    key={index}
                                    className="relative pb-6 pl-12 last:pb-0"
                                >
                                    {/* Status Icon */}
                                    <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 transition-colors ${step.completed ? 'bg-primary/10 border-white text-primary' :
                                        isCurrent ? 'bg-primary border-white text-white shadow-md' : 'bg-gray-100 border-white text-gray-400'
                                        }`}>
                                        {step.completed ? <Check size={20} /> : <step.icon size={18} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0 flex-[1_1_120px] pt-2">
                                            <p className={`text-base font-semibold ${step.completed ? 'text-gray-800' : isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                                                {step.name}
                                            </p>
                                            {step.note && <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-gray-500">{step.note}</p>}
                                        </div>

                                        {step.action && (isClickable || step.showDisabledAction) && (
                                            <button
                                                type="button"
                                                disabled={!isClickable}
                                                onClick={() => { if (isClickable) step.handler?.(); }}
                                                className={`ml-auto min-h-11 shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${!isClickable
                                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                    : step.completed
                                                        ? 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                        : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                                                    }`}
                                            >
                                                {step.action}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <OverviewStoreInfoCard store={orderDetails.pickupLocationDetails} />

                {/* Rental Docs Link for active state ONLY (Hidden when returned) */}
                {(isRentalActive && !isReturned) && (
                    <button onClick={() => setView(AppView.COMPLETION)} className="w-full mt-4 bg-white rounded-xl shadow p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center">
                            <FileText className="text-gray-500 mr-3" />
                            <span className="font-semibold text-gray-700">{t('rentalDocuments')}</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                )}

            </main>

            {/* Sticky Footer for Service Terms */}
            <div className="sticky bottom-0 z-30 border-t border-gray-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                <button
                    onClick={openServiceTerms}
                    className="w-full flex items-center justify-center text-gray-500 hover:text-primary transition-colors py-2"
                >
                    <BookOpen size={16} className="mr-2" />
                    <span className="text-sm font-medium underline decoration-dashed underline-offset-4">{t('serviceTermsLink')}</span>
                </button>
            </div>
        </div>
    );
};

export default OverviewScreen;
