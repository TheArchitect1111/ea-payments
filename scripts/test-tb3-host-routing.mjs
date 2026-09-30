import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';

function getPage(host, path) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, headers: { host } }, (response) => {
      let html = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { html += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, html }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

const port = 3219;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
server.stdout.on('data', (data) => { output += data; });
server.stderr.on('data', (data) => { output += data; });
try {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(output);
    if (output.includes('Ready in')) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  for (const host of ['tb3.online', 'www.tb3.online']) {
    for (const path of ['/', '/tarris', '/hq', '/tarris/future', '/tarris/future/agreement', '/tarris/future/sign']) {
      console.log('Checking ' + host + path);
      const response = await getPage(host, path);
      assert.equal(response.status, 200, host + path);
      const html = response.html;
      if (path === '/' || path === '/tarris') {
        for (const marker of ['TB3 STORE', 'SLOT_TB3_MASK']) assert.ok(html.includes(marker), host + path + ' missing ' + marker);
        const slots = [...html.matchAll(/aria-label="(SLOT_[A-Z0-9_]+)"/g)].map(m => m[1]);
        const expected = ['SLOT_TB3_MASK', 'SLOT_HERO_HOODIE', ...['ATHLETE', 'STORY', 'BRAND', 'NIL', 'COMMUNITY'].map(p => 'SLOT_' + p + '_IMG'), 'SLOT_MEDIA_FEATURE', ...[1, 2, 3, 4].map(n => 'SLOT_MEDIA_THUMB_' + n), 'SLOT_ENTERPRISE_IMG', 'SLOT_FUTURE_IMG', ...['HOODIE_BLACK', 'TEE_WHITE', 'CAP', 'HOODIE_RED', 'TEE_BLACK'].map(m => 'SLOT_MERCH_' + m)];
        assert.deepEqual(slots.sort(), expected.sort(), host + path + ' placeholder slots');
      } else if (path === '/hq' || path === '/tarris/future') {
        for (const marker of ['TB3 HQ', 'LET&#x27;S GET TO WORK', 'ACADEMICS']) assert.ok(html.includes(marker), host + path + ' missing ' + marker);
      }
    }
  }
  const response = await getPage('efficiencyarchitects.online', '/');
  assert.equal(response.status, 200);
  assert.ok(response.html.includes('Live YOUR'));
  console.log('PASS: TB3 light root, 19 placeholders, HQ, agreement and signing on both hosts; EA homepage preserved.');
} catch (error) {
  console.error(output);
  throw error;
} finally {
  server.kill('SIGTERM');
}
