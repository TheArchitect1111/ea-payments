import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPayPalHandlers, type PayPalRuntime } from "../lib/tb3/paypal-http";
import { issueTb3SandboxTestCookie, sandboxTestCookieHeader, hasTb3SandboxTestSession } from "../lib/tb3/paypal-sandbox-test-session";

const origin = "https://tb3-sandbox-preview.example";
function setup(inPreview = true) {
  const token = `tb3sbx.${Math.floor(Date.now() / 1000) + 3600}.${"A".repeat(43)}`;
  const verifier = createHash("sha256").update(token).digest("hex");
  const session = issueTb3SandboxTestCookie(token, verifier)!;
  let calls = 0;
  const runtime = {
    config: { mode: "sandbox", origin },
    sandboxTestItem: true,
    service: {
      recoverApprovedSandboxOrder: async (id: string) => {
        assert.equal(id, "7EJ853085V886142J");
        calls++;
        return {
          orderStatus: "COMPLETED",
          captureCompleted: true,
          durableCaptureRecorded: true,
          fulfillment: "simulated",
          printfulRequested: false,
          internalCaptureId: "MUST_NOT_LEAK",
        };
      },
    },
  } as unknown as PayPalRuntime;
  const handler = createPayPalHandlers(
    () => runtime,
    () => true,
    async (request) => {
      if (!hasTb3SandboxTestSession(request, verifier)) throw new Error("unauthorized");
      return { actor: "sandbox-test" };
    },
    () => verifier,
    () => inPreview,
  );
  const cookie = sandboxTestCookieHeader(session.value, session.maxAge).split(";")[0]!;
  return { handler, cookie, calls: () => calls };
}
function request(cookie?: string, body?: string, requestOrigin = origin) {
  return new Request(`${origin}/api/tb3/paypal/sandbox-recovery`, {
    method: "POST",
    headers: {
      origin: requestOrigin,
      "content-length": String(body?.length ?? 0),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body }),
  });
}

test("sandbox recovery is Preview-scoped, session-authenticated and data-minimal", async () => {
  const outside = setup(false);
  assert.equal((await outside.handler.sandboxOrderRecovery(request(outside.cookie))).status, 404);
  assert.equal(outside.calls(), 0);

  const protectedRoute = setup();
  assert.equal((await protectedRoute.handler.sandboxOrderRecovery(request())).status, 403);
  assert.equal(protectedRoute.calls(), 0);
  assert.equal((await protectedRoute.handler.sandboxOrderRecovery(request(protectedRoute.cookie, "{}"))).status, 400);
  assert.equal(protectedRoute.calls(), 0);
  assert.equal((await protectedRoute.handler.sandboxOrderRecovery(request(protectedRoute.cookie, undefined, "https://attacker.invalid"))).status, 403);
  assert.equal(protectedRoute.calls(), 0);

  const response = await protectedRoute.handler.sandboxOrderRecovery(request(protectedRoute.cookie));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result, {
    orderStatus: "COMPLETED",
    captureCompleted: true,
    durableCaptureRecorded: true,
    fulfillment: "simulated",
    printfulRequested: false,
  });
  assert.equal(protectedRoute.calls(), 1);
});
