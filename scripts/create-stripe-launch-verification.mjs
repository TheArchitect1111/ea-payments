#!/usr/bin/env node
/**
 * Create Stripe Product + one-time Price for EA Launch Verification ($1.00 USD).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... node scripts/create-stripe-launch-verification.mjs
 *   vercel env run -e production -- node scripts/create-stripe-launch-verification.mjs
 *
 * Outputs STRIPE_PRICE_LAUNCH_VERIFICATION for Vercel.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCT_NAME = 'EA Launch Verification';
const PRICE_CENTS = 100;

function loadEnvFile(filename) {
  const path = resolve(__dirname, '..', filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error('STRIPE_SECRET_KEY is required.');
  process.exit(1);
}

const existingProductId = process.env.STRIPE_PRODUCT_LAUNCH_VERIFICATION?.trim();
const existingPriceId = process.env.STRIPE_PRICE_LAUNCH_VERIFICATION?.trim();

async function stripeRequest(path, method = 'GET', body) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Stripe ${res.status}`);
  }
  return json;
}

async function main() {
  console.log('EA Launch Verification — Stripe setup\n');

  let productId = existingProductId;

  if (productId) {
    console.log('Using existing product:', productId);
  } else {
    const product = await stripeRequest('/products', 'POST', {
      name: PRODUCT_NAME,
      description:
        'One-time $1 payment to verify production checkout, Airtable, email, and webhooks before live launch.',
      'metadata[ea_package_id]': 'launch_verification',
      'metadata[purpose]': 'launch_verification',
    });
    productId = product.id;
    console.log('Created product:', productId);
  }

  if (existingPriceId) {
    console.log('Price already configured:', existingPriceId);
    console.log('\nVercel (if not set):');
    console.log(`  vercel env add STRIPE_PRICE_LAUNCH_VERIFICATION production --value "${existingPriceId}"`);
    return;
  }

  const price = await stripeRequest('/prices', 'POST', {
    product: productId,
    unit_amount: String(PRICE_CENTS),
    currency: 'usd',
    'metadata[ea_package_id]': 'launch_verification',
  });

  console.log('Created price:', price.id, `($${(PRICE_CENTS / 100).toFixed(2)} USD one-time)`);
  console.log('\nAdd to Vercel Production:');
  console.log(`  vercel env add STRIPE_PRODUCT_LAUNCH_VERIFICATION production --value "${productId}"`);
  console.log(`  vercel env add STRIPE_PRICE_LAUNCH_VERIFICATION production --value "${price.id}"`);
  console.log('\nThen redeploy ea-payments.');
  console.log('\nCheckout URL: https://www.efficiencyarchitects.online/launch-verification');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
