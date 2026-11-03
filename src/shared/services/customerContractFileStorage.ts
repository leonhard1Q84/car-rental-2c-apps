import type { CustomerContractFile } from '../contracts/customerContractFile';
import { isCustomerContractFile } from '../contracts/customerContractFile';

const DATABASE = 'customer-contract-file-v1';
const STORE = 'confirmations';
const CHANNEL = 'ix-rental:customer-contract-file';

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
    request.onerror = () => reject(request.error ?? new Error('CONTRACT_FILE_DB_OPEN_FAILED'));
    request.onblocked = () => reject(new Error('CONTRACT_FILE_DB_BLOCKED'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onerror = () => reject(request.error ?? new Error('CONTRACT_FILE_REQUEST_FAILED'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error('CONTRACT_FILE_TRANSACTION_FAILED'));
      tx.onabort = () => reject(tx.error ?? new Error('CONTRACT_FILE_TRANSACTION_ABORTED'));
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

export async function loadCustomerContractFile(orderId: string): Promise<CustomerContractFile | null> {
  const value = await transaction<CustomerContractFile | undefined>('readonly', (store) => store.get(orderId));
  if (value === undefined) return null;
  if (!isCustomerContractFile(value) || value.orderId !== orderId) {
    throw new Error('INVALID_CONTRACT_FILE_SNAPSHOT');
  }
  return value;
}

export async function saveCustomerContractFile(snapshot: CustomerContractFile): Promise<void> {
  if (!isCustomerContractFile(snapshot)) throw new Error('INVALID_CONTRACT_FILE_SNAPSHOT');
  await transaction('readwrite', (store) => store.put(snapshot, snapshot.orderId));
  notify(snapshot.orderId);
}

export async function clearCustomerContractFile(orderId: string): Promise<void> {
  await transaction('readwrite', (store) => store.delete(orderId));
  notify(orderId);
}

export function subscribeCustomerContractFile(onOrderChanged: (orderId: string) => void): () => void {
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
