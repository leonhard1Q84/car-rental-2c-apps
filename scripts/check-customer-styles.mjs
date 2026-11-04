import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'dist/assets');
const css = fs.readdirSync(assets).filter(name => name.endsWith('.css')).map(name => fs.readFileSync(path.join(assets, name), 'utf8')).join('\n');
// Cover styles consumed outside src/shared: entry, business modules, and design UI.
for (const selector of ['.pt-10{', '.space-y-5>', '.grid-cols-3{', '.max-w-customer-content{', '.text-customer-display{', '.h-customer-control{', '.bg-customer-brand{']) {
  assert.ok(css.includes(selector), `Missing customer utility in production CSS: ${selector}. Check the Tailwind source scope.`);
}
assert.match(css, /\.max-w-customer-content\{max-width:var\(--customer-size-content\)/);
assert.match(css, /\.h-customer-control\{height:var\(--customer-size-control\)/);
assert.match(css, /\.bg-customer-brand\{background-color:var\(--customer-color-brand\)/);
for (const file of ['src/design/tokens.css', 'src/design/theme.css']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [, name, value] of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    assert.notEqual(value.trim(), `var(${name})`, `Self-referencing token in ${file}: ${name}`);
  }
}
console.log('Customer production styles: entry/module/UI utilities and token references passed.');
