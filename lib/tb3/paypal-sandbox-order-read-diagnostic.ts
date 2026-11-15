import type { PayPalObject } from "./paypal-types";

export const TB3_SANDBOX_ORDER_READ_DIAGNOSTIC_ID = "7EJ853085V886142J";

type PayPalRequest = (
  path: string,
  method?: "GET" | "POST",
  body?: unknown,
  requestId?: string,
) => Promise<PayPalObject>;

const SAFE_ORDER_STATUSES = ["CREATED", "SAVED", "PAYER_ACTION_REQUIRED", "APPROVED", "COMPLETED", "VOIDED"] as const;

/** Read one fixed existing Sandbox order and reduce it to non-sensitive certification facts. */
export async function runTb3SandboxOrderReadDiagnostic(
  request: PayPalRequest,
  configuredMerchantId: string,
) {
  const order = await request(`/v2/checkout/orders/${TB3_SANDBOX_ORDER_READ_DIAGNOSTIC_ID}`, "GET");
  const status = typeof order.status === "string" && SAFE_ORDER_STATUSES.includes(order.status as typeof SAFE_ORDER_STATUSES[number])
    ? order.status
    : "OTHER";
  const units = Array.isArray(order.purchase_units) ? order.purchase_units : [];
  const capturesPresent = units.some((unit: PayPalObject) =>
    Array.isArray(unit.payments?.captures) && unit.payments.captures.length > 0,
  );
  const payees = units.map((unit: PayPalObject) => unit.payee?.merchant_id);

  return {
    orderStatus: status,
    buyerApproved: status === "APPROVED" || status === "COMPLETED",
    capturePresent: capturesPresent,
    merchantMatches: payees.length > 0 && payees.every((merchantId: unknown) =>
      typeof merchantId === "string" && merchantId === configuredMerchantId,
    ),
  };
}

