import React, { useContext } from 'react';
import { AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { preparationReviewIssues } from './review';
import type { PreparationDraft } from '../../app/customer-journey/model';

interface Props {
  draft: PreparationDraft;
  onEdit?: () => void;
  disabled?: boolean;
}

const tones = {
  rejected: 'border-customer-danger-border bg-customer-danger-subtle text-customer-danger-text',
  approved: 'border-customer-success-border bg-customer-success-subtle text-customer-success-text',
  submitted: 'border-customer-info-border bg-customer-info-subtle text-customer-info-text',
} as const;

export function PreparationReviewStatus({ draft, onEdit, disabled }: Props) {
  const { t } = useContext(LanguageContext);
  if (!draft.submittedAt && !draft.correctionStartedAt) return null;
  const rejected = draft.documentReview?.state === 'REJECTED';
  const approved = draft.documentReview?.state === 'APPROVED';
  const issues = preparationReviewIssues(draft.documentReview);
  const Icon = rejected ? AlertCircle : approved ? CheckCircle2 : FileCheck2;
  return <section className={`rounded-customer-inset border p-4 ${rejected ? tones.rejected : approved ? tones.approved : tones.submitted}`} role="status">
    <div className="flex items-center gap-2 text-customer-body-strong"><Icon size={19} className="shrink-0" />{t(rejected ? 'prepReviewRejected' : approved ? 'prepReviewApproved' : 'prepSubmitted')}</div>
    {rejected && <div className="mt-3 text-customer-body">
      <p className="text-customer-body-strong">{t('prepReviewItems')}</p>
      {issues.length > 0 ? <ul className="mt-1 list-disc space-y-1 pl-5">{issues.map(issue =>
        <li key={issue.type} className="break-words leading-relaxed">{t(issue.label)}</li>
      )}</ul> : <p className="mt-1 leading-relaxed">{t('prepReviewItemsMissing')}</p>}
    </div>}
    {rejected && <div className="mt-3 text-customer-body"><p className="text-customer-body-strong">{t('prepReviewReason')}</p><p className="mt-1 whitespace-pre-wrap break-words">{draft.documentReview?.rejectionReason?.trim() || t(draft.documentReview?.rejectionReasonKey ?? 'prepReviewMissingReason')}</p></div>}
    <p className="mt-2 text-customer-body leading-relaxed">{t(rejected ? 'prepReviewHint' : approved ? 'prepReviewApprovedHint' : 'prepSubmittedHint')}</p>
    {rejected && onEdit && <button type="button" disabled={disabled} onClick={onEdit}
      className="mt-2 min-h-11 rounded px-1 text-customer-body-strong underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-customer-brand disabled:cursor-not-allowed disabled:text-customer-text-disabled">{t('prepReviewModify')}</button>}
  </section>;
}
