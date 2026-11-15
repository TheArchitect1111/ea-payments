import type { PayPalIntent } from "./paypal-types";

export function paypalPaymentStatus(row: PayPalIntent) {
  if (row.refundStatus === "review") return "review";
  if (row.refundStatus === "partial") return "partially_refunded";
  if (row.state === "paid") return "captured";
  if (row.state === "refunded") return "refunded";
  if (row.state === "failed") return "failed";
  if (row.state === "hold") return "review";
  return row.state === "created" ? "pending" : "unconfirmed";
}

export function summarizeTb3Orders(rows: PayPalIntent[]) {
  const captured = rows.filter((row) => row.state === "paid" || row.state === "refunded" || (row.state === "hold" && Boolean(row.captureId)));
  const unknownRefund = captured.some((row) => row.state === "hold" || row.refundStatus === "review" || (row.refundTotalCents == null && (row.state === "refunded" || row.refundStatus === "partial" || row.refundStatus === "refunded")));
  const grossCapturedCents = captured.reduce((sum, row) => sum + row.total, 0);
  const refundedCents = captured.every((row) => row.refundTotalCents != null || (row.state !== "refunded" && row.state !== "hold" && row.refundStatus !== "partial" && row.refundStatus !== "refunded" && row.refundStatus !== "review" && (row.refundStatus === "none" || !row.refundStatus)))
    ? captured.reduce((sum, row) => sum + (row.refundTotalCents || 0), 0)
    : null;
  return {
    orderCount: rows.length,
    capturedOrderCount: captured.length,
    grossCapturedCents,
    refundedCents,
    netAfterRefundsCents: unknownRefund || refundedCents === null ? null : grossCapturedCents - refundedCents,
    reconciliation: unknownRefund ? "refund amount requires review" : "ledger totals reconciled",
  };
}
