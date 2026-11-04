const DAY_MS = 86_400_000;
const TOKYO_OFFSET_MS = 9 * 3_600_000;

function partsInTimeZone(value: string, timeZone: string) {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  return year && month && day && hour && minute ? `${year}-${month}-${day}T${hour}:${minute}` : null;
}

export function toBranchLocalDateTime(value: string, timeZone: string): string {
  return partsInTimeZone(value, timeZone) ?? '';
}

export function fromBranchLocalDateTime(value: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return '';
  if (timeZone !== 'Asia/Tokyo') return '';
  return `${value}:00+09:00`;
}

export function addExtensionDays(currentReturnTime: string, days: number): string {
  const current = Date.parse(currentReturnTime);
  if (!Number.isFinite(current) || !Number.isInteger(days) || days < 1) return '';
  return new Date(current + days * DAY_MS + TOKYO_OFFSET_MS).toISOString().replace('Z', '+09:00');
}

export function extensionDaysForReturnTime(currentReturnTime: string, requestedReturnTime: string): number {
  const duration = Date.parse(requestedReturnTime) - Date.parse(currentReturnTime);
  return Number.isFinite(duration) && duration > 0 ? Math.ceil(duration / DAY_MS) : 0;
}

export function returnTimeBounds(currentReturnTime: string, maxDays: number) {
  const current = Date.parse(currentReturnTime);
  if (!Number.isFinite(current) || !Number.isInteger(maxDays) || maxDays < 1) return null;
  return {
    min: new Date(current + 15 * 60_000).toISOString(),
    max: new Date(current + maxDays * DAY_MS).toISOString(),
  };
}

export function isRequestedReturnTimeValid(currentReturnTime: string, requestedReturnTime: string, maxDays: number): boolean {
  const bounds = returnTimeBounds(currentReturnTime, maxDays);
  const requested = Date.parse(requestedReturnTime);
  return !!bounds && Number.isFinite(requested) && requested >= Date.parse(bounds.min) && requested <= Date.parse(bounds.max);
}
