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
        for (const marker of ['TB3 STORE', 'TB3 MEDIA', 'TB3 FILM', '18 PTS 8 REB 3 AST', 'ALABAMA - 111-93', 'FILM 01 - DUNK', 'FILM 04 - DEFENSE', 'SCOREBOARD PROOF - 18/8/3/1']) {
          assert.ok(html.includes(marker), host + path + ' missing ' + marker);
        }
        assert.ok(html.includes('id="tb3-public-hero"'), host + path + ' missing public TB3 hero');
        assert.ok(html.includes('id="tb3-film"'), host + path + ' missing TB3 film gallery');
        const filmCards = [...html.matchAll(/aria-label="(?:Play|View) FILM ?\\d|aria-label="(?:Play|View) SCOREBOARD PROOF/g)];
        assert.equal(filmCards.length, 5, host + path + ' TB3 film and scoreboard cards');
      } else if (path === '/hq' || path === '/tarris/future') {
        for (const marker of ['TB3 HQ', 'LET&#x27;S GET TO WORK', 'ACADEMICS']) assert.ok(html.includes(marker), host + path + ' missing ' + marker);
      }
    }
  }
  const response = await getPage('efficiencyarchitects.online', '/');
  assert.equal(response.status, 200);
  assert.ok(response.html.includes('Live YOUR'));
  console.log('PASS: TB3 public hero, film gallery, scoreboard, store, HQ, agreement and signing on both hosts; EA homepage preserved.');
} catch (error) {
  console.error(output);
  throw error;
} finally {
  server.kill('SIGTERM');
}
