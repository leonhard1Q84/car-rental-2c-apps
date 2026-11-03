import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { createSignatureDrawing } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/signatureDrawing.ts');
  const { resizeSignatureCanvas } = await server.ssrLoadModule('/src/apps/selfservice-rental/modules/pickup-preparation/signatureCanvasSize.ts');
  let ink = [], transform = 1, last, captured = null, dirty = false;
  const context = { getTransform: () => ({ a: transform }), setTransform: value => { transform = value; }, beginPath() {}, moveTo(x,y) { last = [x,y]; }, lineTo(x,y) { ink.push([last, [x,y]]); }, stroke() {}, arc(x,y) { ink.push([x,y]); }, fill() {}, clearRect() { ink = []; } };
  const canvas = { width: 0, height: 0, offsetWidth: 0, offsetHeight: 0, getContext: () => context, getBoundingClientRect: () => ({ left: 40, top: 100 }), setPointerCapture: id => { captured = id; }, hasPointerCapture: id => id === captured, releasePointerCapture: () => { captured = null; }, toDataURL: type => { assert.equal(type, 'image/png'); assert.ok(ink.length); return 'data:image/png;base64,TEST'; } };
  const drawing = createSignatureDrawing(canvas, () => { dirty = !drawing.isEmpty(); });
  const event = (id, x, y, button = 0) => ({ pointerId: id, clientX: x, clientY: y, button, preventDefault() {} });
  resizeSignatureCanvas(drawing, 2);
  assert.equal(canvas.width, 0);
  canvas.offsetWidth = 360; canvas.offsetHeight = 192;
  resizeSignatureCanvas(drawing, 2);
  for (const id of [1, 2, 3]) {
    drawing.down(event(id, 50, 120));
    assert.equal(captured, id);
    assert.equal(dirty, true, 'first actual drawn dot makes signing nonempty');
    assert.deepEqual(drawing.toData().at(-1)[0], { x: 10, y: 20 });
    const count = ink.length;
    drawing.move(event(99, 90, 150)); assert.equal(ink.length, count, 'ignore other pointers');
    drawing.move(event(id, 100, 160)); assert.ok(ink.length > count, 'movement draws actual segments');
    drawing.finish(event(id, 100, 160)); assert.equal(captured, null);
  }
  assert.match(drawing.toDataURL(), /^data:image\/png/);
  const data = structuredClone(drawing.toData());
  canvas.offsetWidth = 0; resizeSignatureCanvas(drawing, 2);
  assert.deepEqual(drawing.toData(), data);
  canvas.offsetWidth = 180; resizeSignatureCanvas(drawing, 2);
  assert.equal(dirty, true, 'resize must restore both rendered ink and submit readiness');
  assert.equal(drawing.toData()[0][0].x, 5);
  drawing.clear(); assert.equal(dirty, false); assert.equal(ink.length, 0);
  drawing.down(event(4, 50, 120, 2)); assert.equal(drawing.isEmpty(), true);
  drawing.down(event(5, 50, 120)); drawing.finish(event(5, 50, 120));
  assert.equal(dirty, true, 'drawing again after clear remains functional');
  console.log('Production pointer handlers: initial visibility, pen down/move/end, pointer capture, multi-pointer rejection, drawing calls, PNG export, resize retention, clear and re-sign passed.');
} finally { await server.close(); }
