import { z } from "zod";
import { tb3MerchCatalog as catalog, findTb3CatalogVariant, isTb3ProductPurchaseReady } from "./merch-catalog";
import { validateTb3PrintfulCatalog } from "./printful-catalog-validation";

validateTb3PrintfulCatalog();

const cartSchema = z.array(z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
}).strict()).min(1).max(20);

function normalizedCart(input: unknown) {
  const parsed = cartSchema.parse(input);
  const merged = new Map<number, number>();
  for (const item of parsed) {
    const quantity = (merged.get(item.variantId) ?? 0) + item.quantity;
    if (quantity > 10) throw new Error("Maximum 10 of each size per order.");
    merged.set(item.variantId, quantity);
  }
  if ([...merged.values()].reduce((sum, n) => sum + n, 0) > 20)
    throw new Error("Maximum 20 items per order.");
  return [...merged];
}

/** Read-only catalog mapping for reconciliation and isolated provider fixtures; this does not authorize checkout. */
export function mapTb3CatalogSelection(input: unknown) {
  return normalizedCart(input).map(([variantId, quantity]) => {
    const match = catalog.flatMap((product) => product.variants.map((variant) => ({ product, variant })))
      .find(({ variant }) => variant.id === variantId);
    if (!match || match.product.provider !== "printful")
      throw new Error("Selected product or size is unavailable.");
    const { product, variant } = match;
    const unitAmount = Math.round(variant.price * 100);
    if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0 || unitAmount !== Math.round(product.price * 100))
      throw new Error("Product pricing needs verification.");
    return {
      productId: product.printfulProductId,
      variantId,
      catalogVariantId: variant.catalogVariantId,
      name: product.name,
      size: variant.size,
      image: product.image,
      quantity,
      unitAmount,
      currency: "usd" as const,
    };
  });
}

/** Only explicitly verified, available Printful mappings may enter a PayPal order. */
export function resolveTb3Cart(input: unknown) {
  const lines = mapTb3CatalogSelection(input);
  for (const line of lines) {
    const match = findTb3CatalogVariant(line.productId, line.variantId, line.catalogVariantId);
    if (!match || !isTb3ProductPurchaseReady(match.product, match.variant))
      throw new Error("Selected product fulfillment mapping is not verified for checkout.");
  }
  return lines;
}
