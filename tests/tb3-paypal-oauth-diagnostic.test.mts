import { test } from "node:test";
import assert from "node:assert/strict";
import { createTb3PayPalOAuthDiagnostic } from "../lib/tb3/paypal-oauth-diagnostic";

const config = { mode: "live" as const, clientId: "client-marker", secret: "secret-marker" };
function fixture(env = "production", enabled?: string, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const run = createTb3PayPalOAuthDiagnostic({ environment: () => env, enabled: () => enabled, config: () => config,
    fetcher: async (url, init) => { calls.push({ url: String(url), init: init ?? {} }); return new Response(JSON.stringify({ access_token: "token-marker", error: "secret-marker" }), { status }); },
  });
  return { run, calls };
}
test("disabled by default and nonproduction do not call provider", async () => {
  for (const f of [fixture(), fixture("preview", "true")]) { assert.equal((await f.run()).status, "BLOCKED"); assert.equal(f.calls.length, 0); }
});
test("successful exchange calls exactly one Live token endpoint with client credentials grant", async () => {
  const f = fixture("production", "true");
  assert.deepEqual(await f.run(), { status: "PASS", httpStatus: 200, errorCategory: "NONE" });
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0]?.url, "https://api-m.paypal.com/v1/oauth2/token");
  assert.equal(f.calls[0]?.init.method, "POST"); assert.equal(f.calls[0]?.init.body, "grant_type=client_credentials");
  assert.equal(new Headers(f.calls[0]?.init.headers).get("authorization"), "Basic " + Buffer.from("client-marker:secret-marker").toString("base64"));
});
test("401 is sanitized and response body is not exposed", async () => {
  const f = fixture("production", "true", 401); const output = JSON.stringify(await f.run());
  assert.deepEqual(JSON.parse(output), { status: "FAIL", httpStatus: 401, errorCategory: "INVALID_CLIENT_CREDENTIALS" });
  for (const marker of ["client-marker", "secret-marker", "token-marker"]) assert.equal(output.includes(marker), false);
});
test("route requires admin manage before diagnostic and exposes no payment operations", async () => {
  const { readFileSync } = await import("node:fs");
  const route = readFileSync("app/api/tb3/paypal/oauth-diagnostic/route.ts", "utf8");
  assert.match(route, /requireAdminActionFromRequest\(request, "admin:manage"\)/);
  assert.ok(route.indexOf("if (!authorization.ok)") < route.indexOf("await diagnostic()"));
  assert.doesNotMatch(route, /orders|capture|refund|printful|console\.(log|error)/i);
});
