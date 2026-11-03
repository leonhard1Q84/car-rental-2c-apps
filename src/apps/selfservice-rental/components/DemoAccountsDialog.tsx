import React, { useContext, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DEMO_ACCOUNTS, MockDemoScenario } from '../mockAccounts';
import type { TranslationKeys } from '../translations';

interface DemoAccountsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCENARIO_TRANSLATION_KEYS: Record<MockDemoScenario, TranslationKeys> = {
  NORMAL_FLOW: 'demoAccountsScenarioNormal',
  CANCELLED: 'demoAccountsScenarioCancelled',
  REGULAR_RENTAL: 'demoAccountsScenarioRegular',
  NOT_ELIGIBLE: 'demoAccountsScenarioNotEligible',
  CHECKIN_NOT_STARTED: 'demoAccountsScenarioCheckinNotStarted',
  CHECKIN_PENDING: 'demoAccountsScenarioCheckinPending',
  CHECKIN_REJECTED: 'demoAccountsScenarioCheckinRejected',
  INSPECTION_READY: 'demoAccountsScenarioInspectionReady',
  CONTRACT_READY: 'demoAccountsScenarioContractReady',
  RETURN_READY: 'demoAccountsScenarioReturnReady',
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const DemoAccountsDialog: React.FC<DemoAccountsDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useContext(LanguageContext);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ) as HTMLElement[];
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      if (!firstFocusableElement || !lastFocusableElement) return;

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-accounts-title"
        aria-describedby="demo-accounts-description"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="demo-accounts-title" className="text-lg font-bold text-gray-900">
              {t('demoAccountsTitle')}
            </h2>
            <p id="demo-accounts-description" className="mt-1 text-sm leading-relaxed text-gray-600">
              {t('demoAccountsDescription')}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('demoAccountsClose')}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-3 md:hidden">
            {DEMO_ACCOUNTS.map((demoAccount) => (
              <article key={demoAccount.orderNo} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <code className="rounded-md bg-white px-2 py-1 text-sm font-bold text-gray-900 ring-1 ring-gray-200">
                    {demoAccount.orderNo}
                  </code>
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <span>{t('demoAccountsLastName')}</span>
                    <strong className="font-semibold text-gray-900">{demoAccount.lastName}</strong>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {t(SCENARIO_TRANSLATION_KEYS[demoAccount.scenario])}
                </p>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th scope="col" className="w-1/4 px-4 py-3">{t('demoAccountsOrderNumber')}</th>
                  <th scope="col" className="w-1/5 px-4 py-3">{t('demoAccountsLastName')}</th>
                  <th scope="col" className="px-4 py-3">{t('demoAccountsScenario')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {DEMO_ACCOUNTS.map((demoAccount) => (
                  <tr key={demoAccount.orderNo}>
                    <td className="px-4 py-3 align-top">
                      <code className="text-sm font-bold text-gray-900">{demoAccount.orderNo}</code>
                    </td>
                    <td className="px-4 py-3 align-top text-sm font-medium text-gray-800">{demoAccount.lastName}</td>
                    <td className="px-4 py-3 text-sm leading-relaxed text-gray-700">
                      {t(SCENARIO_TRANSLATION_KEYS[demoAccount.scenario])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-auto sm:w-auto sm:min-w-28"
          >
            {t('demoAccountsClose')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DemoAccountsDialog;
