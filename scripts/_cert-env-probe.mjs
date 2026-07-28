#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.local');
const keys = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_PAT',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_WEBSITE_PORTAL_STARTER',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'ADMIN_SESSION_SECRET',
  'SESSION_SECRET',
  'NEXT_PUBLIC_BASE_URL',
  'LAUNCH_AUTO_APPROVE_PROPOSALS',
  'AIRTABLE_CREATIVE_STUDIO_TABLE',
];

if (!existsSync(envPath)) {
  console.log(JSON.stringify({ _file: 'MISSING .env.local' }, null, 2));
  process.exit(0);
}

const raw = readFileSync(envPath, 'utf8');
const present = {};
for (const k of keys) {
  const m = raw.match(new RegExp(`^${k}=(.+)$`, 'm'));
  const v = m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  if (!v) present[k] = 'MISSING';
  else if (v.startsWith('sk_live')) present[k] = 'SET:live';
  else if (v.startsWith('sk_test')) present[k] = 'SET:test';
  else if (v.startsWith('pk_')) present[k] = 'SET:pk';
  else present[k] = `SET:len${v.length}`;
}
console.log(JSON.stringify(present, null, 2));
