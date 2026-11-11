import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  TB3_PAYPAL_SANDBOX_TEST_BRANCH,
  TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID,
  isTb3SandboxLedgerTarget,
  isTb3SandboxTestCheckoutEnabled,
  resolveTb3SandboxTestCart,
} from "../lib/tb3/paypal-sandbox-test-item";
import { createPayPalHandlers } from "../lib/tb3/paypal-http";
import type { PayPalRuntime } from "../lib/tb3/paypal-http";
import { hasTb3SandboxTestSession, issueTb3SandboxTestCookie, TB3_SANDBOX_TEST_COOKIE, verifyTb3SandboxTestToken } from "../lib/tb3/paypal-sandbox-test-session";
import { runTb3SandboxPayeeDiagnostic, TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID } from "../lib/tb3/paypal-sandbox-payee-diagnostic";

const sandboxUrl = "postgresql://ea_merchant_api.jkoasrnjlehjziynxfrn:fixture@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require";
const enabled = {
  vercelEnv: "preview",
  branch: TB3_PAYPAL_SANDBOX_TEST_BRANCH,
  paypalEnv: "sandbox",
  checkoutEnabled: "true",
  testItemEnabled: "true",
  databaseUrl: sandboxUrl,
};

test("synthetic checkout requires the exact Preview branch, Sandbox mode, and isolated ledger", () => {
  assert.equal(isTb3SandboxLedgerTarget(sandboxUrl), true);
  assert.equal(isTb3SandboxLedgerTarget(sandboxUrl.replace("jkoasrnjlehjziynxfrn", "dwygvwnjjaennksddniu")), false);
  assert.equal(isTb3SandboxLedgerTarget(sandboxUrl.replace("sslmode=require", "sslmode=disable")), false);
  assert.equal(isTb3SandboxTestCheckoutEnabled(enabled), true);
  for (const change of [
    { vercelEnv: "production" },
    { branch: "work/another-branch" },
    { paypalEnv: "live" },
    { checkoutEnabled: "false" },
    { testItemEnabled: "false" },
    { databaseUrl: sandboxUrl.replace("jkoasrnjlehjziynxfrn", "dwygvwnjjaennksddniu") },
    { printfulDraftApproved: "true" },
    { printfulAutoApproved: "true" },
  ]) {
    assert.equal(isTb3SandboxTestCheckoutEnabled({ ...enabled, ...change }), false);
  }
});

test("test cart accepts only one fixed synthetic item and invents no Printful mapping", () => {
  const lines = resolveTb3SandboxTestCart([{ variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID, quantity: 1 }]);
  assert.deepEqual(lines, [{
    productId: 0,
    variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID,
    catalogVariantId: 0,
    name: "TB3 Sandbox certification test item",
    size: "No fulfillment",
    image: "",
    quantity: 1,
    unitAmount: 1,
    currency: "usd",
  }]);
  for (const cart of [
    [{ variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID, quantity: 2 }],
    [{ variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID, quantity: 1 }, { variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID, quantity: 1 }],
    [{ variantId: 1, quantity: 1 }],
  ]) assert.throws(() => resolveTb3SandboxTestCart(cart));
});

test("private test page remains gated and storefront Coming Soon remains untouched", () => {
  const page = readFileSync("app/tarris/sandbox-certification/page.tsx", "utf8");
  assert.match(page, /runtime\?\.sandboxTestItem/);
  assert.match(page, /runtime\.config\.mode !== "sandbox"/);
  assert.match(page, /authorize\(request, false\)/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  const checkoutPage = readFileSync("app/tarris/paypal-checkout/page.tsx", "utf8");
  assert.match(checkoutPage, /runtime\.sandboxTestItem\) notFound\(\)/);
  const storefront = readFileSync("app/tarris/page.tsx", "utf8");
  assert.match(storefront, /COMING SOON/);
  assert.match(storefront, /Online checkout is not open yet/);
  assert.doesNotMatch(storefront, /sandbox-certification/);
});

test("synthetic Sandbox checkout endpoints require the existing Tarris HQ authorization", async () => {
  const calls = { creates: 0, captures: 0, cancels: 0 };
  const runtime = {
    sandboxTestItem: true,
    config: { mode: "sandbox", clientId: "public-test-client", secret: "hidden", merchantId: "MERCHANT123", webhookId: "WEBHOOK123", origin: "https://preview.example" },
    service: {
      async create() { calls.creates++; return { orderId: "ORDER123", total: "5.01" }; },
      async capture() { calls.captures++; return { status: "paid", fulfillment: "simulated" }; },
      async cancel() { calls.cancels++; return { status: "cancelled" }; },
      async webhook() { return { status: "paid" }; },
    },
    async verify() { return true; },
  } as unknown as PayPalRuntime;
  const handlers = createPayPalHandlers(
    () => runtime,
    () => true,
    async (request) => {
      if (request.headers.get("x-test-hq") !== "authorized") throw new Error("HQ access denied");
    },
  );
  const deniedConfig = await handlers.config(new Request("https://preview.example/api/tb3/paypal/config"));
  assert.equal(deniedConfig.status, 403);
  const deniedCreate = await handlers.create(new Request("https://preview.example/api/tb3/paypal/orders", {
    method: "POST",
    headers: { origin: "https://preview.example", "content-type": "application/json" },
    body: "{}",
  }));
  assert.equal(deniedCreate.status, 403);
  assert.equal(calls.creates, 0);
  const deniedCapture = await handlers.capture(new Request("https://preview.example/api/tb3/paypal/capture", {
    method: "POST",
    headers: { origin: "https://preview.example", "content-type": "application/json" },
    body: "{}",
  }));
  const deniedCancel = await handlers.cancel(new Request("https://preview.example/api/tb3/paypal/cancel", {
    method: "POST",
    headers: { origin: "https://preview.example", "content-type": "application/json" },
    body: "{}",
  }));
  assert.equal(deniedCapture.status, 403);
  assert.equal(deniedCancel.status, 403);
  assert.deepEqual(calls, { creates: 0, captures: 0, cancels: 0 });
  const allowedConfig = await handlers.config(new Request("https://preview.example/api/tb3/paypal/config", {
    headers: { "x-test-hq": "authorized" },
  }));
  assert.equal(allowedConfig.status, 200);
  assert.deepEqual(await allowedConfig.json(), { available: true, clientId: "public-test-client", currency: "USD" });
});

test("temporary test identity is Preview-session-only, expires, and grants no HQ data access", async () => {
  const now = Date.now();
  const expires = Math.floor(now / 1000) + 600;
  const token = `tb3sbx.${expires}.${Buffer.alloc(32, 7).toString("base64url")}`;
  const verifier = createHash("sha256").update(token).digest("hex");
  assert.ok(verifyTb3SandboxTestToken(token, verifier, now));
  assert.equal(verifyTb3SandboxTestToken(token, verifier, now + 601_000), null);
  assert.equal(verifyTb3SandboxTestToken(token, "0".repeat(64), now), null);
  const session = issueTb3SandboxTestCookie(token, verifier, now);
  assert.ok(session);
  assert.ok(session.maxAge <= 15 * 60);
  const cookie = `${TB3_SANDBOX_TEST_COOKIE}=${session.value}`;
  assert.equal(hasTb3SandboxTestSession(new Request("https://preview.example/tarris/sandbox-certification", { headers: { cookie } }), verifier, now + 1_000), true);
  assert.equal(hasTb3SandboxTestSession(new Request("https://preview.example/tarris/sandbox-certification", { headers: { cookie: cookie + "x" } }), verifier, now + 1_000), false);
  assert.equal(hasTb3SandboxTestSession(new Request("https://preview.example/tarris/sandbox-certification", { headers: { cookie } }), verifier, now + 901_000), false);

  const calls = { creates: 0 };
  const runtime = {
    sandboxTestItem: true,
    config: { mode: "sandbox", clientId: "public-test-client", secret: "hidden", merchantId: "MERCHANT123", webhookId: "WEBHOOK123", origin: "https://preview.example" },
    service: { async create(input: unknown) { calls.creates++; assert.deepEqual(input, { cart: [{ variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID, quantity: 1 }] }); return { orderId: "ORDER123", total: "5.01" }; }, async capture() { return { status: "paid" }; }, async cancel() { return { status: "cancelled" }; }, async webhook() { return { status: "paid" }; } },
    async verify() { return true; },
  } as unknown as PayPalRuntime;
  const handlers = createPayPalHandlers(
    () => runtime,
    () => true,
    async (request) => { if (!hasTb3SandboxTestSession(request, verifier, now + 1_000)) throw new Error("not authorized"); },
    () => verifier,
  );
  const exchange = await handlers.sandboxTestSession(new Request("https://preview.example/api/tb3/paypal/sandbox-test-session", {
    method: "POST", headers: { origin: "https://preview.example", "content-type": "application/json" }, body: JSON.stringify({ token }),
  }));
  assert.equal(exchange.status, 204);
  assert.equal(await exchange.text(), "");
  const setCookie = exchange.headers.get("set-cookie") || "";
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.doesNotMatch(setCookie, new RegExp(token));
  const cookiePair = setCookie.split(";", 1)[0];
  const denied = await handlers.config(new Request("https://preview.example/api/tb3/paypal/config"));
  assert.equal(denied.status, 403);
  const allowed = await handlers.config(new Request("https://preview.example/api/tb3/paypal/config", { headers: { cookie: cookiePair } }));
  assert.equal(allowed.status, 200);
  const create = await handlers.create(new Request("https://preview.example/api/tb3/paypal/orders", {
    method: "POST", headers: { origin: "https://preview.example", cookie: cookiePair, "content-type": "application/json" },
    body: JSON.stringify({ cart: [{ variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID, quantity: 1 }] }),
  }));
  assert.equal(create.status, 200);
  assert.equal(calls.creates, 1);
  const wrongOrigin = await handlers.sandboxTestSession(new Request("https://preview.example/api/tb3/paypal/sandbox-test-session", {
    method: "POST", headers: { origin: "https://attacker.example", "content-type": "application/json" }, body: JSON.stringify({ token }),
  }));
  assert.equal(wrongOrigin.status, 403);
});

test("no-payee diagnostic creates only an unapproved $5.01 Sandbox order and reports returned identity safely", async () => {
  const calls: { path: string; method?: string; body?: any; requestId?: string }[] = [];
  const result = await runTb3SandboxPayeeDiagnostic(async (path, method, body, requestId) => {
    calls.push({ path, method, body, requestId });
    return {
      id: "ORDERSECRET123",
      status: "CREATED",
      intent: "CAPTURE",
      purchase_units: [{
        payee: { merchant_id: TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID },
        amount: { currency_code: "USD", value: "5.01", breakdown: {
          item_total: { value: "0.01" }, shipping: { value: "5.00" }, tax_total: { value: "0.00" },
        } },
      }],
    };
  }, TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID, Date.UTC(2026, 10, 11));
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.path, "/v2/checkout/orders");
  assert.equal(calls[0]?.method, "POST");
  assert.equal(calls[0]?.body?.intent, "CAPTURE");
  assert.equal(calls[0]?.body?.purchase_units[0]?.amount?.value, "5.01");
  assert.equal(calls[0]?.body?.purchase_units[0]?.amount?.breakdown?.item_total?.value, "0.01");
  assert.equal(calls[0]?.body?.purchase_units[0]?.amount?.breakdown?.shipping?.value, "5.00");
  assert.equal(Object.hasOwn(calls[0]?.body?.purchase_units[0] ?? {}, "payee"), false);
  assert.equal(calls[0]?.requestId, "tb3-no-payee-20261111");
  assert.equal(result.orderCreated, true);
  assert.equal(result.explicitPayeeOmitted, true);
  assert.equal(result.paymentCaptured, false);
  assert.equal(result.merchantMatchesExpected, true);
  assert.equal(result.merchantIdentitySource, "create_response");
  assert.doesNotMatch(JSON.stringify(result), /ORDERSECRET123|5GQFCP4FK79CU/);
});

test("no-payee diagnostic reads identity only when omitted from create response and fails closed on wrong merchant config", async () => {
  const calls: string[] = [];
  const result = await runTb3SandboxPayeeDiagnostic(async (path) => {
    calls.push(path);
    return path === "/v2/checkout/orders"
      ? { id: "ORDERSECRET123", status: "CREATED", intent: "CAPTURE", purchase_units: [{}] }
      : { id: "ORDERSECRET123", purchase_units: [{ payee: { merchant_id: "5GQFCP4FK79CU" } }] };
  }, TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID, Date.UTC(2026, 10, 11));
  assert.deepEqual(calls, ["/v2/checkout/orders", "/v2/checkout/orders/ORDERSECRET123"]);
  assert.equal(result.merchantMatchesExpected, true);
  assert.equal(result.merchantIdentitySource, "readback");

  let called = false;
  await assert.rejects(
    runTb3SandboxPayeeDiagnostic(async () => { called = true; return {}; }, "OTHER_MERCHANT"),
    /preflight failed/,
  );
  assert.equal(called, false);
});

test("no-payee diagnostic route is Preview-only, session protected, same-origin, and never exposes provider identifiers", async () => {
  const calls = { diagnostic: 0 };
  const runtime = {
    sandboxTestItem: true,
    config: { mode: "sandbox", clientId: "client-hidden", secret: "secret-hidden", merchantId: TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID, webhookId: "webhook-hidden", origin: "https://preview.example" },
    service: {},
    async verify() { return true; },
    async sandboxPayeeDiagnostic() { calls.diagnostic++; return { orderCreated: true, orderId: "NEVER-RETURN-THIS", merchantIdentityReturned: true, merchantMatchesExpected: true }; },
  } as unknown as PayPalRuntime;
  const verifier = createHash("sha256").update("unused").digest("hex");
  const token = `tb3sbx.${Math.floor(Date.now() / 1000) + 600}.${Buffer.alloc(32, 8).toString("base64url")}`;
  const session = issueTb3SandboxTestCookie(token, createHash("sha256").update(token).digest("hex"));
  assert.ok(session);
  const cookie = `${TB3_SANDBOX_TEST_COOKIE}=${session.value}`;
  const handlers = createPayPalHandlers(
    () => runtime,
    () => true,
    async (request) => { if (!hasTb3SandboxTestSession(request, createHash("sha256").update(token).digest("hex"))) throw new Error("denied"); },
    () => verifier,
    () => process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === TB3_PAYPAL_SANDBOX_TEST_BRANCH,
  );
  const request = (headers: Record<string, string> = {}) => new Request("https://preview.example/api/tb3/paypal/sandbox-payee-diagnostic", {
    method: "POST", headers: { origin: "https://preview.example", ...headers },
  });
  const oldEnv = { env: process.env.VERCEL_ENV, branch: process.env.VERCEL_GIT_COMMIT_REF };
  try {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_GIT_COMMIT_REF = TB3_PAYPAL_SANDBOX_TEST_BRANCH;
    assert.equal((await handlers.sandboxPayeeDiagnostic(request({ cookie }))).status, 404);
    process.env.VERCEL_ENV = "preview";
    assert.equal((await handlers.sandboxPayeeDiagnostic(request())).status, 403);
    assert.equal((await handlers.sandboxPayeeDiagnostic(request({ cookie, origin: "https://attacker.example" }))).status, 403);
    const response = await handlers.sandboxPayeeDiagnostic(request({ cookie }));
    assert.equal(response.status, 200);
    const responseText = await response.text();
    assert.match(responseText, /"merchantMatchesExpected":true/);
    assert.doesNotMatch(responseText, /NEVER-RETURN-THIS|client-hidden|secret-hidden|webhook-hidden/);
    assert.equal(calls.diagnostic, 1);
  } finally {
    if (oldEnv.env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = oldEnv.env;
    if (oldEnv.branch === undefined) delete process.env.VERCEL_GIT_COMMIT_REF; else process.env.VERCEL_GIT_COMMIT_REF = oldEnv.branch;
  }
});
