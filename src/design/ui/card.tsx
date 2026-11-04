import React, { type ReactNode } from 'react';
import { cx } from './cx';

const paddings = { default: 'p-5', compact: 'p-4', none: '' } as const;

export function Card({ as: Component = 'div', padding = 'default', className, children, ...rest }: {
  as?: 'div' | 'section' | 'article' | 'label' | 'form';
  padding?: keyof typeof paddings;
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  return (
    <Component className={cx('rounded-customer-card border border-customer-border bg-customer-card shadow-customer-card', paddings[padding], className)} {...rest}>
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, divider = false, className }: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  divider?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('mb-3 flex items-start justify-between gap-3', divider && 'border-b border-customer-border-subtle pb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-customer-title">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-customer-caption text-customer-text-tertiary">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('mb-2 px-1 text-customer-label text-customer-text-secondary', className)}>{children}</h2>;
}
