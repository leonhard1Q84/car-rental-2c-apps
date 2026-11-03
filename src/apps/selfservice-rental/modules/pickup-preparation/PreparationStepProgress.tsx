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
  return <nav aria-label={t('prepStepProgress')} className="rounded-xl border border-gray-200 bg-white px-1 pt-2">
    <ol className="grid grid-cols-3">
      {steps.map(({ id, title, icon: Icon }, index) => {
        const isCurrent = id === currentStep;
        const isComplete = completed[id];
        const blocked = Boolean(requiredPreparationStep(id, completed));
        const isDisabled = disabled || blocked;
        const tone = isComplete ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : isCurrent ? 'bg-orange-50 text-primary ring-orange-200' : 'bg-gray-100 text-gray-400 ring-gray-200';
        return <li key={id} className="relative min-w-0">
          {index < steps.length - 1 && <span aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-4 h-px w-full ${isComplete && completed[steps[index + 1].id] ? 'bg-emerald-200' : 'bg-gray-200'}`} />}
          <button type="button" aria-current={isCurrent ? 'step' : undefined} disabled={isDisabled}
            onClick={() => { if (!isDisabled) onNavigate(id); }}
            className={`relative flex min-h-[76px] w-full flex-col items-center gap-1 rounded-sm border-b-2 px-1 pb-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${disabled ? 'cursor-wait' : blocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${isCurrent ? 'border-primary' : 'border-transparent'}`}>
            <span aria-hidden="true" className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${tone}`}>
              <Icon size={18} strokeWidth={1.8} />
              {isComplete && <span className="absolute -bottom-0.5 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white"><Check size={10} strokeWidth={3} /></span>}
            </span>
            <span className={`min-w-0 text-xs leading-4 [overflow-wrap:anywhere] ${isCurrent ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{t(title)}</span>
            <span className={`mt-auto text-[11px] leading-4 ${isComplete ? 'text-emerald-700' : 'text-gray-500'}`}>{t(isComplete ? 'prepCompleted' : 'prepTodo')}</span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
}
