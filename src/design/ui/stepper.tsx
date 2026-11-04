import React, { type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cx } from './cx';

export type StepperStepState = 'current' | 'complete' | 'upcoming' | 'locked';

export interface StepperStep {
  label: ReactNode;
  state: StepperStepState;
  reason?: ReactNode;
}

export function Stepper({ steps, onSelect, label, className }: {
  steps: StepperStep[];
  onSelect?: (index: number) => void;
  label?: string;
  className?: string;
}) {
  if (steps.length > 5) {
    const currentIndex = Math.max(0, steps.findIndex(step => step.state === 'current'));
    const done = steps.filter(step => step.state === 'complete').length;
    return (
      <nav aria-label={label} className={className}>
        <p className="text-customer-caption text-customer-text-secondary">
          {currentIndex + 1} / {steps.length} · {steps[currentIndex]?.label}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-customer-fill-disabled" role="presentation">
          <div className="h-full rounded-full bg-customer-brand" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </nav>
    );
  }
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const clickable = step.state === 'complete' && Boolean(onSelect);
          const node = (
            <span
              className={cx(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-customer-caption font-semibold',
                step.state === 'current' && 'bg-customer-brand text-customer-text-inverse',
                step.state === 'complete' && 'bg-customer-brand-subtle text-customer-brand-text',
                step.state === 'upcoming' && 'border border-customer-border-strong text-customer-text-tertiary',
                step.state === 'locked' && 'border border-customer-border-strong text-customer-text-disabled',
              )}
            >
              {step.state === 'complete' ? <Check size={16} aria-hidden="true" /> : index + 1}
            </span>
          );
          const caption = (
            <>
              <span className={cx('mt-1.5 text-customer-caption leading-4', step.state === 'current' ? 'font-semibold text-customer-text' : 'text-customer-text-tertiary')}>
                {step.label}
              </span>
              {step.state === 'locked' && step.reason ? <span className="mt-0.5 text-customer-caption leading-4 text-customer-text-disabled">{step.reason}</span> : null}
            </>
          );
          return (
            <React.Fragment key={index}>
              {index > 0 ? (
                <li aria-hidden="true" className={cx('mx-2 mt-3.5 h-px min-w-3 flex-1', steps[index - 1].state === 'complete' ? 'bg-customer-brand' : 'bg-customer-border')} />
              ) : null}
              <li className="flex min-w-0 flex-col items-center">
                {clickable ? (
                  <button type="button" onClick={() => onSelect?.(index)} className="flex min-h-11 flex-col items-center rounded-customer-chip px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-customer-brand">
                    {node}
                    {caption}
                  </button>
                ) : (
                  <div
                    aria-current={step.state === 'current' ? 'step' : undefined}
                    aria-disabled={step.state === 'locked' ? true : undefined}
                    className="flex min-h-11 flex-col items-center px-1"
                  >
                    {node}
                    {caption}
                  </div>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export interface TimelineItem {
  title: ReactNode;
  time?: ReactNode;
  detail?: ReactNode;
  state?: 'complete' | 'upcoming';
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cx('space-y-4', className)}>
      {items.map((item, index) => {
        const complete = item.state === 'complete';
        const last = index === items.length - 1;
        return (
          <li key={index} className="relative pl-6">
            {!last ? <span aria-hidden="true" className={cx('absolute left-[5px] top-4 h-[calc(100%-8px)] border-l-2', complete ? 'border-customer-border' : 'border-dashed border-customer-border')} /> : null}
            <span aria-hidden="true" className={cx('absolute left-0 top-1.5 size-3 rounded-full', complete ? 'bg-customer-brand' : 'border-2 border-customer-border-strong bg-customer-card')} />
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 break-words text-customer-body-strong">{item.title}</p>
              {item.time ? <p className="shrink-0 text-customer-caption tabular-nums text-customer-text-tertiary">{item.time}</p> : null}
            </div>
            {item.detail ? <div className="mt-1.5 rounded-customer-inset bg-customer-inset p-3 text-customer-caption text-customer-text-secondary">{item.detail}</div> : null}
          </li>
        );
      })}
    </ol>
  );
}
