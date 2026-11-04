import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

const SATISFACTION_LABEL_KEYS = [
  'tripRatingVeryDissatisfied',
  'tripRatingDissatisfied',
  'tripRatingNeutral',
  'tripRatingSatisfied',
  'tripRatingVerySatisfied',
] as const;

interface TripRatingScaleProps {
  score: number | null;
  disabled: boolean;
  onChange: (score: number) => void;
}

const TripRatingScale: React.FC<TripRatingScaleProps> = ({ score, disabled, onChange }) => {
  const { t } = useContext(LanguageContext);
  const formatScore = (template: string, value: number, label: string) =>
    template.replace('{score}', String(value)).replace('{label}', label);

  return (
    <div className="mb-4">
      <div role="group" aria-labelledby="trip-rating-question" className="grid grid-cols-5 items-start gap-1.5">
        {SATISFACTION_LABEL_KEYS.map((key, index) => {
          const value = index + 1;
          const isSelected = score === value;
          const label = t(key);
          return (
            <div key={key} className="min-w-0 text-center">
              <button
                type="button"
                onClick={() => onChange(value)}
                aria-label={formatScore(t('tripRatingOptionLabel'), value, label)}
                aria-pressed={isSelected}
                disabled={disabled}
                className={`min-h-11 min-w-11 w-full rounded-full border text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${isSelected
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-primary/20 bg-white/90 text-gray-700 hover:border-primary/60'
                }`}
              >
                {value}
              </button>
              <p aria-hidden="true" className={`mt-2 min-h-8 break-words text-xs leading-4 ${isSelected
                ? 'font-bold text-primary-dark'
                : `${index === 0 || index === 4 ? 'font-semibold' : 'font-medium'} text-gray-600`
              }`}>{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripRatingScale;
