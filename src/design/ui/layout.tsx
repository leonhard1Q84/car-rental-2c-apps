import React, { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cx } from './cx';

export function Page({ header, footer, className, contentClassName, children }: {
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx('min-h-dvh bg-customer-page text-customer-text antialiased', className)}>
      {header}
      <main className={cx(
        'mx-auto w-full max-w-customer-content px-4 pt-4 space-y-3',
        footer ? 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
        contentClassName,
      )}>
        {children}
      </main>
      {footer}
    </div>
  );
}

export function PageHeader({ title, subtitle, onBack, backLabel, leading, trailing, variant = 'task' }: {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  variant?: 'task' | 'brand';
}) {
  const side = onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label={backLabel}
      className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-customer-control text-customer-text hover:bg-customer-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-customer-brand"
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  ) : leading ? <div className="flex shrink-0 items-center">{leading}</div> : null;
  return (
    <header className="sticky top-0 z-30 border-b border-customer-border bg-customer-card/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-customer-header w-full max-w-customer-content items-center gap-2 px-4">
        {side}
        <div className={cx('min-w-0 flex-1', variant === 'task' ? 'text-center' : 'text-left')}>
          <h1 className="truncate text-customer-title">{title}</h1>
          {subtitle ? <p className="truncate text-customer-caption text-customer-text-tertiary">{subtitle}</p> : null}
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : variant === 'task' && side ? <div className="w-11 shrink-0" aria-hidden="true" /> : null}
      </div>
    </header>
  );
}

export const BottomBar = React.forwardRef<HTMLElement, {
  summary?: { label: ReactNode; value: ReactNode };
  note?: ReactNode;
  className?: string;
  children: ReactNode;
}>(function BottomBar({ summary, note, className, children }, ref) {
  return (
    <footer ref={ref} className={cx('fixed inset-x-0 bottom-0 z-40 border-t border-customer-border bg-customer-card/95 shadow-customer-raised backdrop-blur-md', className)}>
      <div className="mx-auto w-full max-w-customer-content px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        {note ? <div className="mb-2 text-customer-caption text-customer-text-tertiary">{note}</div> : null}
        <div className="flex items-center gap-3">
          {summary ? (
            <div className="min-w-0 shrink-0">
              <p className="text-customer-caption text-customer-text-tertiary">{summary.label}</p>
              <p className="text-customer-title tabular-nums">{summary.value}</p>
            </div>
          ) : null}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </footer>
  );
});
