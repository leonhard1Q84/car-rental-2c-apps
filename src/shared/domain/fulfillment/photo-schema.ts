export type VehiclePhotoSlot =
  | 'front'
  | 'rear'
  | 'left'
  | 'right'
  | 'front_lights'
  | 'rear_lights'
  | 'license_plate_with_driver'
  | 'parking_area'
  | 'interior_front'
  | 'interior_rear'
  | 'damage_evidence'
  | 'key_return_evidence'
  | 'prep_evidence';

export const VEHICLE_PHOTO_SLOTS: VehiclePhotoSlot[] = [
  'front',
  'rear',
  'left',
  'right',
  'front_lights',
  'rear_lights',
  'license_plate_with_driver',
  'parking_area',
  'interior_front',
  'interior_rear',
  'damage_evidence',
  'key_return_evidence',
  'prep_evidence',
];
