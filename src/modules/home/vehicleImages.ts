import compactCarImg from '../../assets/vehicles/compact-premium.jpg';
import mpvCarImg from '../../assets/vehicles/mpv-premium.jpg';
import suvCarImg from '../../assets/vehicles/suv-premium.jpg';
import stepwgnImg from '../../assets/vehicle-models/honda-stepwgn.jpg';

export function getVehiclePhoto(modelId?: string, modelName?: string, customUrl?: string): string {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim().length > 0) {
    return customUrl.trim();
  }
  const text = `${modelId || ''} ${modelName || ''}`.toUpperCase();

  if (text.includes('STEPWGN') || text.includes('STEP WGN')) {
    return stepwgnImg;
  }
  if (
    text.includes('MPV') ||
    text.includes('MINIVAN') ||
    text.includes('SERENA') ||
    text.includes('ALPHARD') ||
    text.includes('VOXY') ||
    text.includes('NOAH') ||
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
}
