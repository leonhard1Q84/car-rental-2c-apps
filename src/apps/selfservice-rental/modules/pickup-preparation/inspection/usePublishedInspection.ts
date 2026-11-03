import { useEffect, useState } from 'react';
import { loadPublishedInspection } from './fixtures';
import { assertInspectionOwnership, type InspectionLoadState } from './model';
import { customerInspectionPublicationChannelName } from '@shared/services/customerInspectionPublicationStorage';

export function usePublishedInspection(orderId: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<InspectionLoadState>({ status: 'loading', orderId });
  useEffect(() => {
    let active = true;
    setState(current => current.orderId === orderId && current.status === 'ready' ? current : { status: 'loading', orderId });
    loadPublishedInspection(orderId).then(snapshot => {
      if (!active) return;
      if (!snapshot) { setState({ status: 'empty', orderId }); return; }
      assertInspectionOwnership(snapshot, orderId);
      setState({ status: 'ready', orderId, snapshot });
    }).catch(() => { if (active) setState(current => current.status === 'ready' && current.orderId === orderId ? { ...current, refreshError: true } : { status: 'error', orderId }); });
    return () => { active = false; };
  }, [orderId, attempt]);
  useEffect(() => {
    const reload = () => {
      setAttempt(value => value + 1);
    };
    const changed = (event: StorageEvent) => {
      if (event.key === null || event.key === `ix-rental:customer-inspection:${orderId}`) {
        reload();
      }
    };
    window.addEventListener('storage', changed);
    const handleFocus = () => reload();
    const handleVisibility = () => { if (document.visibilityState === 'visible') reload(); };
    const poll = window.setInterval(handleVisibility, 5000);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(customerInspectionPublicationChannelName);
    const handlePublication = (event: MessageEvent<{ orderId?: string }>) => {
      if (event.data?.orderId === orderId) reload();
    };
    channel?.addEventListener('message', handlePublication);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('storage', changed);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      channel?.removeEventListener('message', handlePublication);
      channel?.close();
    };
  }, [orderId]);
  return {
    state: state.orderId === orderId ? state : { status: 'loading' as const, orderId },
    retry: () => { setState({ status: 'loading', orderId }); setAttempt(value => value + 1); },
  };
}
