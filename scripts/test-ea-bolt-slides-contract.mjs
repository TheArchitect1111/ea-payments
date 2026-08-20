import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../tools/ea-bolt-slides/', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const [app, content, tokens, html, readme] = await Promise.all([
  read('src/App.tsx'),
  read('src/deckContent.ts'),
  read('src/styles/tokens.css'),
  read('index.html'),
  read('README.md'),
]);

assert.equal((app.match(/<Cover\b|<Split\b|<Slide\b|<Contrast\b|<Section\b|<Steps\b|<StatGrid\b|<Quote\b/g) ?? []).length, 12);
assert.match(app, /notes="/);
assert.match(app, /deck\.callToAction/);
assert.doesNotMatch(app, /Component demo|Delete this and build the real one|Dashboard sprawl/);
assert.match(content, /organization: '\[Organization Name\]'/);
assert.match(content, /callToAction: 'Confirm the first operating priority\.'/);
assert.match(tokens, /--bg: #071526/);
assert.match(tokens, /--primary: #cfa657/);
assert.match(html, /Efficiency Architects — Transformation Presentation/);
assert.match(readme, /Never invent numerical outcomes/);

console.log('EA Bolt Slides contract: PASS');
