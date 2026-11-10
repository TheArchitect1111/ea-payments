import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createTb3PayPalLedgerDiagnosticHandler,
  verifyTb3LedgerDiagnosticToken,
  type Tb3LedgerDiagnosticClient,
} from "../lib/tb3/paypal-ledger-diagnostic-handler";

const branch = "work/tb3-commerce-hq-20261109";
const token = "x".repeat(48);
const verifier = createHash("sha256").update(token).digest("hex");
const sandboxUrl = "postgresql://ea_merchant_api.jkoasrnjlehjziynxfrn:fixture@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require";
const request = () => new Request("https://preview.example/api/tb3/paypal/ledger-diagnostic", {
  headers: { "x-tb3-ledger-diagnostic-token": token },
});

function fixture(overrides: Record<string, unknown> = {}) {
  const calls: string[] = [];
  const client: Tb3LedgerDiagnosticClient = {
    async connect() { calls.push("CONNECT"); },
    async query(sql) {
      calls.push(sql);
      if (sql === "BEGIN READ ONLY" || sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("FROM pg_class c JOIN pg_namespace")) return { rows: [{ rls: true, forced: true, columns: ["id", "tenant_slug", "payload", "paypal_id", "capture_id", "updated_at"] }] };
      if (sql.includes("FROM pg_index i")) return { rows: [
        { primary: true, unique: true, columns: ["id"] },
        { primary: false, unique: true, columns: ["paypal_id"] },
        { primary: false, unique: true, columns: ["capture_id"] },
      ] };
      if (sql.includes("FROM pg_policies")) return { rows: [{ policyname: "tb3_paypal_server_only", roles: ["ea_merchant_api"], cmd: "ALL", qual: "(tenant_slug = 'tarris'::text)", with_check: "(tenant_slug = 'tarris'::text)" }] };
      if (sql.includes("has_table_privilege")) return { rows: [{ actual_role: "ea_merchant_api", api_select: true, api_insert: true, api_update: true, api_delete: false, api_truncate: false, api_references: false, api_trigger: false, anon_select: false, anon_insert: false, anon_update: false, anon_delete: false, authenticated_select: false, authenticated_insert: false, authenticated_update: false, authenticated_delete: false, service_select: false, service_insert: false, service_update: false, service_delete: false, public_acl: false }] };
      throw new Error("Unexpected query");
    },
    async end() {},
  };
  const env = { vercel: "preview", branch, checkoutEnabled: undefined, printfulDraftApproved: undefined, printfulAutoApproved: undefined, ...overrides };
  const handler = createTb3PayPalLedgerDiagnosticHandler({
    environment: () => env,
    diagnosticTokenSha256: () => verifier,
    sandboxDatabaseUrl: () => sandboxUrl,
    databaseCa: () => "test-ca",
    connect: async (url, ca) => {
      const parsed = new URL(url);
      assert.equal(parsed.username, "ea_merchant_api.jkoasrnjlehjziynxfrn");
      assert.equal(parsed.password, "fixture");
      assert.equal(ca, "test-ca");
      return client;
    },
  });
  return { handler, calls, env };
}

test("diagnostic token is constant-time digest checked and malformed inputs fail", () => {
  assert.equal(verifyTb3LedgerDiagnosticToken(token, verifier), true);
  assert.equal(verifyTb3LedgerDiagnosticToken("wrong", verifier), false);
  assert.equal(verifyTb3LedgerDiagnosticToken(token, undefined), false);
  assert.equal(verifyTb3LedgerDiagnosticToken(token, "bad"), false);
});

test("production and other branches are rejected before secrets or database access", async () => {
  for (const env of [{ vercel: "production", branch }, { vercel: "preview", branch: "other" }]) {
    let secretReads = 0;
    let connects = 0;
    const handler = createTb3PayPalLedgerDiagnosticHandler({
      environment: () => ({ ...env, checkoutEnabled: undefined, printfulDraftApproved: undefined, printfulAutoApproved: undefined }),
      diagnosticTokenSha256: () => { secretReads++; return verifier; },
      sandboxDatabaseUrl: () => { secretReads++; return sandboxUrl; },
      databaseCa: () => { secretReads++; return "ca"; },
      connect: async () => { connects++; throw new Error("unexpected"); },
    });
    const response = await handler(request());
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { status: "FAIL" });
    assert.equal(secretReads, 0);
    assert.equal(connects, 0);
  }
});

test("unauthorized, checkout-enabled, or Printful-approved calls fail before connecting", async () => {
  let connects = 0;
  const base = {
    environment: () => ({ vercel: "preview", branch, checkoutEnabled: undefined, printfulDraftApproved: undefined, printfulAutoApproved: undefined }),
    diagnosticTokenSha256: () => verifier,
    sandboxDatabaseUrl: () => sandboxUrl,
    databaseCa: () => "ca",
    connect: async () => { connects++; throw new Error("unexpected"); },
  };
  const unauthorized = createTb3PayPalLedgerDiagnosticHandler({ ...base, diagnosticTokenSha256: () => undefined });
  assert.equal((await unauthorized(new Request(request().url))).status, 401);
  for (const change of [{ checkoutEnabled: "true" }, { printfulDraftApproved: "true" }, { printfulAutoApproved: "true" }]) {
    const handler = createTb3PayPalLedgerDiagnosticHandler({ ...base, environment: () => ({ ...base.environment(), ...change }) });
    assert.equal((await handler(request())).status, 503);
  }
  assert.equal(connects, 0);
});

test("Production, unknown, malformed, and missing database targets fail before connection", async () => {
  let connects = 0;
  for (const url of [
    "postgresql://ea_merchant_api.dwygvwnjjaennksddniu:fixture@aws-0-us-east-2.pooler.supabase.com/postgres",
    "postgresql://ea_merchant_api.otherproject:fixture@aws-0-us-east-2.pooler.supabase.com/postgres",
    "postgresql://ea_merchant_api.jkoasrnjlehjziynxfrn:fixture@db.dwygvwnjjaennksddniu.supabase.co/postgres",
    "postgresql://ea_merchant_api.jkoasrnjlehjziynxfrn:fixture@aws-0-us-east-2.pooler.supabase.com/postgres?sslmode=disable",
    "not-a-url",
    "",
  ]) {
    const handler = createTb3PayPalLedgerDiagnosticHandler({
      environment: () => ({ vercel: "preview", branch, checkoutEnabled: undefined, printfulDraftApproved: undefined, printfulAutoApproved: undefined }),
      diagnosticTokenSha256: () => verifier,
      sandboxDatabaseUrl: () => url,
      databaseCa: () => undefined,
      connect: async () => { connects++; throw new Error("unexpected"); },
    });
    assert.equal((await handler(request())).status, 503);
  }
  assert.equal(connects, 0);
});

test("connected database ledger, RLS, tenant policy, and least privilege pass with no writes or row reads", async () => {
  const f = fixture();
  const response = await f.handler(request());
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const result = await response.json();
  assert.deepEqual(result, {
    status: "PASS",
    checks: {
      previewBranch: true,
      sandboxProject: true,
      productionExcluded: true,
      databaseConnected: true,
      ledgerExists: true,
      requiredColumns: true,
      primaryAndProviderUniqueKeys: true,
      rlsEnabled: true,
      rlsForced: true,
      tenantPolicy: true,
      restrictedRoleAccess: true,
      checkoutDisabled: true,
      printfulSubmissionDisabled: true,
    },
  });
  assert.equal(f.calls[0], "CONNECT");
  assert.equal(f.calls[1], "BEGIN READ ONLY");
  assert.equal(f.calls.at(-1), "ROLLBACK");
  assert.equal(f.calls.filter((sql) => /^(INSERT|UPDATE|DELETE|COMMIT)/i.test(sql)).length, 0);
  assert.equal(f.calls.filter((sql) => /SELECT\s+payload\s+FROM\s+public\.tb3_paypal_orders/i.test(sql)).length, 0);
  assert.doesNotMatch(JSON.stringify(result), /fixture|password|postgresql|jkoasrnjlehjziynxfrn/);
});

test("local route is Preview-only, imports no payment/fulfillment provider, and never returns row payloads", () => {
  const route = readFileSync("app/api/tb3/paypal/ledger-diagnostic/route.ts", "utf8");
  assert.match(route, /TB3_PAYPAL_SANDBOX_DATABASE_URL/);
  assert.match(route, /TB3_PAYPAL_DB_DIAGNOSTIC_TOKEN_SHA256/);
  assert.doesNotMatch(route, /paypalTransport|paypalService|tb3Printful|paypalLedger/);
  const handler = readFileSync("lib/tb3/paypal-ledger-diagnostic-handler.ts", "utf8");
  assert.match(handler, /BEGIN READ ONLY/);
  assert.match(handler, /ROLLBACK/);
  assert.doesNotMatch(handler, /SELECT\s+payload\s+FROM\s+public\.tb3_paypal_orders/i);
});
