import { useEffect, useRef, useState } from 'react';
import type { RenewalStage } from './model';

type RenewalView = { page: 'flow'; stage?: RenewalStage } | { page: 'history' } | { page: 'record'; id: string };

/** Keep renewal pages in the existing app URL and preserve the outer journey's history state. */
export function useRenewalNavigation(orderId: string, stage: RenewalStage, restoreStage: (stage: RenewalStage) => RenewalStage) {
  const read = (): RenewalView => {
    const saved = typeof window !== 'undefined' ? window.history.state?.renewalView : null;
    return saved?.orderId === orderId ? saved.view : { page: 'flow' };
  };
  const [view, setView] = useState<RenewalView>(read);
  const restore = useRef(restoreStage);
  restore.current = restoreStage;
  const previousStage = useRef(stage);
  const returnFocus = useRef<HTMLElement | null>(null);
  const scroll = useRef(0);
  const save = (next: RenewalView, push = false) => window.history[push ? 'pushState' : 'replaceState']({ ...window.history.state, renewalView: { orderId, view: next } }, '');

  useEffect(() => {
    if (!window.history.state?.renewalView) save({ page: 'flow', stage });
    const pop = () => {
      const next = read();
      if (next.page === 'flow' && next.stage) {
        const actual = restore.current(next.stage);
        previousStage.current = actual;
        if (actual !== next.stage) save({ page: 'flow', stage: actual });
      }
      setView(next);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [orderId]);

  useEffect(() => {
    const previous = previousStage.current;
    previousStage.current = stage;
    if (view.page !== 'flow') return;
    // Date and quote are reversible screens. Submitted progress replaces the current screen.
    const push = (previous === 'conditions' && stage === 'detail') || (previous === 'status' && stage === 'conditions') || (previous === 'processing' && stage === 'payment');
    save({ page: 'flow', stage }, push);
  }, [stage, view.page]);

  useEffect(() => {
    if (view.page === 'flow') {
      window.scrollTo(0, scroll.current);
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    } else {
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>('[data-renewal-title]')?.focus();
    }
  }, [view.page, view.page === 'record' ? view.id : null]);

  function push(next: RenewalView) {
    if (view.page === 'flow') { scroll.current = window.scrollY; returnFocus.current = document.activeElement as HTMLElement; }
    save(next, true); setView(next);
  }
  function replace(next: RenewalView) {
    save(next, false); setView(next);
  }
  return {
    view,
    landHistory: () => replace({ page: 'history' }),
    openFlow: (stage: RenewalStage) => push({ page: 'flow', stage }),
    openRecord: (id: string) => push({ page: 'record', id }),
    back: () => window.history.back(),
  };
}
