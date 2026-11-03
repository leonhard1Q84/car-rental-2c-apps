import React, { useContext, useMemo, useState } from 'react';
import { AppView } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { Check, CheckCircle, Copy, Lock, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TripEndedScreenProps {
  setView: (view: AppView) => void;
}

const COMMENT_MAX_LENGTH = 50;
const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeYTC_rsX2y4xc-OuS1smkkvDK86yt7caETAhyrjhpmdTTgDw/viewform';

const TripEndedScreen: React.FC<TripEndedScreenProps> = ({ setView }) => {
  const { t } = useContext(LanguageContext);

  const [copiedFeedbackLink, setCopiedFeedbackLink] = useState(false);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingCard, setShowRatingCard] = useState(true);

  const feedbackLink = useMemo(() => FEEDBACK_URL, []);

  const getScoreSegmentKey = (
    score: number
  ): 'npsSegmentDetractor' | 'npsSegmentPassive' | 'npsSegmentPromoter' => {
    if (score <= 6) return 'npsSegmentDetractor';
    if (score <= 8) return 'npsSegmentPassive';
    return 'npsSegmentPromoter';
  };

  const handleSubmitRating = () => {
    if (!npsScore) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  const handleCopyFeedbackLink = async () => {
    try {
      await navigator.clipboard.writeText(feedbackLink);
      setCopiedFeedbackLink(true);
      window.setTimeout(() => setCopiedFeedbackLink(false), 1800);
    } catch {
      setCopiedFeedbackLink(false);
    }
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
                    className="absolute top-3 right-3 text-primary/50 hover:text-primary transition-colors"
                    aria-label={t('npsDismiss')}
                  >
                    <X size={18} />
                  </button>

                  <h3 className="font-bold text-gray-900 mb-1.5 pr-7 leading-snug">{t('npsQuestion')}</h3>
                  <p className="text-sm text-primary-dark mb-4">{t('npsHint')}</p>

                  <div className="grid grid-cols-10 gap-1.5 mb-7">
                    {Array.from({ length: 10 }, (_, idx) => idx + 1).map((score) => {
                      const isSelected = npsScore === score;
                      const badgePositionClass =
                        score <= 2
                          ? 'left-0 translate-x-0'
                          : score >= 9
                          ? 'left-auto right-0 translate-x-0'
                          : 'left-1/2 -translate-x-1/2';

                      return (
                        <div key={score} className="relative flex justify-center">
                          <button
                            type="button"
                            onClick={() => setNpsScore(score)}
                            className={`h-9 w-full rounded-full border text-sm font-semibold transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white/90 text-gray-700 border-primary/20 hover:border-primary/60'
                            }`}
                          >
                            {score}
                          </button>
                          {isSelected && (
                            <span
                              className={`absolute top-full mt-1.5 whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark border border-primary/20 shadow-sm ${badgePositionClass}`}
                            >
                              {t(getScoreSegmentKey(score))}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{t('npsUnlikely')}</span>
                    <span>{t('npsLikely')}</span>
                  </div>

                  <div
                    className="transition-all duration-300 overflow-hidden"
                    style={{ maxHeight: npsScore ? '280px' : '0', opacity: npsScore ? 1 : 0 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('npsCommentLabel')}
                    </label>
                    <textarea
                      value={comment}
                      maxLength={COMMENT_MAX_LENGTH}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('npsCommentPlaceholder')}
                      className="w-full text-sm p-3 border border-primary/20 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-white mb-2 outline-none resize-none"
                      rows={3}
                    />
                    <div className="text-right text-xs text-gray-400 mb-3">
                      {comment.length}/{COMMENT_MAX_LENGTH}
                    </div>

                    <button
                      onClick={handleSubmitRating}
                      disabled={isSubmitting}
                      className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-dark transition-transform active:scale-[0.98] flex justify-center items-center disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        t('npsSubmit')
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 py-8 animate-fade-in text-center">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t('npsSubmittedTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('npsSubmittedBody')}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-3 w-full max-w-sm border border-gray-200 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl border border-primary/20 bg-white p-1.5 flex-shrink-0">
                <QRCodeSVG
                  value={feedbackLink}
                  size={68}
                  level="M"
                  fgColor="#111111"
                  bgColor="#FFFFFF"
                  includeMargin={false}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center text-xs font-semibold text-primary mb-1">
                  <QrCode size={13} className="mr-1.5 flex-shrink-0" />
                  <span>{t('feedbackQrTag')}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{t('feedbackQrTitle')}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-snug">{t('feedbackQrBody')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyFeedbackLink}
              className="mt-3 flex w-full items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
            >
              {copiedFeedbackLink ? <Check size={15} className="mr-2" /> : <Copy size={15} className="mr-2" />}
              {copiedFeedbackLink ? t('feedbackQrCopied') : t('feedbackQrCopyLink')}
            </button>
          </div>

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
