export interface SignaturePoint { x: number; y: number }
export interface SignatureInput { pointerId: number; clientX: number; clientY: number; button: number; preventDefault(): void }

export function createSignatureDrawing(canvas: HTMLCanvasElement, changed: () => void) {
  let strokes: SignaturePoint[][] = [];
  let pointer: number | null = null;
  const context = canvas.getContext('2d')!;
  const point = (event: SignatureInput) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const draw = (from: SignaturePoint, to: SignaturePoint) => {
    context.strokeStyle = '#111827'; context.fillStyle = '#111827';
    context.lineWidth = 2; context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke();
    context.beginPath(); context.arc(to.x, to.y, 1, 0, Math.PI * 2); context.fill();
  };
  const finish = (event: SignatureInput) => {
    if (pointer !== event.pointerId) return;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    changed();
  };
  return {
    getCanvas: () => canvas,
    toData: () => strokes,
    fromData: (data: SignaturePoint[][]) => {
      strokes = data;
      for (const group of strokes) group.forEach((value, index) => draw(group[Math.max(0, index - 1)], value));
      changed();
    },
    clear: () => { pointer = null; strokes = []; context.clearRect(0, 0, canvas.width, canvas.height); changed(); },
    isEmpty: () => !strokes.some(group => group.length),
    toDataURL: (type = 'image/png') => canvas.toDataURL(type),
    down: (event: SignatureInput) => {
      if (pointer !== null || event.button !== 0 || !canvas.width || !canvas.height) return;
      event.preventDefault(); pointer = event.pointerId;
      canvas.setPointerCapture(pointer);
      const value = point(event); strokes.push([value]); draw(value, value); changed();
    },
    move: (event: SignatureInput) => {
      if (pointer !== event.pointerId) return;
      event.preventDefault();
      const group = strokes[strokes.length - 1];
      const value = point(event); draw(group[group.length - 1], value); group.push(value);
    },
    finish,
  };
}
export type SignatureDrawing = ReturnType<typeof createSignatureDrawing>;
