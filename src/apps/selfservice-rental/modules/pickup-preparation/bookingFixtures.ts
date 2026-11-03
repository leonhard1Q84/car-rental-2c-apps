import { DEFAULT_RENTAL_CAR_IMAGE } from '../../utils/imageFallback';
import { preparationEmergencyAcknowledgement } from '../../i18n/preparationEmergency';
import type { PreparationKey } from '../../i18n/preparation';
import { prototypePreparationConfiguration } from './configurationFixtures';

export type VehicleFuelType = 'regular' | 'highOctane' | 'diesel' | 'electric';
export type VehicleAssignment = { status: 'UNASSIGNED' } | { status: 'ASSIGNED'; model: string; plate: string; fuelType?: VehicleFuelType; imageUrl?: string; imageCredit?: { source: string; author: string; license: string } };

export interface PreparationExtra { kind: 'equipment' | 'service'; nameKey: PreparationKey; quantity?: number }
const extras: PreparationExtra[] = [
  { kind: 'equipment', nameKey: 'prepChildSeat', quantity: 1 },
  { kind: 'equipment', nameKey: 'prepEtcCard', quantity: 1 },
  { kind: 'service', nameKey: 'prepBasicCoverage' }
];

export const preparationBookings = [
  { orderId: 'PREP04', customerReference: 'PREP04', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType: 'regular' }, confirmationCode: 'NRT-PREP-004', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012345678', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'PREP05', customerReference: 'PREP05', vehicleAssignment: { status: 'UNASSIGNED' }, confirmationCode: 'NRT-PREP-005', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012345678', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'PREP01', customerReference: 'PREP01', vehicleAssignment: { status: 'ASSIGNED', model: 'Toyota Yaris', plate: '成田330あ1234', fuelType: 'regular' }, confirmationCode: 'NRT-PREP-001', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012345678', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'PREP03', customerReference: 'PREP03', vehicleAssignment: { status: 'UNASSIGNED' }, confirmationCode: 'NRT-PREP-003', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012345678', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  { orderId: 'PREP02', customerReference: 'PREP02', vehicleAssignment: { status: 'UNASSIGNED' }, confirmationCode: 'NRT-PREP-002', first: 'Alex', last: 'Smith', email: 'alex.smith@example.com', phone: '+819012345678', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' },
  // Local-only cross-app fixture for the Store Ops order used in the demo.
  // Production must resolve this mapping in the verified server session.
  { orderId: 'ORD-20260319-012', customerReference: 'XHS-NRT-20260319-312', vehicleAssignment: { status: 'ASSIGNED', model: 'Honda Stepwgn', plate: '成田330し110', fuelType: 'regular', imageUrl: DEFAULT_RENTAL_CAR_IMAGE }, confirmationCode: 'BK-NRT-3100000012', first: 'Mika', last: 'Suzuki', email: 'mika.suzuki@example.com', phone: '+819022221012', storePhone: '+81 50 0000 0000', extras, insurancePlanKey: 'prepBasicInsurance' }
] as const;

export function preparationBooking(orderId: string) {
  const booking = preparationBookings.find(item => item.orderId === orderId);
  if (!booking) throw new Error('UNKNOWN_PREPARATION_ORDER');
  const contractConfigSnapshot = prototypePreparationConfiguration();
  // PREP01 and the verified XHS demo order intentionally share the same
  // local Store Ops contract revision and wording for the two customer
  // preparation confirmations; vehicle-specific onsite confirmations remain
  // Store Ops-only. Production must
  // resolve this mapping and configuration from the order service.
  if (orderId === 'PREP01' || orderId === 'ORD-20260319-012') {
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
  if (orderId === 'ORD-20260319-012') {
    contractConfigSnapshot.revision = 'customer-narita-terms-emergency-v1';
    contractConfigSnapshot.publishedAt = '2026-10-25T12:00:00+09:00';
    contractConfigSnapshot.preparationConfirmationItemIds.push('accident_emergency_acknowledgement');
    contractConfigSnapshot.customerConfirmationItems.push({
      id: 'accident_emergency_acknowledgement', order: 25, title: preparationEmergencyAcknowledgement
    });
  }
  return { ...booking, pickupAt: '2026-11-01T10:00:00+09:00', contractConfigSnapshot };
}

/** Local demo mapping; the production session supplies the canonical order ID. */
export function preparationFulfillmentOrderId(orderId: string): string {
  return orderId;
}
