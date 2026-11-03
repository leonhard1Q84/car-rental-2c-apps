import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { AppView, OrderDetails, ResidencyStatus } from '../types';
import { AlertTriangle, ArrowLeft, FileText, RefreshCw, X } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface ContractScreenProps {
  orderDetails: OrderDetails;
  setView: (view: AppView) => void;
  onContractSign: () => void;
}

interface DriverReadonlyProfile {
  firstName: string;
  lastName: string;
  residencyStatus: ResidencyStatus;
  phone: string;
  email: string;
}

interface VerificationDocumentPreview {
  key: string;
  label: string;
  src: string;
  source: string;
}

const CUSTOMER_BRAND_ACCENT = '#FF5A00';
const CUSTOMER_BRAND_WARNING_ACCENT = '#F59E0B';

const createDocumentPreview = (title: string, subtitle: string, accent: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f5f7fb" />
        </linearGradient>
      </defs>
      <rect width="720" height="480" rx="32" fill="url(#bg)" />
      <rect x="34" y="34" width="652" height="412" rx="24" fill="#ffffff" stroke="#d8deea" stroke-width="4" />
      <rect x="58" y="58" width="160" height="120" rx="20" fill="${accent}" opacity="0.16" />
      <circle cx="138" cy="104" r="34" fill="${accent}" opacity="0.8" />
      <rect x="252" y="82" width="260" height="24" rx="12" fill="#1f2937" opacity="0.92" />
      <rect x="252" y="124" width="220" height="16" rx="8" fill="#6b7280" opacity="0.78" />
      <rect x="58" y="220" width="604" height="12" rx="6" fill="#dbe4f0" />
      <rect x="58" y="260" width="520" height="12" rx="6" fill="#dbe4f0" />
      <rect x="58" y="300" width="560" height="12" rx="6" fill="#dbe4f0" />
      <rect x="58" y="340" width="430" height="12" rx="6" fill="#dbe4f0" />
      <rect x="58" y="386" width="180" height="28" rx="14" fill="${accent}" opacity="0.18" />
      <text x="252" y="184" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#111827">${title}</text>
      <text x="58" y="434" font-family="Arial, sans-serif" font-size="22" fill="#4b5563">${subtitle}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const deriveName = (fullName: string): DriverReadonlyProfile => {
  const segments = fullName.trim().split(/\s+/).filter(Boolean);
  if (segments.length === 0) {
    return {
      firstName: 'Alex',
      lastName: 'Taylor',
      residencyStatus: 'international',
      phone: '+81 90-1234-5678',
      email: 'alex.taylor@example.com',
    };
  }

  const firstName = segments[0];
  const lastName = segments.slice(1).join(' ') || segments[0];
  return {
    firstName,
    lastName,
    residencyStatus: 'international',
    phone: '+81 90-1234-5678',
    email: 'guest@example.com',
  };
};

const ContractScreen: React.FC<ContractScreenProps> = ({ orderDetails, setView, onContractSign }) => {
  const { t } = useContext(LanguageContext);
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const modalHasStrokeRef = useRef(false);

  const [agreed, setAgreed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureModalError, setSignatureModalError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const driverProfile = useMemo<DriverReadonlyProfile>(() => {
    const derived = deriveName(orderDetails.customer.name);
    return {
      ...derived,
      phone: orderDetails.customer.phone,
      email: orderDetails.customer.email || derived.email,
    };
  }, [orderDetails.customer.email, orderDetails.customer.name, orderDetails.customer.phone]);

  const verificationDocuments = useMemo<VerificationDocumentPreview[]>(() => {
    const source = t('contractSourceOnlineCheckin');
    return [
      {
        key: 'home_country_license_front',
        label: t('contractDocHomeLicenseFront'),
        src: createDocumentPreview(t('contractDocHomeLicenseFront'), 'Approved in Online Check-In', CUSTOMER_BRAND_ACCENT),
        source,
      },
      {
        key: 'home_country_license_back',
        label: t('contractDocHomeLicenseBack'),
        src: createDocumentPreview(t('contractDocHomeLicenseBack'), 'Approved in Online Check-In', CUSTOMER_BRAND_ACCENT),
        source,
      },
      {
        key: 'passport_front',
        label: t('contractDocPassportFront'),
        src: createDocumentPreview(t('contractDocPassportFront'), 'Approved in Online Check-In', CUSTOMER_BRAND_ACCENT),
        source,
      },
      {
        key: 'passport_back',
        label: t('contractDocPassportBack'),
        src: createDocumentPreview(t('contractDocPassportBack'), 'Approved in Online Check-In', CUSTOMER_BRAND_ACCENT),
        source,
      },
      {
        key: 'idp',
        label: t('contractDocIdp'),
        src: createDocumentPreview(t('contractDocIdp'), 'Approved in Online Check-In', CUSTOMER_BRAND_WARNING_ACCENT),
        source,
      },
    ];
  }, [t]);

  useEffect(() => {
    if (!signatureModalOpen) return;
    signatureCanvasRef.current?.clear();
    modalHasStrokeRef.current = false;
    setSignatureModalError(null);
  }, [signatureModalOpen]);

  const handleConfirmSignature = () => {
    if (!signatureCanvasRef.current) {
      setSignatureModalError(t('contractSignModalEmpty'));
      return;
    }

    const strokeData = signatureCanvasRef.current.toData?.();
    const hasStrokeByCanvas =
      (typeof signatureCanvasRef.current.isEmpty === 'function' && !signatureCanvasRef.current.isEmpty()) ||
      (Array.isArray(strokeData) && strokeData.length > 0);

    if (!modalHasStrokeRef.current && !hasStrokeByCanvas) {
      setSignatureModalError(t('contractSignModalEmpty'));
      return;
    }

    let dataUrl = '';
    try {
      dataUrl = signatureCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    } catch (_error) {
      dataUrl = signatureCanvasRef.current.toDataURL('image/png');
    }

    if (!dataUrl) {
      setSignatureModalError(t('contractSignModalEmpty'));
      return;
    }

    setSignatureDataUrl(dataUrl);
    setSignatureModalOpen(false);
    setSignatureModalError(null);
    setGlobalError(null);
  };

  const handleSubmit = () => {
    if (!signatureDataUrl) {
      setGlobalError(`${t('contractSignatureLabel')}: ${t('contractSignatureRequired')}`);
      return;
    }
    if (!agreed) {
      setGlobalError(t('contractValidationAgreement'));
      return;
    }

    setGlobalError(null);
    onContractSign();
  };

  const renderReadonlyField = (label: string, value: string, source?: string) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
        {source && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200">{source}</span>}
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</p>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => setView(AppView.INSPECTION_DETAILS)} className="mr-4">
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">{t('contractTitle')}</h1>
      </header>

      <div className="flex-grow space-y-4 overflow-y-auto p-4 pb-28">
        <section className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <h2 className="text-base font-bold text-primary-dark">{t('contractReadonlyNoticeTitle')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-primary-dark">{t('contractReadonlyNoticeBody')}</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('reservationDetailsTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('contractReservationReadonlyHint')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderReadonlyField(t('orderNumber'), orderDetails.orderNumber, t('contractSourceReservation'))}
            {renderReadonlyField(t('confirmationNumber'), orderDetails.confirmationCode, t('contractSourceReservation'))}
            {renderReadonlyField(t('carModel'), orderDetails.vehicle.name, t('contractSourceReservation'))}
            {renderReadonlyField(t('driverName'), orderDetails.customer.name, t('contractSourceReservation'))}
            {renderReadonlyField(t('pickupTime'), orderDetails.rentalPeriod.start, t('contractSourceReservation'))}
            {renderReadonlyField(t('pickupLocation'), orderDetails.pickupLocation, t('contractSourceReservation'))}
            {renderReadonlyField(t('returnTime'), orderDetails.rentalPeriod.end, t('contractSourceReservation'))}
            {renderReadonlyField(t('returnLocation'), orderDetails.returnLocation, t('contractSourceReservation'))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('contractDriverIdentification')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('contractDriverIdentificationIntro')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderReadonlyField(t('contractFirstName'), driverProfile.firstName, t('contractSourceReservation'))}
            {renderReadonlyField(t('contractLastName'), driverProfile.lastName, t('contractSourceReservation'))}
            {renderReadonlyField(t('contractResidencyStatus'), driverProfile.residencyStatus === 'international' ? t('contractResidencyInternational') : t('contractResidencyLocal'), t('contractSourceOnlineCheckin'))}
            {renderReadonlyField(t('contactPhone'), driverProfile.phone, t('contractSourceReservation'))}
            {renderReadonlyField(t('emailLabel'), driverProfile.email, t('contractSourceReservation'))}
            {renderReadonlyField(t('contractAdditionalDriverCount'), t('contractAdditionalDriverNone'), t('contractSourceReservation'))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('contractVerificationDocuments')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('contractVerificationReadonlyHint')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {verificationDocuments.map((document) => (
              <div key={document.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img src={document.src} alt={document.label} className="aspect-[4/3] w-full object-cover bg-gray-50" />
                <div className="space-y-1 p-3">
                  <p className="text-xs font-bold text-gray-900">{document.label}</p>
                  <p className="text-[11px] text-gray-500">{document.source}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{t('signatureTitle')}</h2>
            <button
              type="button"
              onClick={() => setSignatureModalOpen(true)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {signatureDataUrl ? t('contractResign') : t('contractAddSignature')}
            </button>
          </div>

          {signatureDataUrl ? (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <img src={signatureDataUrl} alt={t('contractSignatureLabel')} className="h-24 w-full object-contain" />
              <button
                type="button"
                onClick={() => setSignatureDataUrl(null)}
                className="mt-2 inline-flex items-center text-xs font-semibold text-red-500 hover:underline"
              >
                <RefreshCw size={12} className="mr-1" />
                {t('contractClearSignature')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSignatureModalOpen(true)}
              className="mt-3 w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('contractAddSignature')}
            </button>
          )}
        </section>

        <section id="contract-agreement" className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-base font-bold text-gray-900">{t('contractAgreementSectionTitle')}</h2>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                setGlobalError(null);
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
            />
            <span className="ml-3 text-sm text-gray-600">
              <span dangerouslySetInnerHTML={{ __html: t('contractAgreement') }} />
            </span>
          </label>
        </section>

        {globalError && (
          <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t bg-white p-4">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
        >
          {t('contractSubmit')}
        </button>
      </div>

      {signatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-2xl font-semibold text-gray-900">{t('contractSignModalTitle')}</h3>
              <button
                type="button"
                onClick={() => {
                  setSignatureModalOpen(false);
                  setSignatureModalError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-700">{t('contractSignatureLabel')}</p>
                <button
                  type="button"
                  onClick={() => {
                    signatureCanvasRef.current?.clear();
                    modalHasStrokeRef.current = false;
                    setSignatureModalError(null);
                  }}
                  className="text-sm font-semibold text-red-500 hover:underline"
                >
                  {t('contractSignModalClear')}
                </button>
              </div>
              <div className="rounded-lg border border-gray-300 bg-white">
                <SignatureCanvas
                  ref={signatureCanvasRef}
                  penColor="black"
                  canvasProps={{ className: 'w-full h-56 rounded-lg' }}
                  onBegin={() => {
                    modalHasStrokeRef.current = true;
                    if (signatureModalError) setSignatureModalError(null);
                  }}
                />
              </div>
              {signatureModalError && <p className="mt-2 text-xs text-red-600">{signatureModalError}</p>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureModalOpen(false);
                    setSignatureModalError(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t('contractSignModalCancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  className="rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-dark"
                >
                  {t('contractSignModalConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractScreen;
