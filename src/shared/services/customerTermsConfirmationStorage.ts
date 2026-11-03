import type { CustomerTermsConfirmationSnapshot } from '../contracts/customerTermsConfirmation';
import { isCustomerTermsConfirmationSnapshot } from '../contracts/customerTermsConfirmation';

const DATABASE = 'customer-self-service-terms-v1';
const STORE = 'confirmations';
const CHANNEL = 'ix-rental:customer-terms-confirmation';

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
    request.onerror = () => reject(request.error ?? new Error('TERMS_CONFIRMATION_DB_OPEN_FAILED'));
    request.onblocked = () => reject(new Error('TERMS_CONFIRMATION_DB_BLOCKED'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onerror = () => reject(request.error ?? new Error('TERMS_CONFIRMATION_REQUEST_FAILED'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error('TERMS_CONFIRMATION_TRANSACTION_FAILED'));
      tx.onabort = () => reject(tx.error ?? new Error('TERMS_CONFIRMATION_TRANSACTION_ABORTED'));
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

export async function loadCustomerTermsConfirmation(orderId: string): Promise<CustomerTermsConfirmationSnapshot | null> {
  const value = await transaction<CustomerTermsConfirmationSnapshot | undefined>('readonly', (store) => store.get(orderId));
  if (value === undefined) return null;
  if (!isCustomerTermsConfirmationSnapshot(value) || value.orderId !== orderId) {
    throw new Error('INVALID_TERMS_CONFIRMATION_SNAPSHOT');
  }
  return value;
}

export async function saveCustomerTermsConfirmation(snapshot: CustomerTermsConfirmationSnapshot): Promise<void> {
  if (!isCustomerTermsConfirmationSnapshot(snapshot)) throw new Error('INVALID_TERMS_CONFIRMATION_SNAPSHOT');
  await transaction('readwrite', (store) => store.put(snapshot, snapshot.orderId));
  notify(snapshot.orderId);
}

export async function clearCustomerTermsConfirmation(orderId: string): Promise<void> {
  await transaction('readwrite', (store) => store.delete(orderId));
  notify(orderId);
}

export function subscribeCustomerTermsConfirmation(onOrderChanged: (orderId: string) => void): () => void {
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
