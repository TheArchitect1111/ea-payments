import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tb3MerchCatalog as catalog } from "../lib/tb3/merch-catalog";
import { validateTb3PrintfulCatalog } from "../lib/tb3/printful-catalog-validation";
import { mapTb3CatalogSelection, resolveTb3Cart } from "../lib/tb3/merch-cart";
import { summarizeTb3Orders } from "../lib/tb3/paypal-report";
import { createTb3CommerceReportHandler } from "../lib/tb3/paypal-report-handler";
import type { PayPalIntent } from "../lib/tb3/paypal-types";

test("canonical catalog validates all 14 products and 82 mapped variants without authorizing unverified purchases", () => {
  assert.deepEqual(validateTb3PrintfulCatalog(), { productCount: 14, variantCount: 82, liveCatalogVerified: false, skuFieldPresent: false, purchaseReadyProductCount: 0 });
  const productIds = new Set(catalog.map(x => x.printfulProductId));
  const variants = catalog.flatMap(x => x.variants);
  assert.equal(productIds.size, 14);
  assert.equal(variants.length, 82);
  assert.equal(new Set(variants.map(x => x.id)).size, 82);
  assert.equal(new Set(variants.map(x => x.catalogVariantId)).size, 56);
  for (const variant of variants) {
    const line = mapTb3CatalogSelection([{ variantId: variant.id, quantity: 1 }])[0]!;
    assert.equal(line.variantId, variant.id);
    assert.equal(line.catalogVariantId, variant.catalogVariantId);
    assert.equal(line.productId, catalog.find(p => p.variants.some(v => v.id === variant.id))!.printfulProductId);
  }
  assert.ok(catalog.every((product) => product.status === "coming_soon" && product.fulfillmentMappingVerified === false));
  assert.throws(() => resolveTb3Cart([{ variantId: variants[0].id, quantity: 1 }]), /mapping is not verified/);
  assert.equal(readFileSync("app/tarris/page.tsx", "utf8").includes("@/lib/tb3/merch-catalog"), true);
  assert.equal(readFileSync("app/tarris/paypal-checkout/PayPalCheckout.tsx", "utf8").includes("@/lib/tb3/merch-catalog"), true);
  assert.equal(readFileSync("app/tarris/future/page.tsx", "utf8").includes("@/lib/tb3/merch-catalog"), true);
  assert.equal(readFileSync("app/tarris/book/booking-form.tsx", "utf8").includes("@/lib/tb3/merch-catalog"), true);
});

const order: PayPalIntent = {
  id: "a".repeat(64), tenant: "tarris", mode: "live", merchantId: "M123456", inputHash: "h", createdAt: "2026-11-09T12:00:00.000Z",
  email: "private@example.test", recipient: { name: "Private Buyer", address1: "1 Private St", city: "Test", state_code: "NC", zip: "28201", country_code: "US" },
  lines: [{ productId: 485112609, variantId: 5593588451, catalogVariantId: 9527, name: "TB3 Signature Tee - Black", size: "XS", image: "/tb3/merch/mockups/tb3-signature-tee-black.png", quantity: 1, unitAmount: 5000, currency: "usd" }],
  subtotal: 5000, shipping: 500, tax: 0, shippingMethod: "GROUND", total: 5500, paypalId: "PAYPAL123", captureId: "CAPTURE123", state: "paid", printfulId: 123, fulfillment: "confirmed",
  refundStatus: "partial", refundTotalCents: 1000,
};
const state = { authorized: false, rows: [order], calls: [] as string[], printfulConfigured: true };
const handler = createTb3CommerceReportHandler({
  authorize: async (_request, write) => { assert.equal(write, false, "HQ report must require viewer-level read authorization"); if (!state.authorized) throw Object.assign(new Error("denied"), { status: 401 }); },
  list: async (limit) => state.rows.slice(0, limit),
  printfulConfigured: () => state.printfulConfigured,
  printful: async (path) => {
    state.calls.push(`GET ${path}`);
    if ((state as typeof state & { printfulFailure?: boolean }).printfulFailure) throw new Error("fixture unavailable");
    return { id: 123, status: "fulfilled", shipments: [
      { status: "shipped", tracking_number: "TRACK123", tracking_url: "https://carrier.example/track/123" },
      { status: "shipped", tracking_number: "BAD", tracking_url: "javascript:alert(1)" },
    ] };
  },
  json: (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } }),
});

test("actual HQ report handler rejects unauthorized access and reconciles safe tracking", async () => {
  state.authorized = false;
  const denied = await handler(new Request("https://tb3.online/api/tb3/paypal/report"));
  assert.equal(denied.status, 401);
  state.authorized = true;
  const response = await handler(new Request("https://tb3.online/api/tb3/paypal/report"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const result = await response.json();
  assert.equal(result.source, "paypal-ledger+printful");
  assert.deepEqual(result.summary, { orderCount: 1, capturedOrderCount: 1, grossCapturedCents: 5500, refundedCents: 1000, netAfterRefundsCents: 4500, reconciliation: "ledger totals reconciled" });
  assert.equal(result.orders[0].paymentStatus, "partially_refunded");
  assert.deepEqual(result.orders[0].items[0], { productId: 485112609, variantId: 5593588451, name: "TB3 Signature Tee - Black", size: "XS", image: "/tb3/merch/mockups/tb3-signature-tee-black.png", quantity: 1, unitAmountCents: 5000 });
  assert.equal(result.orders[0].fulfillmentStatus, "fulfilled");
  assert.equal(result.orders[0].fulfillmentSyncStatus, "current");
  assert.deepEqual(result.orders[0].tracking, [
    { status: "shipped", trackingNumber: "TRACK123", trackingUrl: "https://carrier.example/track/123" },
    { status: "shipped", trackingNumber: "BAD", trackingUrl: "" },
  ]);
  assert.doesNotMatch(JSON.stringify(result), /private@example\.test|Private Buyer|Private St|28201/);
  assert.deepEqual(state.calls, ["GET /orders/123"]);
  assert.match(readFileSync("app/api/tb3/paypal/report/route.ts", "utf8"), /GET = createTb3CommerceReportHandler/);
  const hq = readFileSync("app/tarris/future/page.tsx", "utf8");
  assert.match(hq, /import Tb3MerchSales from/);
  assert.match(hq, /<Tb3MerchSales \/>/);
});

test("unknown partial refund amount blocks net-revenue certification", () => {
  const summary = summarizeTb3Orders([{ ...order, refundTotalCents: null, refundStatus: "review" }]);
  assert.equal(summary.grossCapturedCents, 5500);
  assert.equal(summary.refundedCents, null);
  assert.equal(summary.netAfterRefundsCents, null);
  assert.equal(summary.reconciliation, "refund amount requires review");
  const legacy = summarizeTb3Orders([{ ...order, state: "refunded", refundStatus: undefined, refundTotalCents: undefined }]);
  assert.equal(legacy.netAfterRefundsCents, null);
});

test("read-only HQ report tolerates a missing Printful connection without mutation", async () => {
  state.calls.length = 0;
  state.printfulConfigured = false;
  const response = await handler(new Request("https://tb3.online/api/tb3/paypal/report"));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.orders[0].fulfillmentStatus, "confirmed");
  assert.equal(result.orders[0].fulfillmentSyncStatus, "not_configured");
  assert.deepEqual(result.orders[0].tracking, []);
  assert.deepEqual(state.calls, []);
  state.printfulConfigured = true;
});

test("Printful read failure is visible as an unavailable sync", async () => {
  state.calls.length = 0;
  (state as typeof state & { printfulFailure?: boolean }).printfulFailure = true;
  const response = await handler(new Request("https://tb3.online/api/tb3/paypal/report"));
  const result = await response.json();
  assert.equal(result.orders[0].fulfillmentStatus, "confirmed");
  assert.equal(result.orders[0].fulfillmentSyncStatus, "unavailable");
  (state as typeof state & { printfulFailure?: boolean }).printfulFailure = false;
});
