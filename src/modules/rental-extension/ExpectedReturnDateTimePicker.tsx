import React, { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationKey } from '../../i18n/preparation';
import { Alert, Button } from '../../design/ui';
import { extensionDaysForReturnTime, fromBranchLocalDateTime, isRequestedReturnTimeValid, returnTimeBounds, toBranchLocalDateTime } from './returnTime';

interface ExpectedReturnDateTimePickerProps {
  value: string;
  currentReturnTime: string;
  maxDays: number;
  timeZone: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (value: string) => Promise<boolean>;
  confirmLabel?: PreparationKey;
  error?: PreparationKey | null;
  showTrigger?: boolean;
}
const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];
function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
function calendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function ExpectedReturnDateTimePicker({ value, currentReturnTime, maxDays, timeZone, disabled = false, onChange,
  open: controlledOpen, onOpenChange, onConfirm, confirmLabel = 'renewConfirmReturnTime', error, showTrigger = true,
}: ExpectedReturnDateTimePickerProps) {
  const { lang, t } = useContext(LanguageContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => { setLocalOpen(next); onOpenChange?.(next); };
  const localValue = value.includes('T') ? value.slice(0, 16) : toBranchLocalDateTime(value, timeZone);
  const [draftDate, setDraftDate] = useState(localValue.slice(0, 10));
  const [draftTime, setDraftTime] = useState(localValue.slice(11, 16) || '14:00');
  const [visibleMonth, setVisibleMonth] = useState(() => parseCalendarDate(`${localValue.slice(0, 7)}-01`));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bounds = useMemo(() => returnTimeBounds(currentReturnTime, maxDays), [currentReturnTime, maxDays]);
  const minLocal = bounds ? toBranchLocalDateTime(bounds.min, timeZone) : '';
  const maxLocal = bounds ? toBranchLocalDateTime(bounds.max, timeZone) : '';
  const minDate = minLocal.slice(0, 10), maxDate = maxLocal.slice(0, 10);
  const candidateLocal = `${draftDate}T${draftTime}`;
  const candidateInstant = fromBranchLocalDateTime(candidateLocal, timeZone);
  const validCandidate = isRequestedReturnTimeValid(currentReturnTime, candidateInstant, maxDays);
  const extensionDays = extensionDaysForReturnTime(currentReturnTime, candidateInstant);
  const currentDate = toBranchLocalDateTime(currentReturnTime, timeZone).slice(0, 10);
  const date = (iso: string) => new Intl.DateTimeFormat(lang, { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  const shortDate = (iso: string) => new Intl.DateTimeFormat(lang, { timeZone, month: 'numeric', day: 'numeric' }).format(new Date(iso));

  useEffect(() => {
    if (!open) return;
    const local = value.includes('T') ? value.slice(0, 16) : toBranchLocalDateTime(value, timeZone);
    setDraftDate(local.slice(0, 10)); setDraftTime(local.slice(11, 16) || '14:00');
    setVisibleMonth(parseCalendarDate(`${local.slice(0, 7)}-01`));
  }, [open, value, timeZone]);
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; if (trigger?.isConnected) trigger.focus(); };
  }, [open]);

  const monthStart = calendarDate(visibleMonth).slice(0, 7);
  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day < 1 || day > daysInMonth ? null : calendarDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
  });
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(lang, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + index))));
  const monthLabel = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)));
  function selectDate(nextDate: string) {
    let nextTime = draftTime;
    if (`${nextDate}T${nextTime}` < minLocal) nextTime = minLocal.slice(11, 16);
    if (`${nextDate}T${nextTime}` > maxLocal) nextTime = maxLocal.slice(11, 16);
    setDraftDate(nextDate); setDraftTime(nextTime);
  }
  async function confirm() {
    if (!validCandidate || disabled) return;
    if (onConfirm) { await onConfirm(candidateLocal); return; }
    onChange(candidateLocal); setOpen(false);
  }
  const close = () => { if (!disabled) setOpen(false); };
  const selectClass = 'min-h-11 rounded-customer-control border border-customer-border-strong bg-customer-card px-3 text-customer-input text-customer-text focus:outline-customer-brand';
  return <>
    {showTrigger && <button type="button" disabled={disabled || !bounds} onClick={() => setOpen(true)}
      className="flex min-h-12 w-full items-center gap-3 rounded-customer-control border border-customer-border-strong bg-customer-card p-3 text-left focus-visible:outline-customer-brand disabled:opacity-50">
      <CalendarDays size={20} aria-hidden="true" className="shrink-0 text-customer-brand-text" />
      <span className="min-w-0 flex-1"><span className="block text-customer-caption text-customer-text-tertiary">{t('renewRequestedReturn')}</span><span className="block text-customer-body-strong tabular-nums">{date(fromBranchLocalDateTime(localValue, timeZone))}</span></span>
      <ChevronRight size={20} aria-hidden="true" />
    </button>}
    {open && <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-customer-content rounded-t-customer-sheet border-0 bg-customer-card p-0 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim motion-safe:animate-slide-up">
      <div className="flex max-h-[92dvh] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-customer-border p-4">
          <div><h2 id={titleId} className="text-customer-title">{t('renewReturnTimePickerTitle')}</h2><p className="mt-1 text-customer-caption text-customer-text-tertiary">{timeZone}</p></div>
          <button type="button" autoFocus disabled={disabled} onClick={close} aria-label={t('renewClosePicker')} className="flex size-11 shrink-0 items-center justify-center rounded-customer-control hover:bg-customer-inset"><X size={20} aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-customer-caption text-customer-text-secondary">{t('renewCurrentReturn')}<span className="mt-1 block text-customer-body-strong tabular-nums">{date(currentReturnTime)}</span></p>
          </div>
          {error && <Alert tone="danger">{t(error)}</Alert>}
          <div className="flex items-center justify-between">
            <button type="button" disabled={disabled || monthStart <= minDate.slice(0, 7)} onClick={() => setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label={t('renewPreviousMonth')} className="flex size-11 items-center justify-center rounded-customer-control hover:bg-customer-inset disabled:text-customer-text-disabled"><ChevronLeft size={20} aria-hidden="true" /></button>
            <span className="text-customer-body-strong">{monthLabel}</span>
            <button type="button" disabled={disabled || monthStart >= maxDate.slice(0, 7)} onClick={() => setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label={t('renewNextMonth')} className="flex size-11 items-center justify-center rounded-customer-control hover:bg-customer-inset disabled:text-customer-text-disabled"><ChevronRight size={20} aria-hidden="true" /></button>
          </div>
          <div className="-mx-3 grid grid-cols-7 gap-y-1 text-center">
            {weekdays.map((weekday, index) => <span key={index} className="py-1 text-customer-caption text-customer-text-tertiary">{weekday}</span>)}
            {calendarCells.map((day, index) => {
              if (!day) return <span key={index} />;
              const inRange = Boolean(currentDate) && day > currentDate && day <= draftDate;
              const neighbour = (offset: number) => calendarDate(new Date(parseCalendarDate(day).getTime() + offset * 86_400_000));
              const rangeStart = inRange && !(neighbour(-1) > currentDate && neighbour(-1) <= draftDate);
              const rangeEnd = inRange && !(neighbour(1) > currentDate && neighbour(1) <= draftDate);
              const tone = day === draftDate
                ? 'rounded-customer-control bg-customer-brand text-customer-text-inverse'
                : inRange
                ? `bg-customer-brand-subtle text-customer-brand-text hover:bg-customer-brand-border ${rangeStart ? 'rounded-l-customer-control' : 'rounded-none'} ${rangeEnd ? 'rounded-r-customer-control' : 'rounded-none'}`
                : 'rounded-customer-control text-customer-text hover:bg-customer-brand-subtle disabled:text-customer-text-disabled';
              return <button key={day} type="button" disabled={disabled || day < minDate || day > maxDate} aria-pressed={day === draftDate}
                aria-label={new Intl.DateTimeFormat(lang, { dateStyle: 'full' }).format(parseCalendarDate(day))}
                onClick={() => selectDate(day)} className={`min-h-11 w-full text-customer-label transition-colors duration-150 focus-visible:outline-customer-brand ${tone}`}>{Number(day.slice(-2))}</button>;
            })}
          </div>
          {validCandidate && extensionDays > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-customer-caption tabular-nums text-customer-brand-text" role="status">
              <CalendarDays size={14} aria-hidden="true" />
              <span>{t('renewExtensionSpan').replace('{start}', shortDate(currentReturnTime)).replace('{end}', shortDate(candidateInstant)).replace('{count}', String(extensionDays))}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-customer-inset bg-customer-inset p-3">
            <span className="text-customer-label text-customer-text-secondary">{t('returnTime')}</span>
            <div className="flex items-center gap-2">
              <select disabled={disabled} value={draftTime.slice(0, 2)} onChange={event => setDraftTime(`${event.target.value}:${draftTime.slice(3, 5)}`)} aria-label={t('renewReturnHour')} className={selectClass}>{hourOptions.map(hour => <option key={hour}>{hour}</option>)}</select>
              <span aria-hidden="true">:</span>
              <select disabled={disabled} value={draftTime.slice(3, 5)} onChange={event => setDraftTime(`${draftTime.slice(0, 2)}:${event.target.value}`)} aria-label={t('renewReturnMinute')} className={selectClass}>{[...new Set([...minuteOptions, draftTime.slice(3, 5)])].sort().map(minute => <option key={minute}>{minute}</option>)}</select>
            </div>
          </div>
          <p className="text-customer-caption text-customer-text-tertiary">{t('renewReturnTimeLimit').replace('{count}', String(maxDays))}</p>
        </div>
        <footer className="shrink-0 border-t border-customer-border p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <Button block loading={disabled} disabled={!validCandidate} onClick={() => void confirm()}>{t(confirmLabel)}</Button>
        </footer>
      </div>
    </dialog>}
  </>;
}
