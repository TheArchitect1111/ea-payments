import assert from 'node:assert/strict';
import { createTtlReadCache } from '../lib/creative-studio/ttl-read-cache.mjs';
import { createAirtableRateLimitMonitor } from '../lib/data/airtable-rate-limit-monitor.mjs';

let now = 0;
const cache = createTtlReadCache(60_000, () => now);
let loads = 0;
const first = await cache.get('experience:tenant-a', async () => ({ rows: [++loads] }));
const second = await cache.get('experience:tenant-a', async () => ({ rows: [++loads] }));
assert.deepEqual(first, { rows: [1] });
assert.deepEqual(second, { rows: [1] });
assert.equal(loads, 1, 'fresh reads should be cached');
await cache.get('experience:tenant-b', async () => ({ rows: [++loads] }));
assert.equal(loads, 2, 'tenant keys must remain isolated');
now = 60_000;
await cache.get('experience:tenant-a', async () => ({ rows: [++loads] }));
assert.equal(loads, 3, 'expired reads should refresh');
await cache.get('experience:tenant-a:course', async () => ({ rows: [++loads] }));
await cache.get('experience:tenant-b:course', async () => ({ rows: [++loads] }));
cache.invalidatePrefix('experience:tenant-a:');
await cache.get('experience:tenant-a:course', async () => ({ rows: [++loads] }));
assert.equal(loads, 6, 'writes should invalidate only the selected tenant cache prefix');

const concurrentCache = createTtlReadCache(60_000, () => now);
let concurrentLoads = 0;
let release;
const loader = () => {
  concurrentLoads += 1;
  return new Promise((resolve) => { release = resolve; });
};
const a = concurrentCache.get('same-key', loader);
const b = concurrentCache.get('same-key', loader);
await Promise.resolve();
release({ ok: true });
assert.deepEqual(await a, { ok: true });
assert.deepEqual(await b, { ok: true });
assert.equal(concurrentLoads, 1, 'parallel cache misses should coalesce');

const warnings = [];
let monitorNow = 1_000;
const observe429 = createAirtableRateLimitMonitor({
  threshold: 5,
  windowMs: 60_000,
  now: () => monitorNow,
  warn: (event) => warnings.push(event),
});
for (let i = 0; i < 5; i += 1) observe429('https://api.airtable.com/v0/app/base/Client%20Records');
assert.equal(warnings.length, 0, 'five 429s should not warn');
observe429('https://api.airtable.com/v0/app/base/Client%20Records');
assert.equal(warnings.length, 1, 'six 429s in a minute should warn');
assert.equal(warnings[0].level, 'warn');
assert.equal(warnings[0].count, 6);
for (let i = 0; i < 3; i += 1) observe429('https://api.airtable.com/v0/app/base/Client%20Records');
assert.equal(warnings.length, 1, 'warning should be deduplicated during the same minute');
monitorNow += 60_001;
for (let i = 0; i < 6; i += 1) observe429('https://api.airtable.com/v0/app/base/Client%20Records');
assert.equal(warnings.length, 2, 'a new minute can raise a new warning');

console.log('Airtable read hardening tests PASS: TTL, tenant isolation, coalescing, refresh, and 429 threshold warning');
