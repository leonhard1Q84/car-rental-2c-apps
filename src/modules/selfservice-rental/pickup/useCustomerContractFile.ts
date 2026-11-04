import { useCallback, useEffect, useState } from 'react';
import type { CustomerContractFile } from '@shared/contracts/customerContractFile';
import { loadCustomerContractFileAdapter } from '@shared/services/customerInspectionApi';
import { subscribeCustomerContractFile } from '@shared/services/customerContractFileStorage';

export function useCustomerContractFile(orderId: string) {
  const [file, setFile] = useState<CustomerContractFile | null>(null);
  const [verifiedOrderId, setVerifiedOrderId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let active = true;
    let version = 0;
    const read = async () => {
      const request = ++version;
      setVerifiedOrderId(null);
      setLoadError(false);
      try {
        const value = await loadCustomerContractFileAdapter(orderId);
        if (active && request === version) { setFile(value); setVerifiedOrderId(orderId); }
      } catch { if (active && request === version) setLoadError(true); }
    };
    void read();
    const unsubscribe = subscribeCustomerContractFile(id => { if (id === orderId) void read(); });
    const visible = () => { if (document.visibilityState === 'visible') void read(); };
    window.addEventListener('focus', read);
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; unsubscribe(); window.removeEventListener('focus', read); document.removeEventListener('visibilitychange', visible); };
  }, [orderId, attempt]);
  const current = file?.orderId === orderId ? file : null;
  const [link, setLink] = useState<{ file: CustomerContractFile; url: string } | null>(null);
  useEffect(() => {
    if (!current) { setLink(null); return; }
    const url = current.blob ? URL.createObjectURL(current.blob) : current.url!;
    setLink({ file: current, url });
    return () => { if (current.blob) URL.revokeObjectURL(url); };
  }, [current]);
  return { verified: verifiedOrderId === orderId, loadError, file: current, url: link?.file === current ? link?.url : undefined, refresh };
}
