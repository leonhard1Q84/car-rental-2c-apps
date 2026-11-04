import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    AppView,
    InspectionDecisionMode,
    InspectionSubmissionRecord,
    OrderDetails,
    PhotoFile,
} from '../types';
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle,
    CheckCircle2,
    Clock3,
    Lock,
    Loader2,
    Plus,
    RefreshCw,
    X,
    Unlock,
} from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { doorControlService } from '../modules/selfservice-rental/vehicle-control/public-api';
import type { DoorCommandAction, DoorState } from '../modules/selfservice-rental/vehicle-control/public-api';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';
import VehiclePhotoGuideModal from './VehiclePhotoGuideModal';
import PickupDashboardCard from './PickupDashboardCard';
import { DriverPhotoSection } from '../modules/selfservice-rental/driver-photos/DriverPhotoSection';
import { useDriverPhotos } from '../modules/selfservice-rental/driver-photos/useDriverPhotos';
import { resolveCustomerVehicleMetricSource } from './customerVehicleMetricSubmission';

interface InspectionScreenProps {
    setView: (view: AppView) => void;
    onInspectionRecordChange: (record: InspectionSubmissionRecord) => void;
    onContinueToContract: (record: InspectionSubmissionRecord) => void;
    initialRecord?: InspectionSubmissionRecord | null;
    orderDetails: OrderDetails;
}

const DEFAULT_BASELINE_DAMAGE_ISSUES = ['paintScratch', 'bodyCracked', 'rimsDamage', 'bodyDent'];
const MOCK_IMG_FRONT = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80";
const MOCK_IMG_REAR = "https://images.unsplash.com/photo-1510254256671-6c2ff5287319?w=600&q=80";
const MOCK_IMG_LEFT = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80";
const MOCK_IMG_RIGHT = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80";
const MOCK_IMG_INT_FRONT = "https://images.unsplash.com/photo-1596541671569-81acae043fa6?w=600&q=80";
const MOCK_IMG_INT_REAR = "https://images.unsplash.com/photo-1627056093866-e8d1de81d45c?w=600&q=80";
const MOCK_IMG_DMG = "https://images.unsplash.com/photo-1574345229555-d368e7ecbe9c?w=600&q=80";
const DOOR_CONTROL_TIMEOUT_MS = 20_000;
const DOOR_STATUS_POLL_INTERVAL_MS = 2_000;
const AUTO_RELOCK_OBSERVATION_MS = 30_000;

type DoorOperationPhase = 'checking' | 'executing' | 'verifying' | 'success' | 'timeout' | 'failed';

interface DoorOperation {
    action: DoorCommandAction;
    phase: DoorOperationPhase;
    requestId: string;
    deadlineAt: number;
    alreadyInTargetState?: boolean;
}

class DoorControlTimeoutError extends Error {
    constructor() {
        super('DOOR_CONTROL_TIMEOUT');
        this.name = 'DoorControlTimeoutError';
    }
}

const withDeadline = <T,>(promise: Promise<T>, deadlineAt: number): Promise<T> => {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) return Promise.reject(new DoorControlTimeoutError());

    return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new DoorControlTimeoutError()), remainingMs);
        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                window.clearTimeout(timer);
                reject(error);
            },
        );
    });
};

const buildPhotoFiles = (files: FileList): PhotoFile[] =>
    Array.from(files).map((file: File) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
    }));

const appendPhotos = (current: PhotoFile[], incoming: PhotoFile[], max: number = 2): PhotoFile[] =>
    [...current, ...incoming].slice(0, max);

const buildPhotoFilesFromPreviews = (previews: string[]): PhotoFile[] =>
    previews.map((preview, index) => ({
        id: `existing-${index}-${preview.slice(-12)}`,
        file: new File([], `existing-${index}.jpg`, { type: 'image/jpeg' }),
        preview,
    }));

const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== DEFAULT_RENTAL_CAR_IMAGE) {
        event.currentTarget.src = DEFAULT_RENTAL_CAR_IMAGE;
    }
};

const ReadOnlyImage: React.FC<{ label: string; src: string; heightClass?: string }> = ({ label, src, heightClass = "h-[100px]" }) => (
    <div className={`bg-gray-100 border border-gray-200 rounded flex flex-col items-center justify-center relative overflow-hidden w-full ${heightClass}`}>
        <img src={src} alt={label} className="w-full h-full object-cover" onError={handleImageError} />
        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-center text-[10px] py-1 font-semibold">{label}</div>
    </div>
);

const PhotoUploader: React.FC<{
    label: string;
    photos: PhotoFile[];
    onChange: (files: PhotoFile[]) => void;
    max?: number;
}> = ({ label, photos, onChange, max = 2 }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const incoming = buildPhotoFiles(e.target.files);
        onChange(appendPhotos(photos, incoming, max));
        e.target.value = '';
    };

    const removePhoto = (id: string) => {
        onChange(photos.filter(photo => photo.id !== id));
    };

    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                {photos.map(photo => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#DDE2EE] bg-white">
                        <img
                            src={getSafeImageSrc(photo.preview)}
                            alt="upload"
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                        />
                        <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white shadow-sm z-10 transition-colors hover:bg-black/80"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    </div>
                ))}

                {photos.length < max && (
                    <button
                        type="button"
                        className="aspect-square rounded-xl border-2 border-dashed border-[#DDE2EE] bg-white hover:bg-primary/10 transition-colors flex flex-col items-center justify-center text-primary"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Plus size={22} />
                        <span className="mt-2 px-2 text-xs font-semibold text-center leading-tight">{label}</span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                multiple={max > 1}
                onChange={onPickFiles}
            />
        </>
    );
};
const InspectionScreen: React.FC<InspectionScreenProps> = ({
    setView,
    onInspectionRecordChange,
    onContinueToContract,
    initialRecord = null,
    orderDetails,
}) => {
    const { t } = useContext(LanguageContext);
    const reportExceptionNoteMaxLength = 500;
    const baselineDamageIssueCodes = initialRecord?.baselineSnapshot?.damage.issues?.length
        ? initialRecord.baselineSnapshot.damage.issues
        : DEFAULT_BASELINE_DAMAGE_ISSUES;
    const baselineExterior = initialRecord?.baselineSnapshot?.exterior;
    const baselineInterior = initialRecord?.baselineSnapshot?.interior;
    const baselineDamageImage = initialRecord?.baselineSnapshot?.damage.image;

    const vehicleMetricSourceInput = useMemo(() => ({
        vehicleId: orderDetails.vehicle.licensePlate,
        mileage: orderDetails.vehicle.odometer,
        energyPercent: orderDetails.vehicle.fuelLevel,
        fuelType: orderDetails.vehicle.fuelType,
        telematicsStatus: orderDetails.vehicle.telematicsStatus,
        capturedAt: orderDetails.vehicle.telematicsLastReadingAt
    }), [
        orderDetails.vehicle.fuelLevel,
        orderDetails.vehicle.fuelType,
        orderDetails.vehicle.licensePlate,
        orderDetails.vehicle.odometer,
        orderDetails.vehicle.telematicsLastReadingAt,
        orderDetails.vehicle.telematicsStatus
    ]);
    const vehicleMetricSource = resolveCustomerVehicleMetricSource(vehicleMetricSourceInput);
    const driverPhotoBinding = {
        orderId: orderDetails.orderNumber,
        vehicleId: orderDetails.vehicle.licensePlate,
        snapshot: orderDetails.onlineCheckinDrivers,
    };
    const driverPhotos = useDriverPhotos(driverPhotoBinding);
    const driverPhotoConfirmation = driverPhotos.confirmation;

    const [isPhotoGuideModalOpen, setIsPhotoGuideModalOpen] = useState(false);
    const [doorState, setDoorState] = useState<DoorState>('UNKNOWN');
    const [doorStatusUpdatedAt, setDoorStatusUpdatedAt] = useState<number | null>(null);
    const [isDoorStatusLoading, setIsDoorStatusLoading] = useState(true);
    const [doorStatusError, setDoorStatusError] = useState(false);
    const [doorOperation, setDoorOperation] = useState<DoorOperation | null>(null);
    const [doorAlert, setDoorAlert] = useState<'locked_again' | null>(null);
    const mountedRef = useRef(true);
    const operationSequenceRef = useRef(0);
    const operationTokenRef = useRef<string | null>(null);
    const lastCommandRef = useRef<{ action: DoorCommandAction; at: number } | null>(null);
    const observationRef = useRef<{ sessionId: string; startedAt: number; lastState: DoorState } | null>(null);
    const observationTimerRef = useRef<number | null>(null);

    // Exception upload state
    const [reportPhotos, setReportPhotos] = useState<PhotoFile[]>(
        initialRecord ? buildPhotoFilesFromPreviews(initialRecord.exceptionPhotos || []) : [],
    );
    const [reportExceptionNote, setReportExceptionNote] = useState(initialRecord?.exceptionNote || '');

    // Action mode and preserved historical confirmation audit
    const [actionMode, setActionMode] = useState<InspectionDecisionMode>(initialRecord?.decisionMode || 'skip');
    const contractConfirmationRecord = initialRecord?.contractConfirmationRecord;

    const applyDoorStatus = useCallback((status: { state: DoorState; receivedAt: number }) => {
        if (!mountedRef.current) return;
        setDoorState(status.state);
        setDoorStatusUpdatedAt(status.receivedAt);
        setDoorStatusError(status.state === 'UNKNOWN');
    }, []);

    const stopRelockObservation = useCallback(() => {
        observationRef.current = null;
        if (observationTimerRef.current !== null) {
            window.clearTimeout(observationTimerRef.current);
            observationTimerRef.current = null;
        }
    }, []);

    const startRelockObservation = useCallback((sessionId: string) => {
        stopRelockObservation();
        observationRef.current = {
            sessionId,
            startedAt: Date.now(),
            lastState: 'UNLOCKED',
        };

        const poll = async () => {
            const observation = observationRef.current;
            if (!observation || observation.sessionId !== sessionId || !mountedRef.current) return;

            if (Date.now() - observation.startedAt >= AUTO_RELOCK_OBSERVATION_MS) {
                stopRelockObservation();
                return;
            }

            try {
                const status = await doorControlService.getDoorStatus();
                if (!mountedRef.current || observationRef.current?.sessionId !== sessionId) return;
                applyDoorStatus(status);

                const latestCommand = lastCommandRef.current;
                const wasUserLock = latestCommand?.action === 'LOCK' && latestCommand.at >= observation.startedAt;
                if (observation.lastState === 'UNLOCKED' && status.state === 'LOCKED' && !wasUserLock) {
                    setDoorAlert('locked_again');
                    stopRelockObservation();
                    return;
                }

                observation.lastState = status.state;
            } catch {
                // A transient status read failure must not be interpreted as an auto-lock.
            }

            if (observationRef.current?.sessionId === sessionId && mountedRef.current) {
                observationTimerRef.current = window.setTimeout(poll, DOOR_STATUS_POLL_INTERVAL_MS);
            }
        };

        void poll();
    }, [applyDoorStatus, stopRelockObservation]);

    const refreshDoorStatus = useCallback(async () => {
        setIsDoorStatusLoading(true);
        try {
            const status = await doorControlService.getDoorStatus();
            applyDoorStatus(status);
            return status;
        } catch {
            if (mountedRef.current) {
                setDoorState('UNKNOWN');
                setDoorStatusError(true);
            }
            return null;
        } finally {
            if (mountedRef.current) setIsDoorStatusLoading(false);
        }
    }, [applyDoorStatus]);

    useEffect(() => {
        mountedRef.current = true;
        void refreshDoorStatus();

        const handleForeground = () => {
            if (document.visibilityState === 'visible') void refreshDoorStatus();
        };
        document.addEventListener('visibilitychange', handleForeground);
        window.addEventListener('focus', handleForeground);

        return () => {
            mountedRef.current = false;
            stopRelockObservation();
            document.removeEventListener('visibilitychange', handleForeground);
            window.removeEventListener('focus', handleForeground);
        };
    }, [refreshDoorStatus, stopRelockObservation]);

    const buildInspectionRecord = (
        submittedAt = initialRecord?.submittedAt || new Date().toISOString()
    ): InspectionSubmissionRecord => {
        const normalizedExceptionNote = reportExceptionNote.trim();

        return {
            submittedAt,
            vehicleStats: {
                mileage: vehicleMetricSource.mileage,
                fuel: vehicleMetricSource.energyPercent
            },
            vehicleMetricCheckpoint: initialRecord?.vehicleMetricCheckpoint,
            dashboardPhoto: initialRecord?.dashboardPhoto,
            verificationStatus: driverPhotos.complete ? 'uploaded' : 'idle',
            verificationPhotos: driverPhotoConfirmation.drivers.map(driver => driver.photo),
            driverPhotoConfirmation,
            exteriorPhotos: {
                front: [MOCK_IMG_FRONT],
                rear: [MOCK_IMG_REAR],
                left: [MOCK_IMG_LEFT],
                right: [MOCK_IMG_RIGHT],
            },
            lightPhotos: { front: [], rear: [] },
            damageDescription:
                actionMode === 'skip'
                    ? t('inspectionDecisionSkipLabel')
                    : `${t('inspectionDecisionReportLabel')} (${reportPhotos.length} ${t('inspectionPhotoCountUnit')})`,
            decisionMode: actionMode,
            exceptionPhotos: reportPhotos.map(photo => photo.preview),
            exceptionNote: normalizedExceptionNote,
            termsAgreedAt: initialRecord?.termsAgreedAt,
            termsVersion: initialRecord?.termsVersion,
            contractConfirmationRecord,
            baselineSnapshot: {
                exterior: {
                    front: baselineExterior?.front || MOCK_IMG_FRONT,
                    rear: baselineExterior?.rear || MOCK_IMG_REAR,
                    left: baselineExterior?.left || MOCK_IMG_LEFT,
                    right: baselineExterior?.right || MOCK_IMG_RIGHT,
                },
                interior: {
                    frontArea: baselineInterior?.frontArea || MOCK_IMG_INT_FRONT,
                    rearArea: baselineInterior?.rearArea || MOCK_IMG_INT_REAR,
                },
                damage: {
                    issues: baselineDamageIssueCodes,
                    image: baselineDamageImage || MOCK_IMG_DMG,
                },
            },
        };
    };

    useEffect(() => {
        const hasInspectionDraft = Boolean(
            initialRecord ||
            driverPhotoConfirmation.drivers.length ||
            reportPhotos.length ||
            reportExceptionNote.trim() ||
            actionMode === 'report' ||
            contractConfirmationRecord,
        );

        if (!hasInspectionDraft) return;
        onInspectionRecordChange(buildInspectionRecord());
    }, [
        actionMode,
        onInspectionRecordChange,
        reportExceptionNote,
        reportPhotos,
        contractConfirmationRecord,
        driverPhotoConfirmation,
        driverPhotos.complete,
        vehicleMetricSource.mileage,
        vehicleMetricSource.energyPercent,
    ]);

    const isDoorOperationPending = Boolean(
        doorOperation && ['checking', 'executing', 'verifying'].includes(doorOperation.phase),
    );

    const updateDoorOperationPhase = (requestId: string, phase: DoorOperationPhase) => {
        if (!mountedRef.current || operationTokenRef.current !== requestId) return;
        setDoorOperation((current) => current && current.requestId === requestId ? { ...current, phase } : current);
    };

    const executeDoorOperation = useCallback(async (operation: DoorOperation) => {
        const targetState: DoorState = operation.action === 'UNLOCK' ? 'UNLOCKED' : 'LOCKED';

        try {
            const readStatus = async () => {
                const status = await withDeadline(
                    doorControlService.getDoorStatus(),
                    operation.deadlineAt,
                );
                applyDoorStatus(status);
                return status;
            };

            const initialStatus = await readStatus();
            if (initialStatus.state === targetState) {
                setDoorOperation((current) => current && current.requestId === operation.requestId
                    ? { ...current, phase: 'success', alreadyInTargetState: true }
                    : current);
                if (operation.action === 'UNLOCK') {
                    startRelockObservation(operation.requestId);
                } else {
                    stopRelockObservation();
                }
                return;
            }
            if (initialStatus.state === 'UNKNOWN') {
                setDoorStatusError(true);
                throw new Error('DOOR_STATUS_UNKNOWN');
            }

            updateDoorOperationPhase(operation.requestId, 'executing');
            const commandResult = await withDeadline(
                doorControlService.sendDoorCommand(operation.action, operation.requestId),
                operation.deadlineAt,
            );
            if (!commandResult.accepted) throw new Error('DOOR_CONTROL_REJECTED');
            lastCommandRef.current = { action: operation.action, at: Date.now() };
            updateDoorOperationPhase(operation.requestId, 'verifying');

            while (Date.now() < operation.deadlineAt) {
                const status = await readStatus();
                if (status.state === targetState) {
                    if (mountedRef.current && operationTokenRef.current === operation.requestId) {
                        setDoorOperation((current) => current && current.requestId === operation.requestId
                            ? { ...current, phase: 'success' }
                            : current);
                        if (operation.action === 'UNLOCK') {
                            startRelockObservation(operation.requestId);
                        } else {
                            stopRelockObservation();
                        }
                    }
                    return;
                }

                const remainingMs = operation.deadlineAt - Date.now();
                if (remainingMs <= 0) break;
                await withDeadline(
                    new Promise<void>((resolve) => window.setTimeout(resolve, Math.min(DOOR_STATUS_POLL_INTERVAL_MS, remainingMs))),
                    operation.deadlineAt,
                );
            }

            throw new DoorControlTimeoutError();
        } catch (error) {
            if (!mountedRef.current || operationTokenRef.current !== operation.requestId) return;
            setDoorOperation((current) => current && current.requestId === operation.requestId
                ? { ...current, phase: error instanceof DoorControlTimeoutError ? 'timeout' : 'failed' }
                : current);
            if (!(error instanceof DoorControlTimeoutError)) setDoorStatusError(true);
        }
    }, [applyDoorStatus, startRelockObservation, stopRelockObservation]);

    const handleDoorControl = useCallback((action: DoorCommandAction) => {
        if (isDoorOperationPending) return;
        stopRelockObservation();
        setDoorAlert(null);

        operationSequenceRef.current += 1;
        const requestId = `door-${Date.now()}-${operationSequenceRef.current}`;
        const operation: DoorOperation = {
            action,
            phase: 'checking',
            requestId,
            deadlineAt: Date.now() + DOOR_CONTROL_TIMEOUT_MS,
        };
        operationTokenRef.current = requestId;
        setDoorOperation(operation);
        void executeDoorOperation(operation);
    }, [executeDoorOperation, isDoorOperationPending, stopRelockObservation]);

    const handleDoorOperationClose = useCallback(() => {
        if (isDoorOperationPending) return;
        operationTokenRef.current = null;
        setDoorOperation(null);
    }, [isDoorOperationPending]);

    const handleDoorOperationRetry = useCallback(() => {
        if (!doorOperation || isDoorOperationPending) return;
        handleDoorControl(doorOperation.action);
    }, [doorOperation, handleDoorControl, isDoorOperationPending]);

    useEffect(() => {
        if (!doorOperation || doorOperation.phase !== 'success') return;
        const timer = window.setTimeout(() => {
            if (operationTokenRef.current === doorOperation.requestId) {
                operationTokenRef.current = null;
                setDoorOperation(null);
            }
        }, 900);
        return () => window.clearTimeout(timer);
    }, [doorOperation]);

    useEffect(() => {
        if (!isDoorOperationPending) return;
        const preventDismiss = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        window.addEventListener('keydown', preventDismiss);
        return () => window.removeEventListener('keydown', preventDismiss);
    }, [isDoorOperationPending]);

    const isReportPhotoMissing = actionMode === 'report' && reportPhotos.length === 0;
    const canSubmit = driverPhotos.complete && !isReportPhotoMissing && !isDoorOperationPending;

    const handleSubmit = () => {
        if (!canSubmit) return;
        const submittedAt = new Date().toISOString();
        onContinueToContract(buildInspectionRecord(submittedAt));
    };

    const handleBack = () => {
        if (isDoorOperationPending) return;
        setView(AppView.OVERVIEW);
    };

    const doorStatusLabel = {
        LOCKED: t('inspectionDoorStatusLocked'),
        UNLOCKED: t('inspectionDoorStatusUnlocked'),
        UNKNOWN: t('inspectionDoorStatusUnknown'),
    }[doorState];

    const doorStatusTone = {
        LOCKED: 'border-gray-200 bg-gray-50 text-gray-800',
        UNLOCKED: 'border-amber-200 bg-amber-50 text-amber-900',
        UNKNOWN: 'border-gray-200 bg-gray-50 text-gray-600',
    }[doorState];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={handleBack} disabled={isDoorOperationPending} className="mr-4 disabled:opacity-40">
                        <ArrowLeft className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{t('inspectionTitle')}</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">

                <PickupDashboardCard sourceInput={vehicleMetricSourceInput} />

                <DriverPhotoSection binding={driverPhotoBinding} capture={driverPhotos} />

                {/* Vehicle Controls */}
                <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-base text-gray-900 border-l-4 border-primary pl-2">
                            {t('inspectionVehicleControlsTitle')}
                        </h2>
                        {isDoorStatusLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" aria-label={t('inspectionDoorStatusChecking')} />}
                    </div>

                    <div className={`rounded-lg border p-3 ${doorStatusTone}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('inspectionDoorStatusLabel')}</span>
                            <span className="flex items-center gap-2 text-sm font-bold">
                                {doorState === 'UNLOCKED' ? <Unlock size={16} /> : doorState === 'LOCKED' ? <Lock size={16} /> : <AlertTriangle size={16} />}
                                {doorStatusLabel}
                            </span>
                        </div>
                        {doorStatusUpdatedAt && (
                            <p className="mt-1 text-[11px] text-gray-500">
                                {t('inspectionDoorLastUpdated')}
                            </p>
                        )}
                    </div>

                    {doorStatusError && !isDoorOperationPending && (
                        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                            {t('inspectionDoorStatusUnavailable')}
                        </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleDoorControl('UNLOCK')}
                            disabled={isDoorOperationPending}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Unlock size={17} />
                            {t('inspectionUnlockDoors')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDoorControl('LOCK')}
                            disabled={isDoorOperationPending}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Lock size={17} />
                            {t('inspectionLockDoors')}
                        </button>
                    </div>

                    <div className="mt-4 rounded-lg border border-[#F1D8A6] bg-[#FFF8EC] px-3 py-2.5 text-xs leading-relaxed text-[#8B6420]">
                        {t('inspectionDoorInstruction')}
                    </div>

                    {doorAlert === 'locked_again' && (
                        <div className="mt-3 rounded-lg border border-[#F1D8A6] bg-[#FFF8EC] p-3 text-[#8B6420]">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">{t('inspectionDoorLockedAgainTitle')}</p>
                                    <p className="mt-1 text-xs leading-relaxed">{t('inspectionDoorLockedAgainBody')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Read Only Exterior */}
                <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="font-bold text-base text-gray-900 border-l-4 border-gray-400 pl-2 mb-4">{t('inspectionExteriorTitle')}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <ReadOnlyImage label="Front" src={baselineExterior?.front || MOCK_IMG_FRONT} />
                        <ReadOnlyImage label="Rear" src={baselineExterior?.rear || MOCK_IMG_REAR} />
                        <ReadOnlyImage label="Left Side" src={baselineExterior?.left || MOCK_IMG_LEFT} />
                        <ReadOnlyImage label="Right Side" src={baselineExterior?.right || MOCK_IMG_RIGHT} />
                    </div>
                </section>

                {/* Read Only Interior */}
                <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="font-bold text-base text-gray-900 border-l-4 border-gray-400 pl-2 mb-4">{t('inspectionInteriorTitle')}</h2>
                    <div className="flex flex-col gap-3">
                        <ReadOnlyImage label="Front Area Overview" src={baselineInterior?.frontArea || MOCK_IMG_INT_FRONT} heightClass="h-[120px]" />
                        <ReadOnlyImage label="Rear Area Overview" src={baselineInterior?.rearArea || MOCK_IMG_INT_REAR} heightClass="h-[120px]" />
                    </div>
                </section>

                {/* Damage Report (Existing Damages Read Only) */}
                <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="font-bold text-base text-gray-900 border-l-4 border-gray-400 pl-2 mb-4">{t('inspectionDamageTitle')}</h2>

                    <div className="mb-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Damage Issues:</p>
                        <div className="flex flex-wrap gap-2">
                            {baselineDamageIssueCodes.map(issueCode => (
                                <span key={issueCode} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs border border-gray-200">
                                    {t(`damage.issue.${issueCode}`)}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Damages:</p>
                        <ReadOnlyImage label="Reported Existing Damage" src={baselineDamageImage || MOCK_IMG_DMG} heightClass="h-[140px]" />
                    </div>
                </section>

                {/* Customer Decision Area */}
                <section className="mt-8 pb-10">
                    <div className="rounded-xl border border-[#DDE2EE] bg-[#F7F8FC] p-4">
                        <div className="rounded-xl border border-[#E7EBF3] bg-[#F8F2E6] p-4 mb-4">
                            <div className="flex items-start text-[#1F2436]">
                                <div className="w-7 h-7 rounded-full bg-white border border-[#F0D9A3] flex items-center justify-center mr-3 flex-shrink-0">
                                    <AlertTriangle size={14} className="text-[#F3A21D]" />
                                </div>
                                <p className="text-sm font-normal leading-relaxed">{t('inspectionDecisionWarning')}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#E7EBF3] bg-white p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-base text-[#1F2436]">{t('inspectionDecisionTitle')}</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsPhotoGuideModalOpen(true)}
                                    className="text-primary text-xs font-semibold hover:underline underline-offset-4 transition-colors"
                                >
                                    {t('photoGuide')}
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div
                                    className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-center ${actionMode === 'skip'
                                        ? 'bg-[#ECF6EE] border-[#C7E2D0]'
                                        : 'bg-white border-[#DDE2EE] hover:bg-[#F7F9FD]'
                                        }`}
                                    onClick={() => setActionMode('skip')}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${actionMode === 'skip' ? 'bg-[#45AF66] text-white' : 'bg-[#EFF2F9] text-[#95A1BB]'}`}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <p className="font-semibold text-[#1F2436] text-base">{t('inspectionDecisionSkipLabel')}</p>
                                </div>

                                <div
                                    className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-center ${actionMode === 'report'
                                        ? 'bg-[#FFF8EC] border-[#F1D8A6]'
                                        : 'bg-white border-[#DDE2EE] hover:bg-[#F7F9FD]'
                                        }`}
                                    onClick={() => setActionMode('report')}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${actionMode === 'report' ? 'bg-[#F4A51C] text-white' : 'bg-[#FFF4E2] text-[#F4A51C]'}`}>
                                        <AlertTriangle size={16} />
                                    </div>
                                    <p className="font-semibold text-[#1F2436] text-base">{t('inspectionDecisionReportLabel')}</p>
                                </div>
                            </div>

                            {actionMode === 'report' && (
                                <div className="mt-5 pt-4 border-t border-[#E7EBF3] animate-fade-in">
                                    <p className="text-sm text-[#5B6278] font-semibold mb-3">{t('inspectionDecisionUploadPrompt')}</p>
                                    <PhotoUploader label={t('inspectionDecisionUploadAction')} photos={reportPhotos} onChange={setReportPhotos} max={4} />

                                    {isReportPhotoMissing && (
                                        <p className="mt-3 rounded-lg border border-[#F0D7A4] bg-[#FFF8EC] px-3 py-2 text-xs font-medium text-[#8B6420]">
                                            {t('inspectionDecisionPhotoRequired')}
                                        </p>
                                    )}

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-[#5B6278] mb-2">{t('additionalComments')}</label>
                                        <textarea
                                            value={reportExceptionNote}
                                            onChange={(e) => setReportExceptionNote(e.target.value)}
                                            placeholder={t('additionalCommentsPlaceholder')}
                                            rows={3}
                                            maxLength={reportExceptionNoteMaxLength}
                                            className="w-full p-3 border border-[#DDE2EE] rounded-xl text-sm bg-[#F5F6FA] focus:ring-1 focus:ring-primary focus:border-primary outline-none transition text-[#1F2436]"
                                        />
                                        <p className="text-[11px] text-[#5B6278] text-right mt-1">
                                            {reportExceptionNote.length}/{reportExceptionNoteMaxLength}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 px-1">
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full text-white font-bold text-lg py-4 px-4 rounded-xl shadow transition-all ${canSubmit ? 'bg-primary hover:bg-primary-dark' : 'bg-primary/40 cursor-not-allowed'}`}
                        >
                            {t('continueToContract')}
                        </button>
                        {!driverPhotos.complete && (
                            <p className="mt-3 text-center text-xs leading-relaxed text-[#5B6278]">
                                {t('driverPhotoRequired')}
                            </p>
                        )}
                    </div>
                </section>
            </div>

            {doorOperation && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="door-operation-title"
                    onClick={(event) => {
                        if (isDoorOperationPending) event.stopPropagation();
                    }}
                >
                    <div
                        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {isDoorOperationPending && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <h3 id="door-operation-title" className="text-lg font-bold text-gray-900">
                                        {doorOperation.action === 'UNLOCK' ? t('inspectionDoorUnlocking') : t('inspectionDoorLocking')}
                                    </h3>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                                    {doorOperation.phase === 'checking'
                                        ? t('inspectionDoorChecking')
                                        : doorOperation.phase === 'verifying'
                                            ? t('inspectionDoorVerifying')
                                            : t('inspectionDoorWaiting')}
                                </p>
                            </>
                        )}

                        {doorOperation.phase === 'success' && (
                            <div className="flex items-start gap-3">
                                <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
                                <div>
                                    <h3 id="door-operation-title" className="text-lg font-bold text-gray-900">
                                        {doorOperation.action === 'UNLOCK'
                                            ? doorOperation.alreadyInTargetState ? t('inspectionDoorAlreadyUnlocked') : t('inspectionDoorUnlocked')
                                            : doorOperation.alreadyInTargetState ? t('inspectionDoorAlreadyLocked') : t('inspectionDoorLocked')}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                        {doorOperation.action === 'UNLOCK' ? t('inspectionUnlockSuccess') : t('inspectionDoorLockSuccess')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {doorOperation.phase === 'timeout' && (
                            <>
                                <div className="flex items-start gap-3">
                                    <Clock3 className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
                                    <div>
                                        <h3 id="door-operation-title" className="text-lg font-bold text-gray-900">{t('inspectionDoorTimeoutTitle')}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('inspectionDoorTimeoutBody')}</p>
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDoorOperationRetry}
                                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                                    >
                                        <RefreshCw size={16} />
                                        {t('inspectionDoorRetry')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDoorOperationClose}
                                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                                    >
                                        <X size={16} />
                                        {t('inspectionDoorClose')}
                                    </button>
                                </div>
                            </>
                        )}

                        {doorOperation.phase === 'failed' && (
                            <>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                                    <div>
                                        <h3 id="door-operation-title" className="text-lg font-bold text-gray-900">{t('inspectionDoorFailureTitle')}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('inspectionDoorFailureBody')}</p>
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDoorOperationRetry}
                                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                                    >
                                        <RefreshCw size={16} />
                                        {t('inspectionDoorRetry')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDoorOperationClose}
                                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                                    >
                                        <X size={16} />
                                        {t('inspectionDoorClose')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <VehiclePhotoGuideModal isOpen={isPhotoGuideModalOpen} onClose={() => setIsPhotoGuideModalOpen(false)} />
        </div>
    );
};

export default InspectionScreen;
