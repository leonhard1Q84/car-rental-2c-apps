import React, { useContext, useState } from 'react';
import { X, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';

export interface CoverageDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  brandName?: string;
  dailyRate?: number;
  currency?: string;
}

export function CoverageDetailsDrawer({
  open,
  onClose,
  brandName = 'IX RENTAL',
  dailyRate = 1000,
  currency = 'JPY',
}: CoverageDetailsDrawerProps) {
  const { t, lang } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<'items' | 'conditions' | 'exclusions'>('items');
  const [showDeductibleTip, setShowDeductibleTip] = useState(false);

  if (!open) return null;

  const formattedRate = new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: currency || 'JPY',
    maximumFractionDigits: 2,
  }).format(dailyRate);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center overflow-y-auto"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coverage-drawer-title"
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-customer-border overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-customer-border-subtle bg-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="coverage-drawer-title" className="text-customer-title font-bold text-customer-text">
                {t('renewCoverageDrawerTitle')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="size-3 stroke-[2.5]" />
                {t('renewCoverageCurrentPlan')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-customer-text-tertiary hover:text-customer-text hover:bg-customer-inset transition-colors cursor-pointer"
              aria-label={t('renewCoverageClose')}
            >
              <X className="size-5" />
            </button>
          </div>
          <p className="text-customer-caption text-customer-text-tertiary mt-1.5">
            {t('renewCoverageProvidedBy').replace('{brand}', brandName)}
          </p>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 mt-3.5">
            <div className="p-2.5 rounded-customer-inset bg-customer-inset border border-customer-border-subtle text-center">
              <span className="block text-[11px] text-customer-text-tertiary truncate">
                {t('renewCoverageDeductible')}
              </span>
              <span className="block text-xs font-bold text-customer-text mt-1">
                {t('renewCoverageNotIncluded')}
              </span>
            </div>
            <div className="p-2.5 rounded-customer-inset bg-customer-inset border border-customer-border-subtle text-center">
              <span className="block text-[11px] text-customer-text-tertiary truncate">
                {t('renewCoverageNoc')}
              </span>
              <span className="block text-xs font-bold text-customer-text mt-1">
                {t('renewCoverageNotIncluded')}
              </span>
            </div>
            <div className="p-2.5 rounded-customer-inset bg-customer-inset border border-customer-border-subtle text-center">
              <span className="block text-[11px] text-customer-text-tertiary truncate">
                {t('renewCoverageThirdParty')}
              </span>
              <span className="block text-xs font-bold text-customer-text mt-1">
                {t('renewCoverageNotIncluded')}
              </span>
            </div>
          </div>

          {/* 3 Tabs */}
          <div className="flex border-b border-customer-border-subtle mt-4 -mb-4 sm:-mb-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'items'
                  ? 'border-customer-danger text-customer-danger font-bold'
                  : 'border-transparent text-customer-text-secondary hover:text-customer-text'
              }`}
            >
              {t('renewCoverageTabItems')} (2)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('conditions')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'conditions'
                  ? 'border-customer-danger text-customer-danger font-bold'
                  : 'border-transparent text-customer-text-secondary hover:text-customer-text'
              }`}
            >
              {t('renewCoverageTabConditions')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exclusions')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'exclusions'
                  ? 'border-customer-danger text-customer-danger font-bold'
                  : 'border-transparent text-customer-text-secondary hover:text-customer-text'
              }`}
            >
              {t('renewCoverageTabExclusions')}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
          {activeTab === 'items' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-customer-text-secondary">
                <span className="font-semibold">{t('renewCoverageTabItems')}</span>
                <button
                  type="button"
                  onClick={() => setShowDeductibleTip(!showDeductibleTip)}
                  className="text-customer-danger hover:underline cursor-pointer"
                >
                  {t('renewCoverageWhatIsDeductible')}
                </button>
              </div>

              {showDeductibleTip && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-customer-inset text-[11px] text-amber-900 leading-relaxed">
                  {t('renewCoverageTplDesc')}
                </div>
              )}

              {/* Item 1 */}
              <div className="p-3.5 bg-white border border-customer-border-subtle rounded-customer-inset flex items-start gap-3 shadow-2xs">
                <div className="size-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bold text-customer-text text-xs">{t('renewCoverageCdwTitle')}</h4>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 bg-white border border-customer-border-subtle rounded-customer-inset flex items-start gap-3 shadow-2xs">
                <div className="size-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-customer-text text-xs">{t('renewCoverageTplTitle')}</h4>
                  <p className="text-[11px] text-customer-text-tertiary leading-relaxed">
                    {t('renewCoverageTplDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conditions' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-customer-inset border border-customer-border-subtle rounded-customer-inset space-y-1">
                <h4 className="font-bold text-customer-text text-xs">{t('renewCoverageConditionsTitle')}</h4>
                <p className="text-[11px] text-customer-text-tertiary leading-relaxed">
                  {t('renewCoverageConditionsSub')}
                </p>
              </div>

              <div className="p-3 bg-white border border-customer-border-subtle rounded-customer-inset flex items-start gap-2.5 shadow-2xs">
                <span className="size-5 rounded-full bg-rose-100 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-customer-text leading-relaxed text-xs">{t('renewCoverageCond1')}</p>
              </div>

              <div className="p-3 bg-white border border-customer-border-subtle rounded-customer-inset flex items-start gap-2.5 shadow-2xs">
                <span className="size-5 rounded-full bg-rose-100 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-customer-text leading-relaxed text-xs">{t('renewCoverageCond2')}</p>
              </div>

              <div className="p-3 bg-white border border-customer-border-subtle rounded-customer-inset flex items-start gap-2.5 shadow-2xs">
                <span className="size-5 rounded-full bg-rose-100 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-customer-text leading-relaxed text-xs">{t('renewCoverageCond3')}</p>
              </div>
            </div>
          )}

          {activeTab === 'exclusions' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-customer-inset space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                  <AlertTriangle className="size-4" />
                  <span>{t('renewCoverageExclusionsTitle')}</span>
                </div>
                <p className="text-[11px] text-rose-900 leading-relaxed">
                  {t('renewCoverageExclusionsAlert')}
                </p>
              </div>

              <div className="p-3.5 bg-white border border-customer-border-subtle rounded-customer-inset space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-customer-text text-xs">
                  <span className="size-2 rounded-full bg-rose-500 inline-block" />
                  <span>{t('renewCoverageDriverViolations')}</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-customer-text-secondary space-y-1">
                  <li>{t('renewCoverageExUnauth')}</li>
                  <li>{t('renewCoverageExDui')}</li>
                  <li>{t('renewCoverageExAge')}</li>
                </ul>
              </div>

              <div className="p-3.5 bg-white border border-customer-border-subtle rounded-customer-inset space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-customer-text text-xs">
                  <span className="size-2 rounded-full bg-rose-500 inline-block" />
                  <span>{t('renewCoverageImproperHandling')}</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-customer-text-secondary space-y-1">
                  <li>{t('renewCoverageExNoPolice')}</li>
                  <li>{t('renewCoverageExNoNotice')}</li>
                  <li>{t('renewCoverageExNoConsent')}</li>
                </ul>
              </div>

              <div className="p-3.5 bg-white border border-customer-border-subtle rounded-customer-inset space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-customer-text text-xs">
                  <span className="size-2 rounded-full bg-rose-500 inline-block" />
                  <span>{t('renewCoverageVehicleCustody')}</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-customer-text-secondary space-y-1">
                  <li>{t('renewCoverageExKey')}</li>
                  <li>{t('renewCoverageExFuel')}</li>
                  <li>{t('renewCoverageExSmoking')}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Fixed Bar */}
        <div className="p-3.5 sm:p-4 border-t border-customer-border-subtle bg-white flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-customer-text-tertiary block">
              {t('renewCoverageDrawerTitle')}
            </span>
            <span className="text-xs font-bold text-customer-text">
              +{formattedRate}{t('renewPerDay')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-customer-control border border-customer-border bg-white text-customer-text text-xs font-semibold hover:bg-customer-inset transition-colors cursor-pointer"
            >
              {t('renewCoverageClose')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-customer-control bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="size-3.5 stroke-[2.5]" />
              {t('renewCoverageCurrentPlan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
