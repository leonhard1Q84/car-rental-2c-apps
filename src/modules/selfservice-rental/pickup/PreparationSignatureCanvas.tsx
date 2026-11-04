import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { resizeSignatureCanvas } from './signatureCanvasSize';
import { createSignatureDrawing, type SignatureDrawing } from './signatureDrawing';

export function PreparationSignatureCanvas({ canvasRef, active, disabled, label, onEnd }: {
  canvasRef: React.RefObject<SignatureDrawing | null>;
  active: boolean;
  disabled: boolean;
  label: string;
  onEnd: () => void;
}) {
  const element = useRef<HTMLCanvasElement>(null);
  const notify = useRef(onEnd);
  notify.current = onEnd;
  useLayoutEffect(() => {
    const drawing = createSignatureDrawing(element.current!, () => notify.current());
    canvasRef.current = drawing;
    return () => { canvasRef.current = null; };
  }, [canvasRef]);
  useEffect(() => {
    const pad = canvasRef.current;
    if (!pad || !active) return;
    const resize = () => resizeSignatureCanvas(pad, window.devicePixelRatio);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(pad.getCanvas());
    window.addEventListener('resize', resize);
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [active, canvasRef]);
  return <canvas ref={element} className="block h-48 w-full rounded-customer-control" style={{ touchAction: 'none' }} aria-label={label}
    onPointerDown={event => { if (active && !disabled) { resizeSignatureCanvas(canvasRef.current!, window.devicePixelRatio); canvasRef.current?.down(event); } }}
    onPointerMove={event => { if (active && !disabled) canvasRef.current?.move(event); }}
    onPointerUp={event => canvasRef.current?.finish(event)} onPointerCancel={event => canvasRef.current?.finish(event)}
    onLostPointerCapture={event => canvasRef.current?.finish(event)} />;
}
