#!/usr/bin/env node
/**
 * Bootstrap .env.test.local for commercial TEST certification.
 * Copies Airtable/session secrets from .env.local; generates local whsec.
 * Does NOT invent Stripe/Resend secrets — leaves REPLACE placeholders.
 */
import { bootstrapTestEnvFile, loadCommercialTestEnv, assertTestCommercialReady, auditCommercialEnv } from './lib/commercial-test-env.mjs';

const boot = bootstrapTestEnvFile();
loadCommercialTestEnv();
const gate = assertTestCommercialReady(process.env);
const audit = auditCommercialEnv(process.env);
const missing = audit.filter((r) => r.highlight && r.required);

console.log(
  JSON.stringify(
    {
      ok: gate.ok,
      boot,
      gate,
      missingRequired: missing.map((r) => ({ variable: r.variable, status: r.safe, test: r.test })),
      next: gate.ok
        ? 'Ready — run: node scripts/run-test-commercial-money-loop.mjs'
        : 'Fill REPLACE placeholders in .env.test.local (Stripe TEST + Resend), then re-run bootstrap or money loop.',
    },
    null,
    2,
  ),
);
process.exit(gate.ok ? 0 : 2);
