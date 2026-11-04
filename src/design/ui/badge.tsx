import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

export type StatusTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

export const toneClasses: Record<StatusTone, { badge: string; chip: string }> = {
  neutral: { badge: 'border-customer-border bg-customer-inset text-customer-text-secondary', chip: 'bg-customer-inset text-customer-text-secondary' },
  brand: { badge: 'border-customer-brand-border bg-customer-brand-subtle text-customer-brand-text', chip: 'bg-customer-brand-subtle text-customer-brand-text' },
  info: { badge: 'border-customer-info-border bg-customer-info-subtle text-customer-info-text', chip: 'bg-customer-info-subtle text-customer-info-text' },
  success: { badge: 'border-customer-success-border bg-customer-success-subtle text-customer-success-text', chip: 'bg-customer-success-subtle text-customer-success-text' },
  warning: { badge: 'border-customer-warning-border bg-customer-warning-subtle text-customer-warning-text', chip: 'bg-customer-warning-subtle text-customer-warning-text' },
  danger: { badge: 'border-customer-danger-border bg-customer-danger-subtle text-customer-danger-text', chip: 'bg-customer-danger-subtle text-customer-danger-text' },
};

export function Badge({ tone = 'neutral', icon: Icon, className, children }: {
  tone?: StatusTone;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-customer-caption font-semibold', toneClasses[tone].badge, className)}>
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function IconChip({ icon: Icon, tone = 'brand', className, children }: {
  icon?: LucideIcon;
  tone?: StatusTone;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-full', toneClasses[tone].chip, className)} aria-hidden="true">
      {children ?? (Icon ? <Icon size={20} /> : null)}
    </span>
  );
}
