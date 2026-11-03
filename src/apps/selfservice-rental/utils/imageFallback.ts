export const DEFAULT_RENTAL_CAR_IMAGE =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80';

export const getSafeImageSrc = (src?: string | null): string => {
  const value = typeof src === 'string' ? src.trim() : '';
  return value.length > 0 ? value : DEFAULT_RENTAL_CAR_IMAGE;
};
