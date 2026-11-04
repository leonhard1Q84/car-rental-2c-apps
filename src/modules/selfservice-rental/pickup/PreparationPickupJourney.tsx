import React, { useContext, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { preparationContractSigned } from '../../../app/customer-journey/servicePresentation';
import type { PreparationDraft } from '../../../app/customer-journey/model';
import { useInspectionReview } from './inspection/useInspectionReview';
import { loadInspectionReview, type InspectionReviewState } from './inspection/reviewStatus';
import { PreparationInspectionPage } from './inspection/PreparationInspectionPage';
import { PreparationContractPage } from './PreparationContractPage';
import { pickupJourneyState } from './pickupJourneyState';

export function PreparationPickupSteps({ current, confirmed, signed, busy, onSelect }: { current: 1 | 2; confirmed: boolean; signed: boolean; busy?: boolean; onSelect: (step: 1 | 2) => void }) {
  const { t } = useContext(LanguageContext);
  return <nav aria-label={t('prepPickupSteps')} className="sticky z-10 -mx-4 border-b border-customer-border bg-customer-page px-4 py-3" style={{ top: 'var(--prep-sticky-height, 64px)' }}>
    <ol className="flex items-center">{([1, 2] as const).map((step, index) => {
      const complete = step === 1 ? confirmed : signed;
      return <React.Fragment key={step}>{index > 0 && <li aria-hidden="true" className="mx-2 h-px flex-1 bg-customer-border" />}<li className="min-w-0">
        <button type="button" disabled={busy} aria-current={current === step ? 'step' : undefined} aria-disabled={step === 2 && !confirmed && !signed ? true : undefined} onClick={() => onSelect(step)} className="flex min-h-11 items-center gap-2 text-customer-label disabled:text-customer-text-disabled">
          <span data-step-number={step} className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' + (complete ? 'bg-customer-brand-subtle text-customer-brand-text' : current === step ? 'bg-customer-brand text-customer-text-inverse' : 'border border-customer-border-strong text-customer-text-tertiary')}>{complete ? <Check size={17} aria-hidden="true" /> : step}</span>
          <span className={complete ? 'text-customer-brand-text' : current === step ? 'text-customer-text' : 'text-customer-text-tertiary'}>{t(step === 1 ? 'prepOnlineInspection' : 'prepPickupSignContract')}</span>
        </button>
      </li></React.Fragment>;
    })}</ol>
  </nav>;
}

type Props = { draft: PreparationDraft; disabled?: boolean; onTermsChange: (patch: Partial<PreparationDraft>) => void; termsSaving: boolean; termsSaveError: boolean; onTermsRetry: () => void; onBack: () => void; onSaved: () => void; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void };
export const PreparationPickupJourney: React.FC<Props> = (props) => {
  const { t } = useContext(LanguageContext);
  const review = useInspectionReview(props.draft.orderId);
  const signed = preparationContractSigned(props.draft);
  const [selected, setSelected] = useState<1 | 2 | null>(null);
  const [contractOpened, setContractOpened] = useState(false);
  const [localSigned, setLocalSigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(false);
  const [previousRevision, setPreviousRevision] = useState<string>();
  const state: InspectionReviewState = review.state;
  const complete = signed || localSigned;
  const { confirmed, canSign, current, changed } = pickupJourneyState(state, complete, selected, previousRevision);
  useEffect(() => {
    if (state.status === 'ready' && confirmed) setPreviousRevision(state.snapshot.revision);
    if (canSign) setContractOpened(true);
  }, [state, confirmed, canSign]);
  const setWorking = (value: boolean) => { setBusy(value); props.onBusy(value); };
  const select = (next: 1 | 2) => {
    if (busy || props.disabled) return;
    if (next === 2 && !canSign) { setHint(true); return; }
    setHint(false); setSelected(next); window.scrollTo(0, 0);
  };
  async function advance() {
    const latest = await loadInspectionReview(props.draft.orderId);
    if (latest.status !== 'ready' || !latest.confirmation) throw new Error('INSPECTION_NOT_CONFIRMED');
    review.retry(); setContractOpened(true); setSelected(2); setHint(false); window.scrollTo(0, 0);
  }
  return <>
    <PreparationPickupSteps current={current} confirmed={confirmed || complete} signed={complete} busy={busy || props.disabled} onSelect={select} />
    {(hint || changed) && <p role="status" className="border-l-2 border-customer-brand pl-3 text-customer-body text-customer-brand-text">{t(changed ? 'prepPickupPhotosChanged' : 'prepPickupInspectionRequired')}</p>}
    {current === 1 && <div className="space-y-5"><PreparationInspectionPage orderId={props.draft.orderId} onBack={props.onBack} onContract={() => { void advance().catch(() => { setHint(true); review.retry(); }); }} onConfirmed={advance} onBusy={setWorking} sequential /></div>}
    <div hidden={current !== 2} inert={current !== 2} className={current === 2 ? 'space-y-5' : 'hidden'}>
      {(contractOpened || current === 2) && <PreparationContractPage draft={props.draft} active={current === 2} onTermsChange={props.onTermsChange} termsSaving={props.termsSaving} termsSaveError={props.termsSaveError} onTermsRetry={props.onTermsRetry} onBack={props.onBack} onSaved={props.onSaved} onDirty={props.onDirty} onBusy={setWorking} onSigned={() => { setLocalSigned(true); props.onDirty(false); }} onCompleteService={() => select(1)} />}
    </div>
  </>;
}
