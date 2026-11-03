import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const base = '/src/apps/selfservice-rental/';
  const { LanguageProvider } = await server.ssrLoadModule(base + 'contexts/LanguageContext.tsx');
  const { preparationTranslations } = await server.ssrLoadModule(base + 'i18n/preparation.ts');
  const { PreparationSigningConfirmDialog, PreparationSigningConfirmContent } = await server.ssrLoadModule(base + 'modules/pickup-preparation/PreparationSigningConfirmDialog.tsx');
  const render = (component, language, props) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLang: language }, React.createElement(component, { onClose() {}, onConfirm() {}, ...props })));
  for (const [language, copy] of Object.entries(preparationTranslations)) {
    for (const submitting of [false, true]) for (const blocked of [false, true]) {
      const markup = render(PreparationSigningConfirmContent, language, { submitting, blocked });
      for (const key of ['prepSigningConfirmTitle', 'prepSigningConfirmDescription', 'prepSigningConfirmBack']) assert.ok(markup.includes(copy[key]), `${language}: ${key}`);
      assert.ok(markup.includes(submitting ? copy.prepSaving : copy.prepSigningConfirmSubmit));
      const buttons = [...markup.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
      assert.equal(buttons.length, 2);
      assert.equal(buttons[0].includes('disabled=""'), submitting, 'review remains available before submission');
      assert.equal(buttons[1].includes('disabled=""'), submitting || blocked, 'busy or invalid prerequisites cannot submit');
      assert.equal(markup.includes('role="status"'), submitting, 'saving state is announced');
    }
    const dialog = render(PreparationSigningConfirmDialog, language, { submitting: false, blocked: false });
    assert.match(dialog, /<dialog\b/);
    assert.match(dialog, /aria-labelledby="signing-confirm-title"/);
    assert.match(dialog, /aria-describedby="signing-confirm-description"/);
  }
  console.log('Signing confirmation: six-language title/body/actions, normal/blocked/submitting gates, saving announcements and dialog accessibility passed.');
} finally { await server.close(); }
