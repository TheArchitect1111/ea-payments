/**
 * Remint cert session from .env.production.pull and GET-probe CX routes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  signHmacSession,
  makeSessionCookie,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(ROOT, '.env.production.pull');

function loadEnv(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

const env = loadEnv(envFile);
for (const [k, v] of Object.entries(env)) {
  if (v) process.env[k] = v;
}

if (!process.env.ADMIN_SESSION_SECRET?.trim()) {
  console.error('ADMIN_SESSION_SECRET missing in .env.production.pull');
  process.exit(1);
}

const token = await signHmacSession(
  {
    slug: 'ea-portal-cert-test',
    email: 'ea-portal-cert-test@efficiencyarchitects.online',
    role: 'owner',
    exp: newSessionExpiry(),
  },
  {
    secretEnvKey: 'ADMIN_SESSION_SECRET',
    devSecret: 'ea-portal-dev-secret-change-in-prod',
  },
);

if (!token) {
  console.error('signHmacSession failed');
  process.exit(1);
}

const cookie = makeSessionCookie('ea_portal_session', token);
fs.writeFileSync(
  path.join(ROOT, 'docs/audits/_runtime-cert-session-cookie.txt'),
  `ea_portal_session=${cookie.value}`,
);
console.log('reminted ok');

const ORIGIN = 'https://efficiencyarchitects.online';
const paths = [
  '/portal/ea-portal-cert-test/ctp/progress',
  '/portal/ea-portal-cert-test/ctp',
  '/portal/ea-portal-cert-test/ctp/documents',
  '/portal/ea-portal-cert-test/ctp/messages',
  '/portal/ea-portal-cert-test/ctp/support',
  '/portal/ea-portal-cert-test/documents',
  '/portal/ea-portal-cert-test/messaging',
  '/portal/ea-portal-cert-test/ask',
  '/portal/ea-portal-cert-test/updates',
  '/portal/ea-portal-cert-test',
];

const results = [];
for (const p of paths) {
  const res = await fetch(`${ORIGIN}${p}`, {
    redirect: 'manual',
    headers: {
      Cookie: `ea_portal_session=${cookie.value}`,
      Accept: 'text/html',
    },
  });
  const loc = res.headers.get('location');
  let text = '';
  if (res.status === 200) text = await res.text();
  // Follow one redirect if soft-redirect within portal (not login)
  let finalStatus = res.status;
  let finalLoc = loc;
  let finalText = text;
  if (res.status >= 300 && res.status < 400 && loc && !/portal\/login/i.test(loc)) {
    const abs = loc.startsWith('http') ? loc : `${ORIGIN}${loc}`;
    const res2 = await fetch(abs, {
      redirect: 'manual',
      headers: {
        Cookie: `ea_portal_session=${cookie.value}`,
        Accept: 'text/html',
      },
    });
    finalStatus = res2.status;
    finalLoc = res2.headers.get('location');
    if (res2.status === 200) finalText = await res2.text();
  }

  const row = {
    path: p,
    status: res.status,
    location: loc,
    finalStatus,
    finalLocation: finalLoc,
    loggedIn: finalStatus === 200 && !/portal\/login/i.test(finalLoc || ''),
    hasYourJourney: /Your Journey/i.test(finalText),
    hasProgressLabel: />\s*Progress\s*</.test(finalText),
    hasMessagesLabel: />\s*Messages\s*</.test(finalText),
    hasSupportLabel: />\s*Support\s*</.test(finalText),
    hasDocumentsLabel: />\s*Documents\s*</.test(finalText),
    hasHelpFab: /cex-help-fab/i.test(finalText),
    hasAssistant: /ea-assistant|data-ea-assistant/i.test(finalText),
    hasNBA: /next (best )?action|Next step|Design Studio|Mark complete|Your next/i.test(
      finalText,
    ),
    hasLogOut: /Log out/i.test(finalText),
    title: (finalText.match(/<title[^>]*>([^<]*)/i) || [])[1] || null,
    htmlBytes: finalText.length,
    textPreview: finalText.replace(/\s+/g, ' ').slice(0, 500),
  };
  results.push(row);
  console.log(p, res.status, loc || '', '=>', finalStatus, finalLoc || '');
}

const outDir = path.join(ROOT, 'docs/audits/runtime-evidence-cert-2026-07-23');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'http-probes-prod-secret.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      secretSource: '.env.production.pull',
      results,
    },
    null,
    2,
  ),
);

// Save full HTML for progress page if logged in
const progress = results.find((r) => r.path.includes('/ctp/progress'));
if (progress?.loggedIn) {
  const res = await fetch(`${ORIGIN}/portal/ea-portal-cert-test/ctp/progress`, {
    headers: { Cookie: `ea_portal_session=${cookie.value}`, Accept: 'text/html' },
  });
  const html = await res.text();
  fs.writeFileSync(path.join(outDir, 'progress.html'), html);
  console.log('saved progress.html', html.length);
}

console.log(
  'loggedInCount',
  results.filter((r) => r.loggedIn).length,
  '/',
  results.length,
);
