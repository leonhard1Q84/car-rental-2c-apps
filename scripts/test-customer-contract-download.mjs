import assert from 'node:assert/strict';
import { createServer } from 'vite';

const originalIndexedDB = globalThis.indexedDB;
const records = new Map();
globalThis.indexedDB = {
  open(name) {
    const request = {};
    request.result = {
      close() {},
      transaction() {
        const tx = {
          objectStore: () => ({
            get(key) {
              const read = {};
              queueMicrotask(() => {
                read.result = structuredClone(records.get(`${name}:${key}`));
                tx.oncomplete?.();
              });
              return read;
            },
            put(value, key) {
              queueMicrotask(() => {
                records.set(`${name}:${key}`, structuredClone(value));
                tx.oncomplete?.();
              });
              return {};
            },
            delete(key) {
              queueMicrotask(() => {
                records.delete(`${name}:${key}`);
                tx.oncomplete?.();
              });
              return {};
            }
          })
        };
        return tx;
      }
    };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  }
};

const server = await createServer({
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [], entries: [] },
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, ws: false }
});

try {
  const { saveCustomerContractFile, loadCustomerContractFile } = await server.ssrLoadModule('/src/shared/services/customerContractFileStorage.ts');
  const { isCustomerContractFile } = await server.ssrLoadModule('/src/shared/contracts/customerContractFile.ts');
  const pdf = new Blob(['%PDF-1.4 frozen-store-contract'], { type: 'application/pdf' });
  const file = { orderId: 'RC10014', documentId: 'base-1', contractNumber: 'CT-001', fileName: 'CT-001.pdf', generatedAt: '2026-10-25T00:00:00Z', blob: pdf };
  await saveCustomerContractFile(file);
  const restored = await loadCustomerContractFile(file.orderId);
  assert.equal(await restored.blob.text(), await pdf.text());
  assert.equal(await loadCustomerContractFile('OTHER'), null);
  assert.equal(isCustomerContractFile({ ...file, blob: undefined, url: 'javascript:alert(1)' }), false);
  assert.equal(isCustomerContractFile({ ...file, blob: new Blob(['x'], {type:'text/html'}) }), false);
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { PreparationContractContent } = await server.ssrLoadModule('/src/modules/selfservice-rental/pickup/PreparationContractPage.tsx');
  const { LanguageProvider } = await server.ssrLoadModule('/src/contexts/LanguageContext.tsx');
  const { preparationTranslations } = await server.ssrLoadModule('/src/i18n/preparation.ts');
  const { newDraft } = await server.ssrLoadModule('/src/app/customer-journey/model.ts');
  const draft = { ...newDraft(file.orderId), contractSignature: { orderId: file.orderId, revision:'demo-contract-v1', signedAt:file.generatedAt, signature:'data:image/png;base64,AA==', language:'zh-CN' } };
  const render = (lang, extras) => renderToStaticMarkup(React.createElement(LanguageProvider, {initialLang:lang}, React.createElement(PreparationContractContent, {draft, onBack(){}, onSaved(){}, onBusy(){}, onDirty(){}, ...extras})));
  for (const [lang, copy] of Object.entries(preparationTranslations)) {
    const waiting = render(lang, {});
    assert.ok(waiting.includes(copy.prepContractWaiting));
    assert.ok(waiting.includes(copy.prepSignatureCompleted));
    assert.ok(waiting.includes('data-customer-contract="waiting"'));
    const ready = render(lang, {contractFile:file, contractUrl:'blob:contract'});
    assert.ok(ready.includes(copy.prepContractDownload));
    assert.ok(ready.includes(copy.prepContractViewFile));
    assert.ok(ready.includes(file.fileName));
    assert.ok(!ready.includes(copy.prepContractWaiting));
    assert.ok(ready.indexOf('data-customer-contract') < ready.indexOf(copy.prepContractInfo));
    assert.ok(!ready.includes('<canvas'));
    const wrong = render(lang, {contractFile:{...file,orderId:'OTHER'},contractUrl:'blob:contract'});
    assert.ok(!wrong.includes(file.fileName));
    assert.ok(wrong.includes('data-customer-contract="waiting"'));
  }
  console.log('Contract download: PDF persistence, exact bytes, invalid files, order isolation and six-language waiting/ready layouts passed.');
} finally {
  await server.close();
  if (originalIndexedDB === undefined) delete globalThis.indexedDB;
  else globalThis.indexedDB = originalIndexedDB;
}
