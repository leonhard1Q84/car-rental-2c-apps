/**
 * Same-origin prototype storage for the customer inspection publication.
 *
 * The production contract remains a server-side publication API. This store
 * only lets the two local apps share a large, immutable snapshot without
 * duplicating full-size photo data URLs in localStorage.
 */
const DATABASE_NAME = 'ix-rental-customer-inspection-v1';
const DATABASE_VERSION = 1;
const STORE_NAME = 'publications';
const LOCAL_RESET_MARKER_PREFIX = 'ix-rental:customer-inspection:reset:';
export const customerInspectionPublicationChannelName = 'ix-rental:customer-inspection:publication';

interface PublicationRecord {
  orderId: string;
  snapshot: unknown;
  updatedAt: string;
}

const requestToPromise = <T,>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('INSPECTION_PUBLICATION_READ_FAILED'));
  });

const transactionToPromise = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('INSPECTION_PUBLICATION_WRITE_FAILED'));
    transaction.onabort = () => reject(transaction.error ?? new Error('INSPECTION_PUBLICATION_WRITE_ABORTED'));
  });

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('INSPECTION_PUBLICATION_INDEXEDDB_UNAVAILABLE'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'orderId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('INSPECTION_PUBLICATION_DATABASE_FAILED'));
  });

export const customerInspectionPublicationKey = (orderId: string) =>
  `ix-rental:customer-inspection:${orderId}`;

/** Read the legacy snapshot synchronously for old browser sessions. */
export const readLegacyCustomerInspectionPublication = (orderId: string): unknown | null => {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(customerInspectionPublicationKey(orderId));
    return value === null ? null : JSON.parse(value);
  } catch {
    return null;
  }
};

export async function saveCustomerInspectionPublication(orderId: string, snapshot: unknown, expectedRevision?: number | string | null): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(orderId);
    let conflict = false;
    request.onsuccess = () => {
      const legacy = request.result ? null : readLegacyCustomerInspectionPublication(orderId);
      const previous = request.result as PublicationRecord | undefined
        ?? (legacy ? { orderId, snapshot: legacy, updatedAt: new Date().toISOString() } : undefined);
      const revision = (previous?.snapshot as { revision?: string | number } | undefined)?.revision ?? null;
      if (expectedRevision !== undefined && String(revision) !== String(expectedRevision)) {
        conflict = true; transaction.abort(); return;
      }
      if (previous && revision !== null) {
        store.put({ ...previous, orderId: JSON.stringify(['history', orderId, revision]) });
      }
      store.put({ orderId, snapshot, updatedAt: new Date().toISOString() } satisfies PublicationRecord);
    };
    await transactionToPromise(transaction).catch(error => { throw conflict ? new Error('INSPECTION_PUBLICATION_CONFLICT') : error; });
  } finally {
    database.close();
  }
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(customerInspectionPublicationChannelName);
    channel.postMessage({ orderId, revision: (snapshot as { revision?: string } | null)?.revision ?? null });
    channel.close();
  }
}

export async function loadCustomerInspectionPublication(orderId: string): Promise<unknown | null> {
  // SSR/static rendering has no browser storage. Let the customer demo
  // fixtures provide their deterministic fallback instead of surfacing a
  // browser-only capability error during server-side checks.
  if (typeof window === 'undefined') return null;
  try {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const record = await requestToPromise<PublicationRecord | undefined>(transaction.objectStore(STORE_NAME).get(orderId));
      if (record) return record.snapshot;
    } finally {
      database.close();
    }
  } catch (error) {
    const legacy = readLegacyCustomerInspectionPublication(orderId);
    if (legacy !== null) return legacy;
    throw error;
  }
  return readLegacyCustomerInspectionPublication(orderId);
}

/**
 * Local demo only: return one order to the state before the first customer
 * publication. This removes the current customer-visible snapshot while
 * leaving the Store Ops draft/photos untouched. The marker makes the demo
 * reset one-shot, so a later refresh after a new publication cannot erase it.
 */
export async function resetLocalCustomerInspectionPublication(orderId: string, resetRevision: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return false;
  const markerKey = `${LOCAL_RESET_MARKER_PREFIX}${orderId}:${resetRevision}`;
  try {
    if (window.localStorage.getItem(markerKey) === 'done') return false;
  } catch {
    // Continue when storage is unavailable; the publication deletion remains
    // safe for the current page and the caller is still idempotent on reload.
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(orderId);
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
  try {
    window.localStorage.removeItem(customerInspectionPublicationKey(orderId));
    window.localStorage.setItem(markerKey, 'done');
  } catch {
    // IndexedDB is the source of truth for the prototype; legacy localStorage
    // cleanup is best effort when browser privacy settings block it.
  }
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(customerInspectionPublicationChannelName);
    channel.postMessage({ orderId, revision: null, resetRevision });
    channel.close();
  }
  return true;
}

