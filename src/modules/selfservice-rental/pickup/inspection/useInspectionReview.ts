import { customerInspectionPublicationChannelName } from '@shared/services/customerInspectionPublicationStorage';
import { useCallback, useEffect, useState } from 'react';
import { loadInspectionReview, type InspectionReviewState } from './reviewStatus';

export function useInspectionReview(orderId: string) {
  const [state, setState] = useState<InspectionReviewState>({ status: 'loading', orderId });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState({ status: 'loading', orderId });
    setAttempt(value => value + 1);
  }, [orderId]);
  useEffect(() => {
    let active = true;
    let request = 0;
    const refresh = async () => {
      const id = ++request;
      setState(current => current.orderId === orderId && current.status === 'ready' ? current : { status: 'loading', orderId });
      try {
        const next = await loadInspectionReview(orderId);
        if (active && request === id) setState(next);
      } catch { if (active && request === id) setState(current => current.status === 'ready' && current.orderId === orderId && current.confirmation ? current : { status: 'error', orderId }); }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === `ix-rental:customer-inspection:${orderId}`) void refresh();
    };
    const onFocus = () => { void refresh(); };
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(customerInspectionPublicationChannelName);
    const onPublication = (event: MessageEvent<{ orderId?: string }>) => { if (event.data?.orderId === orderId) void refresh(); };
    channel?.addEventListener('message', onPublication);
    void refresh();
    const poll = window.setInterval(onVisible, 5000);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(poll);
      channel?.removeEventListener('message', onPublication);
      channel?.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [orderId, attempt]);
  return { state: state.orderId === orderId ? state : { status: 'loading' as const, orderId }, retry };
}
