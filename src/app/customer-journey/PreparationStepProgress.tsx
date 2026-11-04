import React, { useContext } from 'react';
import { Check, ClipboardCheck, FileCheck2, Users } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import type { PreparationStepLocks } from './stepLocks';
import { requiredPreparationStep } from './stepAdmission';

const steps = [
  { id: 'booking', title: 'prepNavBooking', icon: ClipboardCheck },
  { id: 'drivers', title: 'prepNavDrivers', icon: Users },
  { id: 'terms', title: 'prepNavTerms', icon: FileCheck2 }
] as const;
type NavigationStep = typeof steps[number]['id'];

interface Props {
  currentStep: NavigationStep;
  completed: PreparationStepLocks;
  onNavigate: (step: NavigationStep) => void;
  disabled?: boolean;
}

export function PreparationStepProgress({ currentStep, completed, onNavigate, disabled }: Props) {
  const { t } = useContext(LanguageContext);
  return <nav aria-label={t('prepStepProgress')} className="rounded-customer-card border border-customer-border bg-customer-card px-1 pt-2">
    <ol className="grid grid-cols-3">
      {steps.map(({ id, title, icon: Icon }, index) => {
        const isCurrent = id === currentStep;
        const isComplete = completed[id];
        const blocked = Boolean(requiredPreparationStep(id, completed));
        const isDisabled = disabled || blocked;
        const tone = isComplete ? 'bg-customer-brand-subtle text-customer-brand-text ring-customer-brand-border'
          : isCurrent ? 'bg-customer-brand text-customer-text-inverse ring-customer-brand-border' : 'bg-customer-card text-customer-text-tertiary ring-customer-border-strong';
        return <li key={id} className="relative min-w-0">
          {index < steps.length - 1 && <span aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-4 h-px w-full ${isComplete && completed[steps[index + 1].id] ? 'bg-customer-brand' : 'bg-customer-border'}`} />}
          <button type="button" aria-current={isCurrent ? 'step' : undefined} disabled={isDisabled}
            onClick={() => { if (!isDisabled) onNavigate(id); }}
            className={`relative flex min-h-[76px] w-full flex-col items-center gap-1 rounded-customer-chip border-b-2 px-1 pb-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-customer-brand ${disabled ? 'cursor-wait' : blocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${isCurrent ? 'border-customer-brand' : 'border-transparent'}`}>
            <span aria-hidden="true" className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${tone}`}>
              {isComplete ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} strokeWidth={1.8} />}
            </span>
            <span className={`min-w-0 text-customer-caption leading-4 [overflow-wrap:anywhere] ${isCurrent ? 'font-semibold text-customer-text' : 'text-customer-text-secondary'}`}>{t(title)}</span>
            <span className={`mt-auto text-customer-caption leading-4 ${isComplete ? 'text-customer-brand-text' : 'text-customer-text-tertiary'}`}>{t(isComplete ? 'prepCompleted' : 'prepTodo')}</span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
}
