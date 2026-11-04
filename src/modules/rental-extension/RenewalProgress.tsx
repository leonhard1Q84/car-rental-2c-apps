import { useContext } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';

/** Summarize facts in business order: reserve, pay, activate. */
export function RenewalProgress({ reserved, paid, effective, paymentProcessing = false }: {
  reserved: boolean; paid: boolean; effective: boolean; paymentProcessing?: boolean;
}) {
  const { t } = useContext(LanguageContext);
  const steps = [
    { label: t('renewStepAllocateVehicle'), done: reserved, active: !reserved },
    { label: t(paid ? 'renewStepPaymentAccepted' : 'renewStepConfirmPayment'), done: paid, active: paymentProcessing },
    { label: t('renewStepAgreementEffective'), done: effective, active: paid && !effective },
  ];
  return <ol className="flex items-start justify-between gap-2 pt-2">
    {steps.map((step, index) => <li key={index} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {index > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-3.5 h-px w-full transition-colors duration-500 ${steps[index - 1].done ? 'bg-customer-success-border' : 'bg-customer-border'}`} />}
      <span aria-hidden="true" className={`relative flex size-7 items-center justify-center rounded-full border transition-all duration-300 ${step.done ? 'border-customer-success-border bg-customer-success-subtle text-customer-success-text' : step.active ? 'border-customer-brand bg-customer-brand text-customer-text-inverse' : 'border-customer-border bg-customer-card text-customer-text-tertiary'}`}>
        {step.done ? <Check size={16} className="motion-safe:animate-pop-in" /> : step.active ? <Loader2 size={16} className="motion-safe:animate-spin" /> : index + 1}
      </span>
      <span className={`text-customer-caption transition-colors duration-300 ${step.done || step.active ? 'text-customer-text' : 'text-customer-text-secondary'}`}>{step.label}</span>
    </li>)}
  </ol>;
}
