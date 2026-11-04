import type { DriverPhotoEvidence, RegisteredPickupDriver } from '../../../types';
import { driverPhotoKey, matchesDriverPhoto, type DriverPhotoBinding } from './model';

// Local preview adapter. A production media service must preserve the same binding and success semantics.
const DATABASE = 'selfservice-driver-photo-evidence';
const STORE = 'photos';
let database: Promise<IDBDatabase> | undefined;
const openDatabase = (): Promise<IDBDatabase> => {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('STORAGE_BLOCKED'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); database = undefined; };
        resolve(db);
      };
    });
    database.catch(() => { database = undefined; });
  }
  return database;
};

export const readDriverPhotos = async (binding: DriverPhotoBinding): Promise<DriverPhotoEvidence[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const photos: DriverPhotoEvidence[] = [];
    for (const driver of binding.snapshot?.drivers || []) {
      const request = transaction.objectStore(STORE).get(driverPhotoKey(binding, driver.id));
      request.onsuccess = () => {
        if (matchesDriverPhoto(request.result, driver)) photos.push(request.result);
      };
    }
    transaction.oncomplete = () => resolve(photos);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('STORAGE_ABORTED'));
  });
};

export const saveDriverPhoto = async (binding: DriverPhotoBinding, driver: RegisteredPickupDriver, photo: string): Promise<DriverPhotoEvidence> => {
  const db = await openDatabase();
  const evidence: DriverPhotoEvidence = { ...driver, photo, savedAt: new Date().toISOString() };
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(evidence, driverPhotoKey(binding, driver.id));
    transaction.oncomplete = () => resolve(evidence);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('STORAGE_ABORTED'));
  });
};

export const readDriverPhotoFile = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024 || file.size === 0) throw new Error('INVALID_IMAGE');
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  // Decode before marking saved; resize to keep four photos affordable in local storage.
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('INVALID_IMAGE'));
    image.src = source;
  });
  const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('IMAGE_READ_FAILED');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
};
