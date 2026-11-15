import type { PayPalIntent, PayPalObject } from "./paypal-types";
import { paypalPaymentStatus, summarizeTb3Orders } from "./paypal-report";
import { findTb3CatalogVariant } from "./merch-catalog";

type Shipment = { status: string; trackingNumber: string; trackingUrl: string };
function shipments(order: PayPalObject): Shipment[] {
  if (!Array.isArray(order.shipments)) return [];
  return order.shipments.slice(0, 10).flatMap((raw: PayPalObject) => {
    const trackingNumber = typeof raw.tracking_number === "string" ? raw.tracking_number.slice(0, 80) : "";
    let trackingUrl = "";
    try {
      const u = new URL(String(raw.tracking_url || ""));
      if (u.protocol === "https:") trackingUrl = u.toString();
    } catch { /* omit untrusted tracking URL */ }
    const status = typeof raw.status === "string" ? raw.status.slice(0, 40) : "unknown";
    return trackingNumber || trackingUrl ? [{ status, trackingNumber, trackingUrl }] : [];
  });
}
export function createTb3CommerceReportHandler(ports: {
  authorize: (request: Request, write: false) => Promise<unknown>;
  list: (limit: number) => Promise<PayPalIntent[]>;
  printfulConfigured: () => boolean;
  printful: (path: string) => Promise<PayPalObject>;
  json: (data: unknown, status?: number) => Response;
}) {
  return async function GET(request: Request): Promise<Response> {
    try {
      await ports.authorize(request, false);
      const rows = await ports.list(100);
      const canReadPrintful = ports.printfulConfigured();
      const orders = await Promise.all(rows.map(async (row) => {
        let fulfillmentStatus: string = row.fulfillment;
        let tracking: Shipment[] = [];
        let fulfillmentSyncStatus = row.printfulId ? (canReadPrintful ? "unavailable" : "not_configured") : "not_created";
        if (canReadPrintful && Number.isSafeInteger(row.printfulId) && (row.printfulId || 0) > 0) {
          try {
            const printfulOrder = await ports.printful(`/orders/${row.printfulId}`);
            if (Number(printfulOrder.id) === row.printfulId) {
              fulfillmentSyncStatus = "current";
              if (typeof printfulOrder.status === "string") fulfillmentStatus = printfulOrder.status.slice(0, 40);
              tracking = shipments(printfulOrder);
            } else {
              fulfillmentSyncStatus = "identity_mismatch";
              fulfillmentStatus = "review";
            }
          } catch { /* retain durable ledger state and report the failed live read */ }
        }
        return {
          orderReference: row.paypalId || `intent-${row.id.slice(0, 10)}`,
          paymentStatus: paypalPaymentStatus(row),
          capturedCents: row.captureId && row.state !== "failed" ? row.total : 0,
          refundStatus: row.refundStatus || "none",
          refundedCents: row.refundTotalCents ?? null,
          fulfillmentStatus,
          fulfillmentSyncStatus,
          tracking,
          items: row.lines.map((line) => {
            const match = findTb3CatalogVariant(line.productId, line.variantId, line.catalogVariantId);
            return {
              productId: line.productId,
              variantId: line.variantId,
              name: match?.product.name ?? line.name,
              size: match?.variant.size ?? line.size,
              image: match?.product.image ?? "",
              quantity: line.quantity,
              unitAmountCents: line.unitAmount,
            };
          }),
          createdAt: row.createdAt,
        };
      }));
      return ports.json({ orders, summary: summarizeTb3Orders(rows), source: "paypal-ledger+printful" });
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 503;
      return ports.json({ ok: false, error: status === 401 || status === 403 ? "Private TB3 HQ access required." : "Private TB3 commerce report unavailable." }, status);
    }
  };
}
