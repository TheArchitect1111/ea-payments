import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [page, client, factory] = await Promise.all([
  read('app/admin/device-preview/page.tsx'),
  read('app/admin/device-preview/DevicePreviewClient.tsx'),
  read('app/admin/ea-factory/page.tsx'),
]);

assert.match(page, /verifyAdminSession/);
assert.match(page, /Device Preview/);
for (const device of ['Phone', 'Tablet', 'Desktop']) assert.match(client, new RegExp(`label: '${device}'`));
for (const dimensions of ['390 × 844', '768 × 1024', '1440 × 900']) assert.match(client, new RegExp(dimensions));
assert.match(client, /safeLocalPath/);
assert.match(client, /allow-same-origin allow-scripts/);
assert.match(client, /Preview on all devices/);
assert.match(factory, /href="\/admin\/device-preview"/);

console.log('EA device preview contract: PASS');
