import type { SignatureDrawing } from './signatureDrawing';

export function resizeSignatureCanvas(pad: Pick<SignatureDrawing, 'getCanvas' | 'toData' | 'clear' | 'fromData'>, pixelRatio = 1): void {
  const canvas = pad.getCanvas();
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  if (width <= 0 || height <= 0) return;
  const ratio = Math.max(pixelRatio, 1);
  const nextWidth = Math.round(width * ratio);
  const nextHeight = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  if (!context) return;
  const previousRatio = context.getTransform().a || 1;
  if (canvas.width === nextWidth && canvas.height === nextHeight && previousRatio === ratio) return;
  const previousWidth = canvas.width / previousRatio;
  const previousHeight = canvas.height / previousRatio;
  const strokes = pad.toData().map(group => group.map(point => ({
      ...point,
      x: previousWidth > 0 ? point.x * width / previousWidth : point.x,
      y: previousHeight > 0 ? point.y * height / previousHeight : point.y,
    })));
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  pad.clear();
  if (strokes.length) pad.fromData(strokes);
}
