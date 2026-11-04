import React, { type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';
import { cx } from './cx';
import { toneClasses, type StatusTone } from './badge';

type AlertTone = Exclude<StatusTone, 'neutral' | 'brand'>;
const alertIcons: Record<AlertTone, LucideIcon> = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle };

export function Alert({ tone, title, action, role, className, children }: {
  tone: AlertTone;
  title?: ReactNode;
  action?: ReactNode;
  role?: 'alert' | 'status' | 'note' | false | null;
  className?: string;
  children: ReactNode;
}) {
  const Icon = alertIcons[tone];
  const resolvedRole = role === undefined ? (tone === 'danger' ? 'alert' : 'status') : role || undefined;
  return (
    <div role={resolvedRole} className={cx('flex gap-3 rounded-customer-inset border p-3.5', toneClasses[tone].badge, className)}>
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-customer-body-strong">{title}</p> : null}
        <div className={cx('text-customer-body', title && 'mt-0.5')}>{children}</div>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-customer-inset bg-customer-fill-disabled', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center gap-2 py-8 text-center', className)}>
      {Icon ? <Icon size={40} strokeWidth={1.5} aria-hidden="true" className="text-customer-text-tertiary" /> : null}
      <p className="text-customer-title">{title}</p>
      {description ? <div className="text-customer-body text-customer-text-secondary">{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

const resultIcons: Record<AlertTone, LucideIcon> = alertIcons;

export function Result({ tone, icon, title, description, action, className, children }: {
  tone: AlertTone;
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const Icon = icon ?? resultIcons[tone];
  return (
    <div className={cx('flex flex-col items-center gap-3 py-6 text-center', className)}>
      <span className={cx('flex size-16 items-center justify-center rounded-full', toneClasses[tone].chip)} aria-hidden="true">
        <Icon size={32} />
      </span>
      <h2 className="text-customer-headline">{title}</h2>
      {description ? <div className="text-customer-body text-customer-text-secondary">{description}</div> : null}
      {children}
      {action ? <div className="mt-1 w-full">{action}</div> : null}
    </div>
  );
}
