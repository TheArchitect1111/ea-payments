import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createPayPalHandlers, type PayPalRuntime } from "../lib/tb3/paypal-http";
import { runTb3SandboxOrderReadDiagnostic, TB3_SANDBOX_ORDER_READ_DIAGNOSTIC_ID } from "../lib/tb3/paypal-sandbox-order-read-diagnostic";
import { issueTb3SandboxTestCookie, TB3_SANDBOX_TEST_COOKIE } from "../lib/tb3/paypal-sandbox-test-session";
import { TB3_PAYPAL_SANDBOX_TEST_BRANCH } from "../lib/tb3/paypal-sandbox-test-item";

test("order diagnostic performs only the fixed provider GET and returns four sanitized facts", async () => {
  const calls: Array<{ path: string; method?: string; body?: unknown }> = [];
  const facts = await runTb3SandboxOrderReadDiagnostic(async (path, method, body) => {
    calls.push({ path, method, body });
    return {
      id: TB3_SANDBOX_ORDER_READ_DIAGNOSTIC_ID,
      status: "APPROVED",
      payer: { email_address: "private@example.invalid", payer_id: "PRIVATE-PAYER" },
      purchase_units: [{
        payee: { merchant_id: "sandbox-merchant" },
        payments: { captures: [] },
      }],
    };
  }, "sandbox-merchant");

  assert.deepEqual(calls, [{ path: `/v2/checkout/orders/${TB3_SANDBOX_ORDER_READ_DIAGNOSTIC_ID}`, method: "GET", body: undefined }]);
  assert.deepEqual(facts, {
    orderStatus: "APPROVED",
    buyerApproved: true,
    capturePresent: false,
    merchantMatches: true,
  });
});

test("route is exact-branch Preview only, certification-session only, same-origin, and response-minimal", async () => {
  const token = `tb3sbx.${Math.floor(Date.now() / 1000) + 600}.${Buffer.alloc(32, 8).toString("base64url")}`;
  const verifier = createHash("sha256").update(token).digest("hex");
  const session = issueTb3SandboxTestCookie(token, verifier);
  assert.ok(session);
  const cookie = `${TB3_SANDBOX_TEST_COOKIE}=${session.value}`;
  let providerCalls = 0;
  const runtime = {
    sandboxTestItem: true,
    config: { mode: "sandbox", origin: "https://preview.example", clientId: "hidden-client", secret: "hidden-secret", merchantId: "hidden-merchant", webhookId: "hidden-webhook" },
    service: {},
    async verify() { return true; },
    async sandboxOrderReadDiagnostic() {
      providerCalls++;
      return {
        orderStatus: "APPROVED",
        buyerApproved: true,
        capturePresent: false,
        merchantMatches: true,
        payer: "PRIVATE-PAYER",
        response: "RAW-PAYPAL-RESPONSE",
      };
    },
  } as unknown as PayPalRuntime;
  const handlers = createPayPalHandlers(
    () => runtime,
    () => true,
    undefined,
    () => verifier,
  );
  const request = (headers: Record<string, string> = {}, method = "GET") => new Request("https://preview.example/api/tb3/paypal/sandbox-order-read-diagnostic", {
    method,
    headers: { origin: "https://preview.example", ...headers },
  });
  const oldEnv = { env: process.env.VERCEL_ENV, branch: process.env.VERCEL_GIT_COMMIT_REF };
  try {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_GIT_COMMIT_REF = TB3_PAYPAL_SANDBOX_TEST_BRANCH;
    assert.equal((await handlers.sandboxOrderReadDiagnostic(request({ cookie }))).status, 404);

    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "another-branch";
    assert.equal((await handlers.sandboxOrderReadDiagnostic(request({ cookie }))).status, 404);

    process.env.VERCEL_GIT_COMMIT_REF = TB3_PAYPAL_SANDBOX_TEST_BRANCH;
    assert.equal((await handlers.sandboxOrderReadDiagnostic(request())).status, 403);
    assert.equal((await handlers.sandboxOrderReadDiagnostic(request({ cookie, origin: "https://attacker.example" }))).status, 403);
    assert.equal((await handlers.sandboxOrderReadDiagnostic(request({ cookie }, "POST"))).status, 405);

    const response = await handlers.sandboxOrderReadDiagnostic(request({ cookie }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      orderStatus: "APPROVED",
      buyerApproved: true,
      capturePresent: false,
      merchantMatches: true,
    });
    assert.equal(providerCalls, 1);
  } finally {
    if (oldEnv.env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = oldEnv.env;
    if (oldEnv.branch === undefined) delete process.env.VERCEL_GIT_COMMIT_REF; else process.env.VERCEL_GIT_COMMIT_REF = oldEnv.branch;
  }
});

