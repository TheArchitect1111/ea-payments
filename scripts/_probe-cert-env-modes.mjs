#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve(process.cwd(), process.argv[2] || '.env.cert.local');
if (!existsSync(path)) {
  console.log(JSON.stringify({ _file: 'MISSING', path }, null, 2));
  process.exit(0);
}

const raw = readFileSync(path, 'utf8');
const keys = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_WEBSITE_PORTAL_STARTER',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'AIRTABLE_API_KEY',
  'AIRTABLE_PLATFORM_BASE_ID',
  'AIRTABLE_PAYMENTS_BASE_ID',
  'SESSION_SECRET',
  'ADMIN_SESSION_SECRET',
  'AIRTABLE_CREATIVE_STUDIO_TABLE',
  'NEXT_PUBLIC_BASE_URL',
  'SUPPORT_EMAIL',
];

function mode(k, v) {
  if (!v) return 'MISSING';
  if (v.startsWith('sk_test')) return 'SET:test';
  if (v.startsWith('sk_live')) return 'SET:live';
  if (v.startsWith('pk_test')) return 'SET:pk_test';
  if (v.startsWith('pk_live')) return 'SET:pk_live';
  if (v.startsWith('whsec_')) return 'SET:whsec';
  if (v.startsWith('price_')) return 'SET:price';
  if (v.startsWith('re_')) return 'SET:resend';
  return `SET:len${v.length}`;
}

const out = { _file: path };
for (const k of keys) {
  const m = raw.match(new RegExp(`^${k}=(.*)$`, 'm'));
  const v = m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  out[k] = mode(k, v);
}
console.log(JSON.stringify(out, null, 2));
