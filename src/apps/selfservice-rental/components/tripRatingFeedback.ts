import type { CustomerTripEndedKey } from '../i18n/trip-ended';

export const COMMENT_MAX_LENGTH = 300;
export const tripRatingIssues = [
  { code: 'finding_vehicle', label: 'tripRatingIssueFinding' },
  { code: 'pickup_return_guidance', label: 'tripRatingIssueGuidance' },
  { code: 'remote_lock', label: 'tripRatingIssueRemoteLock' },
  { code: 'page_messages', label: 'tripRatingIssueMessages' },
  { code: 'vehicle_condition', label: 'tripRatingIssueVehicle' },
  { code: 'customer_service', label: 'tripRatingIssueService' },
  { code: 'other', label: 'tripRatingIssueOther' },
] as const satisfies ReadonlyArray<{ code: string; label: CustomerTripEndedKey }>;
export type TripRatingIssue = typeof tripRatingIssues[number]['code'];

// Segment visible characters so emoji and combining marks stay intact.
const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
function characters(value: string): string[] {
  return segmenter ? Array.from(segmenter.segment(value), part => part.segment) : Array.from(value);
}
export function commentLength(value: string): number {
  return characters(value).length;
}
export function limitRatingComment(value: string): { value: string; truncated: boolean } {
  const parts = characters(value);
  return { value: parts.slice(0, COMMENT_MAX_LENGTH).join(''), truncated: parts.length > COMMENT_MAX_LENGTH };
}
