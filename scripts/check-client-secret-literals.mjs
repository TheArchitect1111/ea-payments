/** Fail when known credential literals or server-only env reads enter browser assets. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const staticRoot = path.join(root, '.next', 'static');
const forbiddenLiterals = [
  'DemoPulse2026!',
  'DemoWebsite2026!',
];
const serverOnlyEnv = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_PAT',
  'SESSION_SECRET',
  'ADMIN_SESSION_SECRET',
  'TB3_PAYPAL_CLIENT_SECRET',
  'PAYPAL_CLIENT_SECRET',
  'TB3_PAYPAL_WEBHOOK_SECRET',
  'TB3_PAYPAL_WEBHOOK_ID',
  'TB3_PRINTFUL_API_KEY',
  'PRINTFUL_API_KEY',
  'TB3_PAYPAL_DB_DIAGNOSTIC_TOKEN_SHA256',
  'TB3_PRINTFUL_DIAGNOSTIC_TOKEN_SHA256',
  'VERCEL_AUTOMATION_BYPASS_SECRET',
];

if (!fs.existsSync(staticRoot)) {
  console.error('Client secret scan blocked: .next/static is missing; run a production build first.');
  process.exit(1);
}

const envRead = new RegExp(
  String.raw`(?:process\.env|[\w$]+\.default\.env)\.(?:${serverOnlyEnv.join('|')})\b`,
);
const hits = [];
let filesScanned = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.(?:js|mjs|json|map)$/.test(entry.name)) continue;
    filesScanned += 1;
    const source = fs.readFileSync(file, 'utf8');
    for (const literal of forbiddenLiterals) {
      if (source.includes(literal)) hits.push({ file: path.relative(root, file), kind: 'credential literal' });
    }
    if (envRead.test(source)) {
      hits.push({ file: path.relative(root, file), kind: 'server-only environment read' });
    }
  }
}

walk(staticRoot);
console.log(JSON.stringify({ filesScanned, forbiddenClientCredentialReferences: hits.length, hits }, null, 2));
if (hits.length) process.exit(1);
