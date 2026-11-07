import { createHash } from "node:crypto";
import { resolveTb3Cart } from "./merch-cart";
import {
  CheckoutInput,
  cents,
  dollars,
  type PayPalIntent,
  type PayPalLedger,
  type PayPalObject,
  type Lines,
} from "./paypal-types";
import type { PayPalConfig } from "./paypal-config";
import { canConfirmTb3PrintfulOrder } from "./fulfillment-approval";
import {
  revalidatePrintfulDraft,
  sandboxPayPalQuote,
} from "./paypal-fulfillment-safety";

const hash = (x: unknown) =>
  createHash("sha256").update(JSON.stringify(x)).digest("hex");
const idOK = (x: unknown): x is string =>
  typeof x === "string" && /^[A-Za-z0-9]{6,64}$/.test(x);
export type PayPalPorts = {
  ledger: PayPalLedger;
  request: (
    path: string,
    method?: "GET" | "POST",
    body?: unknown,
    requestId?: string,
  ) => Promise<PayPalObject>;
  quote: (
    lines: Lines,
    recipient: PayPalIntent["recipient"],
  ) => Promise<{ shipping: number; tax: number; shippingMethod: string }>;
  printful: (path: string, init?: RequestInit) => Promise<PayPalObject>;
  autoConfirm: boolean;
  fundingVerified: boolean;
  costCap: number;
  approval?: () => {
    autoConfirm: boolean;
    fundingVerified: boolean;
    costCap: number;
  };
  now?: () => number;
};
const normalize = (x: unknown) =>
  String(x || "")
    .trim()
    .toUpperCase();
export function paypalService(config: PayPalConfig, ports: PayPalPorts) {
  const printful = async (path: string, init?: RequestInit) => {
    if (config.mode !== "live") throw Error("Sandbox cannot access Printful");
    return ports.printful(path, init);
  };
  const approved = (cost: PayPalObject, row: PayPalIntent) => {
    const policy = ports.approval?.() || ports;
    return canConfirmTb3PrintfulOrder({
      isProduction: config.mode === "live",
      ownerApproved: policy.autoConfirm,
      fundingVerified: policy.fundingVerified,
      capCents: policy.costCap,
      cost: cost?.total,
      currency: cost?.currency,
      merchandiseSubtotalCents: row.subtotal,
    });
  };
  const now = ports.now || Date.now;
  const localId = (token: string) =>
    hash([config.mode, config.merchantId, token]);
  function provenance(row: PayPalIntent) {
    if (
      row.tenant !== "tarris" ||
      row.mode !== config.mode ||
      row.merchantId !== config.merchantId
    )
      throw Error("Order tenant mismatch");
  }
  function active(row: PayPalIntent) {
    if (
      now() - Date.parse(row.createdAt) > 30 * 60 * 1000 ||
      now() < Date.parse(row.createdAt)
    )
      throw Error("Checkout expired");
  }
  function unit(order: PayPalObject, row: PayPalIntent) {
    if (
      order.id !== row.paypalId ||
      order.intent !== "CAPTURE" ||
      !Array.isArray(order.purchase_units) ||
      order.purchase_units.length !== 1
    )
      throw Error("PayPal order mismatch");
    const u = order.purchase_units[0];
    if (
      u.payee?.merchant_id !== row.merchantId ||
      u.custom_id !== row.id ||
      u.invoice_id !== "tb3pp_" + row.id ||
      u.reference_id !== "tarris" ||
      u.amount?.currency_code !== "USD" ||
      cents(u.amount.value) !== row.total
    )
      throw Error("PayPal merchant or amount mismatch");
    const breakdown = u.amount.breakdown;
    for (const [key, amount] of [
      ["item_total", row.subtotal],
      ["shipping", row.shipping],
      ["tax_total", row.tax],
    ] as const)
      if (
        breakdown?.[key]?.currency_code !== "USD" ||
        cents(breakdown[key].value) !== amount
      )
        throw Error("PayPal breakdown mismatch");
    const address = u.shipping?.address;
    const expected = {
      address_line_1: row.recipient.address1,
      address_line_2: row.recipient.address2 || "",
      admin_area_2: row.recipient.city,
      admin_area_1: row.recipient.state_code,
      postal_code: row.recipient.zip,
      country_code: row.recipient.country_code,
    };
    if (
      !address ||
      normalize(u.shipping?.name?.full_name) !==
        normalize(row.recipient.name) ||
      Object.entries(expected).some(
        ([k, v]) => normalize(address[k]) !== normalize(v),
      )
    )
      throw Error("PayPal delivery address mismatch");
    return u;
  }
  async function verified(row: PayPalIntent) {
    if (!row.paypalId) throw Error("Provider order unavailable");
    const order = await ports.request("/v2/checkout/orders/" + row.paypalId);
    const u = unit(order, row);
    const captures = u.payments?.captures;
    if (
      order.status !== "COMPLETED" ||
      !Array.isArray(captures) ||
      captures.length !== 1
    )
      return null;
    const capture = captures[0];
    if (capture.status !== "COMPLETED") return null;
    if (
      !idOK(capture.id) ||
      capture.final_capture !== true ||
      capture.amount?.currency_code !== "USD" ||
      cents(capture.amount.value) !== row.total
    )
      throw Error("PayPal capture mismatch");
    const current = await ports.request("/v2/payments/captures/" + capture.id);
    if (
      current.id !== capture.id ||
      current.status !== "COMPLETED" ||
      current.final_capture !== true ||
      current.amount?.currency_code !== "USD" ||
      cents(current.amount.value) !== row.total ||
      current.supplementary_data?.related_ids?.order_id !== row.paypalId
    )
      throw Error("PayPal capture not settled or reversed");
    if (row.captureId && row.captureId !== capture.id)
      throw Error("Capture identity changed");
    return capture.id as string;
  }
  async function create(raw: unknown) {
    const input = CheckoutInput.parse(raw);
    const id = localId(input.checkoutToken),
      lines = resolveTb3Cart(input.cart);
    const inputHash = hash([input.email, input.recipient, lines]);
    await ports.ledger.lock(id, async (existing, save) => {
      let row = existing;
      if (row) {
        provenance(row);
        if (row.inputHash !== inputHash)
          throw Error("Checkout identity conflict");
        if (row.paypalId)
          return { orderId: row.paypalId, total: dollars(row.total) };
        active(row);
      } else {
        const q =
            config.mode === "sandbox"
              ? sandboxPayPalQuote()
              : await ports.quote(lines, input.recipient),
          subtotal = lines.reduce((n, x) => n + x.unitAmount * x.quantity, 0);
        const total = subtotal + q.shipping + q.tax;
        if (
          ![subtotal, q.shipping, q.tax, total].every(
            (n) => Number.isSafeInteger(n) && n >= 0 && n <= 100000000,
          ) ||
          total <= 0 ||
          !q.shippingMethod
        )
          throw Error("Invalid shipping or tax quote");
        row = {
          id,
          tenant: "tarris",
          mode: config.mode,
          merchantId: config.merchantId,
          inputHash,
          createdAt: new Date(now()).toISOString(),
          email: input.email,
          recipient: input.recipient,
          lines,
          subtotal,
          shipping: q.shipping,
          tax: q.tax,
          shippingMethod: q.shippingMethod,
          total,
          state: "creating",
          fulfillment: "pending",
        };
        await save(row);
      }
    });
    return ports.ledger.lock(id, async (row, save) => {
      if (!row) throw Error("Durable intent required");
      provenance(row);
      active(row);
      if (row.paypalId)
        return { orderId: row.paypalId, total: dollars(row.total) };
      const made = await ports.request(
        "/v2/checkout/orders",
        "POST",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: "tarris",
              custom_id: row.id,
              invoice_id: "tb3pp_" + row.id,
              payee: { merchant_id: row.merchantId },
              amount: {
                currency_code: "USD",
                value: dollars(row.total),
                breakdown: {
                  item_total: {
                    currency_code: "USD",
                    value: dollars(row.subtotal),
                  },
                  shipping: {
                    currency_code: "USD",
                    value: dollars(row.shipping),
                  },
                  tax_total: { currency_code: "USD", value: dollars(row.tax) },
                },
              },
              items: row.lines.map((x) => ({
                name: (x.name + " " + x.size).slice(0, 127),
                sku: String(x.variantId),
                quantity: String(x.quantity),
                unit_amount: {
                  currency_code: "USD",
                  value: dollars(x.unitAmount),
                },
                category: "PHYSICAL_GOODS",
              })),
              shipping: {
                name: { full_name: row.recipient.name },
                address: {
                  address_line_1: row.recipient.address1,
                  ...(row.recipient.address2
                    ? { address_line_2: row.recipient.address2 }
                    : {}),
                  admin_area_2: row.recipient.city,
                  admin_area_1: row.recipient.state_code,
                  postal_code: row.recipient.zip,
                  country_code: "US",
                },
              },
            },
          ],
        },
        hash(["create", id]).slice(0, 32),
      );
      if (
        !idOK(made.id) ||
        !["CREATED", "PAYER_ACTION_REQUIRED", "APPROVED"].includes(made.status)
      )
        throw Error("Provider order creation unconfirmed");
      row = { ...row, paypalId: made.id, state: "created" };
      await save(row);
      return { orderId: made.id, total: dollars(row.total) };
    });
  }
  async function settle(id: string, expectedOrderId: string) {
    return ports.ledger.lock(id, async (row, save) => {
      if (!row || row.paypalId !== expectedOrderId)
        throw Error("Order unavailable");
      provenance(row);
      if (row.state === "hold") throw Error("Payment requires review");
      const order = await ports.request("/v2/checkout/orders/" + row.paypalId);
      unit(order, row);
      if (row.state !== "paid" && order.status === "APPROVED") {
        active(row);
        await ports.request(
          "/v2/checkout/orders/" + row.paypalId + "/capture",
          "POST",
          {},
          hash(["capture", id]).slice(0, 32),
        );
      }
      const captureId = await verified(row);
      if (!captureId) {
        if (row.state === "paid")
          throw Error("Previously paid capture requires review");
        return { paid: false, row };
      }
      row = { ...row, captureId, state: "paid" };
      await save(row);
      return { paid: true, row };
    });
  }
  const externalId = (row: PayPalIntent) =>
    "tb3pp_" + hash([row.mode, row.merchantId, row.paypalId]).slice(0, 26);
  async function lookup(id: string): Promise<PayPalObject | null> {
    try {
      return await printful("/orders/@" + id);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      )
        return null;
      throw error;
    }
  }
  function printfulIdentity(order: PayPalObject, row: PayPalIntent) {
    if (
      order.external_id !== externalId(row) ||
      !Number.isSafeInteger(order.id) ||
      !Array.isArray(order.items) ||
      order.items.length !== row.lines.length
    )
      throw Error("Printful identity mismatch");
    const expected = new Map(row.lines.map((x) => [x.variantId, x]));
    for (const item of order.items) {
      const x = expected.get(item.sync_variant_id);
      if (
        !x ||
        x.quantity !== item.quantity ||
        cents(String(item.retail_price)) !== x.unitAmount
      )
        throw Error("Printful lines mismatch");
      expected.delete(item.sync_variant_id);
    }
    if (
      expected.size ||
      order.shipping !== row.shippingMethod ||
      normalize(order.recipient?.email) !== normalize(row.email) ||
      Object.entries({
        ...row.recipient,
        address2: row.recipient.address2 || "",
      }).some(
        ([key, value]) =>
          normalize(order.recipient?.[key]) !== normalize(value),
      )
    )
      throw Error("Printful recipient mismatch");
  }
  async function fulfill(id: string) {
    const action = await ports.ledger.lock(id, async (row, save) => {
      if (!row || row.state !== "paid")
        throw Error("Verified paid order required");
      provenance(row);
      if (!(await verified(row))) throw Error("Payment no longer completed");
      if (config.mode === "sandbox") {
        await save({ ...row, fulfillment: "simulated" });
        return { confirm: false, status: "simulated", printfulId: 0 };
      }
      let order = await lookup(externalId(row));
      if (!order) {
        try {
          order = await printful("/orders?confirm=false", {
            method: "POST",
            body: JSON.stringify({
              external_id: externalId(row),
              shipping: row.shippingMethod,
              recipient: { ...row.recipient, email: row.email },
              items: row.lines.map((x) => ({
                sync_variant_id: x.variantId,
                quantity: x.quantity,
                retail_price: dollars(x.unitAmount),
              })),
            }),
          });
        } catch (error) {
          order = await lookup(externalId(row));
          if (!order) throw error;
        }
      }
      if (!order) throw Error("Printful order unavailable");
      printfulIdentity(order, row);
      const accepted = [
        "pending",
        "inprocess",
        "fulfilled",
        "partial",
        "onhold",
      ].includes(order.status);
      if (accepted) {
        await save({ ...row, printfulId: order.id, fulfillment: "confirmed" });
        return { confirm: false, status: "confirmed", printfulId: order.id };
      }
      if (order.status !== "draft")
        throw Error("Printful order requires review");
      if (row.fulfillment === "confirming" || row.fulfillment === "review") {
        return { confirm: false, status: "review", printfulId: order.id };
      }
      const canConfirm = approved(order.costs, row);
      if (!canConfirm) {
        await save({ ...row, printfulId: order.id, fulfillment: "draft" });
        return { confirm: false, status: "draft", printfulId: order.id };
      }
      // Commit the intent BEFORE any irreversible Printful confirmation.
      await save({ ...row, printfulId: order.id, fulfillment: "confirming" });
      return { confirm: true, status: "confirming", printfulId: order.id };
    });
    if (!action.confirm) return action.status;
    try {
      return await ports.ledger.lock(id, async (row, save) => {
        if (
          !row ||
          row.state !== "paid" ||
          row.fulfillment !== "confirming" ||
          !(await verified(row))
        )
          throw Error("Payment held or confirmation requires review");
        const fresh = await revalidatePrintfulDraft(
          row,
          action.printfulId,
          printful,
        );
        printfulIdentity(fresh, row);
        if (!approved(fresh.costs, row))
          throw Error("Current manufacturing cost or approval requires review");
        const result = await printful(
          "/orders/" + action.printfulId + "/confirm",
          { method: "POST" },
        );
        if (
          result.id !== action.printfulId ||
          !["pending", "inprocess", "fulfilled", "partial", "onhold"].includes(
            result.status,
          )
        )
          throw Error("Printful confirmation unverified");
        printfulIdentity(result, row);
        await save({ ...row, fulfillment: "confirmed" });
        return "confirmed";
      });
    } catch {
      await ports.ledger.lock(id, async (row, save) => {
        if (row && row.fulfillment === "confirming")
          await save({ ...row, fulfillment: "review" });
      });
      return "review";
    }
  }
  async function capture(checkoutToken: string, orderId: string) {
    if (!/^[a-f0-9]{64}$/.test(checkoutToken) || !idOK(orderId))
      throw Error("Invalid order identity");
    const settled = await settle(localId(checkoutToken), orderId);
    if (!settled.paid) return { status: "pending", fulfillment: "pending" };
    return { status: "paid", fulfillment: await fulfill(settled.row.id) };
  }
  async function webhook(event: PayPalObject) {
    const approved = event.event_type === "CHECKOUT.ORDER.APPROVED",
      completed = event.event_type === "PAYMENT.CAPTURE.COMPLETED";
    const hold = [
      "PAYMENT.CAPTURE.REFUNDED",
      "PAYMENT.CAPTURE.REVERSED",
      "PAYMENT.CAPTURE.DENIED",
    ].includes(event.event_type);
    if (!approved && !completed && !hold) return { ignored: true };
    const resource = event.resource || {},
      orderId = approved
        ? resource.id
        : resource.supplementary_data?.related_ids?.order_id;
    let linkedCapture = "";
    for (const link of Array.isArray(resource.links) ? resource.links : []) {
      try {
        const u = new URL(link.href);
        const match = u.pathname.match(
          /^\/v2\/payments\/captures\/([A-Za-z0-9]{6,64})$/,
        );
        if (
          link.rel === "up" &&
          u.protocol === "https:" &&
          [
            "api.paypal.com",
            "api-m.paypal.com",
            "api.sandbox.paypal.com",
            "api-m.sandbox.paypal.com",
          ].includes(u.hostname) &&
          match
        )
          linkedCapture = match[1]!;
      } catch {
        /* Never fetch a webhook-supplied URL. */
      }
    }
    const row = await ports.ledger.find(
      idOK(orderId) ? orderId : "",
      linkedCapture ||
        (idOK(resource.capture_id)
          ? resource.capture_id
          : idOK(resource.id)
            ? resource.id
            : ""),
    );
    if (!row) return { ignored: true };
    provenance(row);
    if (hold) {
      await ports.ledger.lock(row.id, async (current, save) => {
        if (current)
          await save({
            ...current,
            state: "hold",
            fulfillment:
              current.fulfillment === "confirmed" ? "confirmed" : "review",
          });
      });
      return { held: true };
    }
    const settled = await settle(row.id, row.paypalId!);
    if (!settled.paid) throw Error("Payment pending");
    if (completed && resource.id !== settled.row.captureId)
      throw Error("Webhook capture identity mismatch");
    return { status: "paid", fulfillment: await fulfill(row.id) };
  }
  async function cancel(checkoutToken: string, orderId: string) {
    if (!/^[a-f0-9]{64}$/.test(checkoutToken) || !idOK(orderId))
      throw Error("Invalid order identity");
    const result = await ports.ledger.lock(
      localId(checkoutToken),
      async (row, save) => {
        if (!row || row.paypalId !== orderId) throw Error("Order unavailable");
        provenance(row);
        if (row.state === "hold")
          return { status: "review", fulfillment: row.fulfillment };
        const paid = await verified(row);
        if (paid) {
          await save({ ...row, state: "paid", captureId: paid });
          return { status: "paid", fulfillment: row.fulfillment };
        }
        const current = await ports.request(
          "/v2/checkout/orders/" + row.paypalId,
        );
        const purchase = unit(current, row);
        if (
          current.status === "COMPLETED" ||
          purchase.payments?.captures?.length
        ) {
          return { status: "pending", fulfillment: row.fulfillment };
        }
        await save({ ...row, state: "hold" });
        return { status: "cancelled" };
      },
    );
    if (result.status === "paid")
      return {
        status: "paid",
        fulfillment: await fulfill(localId(checkoutToken)),
      };
    return result;
  }
  return { create, capture, cancel, webhook };
}
