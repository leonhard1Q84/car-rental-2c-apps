import type { DriverPhotoConfirmation, DriverPhotoEvidence, OnlineCheckinDriverSnapshot, RegisteredPickupDriver } from '../../types';

export interface DriverPhotoBinding {
  orderId: string;
  vehicleId: string;
  snapshot?: OnlineCheckinDriverSnapshot;
}

export const isDriverSnapshotValid = (snapshot?: OnlineCheckinDriverSnapshot): snapshot is OnlineCheckinDriverSnapshot => {
  if (typeof snapshot?.revision !== 'string' || !snapshot.revision.trim() || !Array.isArray(snapshot.drivers)) return false;
  const { drivers } = snapshot;
  return drivers.length >= 1 && drivers.length <= 4
    && drivers.every(driver => Boolean(driver && typeof driver.id === 'string' && driver.id.trim()
      && typeof driver.name === 'string' && driver.name.trim())
      && ['primary', 'additional'].includes(driver.role)
      && ['japan', 'idp', 'translation', 'myna'].includes(driver.credentialType))
    && drivers.filter(driver => driver.role === 'primary').length === 1
    && new Set(drivers.map(driver => driver.id)).size === drivers.length;
};

export const matchesDriverPhoto = (photo: DriverPhotoEvidence | undefined, driver: RegisteredPickupDriver): photo is DriverPhotoEvidence =>
  Boolean(photo && photo.id === driver.id && photo.name === driver.name && photo.role === driver.role
    && photo.credentialType === driver.credentialType && typeof photo.photo === 'string' && photo.photo.startsWith('data:image/')
    && Number.isFinite(Date.parse(photo.savedAt)));

export const driverPhotoKey = (binding: DriverPhotoBinding, driverId: string): string =>
  JSON.stringify([binding.orderId, binding.vehicleId, binding.snapshot?.revision, driverId]);

export const buildDriverPhotoConfirmation = (binding: DriverPhotoBinding, photos: DriverPhotoEvidence[]): DriverPhotoConfirmation => ({
  orderId: binding.orderId,
  vehicleId: binding.vehicleId,
  driverRevision: binding.snapshot?.revision || '',
  drivers: isDriverSnapshotValid(binding.snapshot)
    ? binding.snapshot.drivers.flatMap(driver => {
      const photo = photos.find(item => item.id === driver.id);
      return matchesDriverPhoto(photo, driver) ? [photo] : [];
    })
    : [],
});

export const isDriverPhotoConfirmationComplete = (confirmation?: DriverPhotoConfirmation, binding?: DriverPhotoBinding): boolean => {
  if (!confirmation?.orderId || !confirmation.vehicleId || !confirmation.driverRevision) return false;
  if (!Array.isArray(confirmation.drivers) || confirmation.drivers.some(driver => !driver || typeof driver.id !== 'string')) return false;
  if (binding && !isDriverSnapshotValid(binding.snapshot)) return false;
  const snapshot = binding?.snapshot || { revision: confirmation.driverRevision, drivers: confirmation.drivers };
  if (!isDriverSnapshotValid(snapshot)) return false;
  if (binding && (confirmation.orderId !== binding.orderId || confirmation.vehicleId !== binding.vehicleId
    || confirmation.driverRevision !== snapshot.revision)) return false;
  return confirmation.drivers.length === snapshot.drivers.length
    && new Set(confirmation.drivers.map(driver => driver.id)).size === snapshot.drivers.length
    && snapshot.drivers.every(driver => matchesDriverPhoto(confirmation.drivers.find(photo => photo.id === driver.id), driver));
};
