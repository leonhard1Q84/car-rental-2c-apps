import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
export type ButtonSize = 'lg' | 'md';

const base = 'inline-flex items-center justify-center gap-2 rounded-customer-control text-customer-button transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-customer-brand focus-visible:ring-offset-2';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-customer-brand text-customer-text-inverse enabled:hover:bg-customer-brand-hover enabled:active:bg-customer-brand-pressed enabled:active:scale-[0.98] disabled:bg-customer-fill-disabled disabled:text-customer-text-disabled',
  secondary: 'border border-customer-border-strong bg-customer-card text-customer-text enabled:hover:bg-customer-inset enabled:active:scale-[0.98] disabled:border-transparent disabled:bg-customer-fill-disabled disabled:text-customer-text-disabled',
  text: 'min-h-customer-touch-min text-customer-brand-text enabled:hover:bg-customer-brand-subtle enabled:active:scale-[0.98] disabled:text-customer-text-disabled',
  danger: 'border border-customer-danger-border bg-customer-card text-customer-danger-text enabled:hover:bg-customer-danger-subtle enabled:active:scale-[0.98] disabled:border-transparent disabled:bg-customer-fill-disabled disabled:text-customer-text-disabled',
};

const sizes: Record<ButtonSize, string> = {
  lg: 'min-h-customer-cta px-5 py-3',
  md: 'min-h-customer-control px-4 py-2.5',
};

export function buttonClass({ variant = 'primary', size = 'lg', block = false, className }: {
  variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string;
} = {}) {
  return cx(base, variants[variant], sizes[size], block && 'w-full', className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'lg', block = false, loading = false, icon: Icon, trailingIcon: TrailingIcon, className, type = 'button', disabled, children, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })}
    >
      {loading ? <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" /> : Icon ? <Icon size={18} className="shrink-0" aria-hidden="true" /> : null}
      {children}
      {!loading && TrailingIcon ? <TrailingIcon size={18} className="shrink-0" aria-hidden="true" /> : null}
    </button>
  );
});
