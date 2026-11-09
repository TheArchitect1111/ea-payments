import { tb3MerchCatalog as catalog, isTb3ProductPurchaseReady, type Tb3MerchProduct } from "./merch-catalog";

export function validateTb3PrintfulCatalog(value: unknown = catalog) {
  if (!Array.isArray(value) || value.length !== 14) throw Error("TB3 catalog must contain 14 products");
  const records = value as Tb3MerchProduct[];
  const productIds = new Set<number>();
  const publicIds = new Set<string>();
  const variants = new Set<number>();
  for (const product of records) {
    if (product.provider !== "printful" || !Number.isSafeInteger(product.printfulProductId) || product.printfulProductId <= 0 || productIds.has(product.printfulProductId) || !product.id || publicIds.has(product.id))
      throw Error("TB3 catalog product mapping is invalid or duplicated");
    if (!Number.isFinite(product.price) || product.price <= 0 || product.currency !== "USD")
      throw Error("TB3 catalog product price is invalid");
    if (!Array.isArray(product.variants) || !product.variants.length || typeof product.fulfillmentMappingVerified !== "boolean")
      throw Error("TB3 catalog product has no explicit fulfillment verification state");
    productIds.add(product.printfulProductId);
    publicIds.add(product.id);
    for (const variant of product.variants) {
      if (!Number.isSafeInteger(variant.id) || variant.id <= 0 || variants.has(variant.id) || !Number.isSafeInteger(variant.catalogVariantId) || variant.catalogVariantId <= 0 || variant.price !== product.price || !variant.size || (variant.sku !== undefined && !variant.sku.trim()))
        throw Error("TB3 catalog variant mapping or price is invalid");
      variants.add(variant.id);
    }
  }
  if (variants.size !== 82) throw Error("TB3 catalog must contain 82 unique mapped variants");
  return {
    productCount: productIds.size,
    variantCount: variants.size,
    liveCatalogVerified: records.every((product) => product.fulfillmentMappingVerified),
    skuFieldPresent: records.some((product) => product.variants.some((variant) => Boolean(variant.sku?.trim()))),
    purchaseReadyProductCount: records.filter((product) => product.variants.every((variant) => isTb3ProductPurchaseReady(product, variant))).length,
  };
}

export const tb3PrintfulCatalogStatus = validateTb3PrintfulCatalog();
