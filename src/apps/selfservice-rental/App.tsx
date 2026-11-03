
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import AuthScreen from './components/AuthScreen';
import OverviewScreen from './components/OverviewScreen';
import InspectionScreen from './components/InspectionScreen';
import InspectionDetailsScreen from './components/InspectionDetailsScreen';
import ContractScreen from './components/ContractScreen';
import CompletionScreen from './components/CompletionScreen';
import ReservationDetailsScreen from './components/ReservationDetailsScreen';
import DepositScreen from './components/DepositScreen';
import VehicleStatusScreen from './components/VehicleStatusScreen';
import ReturnScreen from './components/ReturnScreen';
import TripEndedScreen from './components/TripEndedScreen';
import ReturnDetailsScreen from './components/ReturnDetailsScreen';
import ServiceTermsScreen from './components/ServiceTermsScreen';
import { AppView, OrderDetails, CanonicalStatus, OnlineCheckinVerificationStatus, InspectionSubmissionRecord } from './types';
import { LanguageProvider, LanguageContext } from './contexts/LanguageContext';
import { XCircle, AlertTriangle, Phone } from 'lucide-react';
import { DEFAULT_RENTAL_CAR_IMAGE } from './utils/imageFallback';
import { MOCK_ACCOUNTS } from './mockAccounts';

const MOCK_CONTRACT_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const MOCK_INSPECTION_REVIEW_DELAY_MS = 2600;
const MOCK_INSPECTION_REJECTION_REASON =
  'The driver license details are not clear enough to verify. Please retake the photo with the full license and plate clearly visible.';

const mockOrderDetails: OrderDetails = {
  orderNumber: 'ORD-2025-1026-001',
  confirmationCode: 'WMQ677027',
  canonical_status: CanonicalStatus.CONFIRMED,
  online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
  contract_sign_status: 'UNSIGNED',
  rentalPeriod: {
    // Use ISO format for better cross-browser compatibility
    start: '2025-10-28T10:00:00',
    end: '2025-10-31T18:00:00',
    duration: '3 Days',
  },
  totalPrice: 365.00,
  vehicle: {
    name: 'Volkswagen Tiguan',
    image: DEFAULT_RENTAL_CAR_IMAGE,
    licensePlate: 'B C5580',
    state: 'Tokyo',
    color: 'WHITE',
    fuelLevel: 85,
    range: 420,
    odometer: 12450,
    parkingSpot: 'A-23',
    isLocked: true,
    coordinates: {
      lat: 35.6895,
      lng: 139.6917 // Example: Tokyo
    }
  },
  pickupLocation: 'Tokyo Ginza Imperial Hotel Parking Lot',
  pickupLocationDetails: {
    name: 'Tokyo Ginza Imperial Hotel Parking Lot',
    phone: '+8688888888'
  },
  pickupInstructions: 'Walk 30km left from XXX Road and turn right.',
  returnLocation: 'Tokyo Ginza Imperial Hotel Parking Lot',
  returnCoordinates: {
    lat: 35.6895,
    lng: 139.6917
  },
  storeCoordinates: {
    lat: 35.6895,
    lng: 139.6917
  },
  customer: {
    name: 'Mr. Smith',
    phone: '+81 90-1234-5678',
    email: 'mr.smith@example.com',
  },
  contract: {
    number: 'CO-2025-1026-001',
    date: '2025-10-26',
    attachment_status: 'GENERATING',
  },
  deposit: {
    amount: 1000, // Updated to match screenshot example
    currency: '$', // Updated currency symbol
    status: 1, // 1=Pending
  },
  pickupStatus: 'Awaiting Pickup',
  preparationStatus: 'Preparing', // Changed to Preparing to demonstrate new UI logic
  is_selfservice_eligible: true, // Mock eligible order
  isIdentityVerified: true,
  isDepositPaid: false, // Initially false
  isRentalActive: false, // Initially false
  isReturned: false, // Initially false
};

const isInspectionReadyForContract = (record: InspectionSubmissionRecord | null): boolean => {
  if (!record) return false;
  if (record.verificationStatus !== 'approved') return false;
  if (record.verificationPhotos.length === 0) return false;
  if (!record.termsAgreedAt) return false;
  if (record.decisionMode === 'report' && (!record.exceptionPhotos || record.exceptionPhotos.length === 0)) {
    return false;
  }
  return true;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [inspectionRecord, setInspectionRecord] = useState<InspectionSubmissionRecord | null>(null);
  const [depositVisitCount, setDepositVisitCount] = useState(0);
  const inspectionReviewAttemptRef = useRef(0);
  const inspectionCompleted = isInspectionReadyForContract(inspectionRecord);

  useEffect(() => {
    // Simulate fetching order details after successful authentication
    if (currentView === AppView.OVERVIEW && !orderDetails) {
      setOrderDetails(mockOrderDetails);
    }
  }, [currentView, orderDetails]);

  // Simulate vehicle preparation auto-complete after 5 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (orderDetails && orderDetails.preparationStatus === 'Preparing') {
      timer = setTimeout(() => {
        setOrderDetails(prev => prev ? ({
          ...prev,
          preparationStatus: 'Ready'
        }) : null);
      }, 5000); // 5 seconds delay
    }
    return () => clearTimeout(timer);
  }, [orderDetails]);

  // Simulate async contract PDF generation after contract is signed.
  useEffect(() => {
    if (
      !orderDetails ||
      orderDetails.contract_sign_status !== 'SIGNED' ||
      orderDetails.contract.attachment_status !== 'GENERATING'
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setOrderDetails(prev => {
        if (
          !prev ||
          prev.contract_sign_status !== 'SIGNED' ||
          prev.contract.attachment_status !== 'GENERATING'
        ) {
          return prev;
        }
        return {
          ...prev,
          contract: {
            ...prev.contract,
            attachment_status: 'READY',
            attachment_url: MOCK_CONTRACT_PDF_URL,
          },
        };
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [orderDetails?.contract_sign_status, orderDetails?.contract.attachment_status]);

  useEffect(() => {
    if (!inspectionRecord || inspectionRecord.verificationStatus !== 'pending_review') {
      return;
    }

    inspectionReviewAttemptRef.current += 1;
    const reviewAttempt = inspectionReviewAttemptRef.current;

    const timer = setTimeout(() => {
      setInspectionRecord(prev => {
        if (!prev || prev.verificationStatus !== 'pending_review') {
          return prev;
        }

        const isRejected = reviewAttempt === 1;
        return {
          ...prev,
          verificationStatus: isRejected ? 'rejected' : 'approved',
          verificationReviewReason: isRejected ? MOCK_INSPECTION_REJECTION_REASON : undefined,
        };
      });
    }, MOCK_INSPECTION_REVIEW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [inspectionRecord?.verificationStatus]);

  // Wrapper for setView to track deposit screen visits
  const handleSetView = useCallback((view: AppView) => {
    if (view === AppView.DEPOSIT) {
      setDepositVisitCount(prev => prev + 1);
    }
    setCurrentView(view);
  }, []);

  // ─── Auth Success with Status Gate ──────────────────────────────────────────
  // Rules:
  // 1) CANCELLED order -> blocked
  // 2) Online Check-In not approved -> redirect user back to Online Check-In app
  // 3) Not self-service eligible -> blocked for regular rental orders
  // 4) Approved + eligible -> enter overview
  const handleAuthSuccess = (orderNo: string) => {
    const normalizedOrderNo = orderNo.toUpperCase();
    const account = MOCK_ACCOUNTS[normalizedOrderNo];
    if (!account) return; // 不应发生，AuthScreen 已做校验

    setOrderDetails(null);
    setInspectionRecord(null);
    inspectionReviewAttemptRef.current = 0;

    if (account.canonical_status === CanonicalStatus.CANCELLED) {
      setCurrentView(AppView.AUTH_BLOCKED_CANCELLED);
      return;
    }
    if (account.online_checkin_verification_status !== OnlineCheckinVerificationStatus.APPROVED) {
      setCurrentView(AppView.AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED);
      return;
    }

    if (!account.is_selfservice_eligible) {
      setCurrentView(AppView.AUTH_BLOCKED_NOT_ELIGIBLE);
      return;
    }

    setOrderDetails({
      ...mockOrderDetails,
      orderNumber: normalizedOrderNo,
      confirmationCode: normalizedOrderNo,
      canonical_status: account.canonical_status,
      online_checkin_verification_status: account.online_checkin_verification_status,
      is_selfservice_eligible: account.is_selfservice_eligible,
      isIdentityVerified: account.online_checkin_verification_status === OnlineCheckinVerificationStatus.APPROVED,
    });

    // APPROVED → 正常进入 Overview
    handleSetView(AppView.OVERVIEW);
  };

  const handleDepositComplete = () => {
    if (orderDetails) {
      setOrderDetails({
        ...orderDetails,
        deposit: { ...orderDetails.deposit, status: 3 } // Set to Authorized
      });
    }
  }

  const handleInspectionRecordChange = useCallback((record: InspectionSubmissionRecord) => {
    setInspectionRecord(record);
  }, []);

  const handleContinueToContract = useCallback((record: InspectionSubmissionRecord) => {
    if (!isInspectionReadyForContract(record)) {
      setInspectionRecord(record);
      return;
    }
    setInspectionRecord(record);
    handleSetView(AppView.CONTRACT);
  }, [handleSetView]);

  const handleContractSign = () => {
    setOrderDetails(prev => prev ? ({
      ...prev,
      contract_sign_status: 'SIGNED',
      canonical_status: CanonicalStatus.PICKED_UP,
      contract: {
        ...prev.contract,
        attachment_status: 'GENERATING',
        attachment_url: undefined,
      },
    }) : prev);
    handleSetView(AppView.COMPLETION);
  }

  const handleStartRental = () => {
    if (orderDetails) {
      setOrderDetails({ ...orderDetails, isRentalActive: true });
      handleSetView(AppView.OVERVIEW);
    }
  }

  const handleReturnComplete = () => {
    if (orderDetails) {
      setOrderDetails({
        ...orderDetails,
        isRentalActive: false,
        isReturned: true
      });
      handleSetView(AppView.TRIP_ENDED);
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.AUTH:
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

      // ─── Status Gate Views ─────────────────────────────────────────────────
      case AppView.AUTH_BLOCKED_CANCELLED:
        return <AuthBlockedView type="cancelled" onBack={() => setCurrentView(AppView.AUTH)} />;
      case AppView.AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED:
        return <AuthBlockedView type="online_checkin_required" onBack={() => setCurrentView(AppView.AUTH)} />;
      case AppView.AUTH_BLOCKED_NOT_ELIGIBLE:
        return <AuthBlockedView type="not_eligible" onBack={() => setCurrentView(AppView.AUTH)} />;

      case AppView.OVERVIEW:
        return orderDetails && <OverviewScreen orderDetails={orderDetails} setView={handleSetView} inspectionCompleted={inspectionCompleted} />;
      case AppView.DEPOSIT:
        return orderDetails && <DepositScreen
          orderDetails={orderDetails}
          setView={handleSetView}
          onDepositComplete={handleDepositComplete}
          // Logic: 1st visit (count=1) -> false (Restricted). 2nd visit (count=2) -> true (Allowed).
          simulateTimePassed={depositVisitCount > 1}
        />;
      case AppView.INSPECTION:
        return (
          <InspectionScreen
            setView={handleSetView}
            onInspectionRecordChange={handleInspectionRecordChange}
            onContinueToContract={handleContinueToContract}
            initialRecord={inspectionRecord}
          />
        );
      case AppView.INSPECTION_DETAILS:
        return <InspectionDetailsScreen setView={handleSetView} record={inspectionRecord} />;
      case AppView.CONTRACT:
        return orderDetails && <ContractScreen orderDetails={orderDetails} setView={handleSetView} onContractSign={handleContractSign} />;
      case AppView.RESERVATION_DETAILS:
        return orderDetails && <ReservationDetailsScreen orderDetails={orderDetails} setView={handleSetView} />;
      case AppView.COMPLETION:
        return orderDetails && <CompletionScreen orderDetails={orderDetails} setView={handleSetView} onStartRental={handleStartRental} />;
      case AppView.VEHICLE_STATUS:
        return orderDetails && <VehicleStatusScreen orderDetails={orderDetails} setView={handleSetView} />;
      case AppView.RETURN:
        return orderDetails && <ReturnScreen orderDetails={orderDetails} setView={handleSetView} onReturnComplete={handleReturnComplete} />;
      case AppView.TRIP_ENDED:
        return <TripEndedScreen setView={handleSetView} />;
      case AppView.RETURN_DETAILS:
        return orderDetails && <ReturnDetailsScreen orderDetails={orderDetails} setView={handleSetView} />;
      case AppView.SERVICE_TERMS:
        return <ServiceTermsScreen setView={handleSetView} />;
      default:
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen font-sans antialiased text-gray-800">
        <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen">
          {renderContent()}
        </div>
      </div>
    </LanguageProvider>
  );
};

// ─── Auth Blocked Views ────────────────────────────────────────────────────────
// Inline gate views for blocked auth outcomes.
const AuthBlockedView: React.FC<{
  type: 'cancelled' | 'online_checkin_required' | 'not_eligible';
  onBack: () => void;
}> = ({ type, onBack }) => {
  const { t } = useContext(LanguageContext);

  const config = {
    cancelled: {
      icon: <XCircle size={48} className="text-red-400" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
      titleColor: 'text-red-700',
      bodyColor: 'text-red-600',
      title: t('authBlockedCancelledTitle'),
      body: t('authBlockedCancelledBody'),
    },
    online_checkin_required: {
      icon: <AlertTriangle size={48} className="text-yellow-400" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      titleColor: 'text-yellow-800',
      bodyColor: 'text-yellow-700',
      title: t('authBlockedOnlineCheckinTitle'),
      body: t('authBlockedOnlineCheckinBody'),
    },
    not_eligible: {
      icon: <AlertTriangle size={48} className="text-gray-400" />,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      titleColor: 'text-gray-800',
      bodyColor: 'text-gray-600',
      title: t('authBlockedNotEligibleTitle'),
      body: t('authBlockedNotEligibleBody'),
    },
  }[type];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-sm">

        {/* Status Card */}
        <div className={`${config.bg} border ${config.border} rounded-2xl p-8 text-center shadow-sm mb-6`}>
          <div className="flex justify-center mb-4">{config.icon}</div>
          <h2 className={`text-xl font-bold mb-3 ${config.titleColor}`}>{config.title}</h2>
          <p className={`text-sm leading-relaxed ${config.bodyColor}`}>{config.body}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href="tel:+861064532623"
            className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Phone size={16} className="mr-2" />
            {t('contactSupport')}
          </a>
          <button
            onClick={onBack}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
          >
            ← Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default App;
