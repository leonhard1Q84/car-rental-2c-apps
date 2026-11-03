import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    AppView,
    InspectionDecisionMode,
    InspectionSubmissionRecord,
    InspectionVerificationStatus,
    PhotoFile,
} from '../types';
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle,
    Clock3,
    Loader2,
    Plus,
    X,
    Unlock,
    CheckCircle2
} from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';
import ServiceTermsContent from './ServiceTermsContent';
import VehiclePhotoGuideModal from './VehiclePhotoGuideModal';

interface InspectionScreenProps {
    setView: (view: AppView) => void;
    onInspectionRecordChange: (record: InspectionSubmissionRecord) => void;
    onContinueToContract: (record: InspectionSubmissionRecord) => void;
    initialRecord?: InspectionSubmissionRecord | null;
}

const MAX_VERIFICATION_PHOTOS = 2;
const DEFAULT_BASELINE_DAMAGE_ISSUES = ['paintScratch', 'bodyCracked', 'rimsDamage', 'bodyDent'];
const MOCK_IMG_FRONT = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80";
const MOCK_IMG_REAR = "https://images.unsplash.com/photo-1510254256671-6c2ff5287319?w=600&q=80";
const MOCK_IMG_LEFT = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80";
const MOCK_IMG_RIGHT = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80";
const MOCK_IMG_INT_FRONT = "https://images.unsplash.com/photo-1596541671569-81acae043fa6?w=600&q=80";
const MOCK_IMG_INT_REAR = "https://images.unsplash.com/photo-1627056093866-e8d1de81d45c?w=600&q=80";
const MOCK_IMG_DMG = "https://images.unsplash.com/photo-1574345229555-d368e7ecbe9c?w=600&q=80";

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
}) => {
    const { t } = useContext(LanguageContext);
    const inspectionTermsVersion = 'service_billing_policies_v1';
    const reportExceptionNoteMaxLength = 500;
    const baselineDamageIssueCodes = initialRecord?.baselineSnapshot?.damage.issues?.length
        ? initialRecord.baselineSnapshot.damage.issues
        : DEFAULT_BASELINE_DAMAGE_ISSUES;
    const baselineExterior = initialRecord?.baselineSnapshot?.exterior;
    const baselineInterior = initialRecord?.baselineSnapshot?.interior;
    const baselineDamageImage = initialRecord?.baselineSnapshot?.damage.image;

    const [vehicleStats] = useState({
        fuel: initialRecord?.vehicleStats.fuel ?? 85,
        mileage: initialRecord?.vehicleStats.mileage ?? 12450,
    });
    const [verificationPhotos, setVerificationPhotos] = useState<PhotoFile[]>(
        initialRecord ? buildPhotoFilesFromPreviews(initialRecord.verificationPhotos) : [],
    );
    const [verificationStatus, setVerificationStatus] = useState<InspectionVerificationStatus>(
        initialRecord?.verificationStatus || 'idle',
    );
    const [verificationReviewReason, setVerificationReviewReason] = useState(initialRecord?.verificationReviewReason || '');
    const isApplyingParentReviewStateRef = useRef(false);
    const verifyInputRef = useRef<HTMLInputElement>(null);

    const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
    const [isPhotoGuideModalOpen, setIsPhotoGuideModalOpen] = useState(false);
    const [isDoorUnlocked, setIsDoorUnlocked] = useState(Boolean(initialRecord));

    // Exception upload state
    const [reportPhotos, setReportPhotos] = useState<PhotoFile[]>(
        initialRecord ? buildPhotoFilesFromPreviews(initialRecord.exceptionPhotos || []) : [],
    );
    const [reportExceptionNote, setReportExceptionNote] = useState(initialRecord?.exceptionNote || '');

    // Action Mode & Terms
    const [actionMode, setActionMode] = useState<InspectionDecisionMode>(initialRecord?.decisionMode || 'skip');
    const [termsAgreedAt, setTermsAgreedAt] = useState<string | null>(initialRecord?.termsAgreedAt || null);
    const isTermsAgreed = Boolean(termsAgreedAt);

    // New UX: Force view terms
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [hasViewedTerms, setHasViewedTerms] = useState(Boolean(initialRecord?.termsAgreedAt));

    useEffect(() => {
        // Simulate vehicle unlock logic via telematics API 
        const unlockTimer = setTimeout(() => {
            setIsDoorUnlocked(true);
        }, 1500);

        return () => {
            clearTimeout(unlockTimer);
        };
    }, [Boolean(initialRecord)]);

    useEffect(() => {
        if (!initialRecord) return;
        isApplyingParentReviewStateRef.current = true;
        setVerificationStatus(initialRecord.verificationStatus || 'idle');
        setVerificationReviewReason(initialRecord.verificationReviewReason || '');
    }, [initialRecord?.verificationStatus, initialRecord?.verificationReviewReason]);

    const buildInspectionRecord = (): InspectionSubmissionRecord => {
        const normalizedExceptionNote = reportExceptionNote.trim();

        return {
            submittedAt: initialRecord?.submittedAt || new Date().toISOString(),
            vehicleStats: { mileage: vehicleStats.mileage, fuel: vehicleStats.fuel },
            verificationStatus,
            verificationReviewReason: verificationReviewReason || undefined,
            verificationPhotos: verificationPhotos.map(photo => photo.preview),
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
            termsAgreedAt: termsAgreedAt || undefined,
            termsVersion: termsAgreedAt ? inspectionTermsVersion : undefined,
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
            verificationPhotos.length ||
            reportPhotos.length ||
            reportExceptionNote.trim() ||
            actionMode === 'report' ||
            termsAgreedAt,
        );

        if (!hasInspectionDraft) return;
        if (isApplyingParentReviewStateRef.current) {
            isApplyingParentReviewStateRef.current = false;
            return;
        }
        onInspectionRecordChange(buildInspectionRecord());
    }, [
        actionMode,
        onInspectionRecordChange,
        reportExceptionNote,
        reportPhotos,
        termsAgreedAt,
        verificationPhotos,
        verificationReviewReason,
        verificationStatus,
        vehicleStats.fuel,
        vehicleStats.mileage,
    ]);

    const handleVerificationPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (verificationStatus === 'pending_review' || verificationStatus === 'approved') return;
        if (!e.target.files || e.target.files.length === 0) return;
        const incoming = buildPhotoFiles(e.target.files);
        const updated = [...verificationPhotos, ...incoming].slice(0, MAX_VERIFICATION_PHOTOS);
        setVerificationPhotos(updated);
        setVerificationReviewReason('');
        setVerificationStatus(updated.length > 0 ? 'pending_review' : 'idle');
        e.target.value = '';
    };

    const handleRemoveVerificationPhoto = (id: string) => {
        if (verificationStatus === 'pending_review' || verificationStatus === 'approved') return;
        const updated = verificationPhotos.filter(photo => photo.id !== id);
        setVerificationPhotos(updated);

        if (updated.length === 0) {
            setVerificationStatus('idle');
            setVerificationReviewReason('');
            return;
        }
    };

    const isVerificationLocked = verificationStatus === 'pending_review' || verificationStatus === 'approved';
    const isVerificationDone = verificationStatus === 'approved' && verificationPhotos.length > 0;
    const isReportPhotoMissing = actionMode === 'report' && reportPhotos.length === 0;

    const canSubmit = isVerificationDone && isTermsAgreed && !isReportPhotoMissing;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onContinueToContract(buildInspectionRecord());
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
                        <ArrowLeft className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{t('inspectionTitle')}</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">

                {/* Telematics Action State */}
                <div className={`p-4 rounded-xl flex items-center transition-all duration-500 shadow-sm ${isDoorUnlocked ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'bg-primary/10 border border-primary/20 text-primary-dark font-bold'}`}>
                    {isDoorUnlocked ? <Unlock className="w-6 h-6 mr-3 flex-shrink-0 text-amber-600" /> : <Loader2 className="w-6 h-6 mr-3 animate-spin flex-shrink-0" />}
                    <div className="text-sm">
                        {isDoorUnlocked ? (
                            <>{t('inspectionUnlockSuccess')}</>
                        ) : (
                            <>{t('inspectionUnlockPending')}</>
                        )}
                    </div>
                </div>

                {/* Driver Verification */}
                <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-base text-gray-900 border-l-4 border-primary pl-2">{t('driverVerificationTitle')}</h2>
                        <button
                            type="button"
                            onClick={() => setIsExampleModalOpen(true)}
                            className="bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary rounded-full transition hover:bg-primary/20"
                        >
                            {t('viewExample')}
                        </button>
                    </div>

                    <p
                        className="text-sm text-gray-600 mb-2 leading-relaxed mt-2 font-medium"
                        dangerouslySetInnerHTML={{ __html: t('driverVerificationDesc') }}
                    />
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        {t('driverVerificationTip')}
                    </p>

                    <div className="flex flex-col mb-2 items-center">
                        {verificationPhotos.length === 0 ? (
                            <button
                                type="button"
                                onClick={() => verifyInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-primary rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                            >
                                <Camera size={28} className="mb-2" />
                                <span className="font-bold">{t('takePhoto')}</span>
                            </button>
                        ) : (
                            <div className="flex gap-3 w-full justify-center">
                                {verificationPhotos.map(photo => (
                                    <div key={photo.id} className="relative w-32 h-32 flex-shrink-0">
                                        <img
                                            src={getSafeImageSrc(photo.preview)}
                                            alt="verification"
                                            className="w-full h-full rounded-xl object-cover border border-gray-200 shadow-sm"
                                            onError={handleImageError}
                                        />
                                        {!isVerificationLocked && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVerificationPhoto(photo.id)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!isVerificationLocked && verificationPhotos.length < MAX_VERIFICATION_PHOTOS && (
                                    <button
                                        type="button"
                                        onClick={() => verifyInputRef.current?.click()}
                                        className="w-16 h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        <Camera size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <input type="file" ref={verifyInputRef} onChange={handleVerificationPhotoSelect} className="hidden" accept="image/*" capture="environment" multiple />

                    {verificationStatus === 'pending_review' && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-primary-dark">
                            <div className="flex items-center text-sm font-semibold">
                                <Clock3 size={16} className="mr-2" />
                                {t('verificationPending')}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-primary-dark">
                                {t('verificationPendingDesc')}
                            </p>
                        </div>
                    )}
                    {verificationStatus === 'approved' && (
                        <div className="mt-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-green-800">
                            <div className="flex items-center text-sm font-semibold">
                                <CheckCircle size={16} className="mr-2" />
                                {t('verificationApproved')}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-green-700">
                                {t('verificationApprovedDesc')}
                            </p>
                        </div>
                    )}
                    {verificationStatus === 'rejected' && (
                        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-800">
                            <div className="flex items-center text-sm font-semibold">
                                <AlertTriangle size={16} className="mr-2" />
                                {t('verificationRejected')}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-red-700">
                                {t('verificationRejectedDesc')}
                            </p>
                            {verificationReviewReason && (
                                <p className="mt-2 text-xs leading-relaxed text-red-700">
                                    <span className="font-semibold">{t('verificationReasonLabel')}:</span>{' '}
                                    {verificationReviewReason}
                                </p>
                            )}
                        </div>
                    )}

                    <p className="text-[11px] text-gray-400 mt-4 bg-gray-50 p-2.5 rounded text-center">
                        {t('driverVerificationPrivacy')}
                    </p>
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
                        <div className="flex items-start mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!hasViewedTerms) {
                                        setIsTermsModalOpen(true);
                                    } else {
                                        setTermsAgreedAt(isTermsAgreed ? null : new Date().toISOString());
                                    }
                                }}
                                className={`mt-0.5 border-2 rounded-md w-5 h-5 flex items-center justify-center mr-3 transition-colors flex-shrink-0 ${isTermsAgreed
                                    ? 'bg-primary border-primary'
                                    : hasViewedTerms
                                        ? 'border-[#C9D1E1] hover:border-primary bg-white'
                                        : 'border-[#F3A21D] bg-[#FFF8EC]'
                                    }`}
                            >
                                {isTermsAgreed && <CheckCircle size={14} className="text-white" />}
                            </button>
                            <span className="text-sm font-semibold text-[#1F2436] select-none">
                                {t('inspectionTermsPrefix')}{' '}
                                <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-primary underline underline-offset-2">
                                    {t('inspectionTermsTitle')}
                                </button>
                                .
                            </span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full text-white font-bold text-lg py-4 px-4 rounded-xl shadow transition-all ${canSubmit ? 'bg-primary hover:bg-primary-dark' : 'bg-primary/40 cursor-not-allowed'}`}
                        >
                            {t('continueToContract')}
                        </button>
                        {!canSubmit && verificationPhotos.length > 0 && verificationStatus !== 'approved' && (
                            <p className="mt-3 text-center text-xs leading-relaxed text-[#5B6278]">
                                {t('continueToContractPendingReview')}
                            </p>
                        )}
                    </div>
                </section>
            </div>

            {/* Example Modal */}
            {isExampleModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsExampleModalOpen(false)}>
                    <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-primary text-white flex justify-between items-center">
                            <h3 className="font-bold">Driver Verification Example</h3>
                            <button onClick={() => setIsExampleModalOpen(false)} className="hover:bg-primary-dark p-1 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <img
                                src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=900&q=80"
                                alt="License and plate example"
                                className="w-full rounded-lg border border-gray-200 object-cover aspect-video"
                                onError={handleImageError}
                            />
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Ensure both the vehicle license plate and the details on your physical ID card are legible without glare.
                            </p>
                            <button
                                onClick={() => setIsExampleModalOpen(false)}
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark mt-2"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <VehiclePhotoGuideModal isOpen={isPhotoGuideModalOpen} onClose={() => setIsPhotoGuideModalOpen(false)} />

            {/* Terms Enforcement Modal */}
            {isTermsModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsTermsModalOpen(false)}>
                    <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-primary text-white flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold">{t('inspectionTermsTitle')}</h3>
                            <button onClick={() => setIsTermsModalOpen(false)} className="hover:bg-primary-dark p-1 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <ServiceTermsContent className="text-sm text-gray-700 leading-relaxed" />
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                            <button
                                onClick={() => {
                                    setHasViewedTerms(true);
                                    setTermsAgreedAt(prev => prev || new Date().toISOString());
                                    setIsTermsModalOpen(false);
                                }}
                                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark shadow-sm transition active:scale-[0.98]"
                            >
                                {t('inspectionTermsAgree')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionScreen;
