import type { PayPalObject } from "./paypal-types";

export const TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID = "5GQFCP4FK79CU";

type PayPalRequest = (
  path: string,
  method?: "GET" | "POST",
  body?: unknown,
  requestId?: string,
) => Promise<PayPalObject>;

const isOrderId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9]{6,64}$/.test(value);

const safeOrderStatus = (value: unknown) =>
  ["CREATED", "PAYER_ACTION_REQUIRED", "APPROVED", "COMPLETED", "VOIDED"].includes(String(value))
    ? String(value)
    : "OTHER";

/**
 * Create one unapproved Sandbox-only order with no explicit payee.
 * This deliberately bypasses the ledger and checkout service, and has no
 * capture, webhook, or Printful calls. The daily PayPal request ID makes
 * retries idempotent.
 */
export async function runTb3SandboxPayeeDiagnostic(
  request: PayPalRequest,
  configuredMerchantId: string,
  now = Date.now(),
) {
  if (configuredMerchantId !== TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID) {
    throw new Error("Sandbox merchant preflight failed");
  }

  const day = new Date(now).toISOString().slice(0, 10).replaceAll("-", "");
  const unit = {
    reference_id: "tarris",
    custom_id: `tb3-no-payee-${day}`,
    invoice_id: `tb3ppnp${day}`,
    amount: {
      currency_code: "USD",
      value: "5.01",
      breakdown: {
        item_total: { currency_code: "USD", value: "0.01" },
        shipping: { currency_code: "USD", value: "5.00" },
        tax_total: { currency_code: "USD", value: "0.00" },
      },
    },
    items: [{
      name: "TB3 Sandbox certification test item",
      quantity: "1",
      unit_amount: { currency_code: "USD", value: "0.01" },
      category: "PHYSICAL_GOODS",
    }],
    shipping: {
      name: { full_name: "Sandbox Test Buyer" },
      address: {
        address_line_1: "1 Sandbox Test Street",
        admin_area_2: "Birmingham",
        admin_area_1: "AL",
        postal_code: "35203",
        country_code: "US",
      },
    },
  };
  const payload = { intent: "CAPTURE", purchase_units: [unit] };
  const order = await request(
    "/v2/checkout/orders",
    "POST",
    payload,
    `tb3-no-payee-${day}`,
  );

  let returnedPayee = order.purchase_units?.[0]?.payee?.merchant_id;
  let identitySource: "create_response" | "readback" | "not_returned" =
    typeof returnedPayee === "string" ? "create_response" : "not_returned";
  if (typeof returnedPayee !== "string" && isOrderId(order.id)) {
    try {
      const readback = await request(`/v2/checkout/orders/${order.id}`);
      returnedPayee = readback.purchase_units?.[0]?.payee?.merchant_id;
      if (typeof returnedPayee === "string") identitySource = "readback";
    } catch {
      // The create response remains authoritative for order creation. Report
      // the seller identity as unavailable if the safe GET readback fails.
    }
  }

  const responseUnit = order.purchase_units?.[0];
  const amountMatches =
    responseUnit?.amount?.currency_code === "USD" &&
    responseUnit?.amount?.value === "5.01";
  const fixtureBreakdownMatches =
    responseUnit?.amount?.breakdown?.item_total?.value === "0.01" &&
    responseUnit?.amount?.breakdown?.shipping?.value === "5.00" &&
    responseUnit?.amount?.breakdown?.tax_total?.value === "0.00";
  const noCapture = order.status !== "COMPLETED" &&
    !order.purchase_units?.some((purchaseUnit: PayPalObject) =>
      Array.isArray(purchaseUnit.payments?.captures) && purchaseUnit.payments.captures.length > 0,
    );

  return {
    orderCreated: isOrderId(order.id) && ["CREATED", "PAYER_ACTION_REQUIRED"].includes(String(order.status)),
    orderStatus: safeOrderStatus(order.status),
    intentCapture: order.intent === "CAPTURE",
    purchaseUnitCount: Array.isArray(order.purchase_units) ? order.purchase_units.length : 0,
    explicitPayeeOmitted: !Object.hasOwn(unit, "payee"),
    amountMatches,
    fixtureBreakdownMatches,
    paymentCaptured: !noCapture,
    merchantIdentityReturned: typeof returnedPayee === "string",
    merchantMatchesExpected: typeof returnedPayee === "string"
      ? returnedPayee === TB3_PAYPAL_SANDBOX_EXPECTED_MERCHANT_ID
      : null,
    merchantIdentitySource: identitySource,
  };
}
