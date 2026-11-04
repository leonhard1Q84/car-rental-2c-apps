import React, { useState, type ReactNode } from 'react';
import { cx } from './cx';

export function InfoList({ children, className, collapseAfter, expandLabel }: {
  children: ReactNode;
  className?: string;
  collapseAfter?: number;
  expandLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = React.Children.toArray(children);
  const collapsible = expandLabel !== undefined && collapseAfter !== undefined && items.length > collapseAfter;
  const visible = collapsible && !expanded ? items.slice(0, collapseAfter) : items;
  return (
    <div className={className}>
      <dl className="space-y-3">{visible}</dl>
      {collapsible && !expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="mt-3 flex min-h-customer-touch-min items-center text-customer-label text-customer-brand-text">
          {expandLabel}
        </button>
      ) : null}
    </div>
  );
}

export function InfoRow({ label, value, emphasis = false, total = false, stacked = false, className }: {
  label: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
  total?: boolean;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('flex gap-4', stacked ? 'flex-col gap-1' : 'items-start justify-between', total && 'border-t border-customer-border-subtle pt-3', className)}>
      <dt className="min-w-0 shrink-0 text-customer-label text-customer-text-tertiary">{label}</dt>
      <dd className={cx('min-w-0 break-words tabular-nums', stacked ? 'text-left' : 'text-right', total ? 'text-customer-title' : emphasis ? 'text-customer-body-strong' : 'text-customer-body')}>{value}</dd>
    </div>
  );
}

export function Highlight({ label, value, detail, className }: {
  label?: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('rounded-customer-inset border border-customer-brand-border bg-customer-brand-subtle p-4', className)}>
      {label ? <p className="text-customer-caption text-customer-text-secondary">{label}</p> : null}
      <p className={cx('text-customer-amount tabular-nums text-customer-brand-text', label && 'mt-1')}>{value}</p>
      {detail ? <p className="mt-1 text-customer-caption text-customer-text-secondary">{detail}</p> : null}
    </div>
  );
}
