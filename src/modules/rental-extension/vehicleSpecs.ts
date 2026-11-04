export interface VehicleSpecs {
  seats: number;
  luggage: number;
  transmission: string;
  airConditioning: string;
}

export const getVehicleSpecs = (
  modelId?: string,
  modelName?: string,
  t?: (key: any) => string
): VehicleSpecs => {
  const text = `${modelId || ''} ${modelName || ''}`.toUpperCase();
  const auto = t ? t('prepAutomatic') : '自排';
  const ac = t ? t('prepAirConditioning') : '空調';

  if (
    text.includes('MPV') ||
    text.includes('MINIVAN') ||
    text.includes('SERENA') ||
    text.includes('ALPHARD') ||
    text.includes('STEPWGN') ||
    text.includes('FVAR') ||
    text.includes('SVAR')
  ) {
    return {
      seats: 7,
      luggage: 4,
      transmission: auto,
      airConditioning: ac,
    };
  }

  if (
    text.includes('SUV') ||
    text.includes('RAV4') ||
    text.includes('HARRIER') ||
    text.includes('TIGUAN') ||
    text.includes('IFAR') ||
    text.includes('SFAR')
  ) {
    return {
      seats: 5,
      luggage: 3,
      transmission: auto,
      airConditioning: ac,
    };
  }

  return {
    seats: 5,
    luggage: 2,
    transmission: auto,
    airConditioning: ac,
  };
};
