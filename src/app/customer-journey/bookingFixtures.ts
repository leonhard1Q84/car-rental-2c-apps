import { DEFAULT_RENTAL_CAR_IMAGE } from '../../utils/imageFallback';
import { preparationEmergencyAcknowledgement } from '../../i18n/preparationEmergency';
import type { PreparationKey } from '../../i18n/preparation';
import { prototypePreparationConfiguration } from './configurationFixtures';

export type VehicleFuelType = 'regular' | 'highOctane' | 'diesel' | 'electric';
export type RentalServiceMode = 'regular' | 'selfservice';
export interface VehicleSpecifications {
  doors: number;
  seats: number;
  luggage: number;
  transmission: 'automatic' | 'manual';
  airConditioning: boolean;
}
export type VehicleAssignment = { status: 'UNASSIGNED' } | { status: 'ASSIGNED'; model: string; plate: string; fuelType?: VehicleFuelType; specs?: VehicleSpecifications; imageUrl?: string; imageCredit?: { source: string; author: string; license: string } };

const YARIS_SPECS: VehicleSpecifications = { doors: 5, seats: 5, luggage: 2, transmission: 'automatic', airConditioning: true };
const HARRIER_SPECS: VehicleSpecifications = { doors: 5, seats: 5, luggage: 3, transmission: 'automatic', airConditioning: true };
const STEPWGN_SPECS: VehicleSpecifications = { doors: 5, seats: 7, luggage: 4, transmission: 'automatic', airConditioning: true };

export interface PreparationExtra { kind: 'equipment' | 'service'; nameKey: PreparationKey; quantity?: number }
const extras: PreparationExtra[] = [
  { kind: 'equipment', nameKey: 'prepChildSeat', quantity: 1 },
  { kind: 'equipment', nameKey: 'prepEtcCard', quantity: 1 },
  { kind: 'service', nameKey: 'prepBasicCoverage' }
];

export const preparationBookings = [
  { orderId: 'RC10004', customerReference: 'RC10004', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType: 'regular', specs: YARIS_SPECS }, confirmationCode: 'NRT-PREP-004', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10005', customerReference: 'RC10005', brandCode: 'IX', vehicleAssignment: { status: 'UNASSIGNED' }, confirmationCode: 'NRT-PREP-005', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10001', customerReference: 'RC10001', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType: 'regular', specs: YARIS_SPECS }, confirmationCode: 'NRT-PREP-001', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10006', customerReference: 'RC10006', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-02', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576002', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10007', customerReference: 'RC10007', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-03', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576003', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10008', customerReference: 'RC10008', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-04', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576004', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10009', customerReference: 'RC10009', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-05', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576005', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10010', customerReference: 'RC10010', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-06', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576006', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10011', customerReference: 'RC10011', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-07', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576007', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10012', customerReference: 'RC10012', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-08', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576008', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10013', customerReference: 'RC10013', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Harrier', plate: '品川300 す 88-09', fuelType: 'regular', specs: HARRIER_SPECS }, confirmationCode: 'NYQ576009', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10003', customerReference: 'RC10003', brandCode: 'TG', vehicleAssignment: { status: 'UNASSIGNED' }, confirmationCode: 'NRT-PREP-003', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'RC10002', customerReference: 'RC10002', brandCode: 'IX', vehicleAssignment: { status: 'UNASSIGNED' }, confirmationCode: 'NRT-PREP-002', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012348888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  // Local-only cross-app fixture for the Store Ops order used in the demo.
  // Production must resolve this mapping in the verified server session.
  { orderId: 'RC10014', customerReference: 'XHS-NRT-20260319-312', brandCode: 'IX', vehicleAssignment: { status: 'ASSIGNED', model: 'Honda Stepwgn', plate: '成田330し110', fuelType: 'regular', specs: STEPWGN_SPECS, imageUrl: DEFAULT_RENTAL_CAR_IMAGE }, confirmationCode: 'BK-NRT-3100000012', first: 'Mika', last: 'Suzuki', email: 'mika.suzuki@example.com', phone: '+819022228888', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' }
] as const;

export function preparationBooking(orderId: string) {
  const booking = preparationBookings.find(item => item.orderId === orderId);
  if (!booking) throw new Error('UNKNOWN_PREPARATION_ORDER');
  // Local demo classification only. Production supplies the order's service
  // mode from the verified order session instead of inferring eligibility.
  const rentalMode: RentalServiceMode = orderId === 'RC10014' ? 'selfservice' : 'regular';
  const contractConfigSnapshot = prototypePreparationConfiguration();
  // RC10001 and the verified XHS demo order intentionally share the same
  // local Store Ops contract revision and wording for the two customer
  // preparation confirmations; vehicle-specific onsite confirmations remain
  // Store Ops-only. Production must
  // resolve this mapping and configuration from the order service.
  if (orderId === 'RC10001' || orderId === 'RC10014') {
    contractConfigSnapshot.revision = 'pickup-contract-narita-r8';
    contractConfigSnapshot.publishedAt = '2026-03-17T12:00:00+09:00';
    const terms = contractConfigSnapshot.customerConfirmationItems.find(item => item.id === 'rental_terms_acknowledgement');
    const notes = contractConfigSnapshot.customerConfirmationItems.find(item => item.id === 'rental_notes_acknowledgement');
    if (terms) terms.title = {
      'zh-CN': '我已确认本次租赁车辆、租期与费用信息无误。',
      'zh-TW': '我已確認本次租賃車輛、租期與費用資訊無誤。',
      en: 'I confirm the vehicle, rental period, and charges are correct.',
      ja: '車両、レンタル期間、料金に誤りがないことを確認しました。'
    };
    if (notes) notes.title = {
      'zh-CN': '我已了解燃油、ETC 与附加设备的归还要求。',
      'zh-TW': '我已了解燃油、ETC 與附加設備的歸還要求。',
      en: 'I understand the return requirements for fuel, ETC, and add-ons.',
      ja: '燃料、ETC、追加装備の返却条件を確認しました。'
    };
  }
  if (orderId === 'RC10014') {
    contractConfigSnapshot.revision = 'customer-narita-terms-emergency-v1';
    contractConfigSnapshot.publishedAt = '2026-10-25T12:00:00+09:00';
    contractConfigSnapshot.preparationConfirmationItemIds.push('accident_emergency_acknowledgement');
    contractConfigSnapshot.customerConfirmationItems.push({
      id: 'accident_emergency_acknowledgement', order: 25, title: preparationEmergencyAcknowledgement
    });
  }
  return { ...booking, rentalMode, pickupAt: '2026-11-01T10:00:00+09:00', returnAt: '2026-11-04T10:00:00+09:00', timezone: 'Asia/Tokyo', contractConfigSnapshot };
}

/** Local demo mapping; the production session supplies the canonical order ID. */
export function preparationFulfillmentOrderId(orderId: string): string {
  return orderId;
}
