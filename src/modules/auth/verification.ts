import { ORDER_ID, STEPS, type Step } from '../../app/customer-journey/model';
import { preparationBookings } from '../../app/customer-journey/bookingFixtures';

// Match the original booking fixture, independently of editable driver details.
// The customer enters the last four digits of the booking phone number.
export function matchesPreparationBooking(reference: string, phoneLast4: string): boolean {
  return Boolean(findPreparationBooking(reference, phoneLast4));
}

export function findPreparationBooking(reference: string, phoneLast4: string) {
  const normalized = reference.trim().toUpperCase();
  const normalizedPhoneLast4 = phoneLast4.replace(/\D/g, '');
  if (!/^\d{4}$/.test(normalizedPhoneLast4)) return undefined;
  return preparationBookings.find(booking => booking.orderId === normalized
    && booking.phone.replace(/\D/g, '').endsWith(normalizedPhoneLast4));
}

export function preparationOrderId(value: string | null): string {
  const normalized = value?.trim().toUpperCase();
  return preparationBookings.find(booking => booking.orderId === normalized || booking.customerReference === normalized)?.orderId ?? ORDER_ID;
}

export function preparationEntryStep(value: string | null): Step {
  return STEPS.includes(value as Step) ? value as Step : 'auth';
}
