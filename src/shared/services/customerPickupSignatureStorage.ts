import type { CustomerPickupSignature } from '../contracts/customerPickupSignature';
import { isCustomerPickupSignature } from '../contracts/customerPickupSignature';

const DATABASE = 'customer-pickup-signature-v1';
const STORE = 'confirmations';
const CHANNEL = 'ix-rental:customer-pickup-signature';

function getIndexedDb(): IDBFactory {
  if (typeof indexedDB === 'undefined') throw new Error('INDEXED_DB_UNAVAILABLE');
  return indexedDB;
}

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('PICKUP_SIGNATURE_DB_OPEN_FAILED'));
    request.onblocked = () => reject(new Error('PICKUP_SIGNATURE_DB_BLOCKED'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onerror = () => reject(request.error ?? new Error('PICKUP_SIGNATURE_REQUEST_FAILED'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error('PICKUP_SIGNATURE_TRANSACTION_FAILED'));
      tx.onabort = () => reject(tx.error ?? new Error('PICKUP_SIGNATURE_TRANSACTION_ABORTED'));
    });
  } finally {
    db.close();
  }
}

function notify(orderId: string) {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ orderId });
  channel.close();
}

export async function loadCustomerPickupSignature(orderId: string): Promise<CustomerPickupSignature | null> {
  const value = await transaction<CustomerPickupSignature | undefined>('readonly', (store) => store.get(orderId));
  if (value === undefined) return null;
  if (!isCustomerPickupSignature(value) || value.orderId !== orderId) {
    throw new Error('INVALID_PICKUP_SIGNATURE_SNAPSHOT');
  }
  return value;
}

export async function saveCustomerPickupSignature(snapshot: CustomerPickupSignature): Promise<void> {
  if (!isCustomerPickupSignature(snapshot)) throw new Error('INVALID_PICKUP_SIGNATURE_SNAPSHOT');
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const read = store.get(snapshot.orderId);
      read.onsuccess = () => {
        const previous = read.result as CustomerPickupSignature | undefined;
        if (snapshot.submissionId && previous?.submissionId === snapshot.submissionId) {
          if (JSON.stringify(previous) !== JSON.stringify(snapshot)) tx.abort();
          return;
        }
        if (snapshot.submissionId && previous?.submissionId
          && previous.configurationRevision === snapshot.configurationRevision
          && previous.inspectionRevision === snapshot.inspectionRevision) { tx.abort(); return; }
        store.put(snapshot, snapshot.orderId);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('PICKUP_SIGNATURE_TRANSACTION_FAILED'));
      tx.onabort = () => reject(tx.error ?? new Error('SIGNING_SUBMISSION_CONFLICT'));
    });
  } finally { db.close(); }
  notify(snapshot.orderId);
}

export async function clearCustomerPickupSignature(orderId: string): Promise<void> {
  await transaction('readwrite', (store) => store.delete(orderId));
  notify(orderId);
}

export function subscribeCustomerPickupSignature(onOrderChanged: (orderId: string) => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  const listener = (event: MessageEvent<{ orderId?: string }>) => {
    if (typeof event.data?.orderId === 'string') onOrderChanged(event.data.orderId);
  };
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
    channel.close();
  };
}
