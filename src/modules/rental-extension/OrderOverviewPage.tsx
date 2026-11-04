import React from 'react';
import type { SanitizedOrder } from './contracts';
import type { PreparationKey } from '../../i18n/preparation';
import { ExpectedReturnDateTimePicker } from './ExpectedReturnDateTimePicker';

export function OrderOverviewPage({ order, maxDays, requestedReturnTime, onReturnTimeChange, onResetLookup, onSearchQuote,
  searching, searchError, children,
}: {
  order: SanitizedOrder; maxDays: number; requestedReturnTime: string; onReturnTimeChange: (value: string) => void;
  onResetLookup: () => void; onSearchQuote: (value: string) => Promise<boolean>;
  searching: boolean; searchError: PreparationKey | null; children?: React.ReactNode;
}) {
  return <>
    {children}
    <ExpectedReturnDateTimePicker open showTrigger={false} onOpenChange={open => { if (!open) onResetLookup(); }}
      value={requestedReturnTime} currentReturnTime={order.current_return_time} maxDays={maxDays} timeZone={order.branch_timezone}
      disabled={searching} onChange={onReturnTimeChange} onConfirm={onSearchQuote} confirmLabel="renewConfirmReturnTime" error={searchError} />
  </>;
}
