import compactCarImg from '../../assets/vehicles/compact-premium.jpg';
import mpvCarImg from '../../assets/vehicles/mpv-premium.jpg';
import suvCarImg from '../../assets/vehicles/suv-premium.jpg';

export const getVehiclePhoto = (modelId?: string, modelName?: string): string => {
  const text = `${modelId || ''} ${modelName || ''}`.toUpperCase();

  if (
    text.includes('MPV') ||
    text.includes('MINIVAN') ||
    text.includes('SERENA') ||
    text.includes('ALPHARD') ||
    text.includes('STEPWGN') ||
    text.includes('FVAR') ||
    text.includes('SVAR')
  ) {
    return mpvCarImg;
  }
  if (
    text.includes('SUV') ||
    text.includes('RAV4') ||
    text.includes('HARRIER') ||
    text.includes('TIGUAN') ||
    text.includes('IFAR') ||
    text.includes('SFAR')
  ) {
    return suvCarImg;
  }
  return compactCarImg;
};
