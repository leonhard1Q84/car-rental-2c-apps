import { useEffect, useMemo, useRef, useState } from 'react';
import type { DriverPhotoEvidence, RegisteredPickupDriver } from '../../types';
import { buildDriverPhotoConfirmation, isDriverPhotoConfirmationComplete, isDriverSnapshotValid, type DriverPhotoBinding } from './model';
import { readDriverPhotoFile, readDriverPhotos, saveDriverPhoto } from './storage';

export const useDriverPhotos = (binding: DriverPhotoBinding) => {
  const identity = JSON.stringify(binding);
  const activeIdentity = useRef(identity);
  activeIdentity.current = identity;
  const [photos, setPhotos] = useState<DriverPhotoEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [uploading, setUploading] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, 'invalid' | 'save'>>({});
  const pendingFiles = useRef<Record<string, File>>({});
  const busy = useRef(new Set<string>());
  const [loadedIdentity, setLoadedIdentity] = useState('');

  useEffect(() => {
    let cancelled = false;
    activeIdentity.current = identity;
    setLoading(true);
    setLoadError(false);
    setPhotos([]);
    setErrors({});
    setUploading([]);
    pendingFiles.current = {};
    busy.current = new Set();
    if (!isDriverSnapshotValid(binding.snapshot)) {
      setLoading(false);
      return;
    }
    readDriverPhotos(binding).then(value => {
      if (cancelled) return;
      setPhotos(value);
      setLoadedIdentity(identity);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoadError(true);
      setLoading(false);
    });
    return () => { cancelled = true; activeIdentity.current = ''; };
  }, [identity, attempt]);

  const capture = async (driver: RegisteredPickupDriver, file?: File) => {
    const candidate = file || pendingFiles.current[driver.id];
    if (!candidate || loading || loadError || loadedIdentity !== identity || busy.current.has(driver.id)) return;
    const requestIdentity = identity;
    const requestBusy = busy.current;
    requestBusy.add(driver.id);
    pendingFiles.current[driver.id] = candidate;
    setUploading(current => [...current, driver.id]);
    setErrors(current => { const next = { ...current }; delete next[driver.id]; return next; });
    try {
      const photo = await readDriverPhotoFile(candidate);
      const saved = await saveDriverPhoto(binding, driver, photo);
      if (activeIdentity.current !== requestIdentity) return;
      setPhotos(current => [...current.filter(item => item.id !== driver.id), saved]);
      delete pendingFiles.current[driver.id];
    } catch (error) {
      if (activeIdentity.current !== requestIdentity) return;
      setErrors(current => ({ ...current, [driver.id]: error instanceof Error && error.message === 'INVALID_IMAGE' ? 'invalid' : 'save' }));
    } finally {
      requestBusy.delete(driver.id);
      if (activeIdentity.current === requestIdentity) setUploading(current => current.filter(id => id !== driver.id));
    }
  };
  const currentPhotos = loadedIdentity === identity ? photos : [];
  const confirmation = useMemo(() => buildDriverPhotoConfirmation(binding, currentPhotos), [identity, photos, loadedIdentity]);
  const complete = !loading && !loadError && loadedIdentity === identity && uploading.length === 0
    && Object.keys(errors).length === 0 && isDriverPhotoConfirmationComplete(confirmation, binding);
  return { photos: currentPhotos, loading, loadError, uploading, errors, confirmation, complete, capture, reload: () => setAttempt(value => value + 1) };
};
