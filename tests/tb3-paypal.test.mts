import { test } from "node:test";
import { buildSync, transformSync } from "esbuild";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import catalog from "../lib/tb3/printful-manifest.json";
import { paypalService } from "../lib/tb3/paypal-service";
import {
  paypalTransport,
  verifyPayPalWebhook,
} from "../lib/tb3/paypal-transport";
import { createPayPalHandlers } from "../lib/tb3/paypal-http";
import { renderPayPalButtons } from "../app/tarris/paypal-checkout/PayPalCheckout";
import { paypalConfig } from "../lib/tb3/paypal-config";
import { paypalDatabaseUrl } from "../lib/tb3/paypal-database-config";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { chromium } from "playwright";
import {
  PAYPAL_PRINTFUL_STORE_ID,
  revalidatePrintfulDraft,
} from "../lib/tb3/paypal-fulfillment-safety";
import {
  assessLedgerSchema,
  preflightPayPalMigration,
  type LedgerSchema,
} from "../lib/tb3/paypal-migration-preflight";
import type {
  PayPalIntent,
  PayPalLedger,
  PayPalObject,
} from "../lib/tb3/paypal-types";
const config = {
  mode: "live" as const,
  clientId: "fixture-public",
  secret: "fixture-only",
  merchantId: "MERCHANT123",
  webhookId: "WEBHOOK123",
  origin: "https://fixture.test",
};
const input = {
  checkoutToken: "a".repeat(64),
  cart: [{ variantId: catalog[0].variants[0].id, quantity: 1 }],
  email: "fixture@example.test",
  recipient: {
    name: "Test Buyer",
    address1: "1 Test St",
    city: "Test",
    state_code: "DE",
    zip: "19901",
    country_code: "US",
  },
};
function fixture(autoConfirm = false, mode: "live" | "sandbox" = "live", commerceEnabled = true) {
  let quotes = 0;
  const rows = new Map<string, PayPalIntent>();
  let queue = Promise.resolve();
  const ledger: PayPalLedger = {
    async lock(id, fn) {
      const before = queue;
      let release!: () => void;
      queue = new Promise((r) => (release = r));
      await before;
      let draft = structuredClone(rows.get(id) || null);
      try {
        const result = await fn(draft, async (row) => {
          draft = structuredClone(row);
        });
        if (draft) rows.set(id, draft);
        return result;
      } finally {
        release();
      }
    },
    async find(order, capture) {
      return structuredClone(
        [...rows.values()].find(
          (x) => x.paypalId === order || (!!capture && x.captureId === capture),
        ) || null,
      );
    },
    async list(limit) {
      return structuredClone([...rows.values()].slice(0, limit));
    },
  };
  let order: PayPalObject, capture: PayPalObject, pf: PayPalObject;
  const reads: string[] = [];
  let changeFresh: ((order: PayPalObject) => void) | undefined;
  let approval = { autoConfirm, fundingVerified: true, costCap: 2000 };
  const calls = { create: 0, capture: 0, draft: 0, confirm: 0 };
  let decline = false,
    lost = false,
    pending = false,
    lostDraft = false,
    lostConfirm = false;
  const request = async (path: string, method = "GET", raw?: unknown) => {
    const body = raw as PayPalObject;
    assert.ok(["GET", "POST"].includes(method));
    if (path === "/v2/checkout/orders") {
      assert.ok(
        rows.has(body.purchase_units[0].custom_id),
        "matching intent committed before provider call",
      );
      calls.create++;
      order = { ...structuredClone(body), id: "ORDER123", status: "APPROVED" };
      return { id: order.id, status: "CREATED" };
    }
    if (path.endsWith("/capture")) {
      calls.capture++;
      if (decline) throw Error("declined");
      capture = {
        id: "CAPTURE123",
        status: pending ? "PENDING" : "COMPLETED",
        final_capture: true,
        amount: order.purchase_units[0].amount,
        supplementary_data: { related_ids: { order_id: order.id } },
      };
      order.status = "COMPLETED";
      order.purchase_units[0].payments = { captures: [capture] };
      if (lost) {
        lost = false;
        throw Error("response lost");
      }
      return order;
    }
    if (path.startsWith("/v2/payments/captures/"))
      return structuredClone(capture);
    return structuredClone(order);
  };
  const printful = async (path: string, init?: RequestInit) => {
    reads.push(path);
    if (path === "/stores/" + PAYPAL_PRINTFUL_STORE_ID)
      return { id: PAYPAL_PRINTFUL_STORE_ID };
    if (path.startsWith("/store/products/")) {
      const product = catalog.find(
        (x) => x.printfulProductId === Number(path.split("/").at(-1)),
      )!;
      return {
        sync_product: { id: product.printfulProductId },
        sync_variants: product.variants.map((v) => ({
          id: v.id,
          sync_product_id: product.printfulProductId,
          variant_id: v.catalogVariantId,
          files: [{ id: 1 }],
          availability_status: "active",
        })),
      };
    }
    if (path === "/orders/123" && (!init?.method || init.method === "GET")) {
      changeFresh?.(pf);
      return structuredClone(pf);
    }
    if (path.startsWith("/orders/@")) {
      if (!pf) throw Object.assign(Error("missing"), { status: 404 });
      return structuredClone(pf);
    }
    if (path.endsWith("/confirm")) {
      calls.confirm++;
      pf.status = "pending";
      if (lostConfirm) {
        lostConfirm = false;
        throw Error("confirmation response lost");
      }
      return structuredClone(pf);
    }
    calls.draft++;
    pf = {
      ...JSON.parse(String(init?.body)),
      id: 123,
      store: PAYPAL_PRINTFUL_STORE_ID,
      status: "draft",
      costs: { total: "1.00", currency: "USD" },
    };
    pf.items = pf.items.map((item: PayPalObject) => ({
      ...item,
      variant_id: catalog
        .flatMap((p) => p.variants)
        .find((v) => v.id === item.sync_variant_id)!.catalogVariantId,
    }));
    if (lostDraft) {
      lostDraft = false;
      throw Error("draft response lost");
    }
    return structuredClone(pf);
  };
  const service = paypalService(
    { ...config, mode },
    {
      ledger,
      request,
      quote: async () => {
        quotes++;
        return {
          shipping: 500,
          tax: 0,
          shippingMethod: "STANDARD",
        };
      },
      printful,
      autoConfirm,
      fundingVerified: true,
      costCap: 2000,
      commerceEnabled: () => commerceEnabled,
      approval: () => approval,
    },
  );
  return {
    service,
    rows,
    calls,
    ledger,
    request,
    reads,
    get quotes() {
      return quotes;
    },
    set changeFresh(fn: ((order: PayPalObject) => void) | undefined) {
      changeFresh = fn;
    },
    set approval(value: typeof approval) {
      approval = value;
    },
    set decline(x: boolean) {
      decline = x;
    },
    set lost(x: boolean) {
      lost = x;
    },
    set pending(x: boolean) {
      pending = x;
    },
    set lostDraft(x: boolean) {
      lostDraft = x;
    },
    set lostConfirm(x: boolean) {
      lostConfirm = x;
    },
    get order() {
      return order;
    },
    get capture() {
      return capture;
    },
    get pf() {
      return pf;
    },
  };
}
test("server canonical prices, quantity limits and strict checkout input", async () => {
  const f = fixture();
  for (const cart of [
    [{ variantId: 1, quantity: 1 }],
    [{ variantId: input.cart[0].variantId, quantity: 11 }],
    [{ ...input.cart[0], price: 1 }],
  ])
    await assert.rejects(() => f.service.create({ ...input, cart }));
  await assert.rejects(() => f.service.create({ ...input, tenant: "another" }));
  assert.equal(f.calls.create, 0);
  const result = await f.service.create(input);
  assert.equal(result.total, (catalog[0].price + 5).toFixed(2));
  assert.equal(f.order.purchase_units[0].payee.merchant_id, config.merchantId);
  await assert.rejects(() =>
    f.service.create({ ...input, email: "other@example.test" }),
  );
});
test("concurrent retries capture once and create/confirm one Printful order", async () => {
  const f = fixture(true);
  await Promise.all([f.service.create(input), f.service.create(input)]);
  const results = await Promise.all([
    f.service.capture(input.checkoutToken, "ORDER123"),
    f.service.capture(input.checkoutToken, "ORDER123"),
  ]);
  assert.ok(results.every((x) => x.status === "paid"));
  assert.deepEqual(f.calls, { create: 1, capture: 1, draft: 1, confirm: 1 });
  await f.service.webhook({
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURE123",
      supplementary_data: { related_ids: { order_id: "ORDER123" } },
    },
  });
  assert.equal(f.calls.confirm, 1);
});
test("lost capture response reconciles provider truth without second charge", async () => {
  const f = fixture();
  await f.service.create(input);
  f.lost = true;
  await assert.rejects(() =>
    f.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.notEqual([...f.rows.values()][0].state, "paid");
  assert.equal(
    (await f.service.capture(input.checkoutToken, "ORDER123")).status,
    "paid",
  );
  assert.equal(f.calls.capture, 1);
  assert.equal(f.calls.draft, 1);
  assert.equal(f.calls.confirm, 0);
});
test("declined and pending payments never reach fulfillment", async () => {
  for (const state of ["decline", "pending"] as const) {
    const f = fixture();
    await f.service.create(input);
    f[state] = true;
    if (state === "decline")
      await assert.rejects(() =>
        f.service.capture(input.checkoutToken, "ORDER123"),
      );
    else
      assert.equal(
        (await f.service.capture(input.checkoutToken, "ORDER123")).status,
        "pending",
      );
    assert.equal(f.calls.draft, 0);
    assert.notEqual([...f.rows.values()][0].state, "paid");
  }
});
test("disabled commerce cannot submit even a Printful draft after a valid capture", async () => {
  const f = fixture(false, "live", false);
  await f.service.create(input);
  await assert.rejects(() => f.service.capture(input.checkoutToken, "ORDER123"), /commerce is disabled/i);
  assert.equal(f.calls.draft, 0);
  assert.equal(f.calls.confirm, 0);
  assert.equal(f.reads.length, 0);
  const row = [...f.rows.values()][0]!;
  assert.equal(row.state, "paid");
  assert.equal(row.fulfillment, "pending");
});
test("merchant, amount, address, currency and ownership tampering fail closed", async () => {
  for (const mutate of [
    (u: PayPalObject) => (u.payee.merchant_id = "OTHER123"),
    (u: PayPalObject) => (u.amount.value = "0.01"),
    (u: PayPalObject) => (u.amount.currency_code = "EUR"),
    (u: PayPalObject) => (u.shipping.address.address_line_1 = "elsewhere"),
  ]) {
    const f = fixture();
    await f.service.create(input);
    mutate(f.order.purchase_units[0]);
    await assert.rejects(() =>
      f.service.capture(input.checkoutToken, "ORDER123"),
    );
    assert.equal(f.calls.capture, 0);
    assert.equal(f.calls.draft, 0);
  }
  const f = fixture();
  await f.service.create(input);
  await assert.rejects(() => f.service.capture("b".repeat(64), "ORDER123"));
});
test("refund hold and cancellation prohibit subsequent capture", async () => {
  const f = fixture();
  await f.service.create(input);
  await f.service.cancel(input.checkoutToken, "ORDER123");
  await assert.rejects(() =>
    f.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.equal(f.calls.capture, 0);
  const paid = fixture();
  await paid.service.create(input);
  await paid.service.capture(input.checkoutToken, "ORDER123");
  await paid.service.webhook({
    event_type: "PAYMENT.CAPTURE.REVERSED",
    resource: { id: "CAPTURE123" },
  });
  await assert.rejects(() =>
    paid.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.equal([...paid.rows.values()][0].state, "hold");
});
test("full and partial PayPal refund webhooks are idempotent and block further fulfillment", async () => {
  const full = fixture();
  await full.service.create(input);
  await full.service.capture(input.checkoutToken, "ORDER123");
  full.capture.status = "REFUNDED";
  const event = { id: "WH-REFUND-FULL-123", event_type: "PAYMENT.CAPTURE.REFUNDED", resource: { id: "CAPTURE123", status: "REFUNDED", supplementary_data: { related_ids: { order_id: "ORDER123" } } } };
  await full.service.webhook(event);
  await full.service.webhook(event);
  const fullyRefunded = [...full.rows.values()][0]!;
  assert.equal(fullyRefunded.state, "refunded");
  assert.equal(fullyRefunded.refundTotalCents, fullyRefunded.total);
  assert.deepEqual(fullyRefunded.refundEventIds, [event.id]);
  await assert.rejects(() => full.service.capture(input.checkoutToken, "ORDER123"));

  const partial = fixture();
  await partial.service.create(input);
  await partial.service.capture(input.checkoutToken, "ORDER123");
  partial.capture.status = "PARTIALLY_REFUNDED";
  await partial.service.webhook({
    id: "WH-REFUND-PART-123",
    event_type: "PAYMENT.CAPTURE.REFUNDED",
    resource: { id: "CAPTURE123", status: "PARTIALLY_REFUNDED", refund_amount: { value: "3.00", currency_code: "USD" }, supplementary_data: { related_ids: { order_id: "ORDER123" } } },
  });
  const partiallyRefunded = [...partial.rows.values()][0]!;
  assert.equal(partiallyRefunded.state, "paid");
  assert.equal(partiallyRefunded.refundStatus, "partial");
  assert.equal(partiallyRefunded.refundTotalCents, 300);
  assert.equal(partiallyRefunded.fulfillment, "review");
  await assert.rejects(() => partial.service.capture(input.checkoutToken, "ORDER123"));
  await partial.service.webhook({
    id: "WH-REFUND-OVER-123",
    event_type: "PAYMENT.CAPTURE.REFUNDED",
    resource: { id: "CAPTURE123", status: "PARTIALLY_REFUNDED", refund_amount: { value: "53.00", currency_code: "USD" }, supplementary_data: { related_ids: { order_id: "ORDER123" } } },
  });
  const overRefunded = [...partial.rows.values()][0]!;
  assert.equal(overRefunded.state, "hold");
  assert.equal(overRefunded.refundStatus, "review");
  assert.equal(overRefunded.refundTotalCents, null);
});
test("verified PayPal capture-denied webhook marks the order failed without Printful access", async () => {
  const f = fixture(false, "live", false);
  await f.service.create(input);
  await f.service.capture(input.checkoutToken, "ORDER123").catch(() => undefined);
  f.capture.status = "DECLINED";
  await f.service.webhook({
    id: "WH-CAPTURE-DENIED-123",
    event_type: "PAYMENT.CAPTURE.DENIED",
    resource: { id: "CAPTURE123", status: "DECLINED", supplementary_data: { related_ids: { order_id: "ORDER123" } } },
  });
  assert.equal([...f.rows.values()][0]!.state, "failed");
  assert.equal(f.calls.draft, 0);
  assert.equal(f.calls.confirm, 0);
});
test("HTTP origin, disabled gate and webhook verification precede writes", async () => {
  const f = fixture();
  let valid = false;
  const h = createPayPalHandlers(() => ({
    config,
    service: f.service,
    verify: async () => valid,
  }));
  const req = (path: string, body: unknown, origin = config.origin) =>
    new Request(config.origin + path, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await h.create(req("/orders", input, "https://evil.test"))).status,
    403,
  );
  assert.equal(
    (await createPayPalHandlers(() => null).create(req("/orders", input)))
      .status,
    503,
  );
  const event = {
    id: "EVENT123",
    event_type: "CHECKOUT.ORDER.APPROVED",
    resource: { id: "ORDER123" },
  };
  assert.equal((await h.webhook(req("/webhook", event))).status, 400);
  assert.equal(f.calls.capture, 0);
  assert.equal((await h.create(req("/orders", input))).status, 200);
  valid = true;
  assert.equal((await h.webhook(req("/webhook", event))).status, 200);
  assert.equal(f.calls.capture, 1);
});
test("webhook postback pins certificate host and webhook ID", async () => {
  const headers = new Headers({
    "paypal-auth-algo": "SHA256withRSA",
    "paypal-cert-url": "https://api.paypal.com/v1/notifications/certs/fixture",
    "paypal-transmission-id": "fixture",
    "paypal-transmission-sig": "fixture",
    "paypal-transmission-time": "2026-11-07T00:00:00Z",
  });
  let calls = 0;
  const request = async (path: string, method?: string, raw?: unknown) => {
    const body = raw as PayPalObject;
    calls++;
    assert.equal(path, "/v1/notifications/verify-webhook-signature");
    assert.equal(body?.webhook_id, config.webhookId);
    return { verification_status: "SUCCESS" };
  };
  assert.equal(
    await verifyPayPalWebhook(new Headers(), {}, config, request),
    false,
  );
  headers.set("paypal-cert-url", "https://evil.test/v1/notifications/certs/x");
  assert.equal(await verifyPayPalWebhook(headers, {}, config, request), false);
  assert.equal(calls, 0);
  headers.set(
    "paypal-cert-url",
    "https://api.paypal.com/v1/notifications/certs/fixture",
  );
  assert.equal(await verifyPayPalWebhook(headers, {}, config, request), true);
  assert.equal(
    await verifyPayPalWebhook(headers, {}, config, async () => ({
      verification_status: "FAILURE",
    })),
    false,
  );
});
test("official Orders transport uses OAuth, fixed host and stable idempotency header", async () => {
  const seen: [string, PayPalObject][] = [];
  const request = paypalTransport(config, async (url, init) => {
    seen.push([String(url), init || {}]);
    return Response.json(
      String(url).endsWith("/token")
        ? {
            access_token: "fixture-token",
            token_type: "Bearer",
            expires_in: 3600,
          }
        : { id: "ORDER123" },
    );
  });
  await request("/v2/checkout/orders", "POST", {}, "stable-request");
  await request("/v2/checkout/orders/ORDER123");
  assert.equal(seen.length, 3);
  assert.equal(seen[1][0], "https://api-m.paypal.com/v2/checkout/orders");
  assert.equal(seen[1][1].headers["PayPal-Request-Id"], "stable-request");
  assert.equal(seen[1][1].redirect, "error");
  await assert.rejects(() => request("https://evil.test"));
});
test("lost Printful responses reconcile external identity without duplicate manufacturing", async () => {
  for (const stage of ["lostDraft", "lostConfirm"] as const) {
    const f = fixture(true);
    await f.service.create(input);
    f[stage] = true;
    await f.service.capture(input.checkoutToken, "ORDER123");
    await f.service.capture(input.checkoutToken, "ORDER123");
    assert.equal(f.calls.draft, 1);
    assert.equal(f.calls.confirm, 1);
    assert.equal([...f.rows.values()][0].fulfillment, "confirmed");
  }
});
test("reversed capture truth and changed Printful identity prohibit handoff", async () => {
  const f = fixture();
  await f.service.create(input);
  await f.service.capture(input.checkoutToken, "ORDER123");
  f.capture.status = "REFUNDED";
  await assert.rejects(() =>
    f.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.equal(f.calls.confirm, 0);
  const other = fixture();
  await other.service.create(input);
  await other.service.capture(input.checkoutToken, "ORDER123");
  other.pf.recipient.email = "other@example.test";
  await assert.rejects(() =>
    other.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.equal(other.calls.draft, 1);
  assert.equal(other.calls.confirm, 0);
});
test("oversized input and rate limit reject before provider calls", async () => {
  const f = fixture();
  const req = (body: unknown) =>
    new Request(config.origin + "/orders", {
      method: "POST",
      headers: { origin: config.origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const runtime = { config, service: f.service, verify: async () => true };
  assert.equal(
    (
      await createPayPalHandlers(
        () => runtime,
        () => false,
      ).create(req(input))
    ).status,
    429,
  );
  assert.equal(
    (
      await createPayPalHandlers(() => runtime).create(
        req({ large: "x".repeat(17000) }),
      )
    ).status,
    503,
  );
  assert.equal(f.calls.create, 0);
});
test("card and PayPal buttons render only when SDK declares eligibility", async () => {
  for (const eligible of [true, false]) {
    const rendered: string[] = [];
    const buttons = await renderPayPalButtons(
      {
        FUNDING: { PAYPAL: "paypal", CARD: "card" },
        Buttons(options) {
          return {
            isEligible: () => options.fundingSource === "paypal" || eligible,
            render: async () => {
              rendered.push(String(options.fundingSource));
            },
            close() {},
          };
        },
      },
      {} as HTMLElement,
      {},
    );
    assert.deepEqual(rendered, eligible ? ["paypal", "card"] : ["paypal"]);
    assert.equal(buttons.length, rendered.length);
  }
});
test("live configuration requires explicit enablement and production separation", () => {
  const keys = [
    "TB3_PAYPAL_ENABLED",
    "TB3_PAYPAL_ENV",
    "VERCEL_ENV",
    "TB3_PAYPAL_CLIENT_ID",
    "TB3_PAYPAL_CLIENT_SECRET",
    "TB3_PAYPAL_MERCHANT_ID",
    "TB3_PAYPAL_WEBHOOK_ID",
    "TB3_PAYPAL_ORIGIN",
  ];
  const saved = keys.map((k) => process.env[k]);
  try {
    Object.assign(process.env, {
      TB3_PAYPAL_ENABLED: "false",
      TB3_PAYPAL_ENV: "live",
      VERCEL_ENV: "production",
      TB3_PAYPAL_CLIENT_ID: config.clientId,
      TB3_PAYPAL_CLIENT_SECRET: config.secret,
      TB3_PAYPAL_MERCHANT_ID: config.merchantId,
      TB3_PAYPAL_WEBHOOK_ID: config.webhookId,
      TB3_PAYPAL_ORIGIN: config.origin,
    });
    assert.equal(paypalConfig(), null);
    process.env.TB3_PAYPAL_ENABLED = "true";
    assert.equal(paypalConfig()?.mode, "live");
    process.env.VERCEL_ENV = "preview";
    assert.equal(paypalConfig(), null);
    process.env.TB3_PAYPAL_ENV = "sandbox";
    assert.equal(paypalConfig()?.mode, "sandbox");
    process.env.VERCEL_ENV = "production";
    assert.equal(paypalConfig(), null);
  } finally {
    keys.forEach((k, i) => {
      if (saved[i] === undefined) delete process.env[k];
      else process.env[k] = saved[i];
    });
  }
});
test("actual SQL ledger adapter commits, rolls back and rejects cross-tenant writes", async () => {
  const output = buildSync({
    stdin: {
      contents: "export {paypalLedger} from './lib/tb3/paypal-ledger';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    external: ["server-only", "pg"],
  }).outputFiles[0].text;
  const queries: { sql: string; args?: unknown[] }[] = [];
  let rejectWrite = false,
    ended = 0;
  class Client {
    constructor(options: PayPalObject) {
      assert.equal(options.ssl.rejectUnauthorized, true);
      assert.equal(options.connectionTimeoutMillis, 5000);
    }
    async connect() {}
    async end() {
      ended++;
    }
    async query(sql: string, args?: unknown[]) {
      queries.push({ sql, args });
      return {
        rows: [],
        rowCount: sql.startsWith("INSERT") && !rejectWrite ? 1 : 0,
      };
    }
  }
  const loaded = { exports: {} as { paypalLedger: PayPalLedger } };
  new Function("module", "exports", "require", output)(
    loaded,
    loaded.exports,
    (name: string) => {
      if (name === "server-only") return {};
      assert.equal(name, "pg");
      return { Client };
    },
  );
  const saved = process.env.TB3_PAYPAL_DATABASE_URL;
  process.env.TB3_PAYPAL_DATABASE_URL =
    "postgresql://ea_merchant_api:fixture@db.fixture.supabase.com/postgres";
  try {
    const f = fixture();
    await f.service.create(input);
    const row = [...f.rows.values()][0];
    const ledger = loaded.exports.paypalLedger;
    await ledger.lock(row.id, async (existing, save) => {
      assert.equal(existing, null);
      await save(row);
    });
    assert.equal(queries.at(-1)?.sql, "COMMIT");
    assert.ok(
      queries.some(
        (x) =>
          x.sql.includes("pg_advisory_xact_lock") &&
          x.args?.[0] === "tarris/paypal/" + row.id,
      ),
    );
    assert.ok(
      queries.some(
        (x) => x.sql.includes("FOR UPDATE") && x.args?.[0] === "tarris",
      ),
    );
    rejectWrite = true;
    await assert.rejects(() =>
      ledger.lock(row.id, async (_, save) => save(row)),
    );
    assert.equal(queries.at(-1)?.sql, "ROLLBACK");
    await assert.rejects(() =>
      ledger.lock(row.id, async (_, save) =>
        save({ ...row, tenant: "other" } as unknown as PayPalIntent),
      ),
    );
    assert.equal(queries.at(-1)?.sql, "ROLLBACK");
    assert.equal(ended, 3);
    await assert.rejects(() => ledger.lock("invalid", async () => {}));
  } finally {
    if (saved === undefined) delete process.env.TB3_PAYPAL_DATABASE_URL;
    else process.env.TB3_PAYPAL_DATABASE_URL = saved;
  }
});
test("expired intents, unavailable ledger and wrong tenant never initiate capture", async () => {
  const f = fixture();
  await f.service.create(input);
  const row = [...f.rows.values()][0];
  f.rows.set(row.id, { ...row, createdAt: "2000-01-01T00:00:00Z" });
  await assert.rejects(() =>
    f.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.equal(f.calls.capture, 0);
  f.rows.set(row.id, { ...row, tenant: "other" } as unknown as PayPalIntent);
  await assert.rejects(() =>
    f.service.capture(input.checkoutToken, "ORDER123"),
  );
  assert.equal(f.calls.capture, 0);
  let providers = 0;
  const unavailable = paypalService(config, {
    ledger: {
      lock: async () => {
        throw Error("database unavailable");
      },
      find: async () => null,
      list: async () => [],
    },
    request: async () => {
      providers++;
      return {};
    },
    quote: async () => ({ shipping: 0, tax: 0, shippingMethod: "STANDARD" }),
    printful: async () => ({}),
    autoConfirm: false,
    fundingVerified: false,
    costCap: 0,
  });
  await assert.rejects(() => unavailable.create(input));
  assert.equal(providers, 0);
});
test("partial/multiple captures and cancellation of held payments cannot authorize fulfillment", async () => {
  for (const kind of ["amount", "final", "multiple"]) {
    const f = fixture();
    await f.service.create(input);
    await f.service.capture(input.checkoutToken, "ORDER123");
    if (kind === "amount")
      f.capture.amount = { currency_code: "USD", value: "0.01" };
    if (kind === "final") f.capture.final_capture = false;
    if (kind === "multiple")
      f.order.purchase_units[0].payments.captures.push({
        ...f.capture,
        id: "CAPTURE456",
      });
    await assert.rejects(() =>
      f.service.capture(input.checkoutToken, "ORDER123"),
    );
    assert.equal(f.calls.confirm, 0);
  }
  const held = fixture();
  await held.service.create(input);
  await held.service.capture(input.checkoutToken, "ORDER123");
  await held.service.webhook({
    event_type: "PAYMENT.CAPTURE.REVERSED",
    resource: { id: "CAPTURE123" },
  });
  assert.equal(
    (await held.service.cancel(input.checkoutToken, "ORDER123")).status,
    "review",
  );
  assert.equal([...held.rows.values()][0].state, "hold");
});
test("pending payment cancellation never reports no-payment cancellation", async () => {
  const f = fixture();
  await f.service.create(input);
  f.pending = true;
  await f.service.capture(input.checkoutToken, "ORDER123");
  assert.equal(
    (await f.service.cancel(input.checkoutToken, "ORDER123")).status,
    "pending",
  );
  assert.equal([...f.rows.values()][0].state, "created");
  assert.equal(f.calls.draft, 0);
});
test("sandbox never reaches live Printful quotes, drafts or confirmations, including retries/webhooks", async () => {
  const f = fixture(true, "sandbox");
  await f.service.create(input);
  assert.equal(
    f.order.purchase_units[0].amount.breakdown.shipping.value,
    "5.00",
  );
  assert.equal(
    (await f.service.capture(input.checkoutToken, "ORDER123")).fulfillment,
    "simulated",
  );
  await f.service.capture(input.checkoutToken, "ORDER123");
  await f.service.webhook({
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURE123",
      supplementary_data: { related_ids: { order_id: "ORDER123" } },
    },
  });
  assert.equal(f.reads.length, 0);
  assert.equal(f.quotes, 0);
  assert.equal(f.calls.draft, 0);
  assert.equal(f.calls.confirm, 0);
  assert.equal(f.calls.capture, 1);
  assert.equal([...f.rows.values()][0].fulfillment, "simulated");
});
test("fresh draft cost, store, identity and current approval changes stop manufacturing", async () => {
  for (const mutation of [
    (p: PayPalObject) => {
      p.costs.total = "9999.00";
    },
    (p: PayPalObject) => {
      p.costs.currency = "EUR";
    },
    (p: PayPalObject) => {
      p.costs.total = undefined;
    },
    (p: PayPalObject) => {
      p.store = 1;
    },
    (p: PayPalObject) => {
      p.items[0].sync_variant_id = 1;
    },
    (p: PayPalObject) => {
      p.recipient.email = "other@example.test";
    },
    (p: PayPalObject) => {
      p.status = "canceled";
    },
  ]) {
    const f = fixture(true);
    await f.service.create(input);
    f.changeFresh = mutation;
    assert.equal(
      (await f.service.capture(input.checkoutToken, "ORDER123")).fulfillment,
      "review",
    );
    assert.equal(f.calls.confirm, 0);
    assert.equal([...f.rows.values()][0].state, "paid");
  }
  for (const policy of [
    { autoConfirm: false, fundingVerified: true, costCap: 2000 },
    { autoConfirm: true, fundingVerified: false, costCap: 2000 },
    { autoConfirm: true, fundingVerified: true, costCap: 1 },
  ]) {
    const f = fixture(true);
    await f.service.create(input);
    f.changeFresh = () => {
      f.approval = policy;
    };
    assert.equal(
      (await f.service.capture(input.checkoutToken, "ORDER123")).fulfillment,
      "review",
    );
    assert.equal(f.calls.confirm, 0);
  }
});
test("confirmation immediately follows fresh store/product/draft verification", async () => {
  const f = fixture(true);
  await f.service.create(input);
  assert.equal(
    (await f.service.capture(input.checkoutToken, "ORDER123")).fulfillment,
    "confirmed",
  );
  const tail = f.reads.slice(-4);
  assert.deepEqual(tail, [
    "/stores/" + PAYPAL_PRINTFUL_STORE_ID,
    "/store/products/" + catalog[0].printfulProductId,
    "/orders/123",
    "/orders/123/confirm",
  ]);
  assert.equal(f.calls.confirm, 1);
});
test("store/product/variant provider mismatch and availability fail closed before confirmation", async () => {
  const f = fixture();
  await f.service.create(input);
  const row = [...f.rows.values()][0];
  for (const kind of [
    "store",
    "product",
    "sync",
    "variant",
    "files",
    "stock",
    "unavailable",
  ]) {
    let confirms = 0;
    await assert.rejects(() =>
      revalidatePrintfulDraft(row, 123, async (path, init) => {
        if (init?.method === "POST") confirms++;
        if (path.startsWith("/stores/")) {
          if (kind === "unavailable") throw Error("provider down");
          return { id: kind === "store" ? 1 : PAYPAL_PRINTFUL_STORE_ID };
        }
        return {
          sync_product: { id: kind === "product" ? 1 : row.lines[0].productId },
          sync_variants: [
            {
              id: row.lines[0].variantId,
              sync_product_id: kind === "sync" ? 1 : row.lines[0].productId,
              variant_id:
                kind === "variant" ? 1 : row.lines[0].catalogVariantId,
              files: kind === "files" ? [] : [{}],
              availability_status: kind === "stock" ? "out_of_stock" : "active",
            },
          ],
        };
      }),
    );
    assert.equal(confirms, 0);
  }
});
function matchingSchema(): LedgerSchema {
  return {
    kind: "r",
    rls: true,
    forceRls: true,
    columns: [
      {
        name: "id",
        type: "text",
        notNull: true,
        generated: "",
        expression: null,
      },
      {
        name: "tenant_slug",
        type: "text",
        notNull: true,
        generated: "",
        expression: null,
      },
      {
        name: "payload",
        type: "jsonb",
        notNull: true,
        generated: "",
        expression: null,
      },
      {
        name: "paypal_id",
        type: "text",
        notNull: false,
        generated: "s",
        expression: "(payload ->> 'paypalId'::text)",
      },
      {
        name: "capture_id",
        type: "text",
        notNull: false,
        generated: "s",
        expression: "(payload ->> 'captureId'::text)",
      },
      {
        name: "updated_at",
        type: "timestamp with time zone",
        notNull: true,
        generated: "",
        expression: "now()",
      },
    ],
    constraints: [
      ...[
        ["p", "id"],
        ["u", "paypal_id"],
        ["u", "capture_id"],
      ].map(([type, name]) => ({ type, columns: [name], definition: "" })),
      ...[
        "CHECK (id ~ '^[a-f0-9]{64}$')",
        "CHECK (tenant_slug='tarris')",
        "CHECK(payload->>'id'=id AND payload->>'tenant'=tenant_slug)",
        "CHECK(payload->>'mode' IN ('live','sandbox'))",
        "CHECK(payload->>'state' IN ('creating','created','paid','hold'))",
        "CHECK(payload ?& ARRAY['id','tenant','mode','state','merchantId','inputHash','total','subtotal','shipping','tax','createdAt'])",
      ].map((definition) => ({ type: "c", columns: [], definition })),
    ],
  };
}
test("migration preflight distinguishes absence, compatible collision and incompatible schemas without writes", async () => {
  for (const schema of [
    null,
    matchingSchema(),
    { ...matchingSchema(), kind: "v" },
    { ...matchingSchema(), columns: [] },
    { ...matchingSchema(), constraints: [] },
    { ...matchingSchema(), forceRls: false },
  ]) {
    const queries: string[] = [];
    const report = await preflightPayPalMigration({
      async query(sql) {
        queries.push(sql);
        return {
          rows: sql.includes("FROM pg_catalog.pg_class")
            ? schema
              ? [schema as unknown as Record<string, unknown>]
              : []
            : sql.includes("SELECT rolname")
              ? ["ea_merchant_api", "anon", "authenticated"].map((rolname) => ({
                  rolname,
                }))
              : [],
        };
      },
    });
    assert.equal(report.migrationAllowed, schema === null);
    assert.equal(report.exists, schema !== null);
    assert.equal(queries[0], "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    assert.equal(queries.at(-1), "ROLLBACK");
    assert.ok(
      queries.every((q) => /^(BEGIN|SET LOCAL|SELECT|ROLLBACK)/.test(q)),
    );
    assert.ok(
      queries.every((q) => !q.includes("FROM public.tb3_paypal_orders")),
    );
  }
  assert.equal(assessLedgerSchema(matchingSchema()).schemaCompatible, true);
});
test("migration preflight rejects missing roles and rolls back incomplete inspection", async () => {
  const missing = await preflightPayPalMigration({
    query: async () => ({ rows: [] }),
  });
  assert.equal(missing.status, "BLOCKED");
  assert.ok(missing.missingRoles.includes("ea_merchant_api"));
  const seen: string[] = [];
  await assert.rejects(() =>
    preflightPayPalMigration({
      async query(sql) {
        seen.push(sql);
        if (sql.startsWith("SELECT")) throw Error("inspection denied");
        return { rows: [] };
      },
    }),
  );
  assert.equal(seen.at(-1), "ROLLBACK");
});
test("sandbox ledger has no live fallback and rejects known shared database identities", () => {
  const live =
    "postgresql://ea_merchant_api:fixture@db.live.supabase.com/postgres";
  assert.equal(
    paypalDatabaseUrl({
      TB3_PAYPAL_ENV: "sandbox",
      EA_MERCHANT_DATABASE_URL: live,
    }),
    undefined,
  );
  assert.equal(
    paypalDatabaseUrl({
      TB3_PAYPAL_ENV: "sandbox",
      EA_MERCHANT_DATABASE_URL: live,
      TB3_PAYPAL_SANDBOX_DATABASE_URL: live.replace(
        "ea_merchant_api",
        "tb3_paypal_api",
      ),
    }),
    undefined,
  );
  const isolated =
    "postgresql://tb3_paypal_api:fixture@db.sandbox.supabase.com/postgres";
  assert.equal(
    paypalDatabaseUrl({
      TB3_PAYPAL_ENV: "sandbox",
      EA_MERCHANT_DATABASE_URL: live,
      TB3_PAYPAL_SANDBOX_DATABASE_URL: isolated,
    }),
    isolated,
  );
  assert.equal(
    paypalDatabaseUrl({
      TB3_PAYPAL_ENV: "live",
      EA_MERCHANT_DATABASE_URL: live,
    }),
    live,
  );
});
test("sandbox draft inspection is blocked before even a read-only Printful request", async () => {
  const f = fixture(false, "sandbox");
  await f.service.create(input);
  const row = [...f.rows.values()][0];
  let calls = 0;
  await assert.rejects(() =>
    revalidatePrintfulDraft(row, 1, async () => {
      calls++;
      return {};
    }),
  );
  assert.equal(calls, 0);
});
test("migration preflight catches PostgreSQL type-only name collisions", async () => {
  const report = await preflightPayPalMigration({
    async query(sql) {
      return {
        rows: sql.includes("SELECT t.typname")
          ? [{ typname: "tb3_paypal_orders" }]
          : sql.includes("SELECT rolname")
            ? ["ea_merchant_api", "anon", "authenticated"].map((rolname) => ({
                rolname,
              }))
            : [],
      };
    },
  });
  assert.equal(report.typeCollision, true);
  assert.equal(report.migrationAllowed, false);
});
test("migration preflight CLI refuses implicit database selection without connecting", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--require",
      "./tests/fixtures/network-offline.cjs",
      "--import",
      "tsx",
      "scripts/tb3-paypal-migration-preflight.mts",
    ],
    { encoding: "utf8", timeout: 15000 },
  );
  assert.equal(run.status, 1);
  assert.match(run.stderr, /read-only migration preflight unavailable/);
  assert.equal(run.stdout, "");
});
test("actual sandbox runtime checkout and quote entry point cannot call Printful", async () => {
  const source = readFileSync(
    new URL("../lib/tb3/paypal-runtime.ts", import.meta.url),
    "utf8",
  );
  const code = transformSync(source, {
    loader: "ts",
    format: "cjs",
    target: "node22",
  }).code;
  const f = fixture(false, "sandbox");
  let providerCalls = 0;
  const loaded = {
    exports: {} as {
      getPayPalRuntime: () => { service: ReturnType<typeof paypalService> };
      quotePayPalOrder: (...args: unknown[]) => Promise<unknown>;
    },
  };
  const modules: Record<string, unknown> = {
    "server-only": {},
    "./paypal-config": { paypalConfig: () => ({ ...config, mode: "sandbox" }) },
    "./paypal-transport": {
      paypalTransport: () => f.request,
      verifyPayPalWebhook: async () => true,
    },
    "./paypal-service": { paypalService },
    "./paypal-ledger": { paypalLedger: f.ledger },
    "./paypal-database-config": {
      paypalDatabaseUrl: () => "fixture-isolated-database",
    },
    "./printful-client": {
      tb3Printful: async () => {
        providerCalls++;
        throw Error("Real Printful forbidden");
      },
    },
    "./paypal-types": {},
  };
  new Function("module", "exports", "require", code)(
    loaded,
    loaded.exports,
    (name: string) => {
      assert.ok(name in modules, "Unexpected runtime dependency: " + name);
      return modules[name];
    },
  );
  const runtime = loaded.exports.getPayPalRuntime();
  await runtime.service.create(input);
  assert.equal(
    (await runtime.service.capture(input.checkoutToken, "ORDER123"))
      .fulfillment,
    "simulated",
  );
  await assert.rejects(() =>
    loaded.exports.quotePayPalOrder([], input.recipient),
  );
  assert.equal(providerCalls, 0);
  assert.equal(f.reads.length, 0);
});
test("local sandbox simulator certifies browser checkout, persisted order, retries, duplicate protection and failures through HTTP handlers", async () => {
  const f = fixture(false, "sandbox");
  let origin = "";
  let browserCheckoutInput: typeof input | undefined;
  let verifiedWebhooks = 0;
  const failures: string[] = [];
  const source = `import React from 'react';import {createRoot} from 'react-dom/client';import Checkout from './app/tarris/paypal-checkout/PayPalCheckout';createRoot(document.getElementById('root')).render(React.createElement(Checkout));`;
  const script = buildSync({
    stdin: { contents: source, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true,
    platform: "browser",
    format: "iife",
    write: false,
    define: { "process.env.NODE_ENV": '"test"' },
  }).outputFiles[0].text;
  const handlers = createPayPalHandlers(() => ({
    config: { ...config, mode: "sandbox", origin },
    service: f.service,
    verify: (headers, event) =>
      verifyPayPalWebhook(
        headers,
        event,
        { ...config, mode: "sandbox" },
        async () => {
          verifiedWebhooks++;
          return { verification_status: "SUCCESS" };
        },
      ),
  }));
  const sdk = `window.paypal={FUNDING:{PAYPAL:'paypal',CARD:'card'},Buttons(options){return {isEligible:()=>true,close(){},async render(container){const button=document.createElement('button');button.textContent='Fixture '+options.fundingSource;button.onclick=async()=>{try{const orderID=await options.createOrder();await options.onApprove({orderID});}catch(error){options.onError(error);}};container.append(button);}};}};`;
  const server = createServer(async (req, res) => {
    try {
      if (req.url === "/") {
        res.setHeader("content-type", "text/html");
        res.end(
          '<!doctype html><html><body><div id="root"></div><script>' +
            sdk +
            '</script><script src="/checkout.js"></script></body></html>',
        );
        return;
      }
      if (req.url === "/checkout.js") {
        res.setHeader("content-type", "application/javascript");
        res.end(script);
        return;
      }
      const buffers: Buffer[] = [];
      for await (const chunk of req) buffers.push(Buffer.from(chunk));
      if (req.url === "/api/tb3/paypal/orders")
        browserCheckoutInput = JSON.parse(Buffer.concat(buffers).toString("utf8"));
      const request = new Request(origin + req.url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        ...(req.method === "GET" ? {} : { body: Buffer.concat(buffers) }),
      });
      const action = req.url?.split("/").at(-1);
      const response =
        action === "config"
          ? await handlers.config()
          : action === "orders"
            ? await handlers.create(request)
            : action === "capture"
              ? await handlers.capture(request)
                : action === "cancel"
                  ? await handlers.cancel(request)
              : action === "webhook"
                ? await handlers.webhook(request)
                : new Response(null, { status: 404 });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      failures.push(String(error));
      res.writeHead(500);
      res.end("Fixture server failure");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + (server.address() as { port: number }).port;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    let external = 0;
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== origin) {
        external++;
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    await page.goto(origin);
    for (const [name, value] of Object.entries({
      email: input.email,
      ...input.recipient,
    })) {
      const field = page.locator('[name="' + name + '"]');
      if (await field.count()) await field.fill(value);
    }
    await page
      .getByRole("button", { name: "Continue to payment options" })
      .click();
    await page
      .getByRole("button", { name: "Fixture paypal", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({
        hasText: "Fulfillment simulated; no Printful order was created.",
      })
      .waitFor();
    assert.equal(f.rows.size, 1);
    const savedOrder = [...f.rows.values()][0];
    assert.equal(savedOrder.state, "paid");
    assert.equal(savedOrder.mode, "sandbox");
    assert.equal(savedOrder.tenant, "tarris");
    assert.equal(savedOrder.merchantId, config.merchantId);
    assert.equal(savedOrder.paypalId, "ORDER123");
    assert.equal(savedOrder.captureId, "CAPTURE123");
    assert.equal(savedOrder.fulfillment, "simulated");
    assert.equal(savedOrder.printfulId, undefined);
    assert.equal(savedOrder.shipping, 500);
    assert.equal(savedOrder.tax, 0);
    assert.equal(savedOrder.total, savedOrder.subtotal + 500);
    await page.reload();
    await page.getByRole("button", { name: "Check payment status" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Fulfillment simulated" })
      .waitFor();
    assert.equal(f.calls.capture, 1);
    const duplicateCheckout = await fetch(origin + "/api/tb3/paypal/orders", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(browserCheckoutInput),
    });
    assert.equal(duplicateCheckout.status, 200);
    assert.equal((await duplicateCheckout.json()).orderId, "ORDER123");
    assert.equal(f.calls.create, 1, "same checkout token reuses provider order");
    const duplicateCapture = await fetch(origin + "/api/tb3/paypal/capture", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ checkoutToken: browserCheckoutInput?.checkoutToken, orderId: "ORDER123" }),
    });
    assert.equal(duplicateCapture.status, 200);
    assert.equal(f.calls.capture, 1, "paid retry cannot capture a second time");
    const event = {
      id: "EVENT123",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "CAPTURE123",
        supplementary_data: { related_ids: { order_id: "ORDER123" } },
      },
    };
    const headers = {
      "content-type": "application/json",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url":
        "https://api.sandbox.paypal.com/v1/notifications/certs/fixture",
      "paypal-transmission-id": "fixture",
      "paypal-transmission-sig": "fixture",
      "paypal-transmission-time": new Date().toISOString(),
    };
    for (let retry = 0; retry < 2; retry++)
      assert.equal(
        (
          await fetch(origin + "/api/tb3/paypal/webhook", {
            method: "POST",
            headers,
            body: JSON.stringify(event),
          })
        ).status,
        200,
      );
    assert.equal(
      (
        await fetch(origin + "/api/tb3/paypal/webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(event),
        })
      ).status,
      400,
    );
    const denied = await fetch(origin + "/api/tb3/paypal/capture", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({
        checkoutToken: "0".repeat(64),
        orderId: "ORDER123",
      }),
    });
    assert.ok(denied.status >= 400);
    assert.equal(verifiedWebhooks, 2);
    assert.equal(f.calls.capture, 1);
    assert.equal(f.rows.size, 1);
    assert.equal(f.reads.length, 0);
    assert.equal(f.quotes, 0);
    assert.equal(external, 0);
    assert.deepEqual(failures, []);

    const failedCapture = await fetch(origin + "/api/tb3/paypal/capture", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ checkoutToken: browserCheckoutInput?.checkoutToken, orderId: "ORDER999" }),
    });
    assert.equal(failedCapture.status, 503);
    assert.equal(f.calls.capture, 1, "failed identity cannot trigger another capture");
    assert.equal(f.rows.size, 1, "failure leaves the paid order unchanged");
    assert.equal([...f.rows.values()][0].state, "paid");
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
