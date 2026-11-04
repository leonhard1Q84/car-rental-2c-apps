import React, { useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cx } from './cx';

const controlClass = 'w-full rounded-customer-control border border-customer-border-strong bg-customer-card px-3.5 text-customer-input text-customer-text placeholder:text-customer-text-disabled focus:border-customer-brand focus:outline-none focus:ring-4 focus:ring-customer-brand-ring disabled:bg-customer-inset disabled:text-customer-text-disabled aria-invalid:border-customer-danger aria-invalid:focus:ring-customer-danger-subtle';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx('h-customer-control', controlClass, className)} {...rest} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cx('h-customer-control', controlClass, className)} {...rest} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx('min-h-24 py-2.5', controlClass, className)} {...rest} />;
});

export function Field({ label, hint, error, htmlFor, className, children }: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  const autoId = useId();
  const hintId = `${autoId}-hint`;
  const errorId = `${autoId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
  const control = React.cloneElement(child, {
    'aria-describedby': [child.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : child.props['aria-invalid'],
  });
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-customer-label text-customer-text-secondary">{label}</label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1 text-customer-caption text-customer-danger-text">
          <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="min-w-0">{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-customer-caption text-customer-text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
