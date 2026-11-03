import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, logLevel: 'error', server: { middlewareMode: true } });
const original = { indexedDB: globalThis.indexedDB, window: globalThis.window, BroadcastChannel: globalThis.BroadcastChannel };
const records = new Map(), legacy = new Map();
// Transactional test adapter stages writes until completion and discards aborted writes.
globalThis.indexedDB = { open() {
  const request = {};
  request.result = { close() {}, transaction() {
    const staged = new Map(); let timer, aborted = false;
    const finish = () => { clearTimeout(timer); timer = setTimeout(() => {
      if (aborted) return;
      staged.forEach((value, key) => records.set(key, structuredClone(value)));
      tx.oncomplete?.();
    }, 0); };
    const tx = { abort() { aborted = true; clearTimeout(timer); queueMicrotask(() => tx.onabort?.()); }, objectStore() { return {
      get(key) { const read = {}; queueMicrotask(() => { read.result = structuredClone(records.get(key)); read.onsuccess?.(); if (!aborted) finish(); }); return read; },
      put(value) { staged.set(value.orderId, structuredClone(value)); finish(); },
    }; } };
    return tx;
  } };
  queueMicrotask(() => request.onsuccess?.()); return request;
} };
globalThis.window = { localStorage: { getItem: key => legacy.get(key) ?? null } };
globalThis.BroadcastChannel = undefined;
try {
  const { saveCustomerInspectionPublication: save, loadCustomerInspectionPublication: load } = await server.ssrLoadModule('/src/shared/services/customerInspectionPublicationStorage.ts');
  const first = { orderId: 'O1', vehicleId: 'V1', revision: 'R1', groups: { exterior: ['first'] } };
  await save('O1', first, null);
  assert.deepEqual(await load('O1'), first);
  const second = { ...first, revision: 'R2', groups: { exterior: ['second'] } };
  await save('O1', second, 'R1');
  assert.deepEqual(records.get(JSON.stringify(['history', 'O1', 'R1'])).snapshot, first, 'original evidence is archived unchanged');
  await assert.rejects(save('O1', { ...second, revision: 'STALE' }, 'R1'), /CONFLICT/);
  assert.deepEqual(await load('O1'), second, 'stale writer cannot replace the latest snapshot');
  assert.equal(records.has(JSON.stringify(['history', 'O1', 'R2'])), false, 'conflict creates no false history entry');
  legacy.set('ix-rental:customer-inspection:O2', JSON.stringify({ ...first, orderId: 'O2' }));
  await save('O2', { ...second, orderId: 'O2' }, 'R1');
  assert.equal((await load('O2')).revision, 'R2', 'legacy-only publications migrate without an endless conflict');
  assert.equal((await load('O1')).revision, 'R2', 'order records stay isolated');
  console.log('PASS: publication transaction, immutable history, stale-write rejection, legacy migration and order isolation.');
} finally { Object.assign(globalThis, original); await server.close(); }
