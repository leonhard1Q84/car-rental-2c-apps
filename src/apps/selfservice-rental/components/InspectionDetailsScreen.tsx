import React, { useContext } from 'react';
import { AppView, InspectionSubmissionRecord } from '../types';
import { AlertTriangle, ArrowLeft, Car, CheckCircle, CheckCircle2, Clock3, Gauge, MessageSquare, ShieldCheck } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEFAULT_RENTAL_CAR_IMAGE, getSafeImageSrc } from '../utils/imageFallback';

interface InspectionDetailsScreenProps {
  setView: (view: AppView) => void;
  record: InspectionSubmissionRecord | null;
}

const ReadOnlyPhoto: React.FC<{ label: string; src?: string | null }> = ({ label, src }) => (
  <div className="border border-gray-200 rounded-lg p-2 bg-white">
    <div className="relative h-24 rounded-md overflow-hidden bg-gray-100">
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

const InspectionDetailsScreen: React.FC<InspectionDetailsScreenProps> = ({ setView, record }) => {
  const { t } = useContext(LanguageContext);
  const submittedAt = record ? new Date(record.submittedAt).toLocaleString() : '-';
  const mileage = record?.vehicleStats.mileage ?? 0;
  const fuel = record?.vehicleStats.fuel ?? 0;
  const fuelLevels = Math.round((fuel / 100) * 8);
  const verificationPhotos =
    record && record.verificationPhotos.length > 0
      ? record.verificationPhotos
      : [DEFAULT_RENTAL_CAR_IMAGE];
  const baselineExterior = record?.baselineSnapshot?.exterior;
  const baselineInterior = record?.baselineSnapshot?.interior;
  const baselineDamage = record?.baselineSnapshot?.damage;
  const exteriorFront = baselineExterior?.front || record?.exteriorPhotos.front?.[0];
  const exteriorRear = baselineExterior?.rear || record?.exteriorPhotos.rear?.[0];
  const exteriorLeft = baselineExterior?.left || record?.exteriorPhotos.left?.[0];
  const exteriorRight = baselineExterior?.right || record?.exteriorPhotos.right?.[0];
  const interiorFront = baselineInterior?.frontArea;
  const interiorRear = baselineInterior?.rearArea;
  const baselineDamageIssues = baselineDamage?.issues || [];
  const baselineDamageImage = baselineDamage?.image;
  const decisionLabel = record?.decisionMode
    ? (record.decisionMode === 'report' ? t('inspectionDecisionReportLabel') : t('inspectionDecisionSkipLabel'))
    : '-';
  const exceptionPhotos = record?.exceptionPhotos || [];
  const exceptionNote = (record?.exceptionNote || '').trim();
  const verificationStatusConfig = record?.verificationStatus === 'rejected'
    ? {
      icon: AlertTriangle,
      title: t('verificationRejected'),
      description: t('verificationRejectedDesc'),
      containerClass: 'border-red-100 bg-red-50',
      textClass: 'text-red-800',
      bodyClass: 'text-red-700',
    }
    : record?.verificationStatus === 'approved'
      ? {
        icon: CheckCircle,
        title: t('verificationApproved'),
        description: t('verificationApprovedDesc'),
        containerClass: 'border-green-100 bg-green-50',
        textClass: 'text-green-800',
        bodyClass: 'text-green-700',
      }
      : record?.verificationStatus === 'pending_review'
        ? {
          icon: Clock3,
          title: t('verificationPending'),
          description: t('verificationPendingDesc'),
          containerClass: 'border-primary/20 bg-primary/10',
          textClass: 'text-primary-dark',
          bodyClass: 'text-primary-dark',
        }
        : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => setView(AppView.OVERVIEW)} className="mr-4">
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">{t('inspectionTitle')}</h1>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-10">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{t('view')}</h2>
            <p className="text-xs text-gray-500">{submittedAt}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold flex items-center text-gray-900 mb-3">
            <Gauge className="mr-2 text-primary" size={20} />
            {t('dashboardTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">{t('mileageLabel')}</p>
              <p className="text-2xl font-bold text-gray-800 leading-none tracking-tight">{mileage.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">{t('fuelLevelLabel')}</p>
              <p className="text-2xl font-bold text-gray-800 leading-none tracking-tight">{fuelLevels}/8</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold flex items-center text-gray-900 mb-3">
            <ShieldCheck className="mr-2 text-primary" size={20} />
            {t('driverVerificationTitle')}
          </h2>
          {verificationStatusConfig && (
            <div className={`mb-3 rounded-xl border px-3 py-3 ${verificationStatusConfig.containerClass}`}>
              <div className={`flex items-center text-sm font-semibold ${verificationStatusConfig.textClass}`}>
                <verificationStatusConfig.icon size={16} className="mr-2" />
                {verificationStatusConfig.title}
              </div>
              <p className={`mt-1 text-xs leading-relaxed ${verificationStatusConfig.bodyClass}`}>
                {verificationStatusConfig.description}
              </p>
              {record?.verificationStatus === 'rejected' && record.verificationReviewReason && (
                <p className={`mt-2 text-xs leading-relaxed ${verificationStatusConfig.bodyClass}`}>
                  <span className="font-semibold">{t('verificationReasonLabel')}:</span>{' '}
                  {record.verificationReviewReason}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {verificationPhotos.map((photo, index) => (
              <ReadOnlyPhoto key={`${photo}-${index}`} label={`${t('driverVerificationTitle')} ${index + 1}`} src={photo} />
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold flex items-center text-gray-900 mb-3">
            <Car className="mr-2 text-primary" size={20} />
            {t('inspectionExteriorTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyPhoto label={t('exteriorFront')} src={exteriorFront} />
            <ReadOnlyPhoto label={t('exteriorRear')} src={exteriorRear} />
            <ReadOnlyPhoto label={t('exteriorLeft')} src={exteriorLeft} />
            <ReadOnlyPhoto label={t('exteriorRight')} src={exteriorRight} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold flex items-center text-gray-900 mb-3">
            <Car className="mr-2 text-primary" size={20} />
            {t('inspectionInteriorTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyPhoto label="Front Area Overview" src={interiorFront} />
            <ReadOnlyPhoto label="Rear Area Overview" src={interiorRear} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold flex items-center text-gray-900 mb-3">
            <CheckCircle2 className="mr-2 text-primary" size={20} />
            {t('inspectionDecisionResultTitle')}
          </h2>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{t('inspectionDecisionTitle')}</p>
              <p className="text-sm font-bold text-gray-800">{decisionLabel}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{t('additionalComments')}</p>
              <p className="text-sm text-gray-700">{exceptionNote || t('inspectionNoAdditionalNotes')}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">{t('inspectionExceptionPhotosTitle')}</p>
              {exceptionPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {exceptionPhotos.map((photo, index) => (
                    <ReadOnlyPhoto key={`${photo}-${index}`} label={`${t('inspectionExceptionPhotosTitle')} ${index + 1}`} src={photo} />
                  ))}
                </div>
              ) : (
                <p className="text-sm bg-gray-50 p-3 rounded border border-gray-100 text-gray-700">-</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold flex items-center text-gray-900 mb-3">
            <MessageSquare className="mr-2 text-primary" size={20} />
            {t('inspectionDamageTitle')}
          </h2>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Damage Issues</p>
              {baselineDamageIssues.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {baselineDamageIssues.map(issue => (
                    <span key={issue} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                      {t(`damage.issue.${issue}`)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">-</p>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Damages</p>
              {baselineDamageImage ? (
                <ReadOnlyPhoto label="Reported Existing Damage" src={baselineDamageImage} />
              ) : (
                <p className="text-sm text-gray-700">-</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetailsScreen;
