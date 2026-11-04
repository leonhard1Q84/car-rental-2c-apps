import React, { useContext, useRef, useState } from 'react';
import { AppView } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { CheckCircle, Lock, X } from 'lucide-react';
import TripRatingScale from './TripRatingScale';
import { COMMENT_MAX_LENGTH, commentLength, limitRatingComment, tripRatingIssues, type TripRatingIssue } from './tripRatingFeedback';

interface TripEndedScreenProps {
  setView: (view: AppView) => void;
}

const TripEndedScreen: React.FC<TripEndedScreenProps> = ({ setView }) => {
  const { t } = useContext(LanguageContext);

  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [otherTruncated, setOtherTruncated] = useState(false);
  const [isOtherComposing, setIsOtherComposing] = useState(false);
  const otherComposing = useRef(false);
  const updateOtherReason = (value: string) => {
    const limited = limitRatingComment(value);
    setOtherReason(limited.value);
    setOtherTruncated(limited.truncated);
  };
  const [issues, setIssues] = useState<TripRatingIssue[]>([]);
  const [commentTruncated, setCommentTruncated] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const composing = useRef(false);
  const hasOtherIssue = issues.includes('other');
  const updateComment = (value: string) => {
    const limited = limitRatingComment(value);
    setComment(limited.value);
    setCommentTruncated(limited.truncated);
  };
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingCard, setShowRatingCard] = useState(true);

  const handleSubmitRating = () => {
    if (isSubmitting || composing.current || (hasOtherIssue && (otherComposing.current || commentLength(otherReason) > COMMENT_MAX_LENGTH)) || commentLength(comment) > COMMENT_MAX_LENGTH || ratingScore === null || !Number.isInteger(ratingScore) || ratingScore < 1 || ratingScore > 5) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-primary p-4 flex items-center justify-center shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-white">{t('myRentalTitle')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center p-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm border border-primary/20 flex flex-col items-center mb-4 mt-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm -mt-10">
              <CheckCircle className="text-primary w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{t('tripEndedTitle')}</h2>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed text-center">{t('tripEndedMessage')}</p>

            <div className="flex items-center justify-center text-gray-400 text-xs bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 w-full mb-2">
              <Lock size={12} className="mr-1.5" />
              {t('digitalKeyDisabled')}
            </div>
          </div>

          {showRatingCard && (
            <div className="bg-gradient-to-br from-primary/10 to-white rounded-2xl shadow-sm p-5 w-full max-w-sm mb-6 border border-primary/20 relative">
              {!submitted ? (
                <div className="flex flex-col animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setShowRatingCard(false)}
                    className="absolute right-0 top-0 flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                    aria-label={t('tripRatingDismiss')}
                  >
                    <X size={18} />
                  </button>

                  <h3 id="trip-rating-question" className="font-bold text-gray-900 mb-1.5 pr-7 leading-snug">{t('tripRatingTitle')}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-600">{t('tripRatingHint')}</p>

                  <TripRatingScale score={ratingScore} disabled={isSubmitting} onChange={setRatingScore} />

                  {ratingScore !== null && (
                    <div className="animate-fade-in">
                      <fieldset disabled={isSubmitting} className="mb-5 min-w-0">
                        <legend className="mb-2 text-sm font-semibold text-gray-700">{t('tripRatingIssuesLabel')}</legend>
                        <div className="space-y-2">
                          {tripRatingIssues.map(issue => (
                            <label key={issue.code} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 focus-within:ring-2 focus-within:ring-primary">
                              <input
                                type="checkbox"
                                value={issue.code}
                                checked={issues.includes(issue.code)}
                                onChange={event => {
                                  const checked = event.target.checked;
                                  if (issue.code === 'other' && !checked) {
                                    otherComposing.current = false;
                                    setIsOtherComposing(false);
                                    updateOtherReason(otherReason);
                                  }
                                  setIssues(current => checked
                                    ? [...current, issue.code] : current.filter(code => code !== issue.code));
                                }}
                                className="h-5 w-5 shrink-0 accent-primary"
                              />
                              <span className="min-w-0 break-words">{t(issue.label)}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {hasOtherIssue && (
                        <div>
                          <label htmlFor="trip-rating-other-reason" className="block text-sm font-semibold text-gray-700 mb-2">
                            {t('tripRatingOtherCommentLabel')}
                          </label>
                          <textarea
                            id="trip-rating-other-reason"
                            value={otherReason}
                            disabled={isSubmitting}
                            onCompositionStart={() => { otherComposing.current = true; setIsOtherComposing(true); }}
                            onCompositionEnd={event => {
                              otherComposing.current = false;
                              setIsOtherComposing(false);
                              updateOtherReason(event.currentTarget.value);
                            }}
                            onChange={event => otherComposing.current ? setOtherReason(event.target.value) : updateOtherReason(event.target.value)}
                            aria-describedby="trip-rating-other-count trip-rating-other-limit"
                            placeholder={t('tripRatingOtherCommentPlaceholder')}
                            className="w-full text-sm p-3 border border-primary/20 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-white mb-2 outline-none resize-none"
                            rows={3}
                          />
                          <div id="trip-rating-other-count" className="text-right text-xs text-gray-500 mb-3">
                            {commentLength(otherReason)}/{COMMENT_MAX_LENGTH}
                          </div>
                          <p id="trip-rating-other-limit" role="status" className={otherTruncated ? "mb-3 text-xs text-gray-600" : "sr-only"}>
                            {otherTruncated ? t('tripRatingCommentLimit') : null}
                          </p>
                        </div>
                      )}
                      <label htmlFor="trip-rating-comment" className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('tripRatingCommentLabel')}
                      </label>
                      <textarea
                        id="trip-rating-comment"
                        value={comment}
                        disabled={isSubmitting}
                        onCompositionStart={() => { composing.current = true; setIsComposing(true); }}
                        onCompositionEnd={event => {
                          composing.current = false;
                          setIsComposing(false);
                          updateComment(event.currentTarget.value);
                        }}
                        onChange={event => composing.current ? setComment(event.target.value) : updateComment(event.target.value)}
                        aria-describedby="trip-rating-count trip-rating-limit"
                        placeholder={t('tripRatingCommentPlaceholder')}
                        className="w-full text-sm p-3 border border-primary/20 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-white mb-2 outline-none resize-none"
                        rows={4}
                      />
                      <div id="trip-rating-count" className="text-right text-xs text-gray-500 mb-3">
                        {commentLength(comment)}/{COMMENT_MAX_LENGTH}
                      </div>
                      <p id="trip-rating-limit" role="status" className={commentTruncated ? "mb-3 text-xs text-gray-600" : "sr-only"}>
                        {commentTruncated ? t('tripRatingCommentLimit') : null}
                      </p>

                      <button
                        type="button"
                        onClick={handleSubmitRating}
                        disabled={isSubmitting || isComposing || (hasOtherIssue && isOtherComposing)}
                        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-dark transition-transform active:scale-[0.98] flex justify-center items-center disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          t('tripRatingSubmit')
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 py-8 animate-fade-in text-center">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t('tripRatingSubmittedTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('tripRatingSubmittedBody')}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setView(AppView.OVERVIEW)}
            className="w-full max-w-sm bg-white border border-gray-300 text-gray-700 font-bold py-3.5 px-4 rounded-xl hover:border-primary hover:text-primary hover:bg-primary/10 active:scale-[0.98] transition-all text-sm mb-8"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripEndedScreen;
