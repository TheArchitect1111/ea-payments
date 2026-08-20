import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const entry = await readFile(new URL('../app/amplifi/test/page.tsx', import.meta.url), 'utf8');
const demo = await readFile(new URL('../app/api/auth/demo-enter/route.ts', import.meta.url), 'utf8');

assert.match(entry, /\/api\/auth\/demo-enter\?next=\/amplifi\/workspace/);
assert.match(entry, /index: false/);
assert.match(demo, /raw\.startsWith\('\/amplifi'\)/);

console.log('Amplifi public tester entry contract passed.');
