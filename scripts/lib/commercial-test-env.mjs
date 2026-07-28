/**
 * Shared TEST commercial env loader + safety gates.
 * Used only by certification scripts — does not change app architecture.
 */
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const ROOT = resolve(process.cwd());
export const TEST_ENV_PATH = resolve(ROOT, '.env.test.local');
export const LOCAL_ENV_PATH = resolve(ROOT, '.env.local');

const COPY_FROM_LOCAL = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_PAT',
  'AIRTABLE_PAYMENTS_BASE_ID',
  'AIRTABLE_PLATFORM_BASE_ID',
  'AIRTABLE_CLIENT_RECORDS_TABLE_ID',
  'AIRTABLE_CTP_SUBMISSIONS_TABLE',
  'AIRTABLE_CREATIVE_STUDIO_TABLE',
  'SESSION_SECRET',
  'ADMIN_SESSION_SECRET',
  'SUPPORT_EMAIL',
  'ADMIN_NOTIFICATION_EMAIL',
];

/** @param {string} path */
export function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

/** Load process.env overlays: .env.local then .env.test.local (test wins). */
export function loadCommercialTestEnv() {
  const local = parseEnvFile(LOCAL_ENV_PATH);
  const test = parseEnvFile(TEST_ENV_PATH);
  const merged = { ...local, ...test };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== '') process.env[k] = v;
  }
  process.env.EA_COMMERCIAL_CERT_MODE = 'test';
  return { local, test, merged };
}

/**
 * Classify a secret without printing it.
 * @param {string | undefined} value
 * @param {'stripe_secret'|'stripe_pk'|'whsec'|'resend'|'generic'} kind
 */
export function classifyValue(value, kind = 'generic') {
  const v = (value || '').trim();
  if (!v) return { present: false, mode: 'missing', safe: 'MISSING' };
  // Placeholders must lose before prefix checks (sk_test_REPLACE is not a real key).
  if (/REPLACE|your_|changeme|xxx/i.test(v)) {
    return { present: false, mode: 'placeholder', safe: 'PLACEHOLDER' };
  }
  if (kind === 'stripe_secret') {
    if (v.startsWith('sk_test') && v.length > 20) return { present: true, mode: 'test', safe: 'SET:test' };
    if (v.startsWith('sk_live') && v.length > 20) return { present: true, mode: 'live', safe: 'SET:live' };
    if (v.startsWith('sk_test') || v.startsWith('sk_live'))
      return { present: false, mode: 'placeholder', safe: 'PLACEHOLDER' };
    return { present: true, mode: 'unknown', safe: `SET:len${v.length}` };
  }
  if (kind === 'stripe_pk') {
    if (v.startsWith('pk_test') && v.length > 20) return { present: true, mode: 'test', safe: 'SET:pk_test' };
    if (v.startsWith('pk_live') && v.length > 20) return { present: true, mode: 'live', safe: 'SET:pk_live' };
    if (v.startsWith('pk_test') || v.startsWith('pk_live'))
      return { present: false, mode: 'placeholder', safe: 'PLACEHOLDER' };
    return { present: true, mode: 'unknown', safe: `SET:len${v.length}` };
  }
  if (kind === 'whsec') {
    if (v.startsWith('whsec_') && v.length > 20) return { present: true, mode: 'ok', safe: 'SET:whsec' };
    return { present: false, mode: 'missing', safe: 'MISSING' };
  }
  if (kind === 'resend') {
    if (v.startsWith('re_') && v.length > 10) return { present: true, mode: 'ok', safe: 'SET:resend' };
    return { present: false, mode: 'missing', safe: 'MISSING' };
  }
  return { present: true, mode: 'ok', safe: `SET:len${v.length}` };
}

export function auditCommercialEnv(env = process.env) {
  const rows = [
    {
      variable: 'STRIPE_SECRET_KEY',
      purpose: 'Stripe API (checkout + webhook retrieve)',
      required: true,
      ...classifyValue(env.STRIPE_SECRET_KEY, 'stripe_secret'),
      default: '',
      production: 'sk_live_…',
      development: 'optional',
      test: 'sk_test_… REQUIRED',
    },
    {
      variable: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      purpose: 'Stripe.js / Checkout publishable key',
      required: true,
      ...classifyValue(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, 'stripe_pk'),
      default: '',
      production: 'pk_live_…',
      development: 'optional',
      test: 'pk_test_… REQUIRED',
    },
    {
      variable: 'STRIPE_WEBHOOK_SECRET',
      purpose: 'Verify Stripe webhook signatures',
      required: true,
      ...classifyValue(env.STRIPE_WEBHOOK_SECRET, 'whsec'),
      default: '',
      production: 'whsec_ live endpoint',
      development: 'stripe listen',
      test: 'whsec_ local or test endpoint REQUIRED',
    },
    {
      variable: 'STRIPE_PRICE_WEBSITE_PORTAL_STARTER',
      purpose: 'Price ID for Website + Portal (optional if inline price)',
      required: false,
      ...classifyValue(env.STRIPE_PRICE_WEBSITE_PORTAL_STARTER, 'generic'),
      default: 'inline price_data ($2,497)',
      production: 'price_…',
      development: 'optional',
      test: 'optional (inline allowed)',
    },
    {
      variable: 'RESEND_API_KEY',
      purpose: 'Send welcome / payment emails',
      required: true,
      ...classifyValue(env.RESEND_API_KEY, 'resend'),
      default: '',
      production: 're_…',
      development: 're_…',
      test: 're_… REQUIRED',
    },
    {
      variable: 'RESEND_FROM_EMAIL',
      purpose: 'From address for customer email',
      required: true,
      ...classifyValue(env.RESEND_FROM_EMAIL, 'generic'),
      default: '',
      production: 'EA <…@domain>',
      development: 'onboarding@resend.dev ok',
      test: 'must include @',
    },
    {
      variable: 'AIRTABLE_API_KEY',
      purpose: 'Client records, orgs, CTP, sites',
      required: true,
      ...classifyValue(env.AIRTABLE_API_KEY || env.AIRTABLE_PAT, 'generic'),
      default: '',
      production: 'pat/key',
      development: 'pat/key',
      test: 'same base as cert data',
    },
    {
      variable: 'AIRTABLE_PAYMENTS_BASE_ID',
      purpose: 'Payments / client records base',
      required: false,
      ...classifyValue(env.AIRTABLE_PAYMENTS_BASE_ID, 'generic'),
      default: 'appv0YoLIMY45fmDA',
      production: 'set',
      development: 'set',
      test: 'set or default',
    },
    {
      variable: 'AIRTABLE_PLATFORM_BASE_ID',
      purpose: 'Organizations / platform store',
      required: false,
      ...classifyValue(env.AIRTABLE_PLATFORM_BASE_ID, 'generic'),
      default: 'often same payments base',
      production: 'set',
      development: 'set',
      test: 'required for durable orgs',
    },
    {
      variable: 'SESSION_SECRET',
      purpose: 'Portal HMAC sessions',
      required: true,
      ...classifyValue(env.SESSION_SECRET, 'generic'),
      default: '',
      production: 'set',
      development: 'set',
      test: 'set',
    },
    {
      variable: 'ADMIN_SESSION_SECRET',
      purpose: 'Magic links + admin HMAC',
      required: true,
      ...classifyValue(env.ADMIN_SESSION_SECRET, 'generic'),
      default: '',
      production: 'set',
      development: 'set',
      test: 'set',
    },
    {
      variable: 'NEXT_PUBLIC_BASE_URL',
      purpose: 'Checkout success/cancel + email links',
      required: true,
      ...classifyValue(env.NEXT_PUBLIC_BASE_URL, 'generic'),
      default: 'http://localhost:3000',
      production: 'https://efficiencyarchitects.online',
      development: 'http://localhost:3000',
      test: 'http://localhost:3000',
    },
    {
      variable: 'EA_COMMERCIAL_CERT_MODE',
      purpose: 'Marks cert TEST run',
      required: true,
      ...classifyValue(env.EA_COMMERCIAL_CERT_MODE, 'generic'),
      default: '',
      production: 'unset',
      development: 'unset',
      test: 'test',
    },
  ];

  return rows.map((r) => ({
    ...r,
    present: r.present && r.mode !== 'placeholder',
    highlight: !r.present || r.mode === 'live' || r.mode === 'placeholder' || r.mode === 'missing',
  }));
}

/**
 * Fail closed before any checkout. Returns { ok, errors[], warnings[], stripeMode }.
 */
export function assertTestCommercialReady(env = process.env) {
  const errors = [];
  const warnings = [];
  const sk = classifyValue(env.STRIPE_SECRET_KEY, 'stripe_secret');
  const pk = classifyValue(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, 'stripe_pk');
  const wh = classifyValue(env.STRIPE_WEBHOOK_SECRET, 'whsec');
  const rk = classifyValue(env.RESEND_API_KEY, 'resend');
  const from = classifyValue(env.RESEND_FROM_EMAIL, 'generic');
  const airtable = classifyValue(env.AIRTABLE_API_KEY || env.AIRTABLE_PAT, 'generic');
  const session = classifyValue(env.SESSION_SECRET, 'generic');
  const admin = classifyValue(env.ADMIN_SESSION_SECRET, 'generic');

  if (!sk.present) errors.push('STRIPE_SECRET_KEY missing — add sk_test_… to .env.test.local');
  else if (sk.mode === 'live')
    errors.push('STRIPE_SECRET_KEY is LIVE (sk_live). TEST cert refuses LIVE keys.');
  else if (sk.mode !== 'test')
    errors.push('STRIPE_SECRET_KEY must start with sk_test_');

  if (!pk.present) errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing — add pk_test_…');
  else if (pk.mode === 'live')
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is LIVE. TEST cert refuses pk_live.');
  else if (pk.mode !== 'test')
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_test_');

  if (!wh.present)
    errors.push('STRIPE_WEBHOOK_SECRET missing — run bootstrap or set whsec_…');

  if (!rk.present) errors.push('RESEND_API_KEY missing — required for welcome email proof');
  if (!from.present || !(env.RESEND_FROM_EMAIL || '').includes('@'))
    errors.push('RESEND_FROM_EMAIL missing or invalid (must include @)');

  if (!airtable.present) errors.push('AIRTABLE_API_KEY missing — copy from .env.local via bootstrap');
  if (!session.present) errors.push('SESSION_SECRET missing');
  if (!admin.present) errors.push('ADMIN_SESSION_SECRET missing');

  const base = (env.CERT_BASE_URL || env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!base) errors.push('CERT_BASE_URL / NEXT_PUBLIC_BASE_URL missing');
  const isProdHost = /efficiencyarchitects\.online|simplifi\.ai/i.test(base);
  if (isProdHost && env.EA_ALLOW_TEST_AGAINST_PROD !== '1') {
    errors.push(
      `CERT_BASE_URL is production host (${base}). Use http://localhost:3000 or set EA_ALLOW_TEST_AGAINST_PROD=1 intentionally.`,
    );
  }

  if (sk.mode === 'test' && pk.mode === 'test' && sk.present && pk.present) {
    // ok
  } else if (!errors.length) {
    errors.push('Stripe TEST key pair incomplete');
  }

  if (!env.AIRTABLE_PLATFORM_BASE_ID && !env.AIRTABLE_PAYMENTS_BASE_ID) {
    warnings.push(
      'AIRTABLE_PLATFORM_BASE_ID unset — durable Organizations may fail (fail-closed is correct).',
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stripeMode: sk.mode,
    baseUrl: base || 'http://localhost:3000',
  };
}

/** Create/update .env.test.local skeleton. Never writes LIVE keys. */
export function bootstrapTestEnvFile() {
  const local = parseEnvFile(LOCAL_ENV_PATH);
  const existing = parseEnvFile(TEST_ENV_PATH);
  const whsec =
    existing.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') &&
    !existing.STRIPE_WEBHOOK_SECRET.includes('REPLACE')
      ? existing.STRIPE_WEBHOOK_SECRET
      : `whsec_cert_${randomBytes(24).toString('hex')}`;

  /** @type {Record<string, string>} */
  const next = {
    EA_COMMERCIAL_CERT_MODE: 'test',
    NEXT_PUBLIC_BASE_URL: existing.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    CERT_BASE_URL: existing.CERT_BASE_URL || 'http://localhost:3000',
    STRIPE_WEBHOOK_SECRET: whsec,
    RESEND_FROM_EMAIL:
      existing.RESEND_FROM_EMAIL ||
      local.RESEND_FROM_EMAIL ||
      'EA Cert <onboarding@resend.dev>',
  };

  for (const key of COPY_FROM_LOCAL) {
    if (existing[key]) next[key] = existing[key];
    else if (local[key]) next[key] = local[key];
  }

  // Preserve TEST stripe/resend if already valid; else placeholders
  const sk = classifyValue(existing.STRIPE_SECRET_KEY, 'stripe_secret');
  const pk = classifyValue(existing.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, 'stripe_pk');
  const rk = classifyValue(existing.RESEND_API_KEY, 'resend');

  next.STRIPE_SECRET_KEY =
    sk.mode === 'test' ? existing.STRIPE_SECRET_KEY : 'sk_test_REPLACE';
  next.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
    pk.mode === 'test' ? existing.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : 'pk_test_REPLACE';
  next.RESEND_API_KEY = rk.present ? existing.RESEND_API_KEY : local.RESEND_API_KEY || 're_REPLACE';

  if (existing.STRIPE_PRICE_WEBSITE_PORTAL_STARTER)
    next.STRIPE_PRICE_WEBSITE_PORTAL_STARTER = existing.STRIPE_PRICE_WEBSITE_PORTAL_STARTER;

  const lines = [
    '# Generated by scripts/bootstrap-commercial-test-env.mjs',
    '# Stripe TEST keys: https://dashboard.stripe.com/test/apikeys',
    '# Replace sk_test_REPLACE / pk_test_REPLACE / re_REPLACE then re-run money loop.',
    '',
  ];
  for (const [k, v] of Object.entries(next)) {
    lines.push(`${k}=${v}`);
  }
  writeFileSync(TEST_ENV_PATH, `${lines.join('\n')}\n`, 'utf8');

  const fingerprint = createHash('sha256')
    .update(JSON.stringify(Object.keys(next).sort()))
    .digest('hex')
    .slice(0, 12);

  return {
    path: TEST_ENV_PATH,
    fingerprint,
    whsecGenerated: !existing.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'),
    needsStripeTestKeys: sk.mode !== 'test',
    needsResend: !rk.present,
    copiedFromLocal: COPY_FROM_LOCAL.filter((k) => Boolean(local[k])),
  };
}
