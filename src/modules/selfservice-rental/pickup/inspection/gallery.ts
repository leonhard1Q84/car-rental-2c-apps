import { inspectionGroupOrder, type PublishedInspection } from './model';

export function inspectionGallery(snapshot: PublishedInspection) {
  return inspectionGroupOrder.flatMap(group =>
    (snapshot.groups[group]?.photos ?? []).map((photo, index) => ({ group, index, photo })));
}

export function adjacentPhotoIndex(index: number, direction: -1 | 1, total: number): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= total) return null;
  const next = index + direction;
  return next >= 0 && next < total ? next : null;
}

export function inspectionSwipeDirection(start: { x: number; y: number }, end: { x: number; y: number }): -1 | 1 | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return null;
  return dx < 0 ? 1 : -1;
}
