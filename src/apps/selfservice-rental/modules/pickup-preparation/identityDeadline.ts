import { preparationBooking } from './bookingFixtures';

export function identityDeadlinePassed(orderId: string, now = Date.now()): boolean {
  const pickup = Date.parse(preparationBooking(orderId).pickupAt);
  return !Number.isFinite(pickup) || !Number.isFinite(now) || now > pickup - 4 * 60 * 60 * 1000;
}
