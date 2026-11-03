import { assertCaptureRecord, captureKey, type CaptureBinding, type CaptureRecord, type CaptureRepository } from './capture';
import { customerInspectionReviewChannelName } from '@shared/contracts/customerInspection';

const DATABASE = 'customer-vehicle-condition-v1';
const STORE = 'records';
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('CAPTURE_STORAGE_BLOCKED'));
  });
}
export const captureRepository: CaptureRepository = {
  async load(binding: CaptureBinding) {
    const db = await database();
    try {
      return await new Promise<CaptureRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(captureKey(binding));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('CAPTURE_READ_FAILED'));
      });
    } finally { db.close(); }
  },
  async save(record, expectedSequence) {
    assertCaptureRecord(record, record);
    if (record.sequence !== expectedSequence + 1) throw new Error('CAPTURE_CONFLICT');
    const db = await database();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const key = captureKey(record);
        const request = store.get(key);
        let conflict = false;
        request.onsuccess = () => {
          const previous = request.result as CaptureRecord | undefined;
          if ((previous?.sequence ?? 0) !== expectedSequence || previous?.confirmation) {
            conflict = true; tx.abort(); return;
          }
          store.put(record, key);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => reject(conflict ? new Error('CAPTURE_CONFLICT') : tx.error ?? new Error('CAPTURE_WRITE_FAILED'));
      });
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' && record.confirmation) {
        const channel = new BroadcastChannel(customerInspectionReviewChannelName);
        channel.postMessage({ orderId: record.orderId, vehicleId: record.vehicleId, revision: record.revision });
        channel.close();
      }
      // BroadcastChannel is unavailable in some embedded/mobile webviews. A
      // tiny same-origin marker gives the Store Ops tab a storage-event
      // fallback without putting the confirmation payload in localStorage.
      if (typeof window !== 'undefined' && record.confirmation) {
        try {
          window.localStorage.setItem(`ix-rental:customer-inspection:${record.orderId}`, JSON.stringify({
            vehicleId: record.vehicleId,
            revision: record.revision,
            confirmedAt: record.confirmation.at,
          }));
        } catch {
          // IndexedDB remains the source of truth when storage is unavailable.
        }
      }
    } finally { db.close(); }
  },
};

// Local demo migration only: keep photos and audit evidence while reopening review.
export async function resetDemoInspectionConfirmation(binding: CaptureBinding, revision: string): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const key = captureKey(binding);
      const request = store.get(key);
      request.onsuccess = () => {
        const previous = request.result as CaptureRecord | undefined;
        if (previous?.demoResetRevision === revision) { resolve(); return; }
        const record: CaptureRecord = previous ?? { orderId: binding.orderId, vehicleId: binding.vehicleId, revision: binding.revision, version: 1, sequence: 0, photos: [] };
        const next = { ...record, sequence: record.sequence + 1, demoResetRevision: revision,
          confirmationHistory: [...(record.confirmationHistory ?? []), ...(record.confirmation ? [record.confirmation] : [])],
          confirmation: undefined };
        try { assertCaptureRecord(next, binding); }
        catch (error) { tx.abort(); reject(error); return; }
        store.put(next, key);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('CAPTURE_RESET_FAILED'));
    });
  } finally { db.close(); }
}
