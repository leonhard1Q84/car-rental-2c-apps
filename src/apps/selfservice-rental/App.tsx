
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
import OnlineCheckinScreen from './components/OnlineCheckinScreen';
import { AppView, OrderDetails, CanonicalStatus, CustomerReturnSubmission, OnlineCheckinVerificationStatus, InspectionSubmissionRecord } from './types';
import { LanguageProvider, LanguageContext } from './contexts/LanguageContext';
import { XCircle, AlertTriangle, Phone } from 'lucide-react';
import { DEFAULT_RENTAL_CAR_IMAGE } from './utils/imageFallback';
import { MOCK_ACCOUNTS } from './mockAccounts';
import {
  createVehicleMetricCheckpoint,
  RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID,
  RENTAL_TERMS_CONFIRMATION_ITEM_ID,
  resolveVehicleMetricSource,
  type PickupContractConfigSnapshot
} from '@shared/contracts';
import { isInspectionReadyForContract } from './components/inspectionContractEntry';

const MOCK_CONTRACT_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const MOCK_RENTAL_GUIDELINES_IMAGE_URL = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=85';
export const MOCK_PICKUP_CONTRACT_CONFIG_SNAPSHOT: PickupContractConfigSnapshot = {
  schemaVersion: 2,
  revision: 'selfservice-pickup-contract-r8',
  publishedAt: '2025-10-20T08:00:00+09:00',
  defaultLocale: 'en',
  vendorId: 'jdm-car-rental',
  storeId: 'tokyo-ginza',
  rentalContract: {
    attachments: [
      {
        id: 'selfservice-r8-rental-terms',
        title: 'Japan Rental Terms and Conditions',
        originalFileName: 'JDM_Rental_Terms_2026.pdf',
        displayOrder: 1,
        url: MOCK_CONTRACT_PDF_URL,
        mimeType: 'application/pdf',
        uploadStatus: 'UPLOADED'
      }
    ]
  },
  rentalGuidelines: {
    attachments: [
      {
        id: 'selfservice-r8-driving-safety-notes',
        title: 'Japan Driving Safety Notes',
        originalFileName: 'Japan_Driving_Safety_Notes.jpg',
        displayOrder: 1,
        url: MOCK_RENTAL_GUIDELINES_IMAGE_URL,
        mimeType: 'image/jpeg',
        uploadStatus: 'UPLOADED'
      }
    ]
  },
  customerConfirmationItems: [
    {
      id: RENTAL_TERMS_CONFIRMATION_ITEM_ID,
      materialGroup: 'RENTAL_CONTRACT',
      order: 10,
      title: {
        'zh-CN': '我已阅读并同意租车条款',
        'zh-TW': '我已閱讀並同意租車條款',
        en: 'I have read and agree to the rental terms.',
        ja: 'レンタル条項を読み、同意します。',
        ko: '대여 약관을 읽었으며 이에 동의합니다.',
        th: 'ฉันได้อ่านและยอมรับข้อกำหนดการเช่าแล้ว'
      }
    },
    {
      id: RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID,
      materialGroup: 'RENTAL_GUIDELINES',
      order: 20,
      title: {
        'zh-CN': '我已阅读并知悉租车注意事项',
        'zh-TW': '我已閱讀並知悉租車注意事項',
        en: 'I have read and acknowledged the rental notes.',
        ja: 'レンタル時の注意事項を読み、確認しました。',
        ko: '대여 유의사항을 읽고 확인했습니다.',
        th: 'ฉันได้อ่านและรับทราบข้อควรทราบในการเช่าแล้ว'
      }
    }
  ]
};

const createApprovedInspectionRecord = (orderId: string): InspectionSubmissionRecord => ({
  submittedAt: '2025-10-28T09:30:00+09:00',
  vehicleStats: {
    mileage: 12450,
    fuel: 85,
  },
  verificationStatus: 'approved',
  verificationPhotos: [DEFAULT_RENTAL_CAR_IMAGE],
  exteriorPhotos: {
    front: [],
    rear: [],
    left: [],
    right: [],
  },
  lightPhotos: {
    front: [],
    rear: [],
  },
  damageDescription: '',
  decisionMode: 'skip',
  termsAgreedAt: '2025-10-28T09:35:00+09:00',
  termsVersion: 'v1.0',
  contractConfirmationRecord: {
    configRevision: MOCK_PICKUP_CONTRACT_CONFIG_SNAPSHOT.revision,
    configPublishedAt: MOCK_PICKUP_CONTRACT_CONFIG_SNAPSHOT.publishedAt,
    confirmations: [
      {
        itemId: RENTAL_TERMS_CONFIRMATION_ITEM_ID,
        materialGroup: 'RENTAL_CONTRACT',
        confirmationText: 'I have read and agree to the rental terms.',
        attachmentIds: ['selfservice-r8-rental-terms'],
        locale: 'en',
        confirmedAt: '2025-10-28T09:34:00+09:00'
      },
      {
        itemId: RENTAL_GUIDELINES_CONFIRMATION_ITEM_ID,
        materialGroup: 'RENTAL_GUIDELINES',
        confirmationText: 'I have read and acknowledged the rental notes.',
        attachmentIds: ['selfservice-r8-driving-safety-notes'],
        locale: 'en',
        confirmedAt: '2025-10-28T09:35:00+09:00'
      }
    ]
  },
  dashboardPhoto: DEFAULT_RENTAL_CAR_IMAGE,
  vehicleMetricCheckpoint: createVehicleMetricCheckpoint({
    checkpointType: 'SELF_SERVICE_CUSTOMER_PICKUP',
    orderId,
    vehicleId: 'B C5580',
    source: resolveVehicleMetricSource({
      hasTelematics: true,
      telematicsStatus: 'INSTALLED_ONLINE',
      mileage: 12450,
      fuelLevel: 85,
      fuelType: 'Gasoline',
      deviceId: 'device-demo-approved',
      capturedAt: new Date().toISOString()
    }),
    mileage: 12450,
    energyPercent: 85,
    decision: 'CONFIRMED',
    actorId: `customer-${orderId}`,
    actorRole: 'CUSTOMER'
  })
});

const mockOrderDetails: OrderDetails = {
  onlineCheckinDrivers: MOCK_ACCOUNTS.DEMO.onlineCheckinDrivers,
  orderNumber: 'ORD-2025-1026-001',
  confirmationCode: 'WMQ677027',
  canonical_status: CanonicalStatus.CONFIRMED,
  online_checkin_verification_status: OnlineCheckinVerificationStatus.APPROVED,
  contract_sign_status: 'UNSIGNED',
  addons: {
    online_booking: [
      {
        code: 'BABY_SEAT',
        name: 'Baby seat',
        quantity: 1,
        unitPrice: 1650,
        subtotal: 1650,
        currency: 'JPY'
      }
    ],
    store_addons: [
      {
        code: 'CDW',
        name: 'Collision Damage Waiver',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        currency: 'JPY'
      }
    ]
  },
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
    fuelType: 'Gasoline',
    range: 420,
    odometer: 12450,
    parkingSpot: 'A-23',
    isLocked: true,
    telematicsStatus: 'INSTALLED_ONLINE',
    telematicsLastReadingAt: new Date().toISOString(),
    coordinates: {
      lat: 35.6895,
      lng: 139.6917 // Example: Tokyo
    }
  },
  pickupLocation: 'Tokyo Ginza Imperial Hotel, 1-1-1 Uchisaiwaicho, Chiyoda City, Tokyo',
  pickupLocationDetails: {
    name: 'Tokyo Ginza Imperial Hotel Parking Lot',
    address: '1-1-1 Uchisaiwaicho, Chiyoda City, Tokyo',
    phone: '+8688888888'
  },
  pickupInstructions: 'Walk 30km left from XXX Road and turn right.',
  returnLocation: 'Tokyo Ginza Imperial Hotel, 1-1-1 Uchisaiwaicho, Chiyoda City, Tokyo',
  returnParkingPlan: {
    status: 'ACTIVE',
    parkingName: 'Imperial Hotel Parking',
    address: '1-1-1 Uchisaiwaicho, Chiyoda City, Tokyo 100-8558',
  },
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
    attachment_status: 'NOT_READY',
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
  pickupContractConfigSnapshot: MOCK_PICKUP_CONTRACT_CONFIG_SNAPSHOT,
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [inspectionRecord, setInspectionRecord] = useState<InspectionSubmissionRecord | null>(null);
  const [depositVisitCount, setDepositVisitCount] = useState(0);
  const [blockedOnlineCheckinStatus, setBlockedOnlineCheckinStatus] = useState<OnlineCheckinVerificationStatus | null>(null);
  const [onlineCheckinOrderNo, setOnlineCheckinOrderNo] = useState<string | null>(null);
  const [submittedOnlineCheckinOrders, setSubmittedOnlineCheckinOrders] = useState<Set<string>>(() => new Set());
  // 记录正在发起签约的订单号，避免同一订单重复触发合同签署流程。
  const contractSigningOrderRef = useRef<string | null>(null);
  const inspectionCompleted = isInspectionReadyForContract(inspectionRecord, orderDetails || undefined);

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
          // The rental becomes active only after the signed contract artifact is ready.
          isRentalActive: true,
        };
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [orderDetails?.contract_sign_status, orderDetails?.contract.attachment_status]);



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
  // 2) Online Check-In not submitted -> open the local submission demo; review states stay blocked
  // 3) Not self-service eligible -> blocked for regular rental orders
  // 4) Approved + eligible -> enter the account's configured demo entry point
  const handleAuthSuccess = (orderNo: string) => {
    const normalizedOrderNo = orderNo.toUpperCase();
    const account = MOCK_ACCOUNTS[normalizedOrderNo];
    if (!account) return; // 不应发生，AuthScreen 已做校验
    const onlineCheckinStatus = submittedOnlineCheckinOrders.has(normalizedOrderNo)
      ? OnlineCheckinVerificationStatus.PENDING_REVIEW
      : account.online_checkin_verification_status;

    setOrderDetails(null);
    setInspectionRecord(null);
    setBlockedOnlineCheckinStatus(null);
    setOnlineCheckinOrderNo(null);
    contractSigningOrderRef.current = null;

    if (account.canonical_status === CanonicalStatus.CANCELLED) {
      setCurrentView(AppView.AUTH_BLOCKED_CANCELLED);
      return;
    }
    if (onlineCheckinStatus !== OnlineCheckinVerificationStatus.APPROVED) {
      if (onlineCheckinStatus === OnlineCheckinVerificationStatus.NOT_SUBMITTED) {
        setOnlineCheckinOrderNo(normalizedOrderNo);
        setCurrentView(AppView.ONLINE_CHECKIN);
        return;
      }
      setBlockedOnlineCheckinStatus(onlineCheckinStatus);
      setCurrentView(AppView.AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED);
      return;
    }

    if (!account.is_selfservice_eligible) {
      setCurrentView(AppView.AUTH_BLOCKED_NOT_ELIGIBLE);
      return;
    }

    const isInspectionReadyAccount = account.demo_stage === 'INSPECTION_READY';
    const isContractReadyAccount = account.demo_stage === 'CONTRACT_READY';
    const isRentalActiveAccount = account.demo_stage === 'RETURN_READY' || account.canonical_status === CanonicalStatus.PICKED_UP;
    const hasCompletedInspection = isContractReadyAccount || isRentalActiveAccount;
    const hasAuthorizedDeposit = isInspectionReadyAccount || hasCompletedInspection;
    if (hasCompletedInspection) {
      setInspectionRecord(createApprovedInspectionRecord(normalizedOrderNo));
    }

    setOrderDetails({
      ...mockOrderDetails,
      orderNumber: normalizedOrderNo,
      onlineCheckinDrivers: account.onlineCheckinDrivers,
      confirmationCode: normalizedOrderNo,
      canonical_status: account.canonical_status,
      online_checkin_verification_status: onlineCheckinStatus,
      is_selfservice_eligible: account.is_selfservice_eligible,
      isIdentityVerified: onlineCheckinStatus === OnlineCheckinVerificationStatus.APPROVED,
      preparationStatus: hasAuthorizedDeposit ? 'Ready' : mockOrderDetails.preparationStatus,
      pickupStatus: isRentalActiveAccount
        ? 'Picked Up'
        : isContractReadyAccount
          ? 'Inspection Complete'
          : isInspectionReadyAccount
            ? 'Ready for Inspection'
            : mockOrderDetails.pickupStatus,
      deposit: hasAuthorizedDeposit
        ? { ...mockOrderDetails.deposit, status: 3 }
        : mockOrderDetails.deposit,
      isDepositPaid: hasAuthorizedDeposit,
      contract_sign_status: isRentalActiveAccount ? 'SIGNED' : mockOrderDetails.contract_sign_status,
      contract: isRentalActiveAccount
        ? {
            ...mockOrderDetails.contract,
            number: 'CO-RETURN01',
            date: '2025-10-28',
            attachment_status: 'READY',
            attachment_url: MOCK_CONTRACT_PDF_URL,
          }
        : mockOrderDetails.contract,
      isRentalActive: isRentalActiveAccount,
      isReturned: false,
    });

    // Contract-ready demo skips navigation only; all formal contract admission facts remain populated.
    handleSetView(isContractReadyAccount ? AppView.CONTRACT : AppView.OVERVIEW);
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
    if (!orderDetails || !record.driverPhotoConfirmation || !isInspectionReadyForContract(record, orderDetails)) {
      setInspectionRecord(record);
      return;
    }
    const pickupCompletedAt = new Date().toISOString();
    setInspectionRecord(record);
    setOrderDetails((previous) => {
      if (!previous) return previous;
      if (previous.pickup_completed_at) return previous;
      return {
        ...previous,
        canonical_status: CanonicalStatus.PICKED_UP,
        pickup_completed_at: pickupCompletedAt,
        pickup_addons_snapshot: previous.pickup_addons_snapshot ?? {
          online_booking: previous.addons.online_booking.map((item) => ({ ...item })),
          store_addons: previous.addons.store_addons.map((item) => ({ ...item })),
          frozen_at: pickupCompletedAt
        },
        contract_sign_status: 'UNSIGNED',
        contract_signed_at: undefined,
        contract: {
          ...previous.contract,
          attachment_status: 'NOT_READY',
          attachment_url: undefined
        }
      };
    });
    handleSetView(AppView.CONTRACT);
  }, [handleSetView, orderDetails]);

  const handleContractSign = () => {
    if (!orderDetails || orderDetails.canonical_status !== CanonicalStatus.PICKED_UP || !orderDetails.pickup_completed_at || !orderDetails.pickup_addons_snapshot) {
      return false;
    }
    if (
      orderDetails.contract_sign_status === 'SIGNED' ||
      orderDetails.contract_sign_status === 'SIGNING' ||
      contractSigningOrderRef.current === orderDetails.orderNumber
    ) {
      return false;
    }

    contractSigningOrderRef.current = orderDetails.orderNumber;
    const signedAt = new Date().toISOString();
    setOrderDetails(prev => {
      if (
        !prev ||
        prev.canonical_status !== CanonicalStatus.PICKED_UP ||
        !prev.pickup_completed_at ||
        !prev.pickup_addons_snapshot ||
        prev.contract_sign_status === 'SIGNED' ||
        prev.contract_sign_status === 'SIGNING'
      ) {
        contractSigningOrderRef.current = null;
        return prev;
      }
      return {
        ...prev,
        contract_sign_status: 'SIGNED',
        contract_signed_at: signedAt,
        isRentalActive: false,
        contract: {
          ...prev.contract,
          attachment_status: 'GENERATING',
          attachment_url: undefined,
        },
      };
    });
    handleSetView(AppView.COMPLETION);
    return true;
  }

  const handleRetryContractGeneration = useCallback(() => {
    setOrderDetails((previous) => {
      if (
        !previous ||
        previous.canonical_status !== CanonicalStatus.PICKED_UP ||
        previous.contract_sign_status !== 'SIGNED' ||
        previous.contract.attachment_status !== 'FAILED'
      ) {
        return previous;
      }

      return {
        ...previous,
        isRentalActive: false,
        contract: {
          ...previous.contract,
          attachment_status: 'GENERATING',
          attachment_url: undefined
        }
      };
    });
  }, []);

  const handleStartRental = () => {
    handleSetView(AppView.OVERVIEW);
  }

  const handleReturnComplete = (submission: CustomerReturnSubmission) => {
    if (orderDetails) {
      setOrderDetails({
        ...orderDetails,
        isRentalActive: false,
        isReturned: true,
        returnVehicleMetricCheckpoint: submission.vehicleMetricCheckpoint,
        returnDashboardPhoto: submission.dashboardPhoto,
        returnConditionReport: submission.conditionReport
      });
      handleSetView(AppView.TRIP_ENDED);
    }
  }

  const handleOnlineCheckinSubmitted = () => {
    if (onlineCheckinOrderNo) {
      setSubmittedOnlineCheckinOrders((previous) => {
        const next = new Set(previous);
        next.add(onlineCheckinOrderNo);
        return next;
      });
    }
    setOnlineCheckinOrderNo(null);
    setBlockedOnlineCheckinStatus(OnlineCheckinVerificationStatus.PENDING_REVIEW);
    setCurrentView(AppView.AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.AUTH:
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

      case AppView.ONLINE_CHECKIN:
        return onlineCheckinOrderNo ? (
          <OnlineCheckinScreen
            orderNo={onlineCheckinOrderNo}
            onBack={() => {
              setOnlineCheckinOrderNo(null);
              setCurrentView(AppView.AUTH);
            }}
            onSubmitted={handleOnlineCheckinSubmitted}
          />
        ) : <AuthScreen onAuthSuccess={handleAuthSuccess} />;

      // ─── Status Gate Views ─────────────────────────────────────────────────
      case AppView.AUTH_BLOCKED_CANCELLED:
        return <AuthBlockedView type="cancelled" onBack={() => setCurrentView(AppView.AUTH)} />;
      case AppView.AUTH_BLOCKED_ONLINE_CHECKIN_REQUIRED:
        return (
          <AuthBlockedView
            type="online_checkin_required"
            onlineCheckinStatus={blockedOnlineCheckinStatus}
            onBack={() => setCurrentView(AppView.AUTH)}
          />
        );
      case AppView.AUTH_BLOCKED_NOT_ELIGIBLE:
        return <AuthBlockedView type="not_eligible" onBack={() => setCurrentView(AppView.AUTH)} />;

      case AppView.OVERVIEW:
        return orderDetails && (
          <OverviewScreen
            orderDetails={orderDetails}
            setView={handleSetView}
            inspectionCompleted={inspectionCompleted}
            onRetryContractGeneration={handleRetryContractGeneration}
          />
        );
      case AppView.DEPOSIT:
        return orderDetails && <DepositScreen
          orderDetails={orderDetails}
          setView={handleSetView}
          onDepositComplete={handleDepositComplete}
          // Logic: 1st visit (count=1) -> false (Restricted). 2nd visit (count=2) -> true (Allowed).
          simulateTimePassed={depositVisitCount > 1}
        />;
      case AppView.INSPECTION:
        return orderDetails ? (
          <InspectionScreen
            orderDetails={orderDetails}
            setView={handleSetView}
            onInspectionRecordChange={handleInspectionRecordChange}
            onContinueToContract={handleContinueToContract}
            initialRecord={inspectionRecord}
          />
        ) : null;
      case AppView.INSPECTION_DETAILS:
        return <InspectionDetailsScreen setView={handleSetView} record={inspectionRecord} />;
      case AppView.CONTRACT:
        return orderDetails && <ContractScreen orderDetails={orderDetails} setView={handleSetView} onContractSign={handleContractSign} />;
      case AppView.RESERVATION_DETAILS:
        return orderDetails && <ReservationDetailsScreen orderDetails={orderDetails} setView={handleSetView} />;
      case AppView.COMPLETION:
        return orderDetails && (
          <CompletionScreen
            orderDetails={orderDetails}
            setView={handleSetView}
            onStartRental={handleStartRental}
            onRetryContractGeneration={handleRetryContractGeneration}
          />
        );
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
  onlineCheckinStatus?: OnlineCheckinVerificationStatus | null;
  onBack: () => void;
}> = ({ type, onlineCheckinStatus, onBack }) => {
  const { t } = useContext(LanguageContext);

  const onlineCheckinConfig = onlineCheckinStatus === OnlineCheckinVerificationStatus.PENDING_REVIEW
    ? {
        icon: <AlertTriangle size={48} className="text-yellow-400" />,
        bg: 'bg-yellow-50',
        border: 'border-yellow-100',
        titleColor: 'text-yellow-800',
        bodyColor: 'text-yellow-700',
        title: t('authBlockedPendingTitle'),
        body: t('authBlockedPendingBody'),
      }
    : onlineCheckinStatus === OnlineCheckinVerificationStatus.REJECTED
      ? {
          icon: <XCircle size={48} className="text-red-400" />,
          bg: 'bg-red-50',
          border: 'border-red-100',
          titleColor: 'text-red-700',
          bodyColor: 'text-red-600',
          title: t('authBlockedRejectedTitle'),
          body: t('authBlockedRejectedBody'),
        }
      : {
          icon: <AlertTriangle size={48} className="text-yellow-400" />,
          bg: 'bg-yellow-50',
          border: 'border-yellow-100',
          titleColor: 'text-yellow-800',
          bodyColor: 'text-yellow-700',
          title: t('authBlockedOnlineCheckinTitle'),
          body: t('authBlockedOnlineCheckinBody'),
        };

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
    online_checkin_required: onlineCheckinConfig,
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
            {t('backToLogin')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default App;
