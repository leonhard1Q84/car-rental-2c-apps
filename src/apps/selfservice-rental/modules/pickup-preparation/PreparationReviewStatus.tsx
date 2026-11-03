import React, { useContext } from 'react';
import { AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { preparationReviewIssues } from './review';
import type { PreparationDraft } from './model';

interface Props {
  draft: PreparationDraft;
  onEdit?: () => void;
  disabled?: boolean;
}

export function PreparationReviewStatus({ draft, onEdit, disabled }: Props) {
  const { t } = useContext(LanguageContext);
  if (!draft.submittedAt && !draft.correctionStartedAt) return null;
  const rejected = draft.documentReview?.state === 'REJECTED';
  const approved = draft.documentReview?.state === 'APPROVED';
  const issues = preparationReviewIssues(draft.documentReview);
  const Icon = rejected ? AlertCircle : approved ? CheckCircle2 : FileCheck2;
  return <section className={`rounded-xl border p-4 ${rejected ? 'border-red-200 bg-red-50 text-red-900' : approved ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`} role="status">
    <div className="flex items-center gap-2 font-bold"><Icon size={19} className="shrink-0" />{t(rejected ? 'prepReviewRejected' : approved ? 'prepReviewApproved' : 'prepSubmitted')}</div>
    {rejected && <div className="mt-3 text-sm">
      <p className="font-semibold">{t('prepReviewItems')}</p>
      {issues.length > 0 ? <ul className="mt-1 list-disc space-y-1 pl-5">{issues.map(issue =>
        <li key={issue.type} className="text-sm leading-relaxed break-words">{t(issue.label)}</li>
      )}</ul> : <p className="mt-1 leading-relaxed">{t('prepReviewItemsMissing')}</p>}
    </div>}
    {rejected && <div className="mt-3 text-sm"><p className="font-semibold">{t('prepReviewReason')}</p><p className="mt-1 whitespace-pre-wrap break-words">{draft.documentReview?.rejectionReason?.trim() || t(draft.documentReview?.rejectionReasonKey ?? 'prepReviewMissingReason')}</p></div>}
    <p className="mt-2 text-sm leading-relaxed">{t(rejected ? 'prepReviewHint' : approved ? 'prepReviewApprovedHint' : 'prepSubmittedHint')}</p>
    {rejected && onEdit && <button type="button" disabled={disabled} onClick={onEdit}
      className="mt-2 min-h-11 rounded px-1 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{t('prepReviewModify')}</button>}
  </section>;
}
