import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const forbidden = /(?:store-ops|merchant-mobile|@storeops|@merchant)(?:[/.'"\s]|$)/;
const issues = [];
const relative = (file) => path.relative(root, file);
const filesIn = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  })
  : [];

assert.ok(!fs.existsSync(path.join(root, 'src/apps')), 'src must stay flat: no src/apps directory');

const customerModules = new Set(['auth', 'home', 'online-checkin', 'selfservice-rental', 'rental-extension']);
for (const entry of fs.readdirSync(path.join(root, 'src/modules'), { withFileTypes: true })) {
  if (entry.isDirectory() && !customerModules.has(entry.name)) issues.push(`Unexpected top-level customer module: ${entry.name}. Check specs/epic/customer-applications.md.`);
}

for (const name of ['merchant.html', 'store-ops.html']) {
  if (fs.existsSync(path.join(root, name))) issues.push(`Unexpected application entry: ${name}`);
}
for (const file of filesIn(path.join(root, 'public'))) {
  if (forbidden.test(relative(file))) issues.push(`Unexpected merchant asset: ${relative(file)}`);
}
for (const name of ['vite.config.ts', 'tsconfig.json', 'vercel.json', 'index.html', 'selfservice.html']) {
  if (forbidden.test(fs.readFileSync(path.join(root, name), 'utf8'))) {
    issues.push(`Merchant reference in ${name}`);
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dependency of ['@google/genai', 'react-router-dom']) {
  if (pkg.dependencies?.[dependency] || pkg.devDependencies?.[dependency]) {
    issues.push(`Unexpected unused dependency: ${dependency}`);
  }
}

const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
assert.equal(configFile.error, undefined, 'tsconfig.json must parse');
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const sources = filesIn(path.join(root, 'src')).filter((file) => /\.(?:tsx?|css)$/.test(file));
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.trimEnd().split('\n').length > 1500) issues.push(`File exceeds 1500 lines: ${relative(file)}`);
  if (file.endsWith('.css')) {
    if (forbidden.test(text)) issues.push(`Merchant scan or style reference: ${relative(file)}`);
    continue;
  }
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const inspectImport = (specifier) => {
    if (forbidden.test(specifier)) issues.push(`Forbidden import in ${relative(file)}: ${specifier}`);
    if (path.isAbsolute(specifier)) issues.push(`Absolute import in ${relative(file)}: ${specifier}`);
    const resolved = ts.resolveModuleName(specifier, file, config.options, ts.sys).resolvedModule;
    if (!resolved) {
      const asset = /\.(?:css|svg|png|jpe?g|webp)$/.test(specifier) && specifier.startsWith('.')
        ? path.resolve(path.dirname(file), specifier)
        : null;
      if (!asset || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) {
        // Vite handles static assets outside TypeScript module resolution.
        if (specifier !== '@shared/styles/tailwind.css' || !fs.existsSync(path.join(root, 'src/shared/styles/tailwind.css'))) {
          issues.push(`Unresolved import in ${relative(file)}: ${specifier}`);
        }
      } else if (relative(asset).startsWith(`..${path.sep}`)) {
        issues.push(`Asset outside repository: ${relative(file)}`);
      }
      return;
    }
    const destination = relative(resolved.resolvedFileName);
    if (destination.startsWith(`..${path.sep}`)) issues.push(`Import outside repository: ${relative(file)}`);
    if (relative(file).startsWith('src/shared/') && destination.startsWith('src/') && !destination.startsWith('src/shared/')) {
      issues.push(`Shared depends on app: ${relative(file)} -> ${destination}`);
    }
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      inspectImport(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      inspectImport(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Customer boundaries passed (${sources.length} source files).`);
}
