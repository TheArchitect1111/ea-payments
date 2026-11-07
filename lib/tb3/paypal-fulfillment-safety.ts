import type { Lines, PayPalIntent, PayPalObject } from "./paypal-types";

// Same approved store as the existing TB3 transport. Never selected by a buyer.
export const PAYPAL_PRINTFUL_STORE_ID = 18945233;
export const sandboxPayPalQuote = () => ({
  shipping: 500,
  tax: 0,
  shippingMethod: "SANDBOX_FIXTURE",
});
export async function revalidatePrintfulDraft(
  row: PayPalIntent,
  orderId: number,
  request: (path: string, init?: RequestInit) => Promise<PayPalObject>,
) {
  if (row.mode !== "live")
    throw Error("Sandbox cannot inspect or confirm Printful drafts");
  const store = await request("/stores/" + PAYPAL_PRINTFUL_STORE_ID);
  if (store.id !== PAYPAL_PRINTFUL_STORE_ID)
    throw Error("Printful store mismatch");
  await revalidateProducts(row.lines, request);
  const order = await request("/orders/" + orderId);
  if (
    order.id !== orderId ||
    order.store !== PAYPAL_PRINTFUL_STORE_ID ||
    order.status !== "draft"
  )
    throw Error("Printful draft/store mismatch");
  if (
    !Array.isArray(order.items) ||
    order.items.length !== row.lines.length ||
    row.lines.some(
      (line) =>
        !order.items.some(
          (item: PayPalObject) =>
            item.sync_variant_id === line.variantId &&
            item.variant_id === line.catalogVariantId,
        ),
    )
  )
    throw Error("Printful draft catalog variant mismatch");
  return order;
}
async function revalidateProducts(
  lines: Lines,
  request: (path: string) => Promise<PayPalObject>,
) {
  for (const productId of new Set(lines.map((x) => x.productId))) {
    const detail = await request("/store/products/" + productId);
    if (
      detail.sync_product?.id !== productId ||
      detail.sync_product?.is_ignored ||
      !Array.isArray(detail.sync_variants)
    )
      throw Error("Printful product mismatch");
    for (const line of lines.filter((x) => x.productId === productId)) {
      const variant = detail.sync_variants.find(
        (x: PayPalObject) => x.id === line.variantId,
      );
      if (
        !variant ||
        variant.sync_product_id !== productId ||
        variant.variant_id !== line.catalogVariantId ||
        variant.is_ignored ||
        ["discontinued", "out_of_stock", "temporary_out_of_stock"].includes(
          variant.availability_status,
        ) ||
        !Array.isArray(variant.files) ||
        !variant.files.length
      )
        throw Error("Printful variant mismatch");
    }
  }
}
