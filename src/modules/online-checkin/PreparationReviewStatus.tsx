import React, { useContext, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, FileCheck2, X } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { preparationReviewIssues } from './review';
import type { PreparationDraft } from '../../app/customer-journey/model';
import { Button } from '../../design/ui';

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

export function PreparationReviewDialog({ draft, onClose }: { draft: PreparationDraft; onClose: () => void }) {
  const { t } = useContext(LanguageContext);
  const ref = useRef<HTMLDialogElement>(null);
  const issues = preparationReviewIssues(draft.documentReview);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="prep-review-dialog-title"
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100vw_-_48px)] max-w-[360px] overflow-y-auto rounded-customer-card bg-customer-card p-5 text-customer-text shadow-customer-overlay backdrop:bg-customer-scrim"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="prep-review-dialog-title" className="flex items-center gap-2 text-customer-title font-bold text-customer-danger-text">
          <AlertCircle size={20} className="shrink-0" />
          {t('prepReviewRejected')}
        </h2>
        <button type="button" onClick={onClose} aria-label={t('prepBack')} className="flex h-8 w-8 items-center justify-center rounded-full text-customer-text-tertiary hover:bg-customer-inset">
          <X size={18} />
        </button>
      </div>

      {issues.length > 0 && (
        <div className="mt-4 text-customer-body">
          <p className="font-semibold text-customer-text">{t('prepReviewItems')}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-customer-text-secondary text-customer-caption">
            {issues.map(issue => (
              <li key={issue.type} className="break-words">{t(issue.label)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 text-customer-body">
        <p className="font-semibold text-customer-text">{t('prepReviewReason')}</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-customer-caption text-customer-danger-text">
          {draft.documentReview?.rejectionReason?.trim() || t(draft.documentReview?.rejectionReasonKey ?? 'prepReviewMissingReason')}
        </p>
      </div>

      <p className="mt-3 text-customer-caption text-customer-text-tertiary leading-relaxed">
        {t('prepReviewHint')}
      </p>

      <div className="mt-5 flex justify-end">
        <Button autoFocus size="md" onClick={onClose} className="w-full">
          {t('prepInspectionIssueAcknowledge')}
        </Button>
      </div>
    </dialog>
  );
}

export function PreparationReviewCompactNotice({ draft, onClick }: { draft: PreparationDraft; onClick: () => void }) {
  const { t } = useContext(LanguageContext);
  const rejected = draft.documentReview?.state === 'REJECTED';
  if (!rejected) return null;
  const reason = draft.documentReview?.rejectionReason?.trim() || t(draft.documentReview?.rejectionReasonKey ?? 'prepReviewMissingReason');
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="flex min-h-10 items-center justify-between gap-2 rounded-customer-inset border border-customer-danger-border bg-customer-danger-subtle px-3 py-2 text-customer-caption text-customer-danger-text cursor-pointer hover:opacity-95 transition-opacity"
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle size={16} className="shrink-0" />
        <span className="truncate font-medium">{t('prepReviewRejected')}: {reason}</span>
      </div>
      <span className="shrink-0 font-semibold underline underline-offset-2 text-customer-brand-text">
        {t('prepView')} &gt;
      </span>
    </div>
  );
}
