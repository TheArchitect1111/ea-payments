import catalog from "./printful-manifest.json";

export function validateTb3PrintfulCatalog(value: unknown = catalog) {
  if (!Array.isArray(value) || value.length !== 14) throw Error("TB3 catalog must contain 14 products");
  const records = value as typeof catalog;
  const products = new Set<number>();
  const variants = new Set<number>();
  for (const product of records) {
    if (product.provider !== "printful" || !Number.isSafeInteger(product.printfulProductId) || product.printfulProductId <= 0 || products.has(product.printfulProductId))
      throw Error("TB3 catalog product mapping is invalid or duplicated");
    products.add(product.printfulProductId);
    if (!Array.isArray(product.variants) || !product.variants.length) throw Error("TB3 catalog product has no variants");
    for (const variant of product.variants) {
      if (!Number.isSafeInteger(variant.id) || variant.id <= 0 || variants.has(variant.id) || !Number.isSafeInteger(variant.catalogVariantId) || variant.catalogVariantId <= 0 || variant.price !== product.price)
        throw Error("TB3 catalog variant mapping or price is invalid");
      variants.add(variant.id);
    }
  }
  if (variants.size !== 82) throw Error("TB3 catalog must contain 82 unique mapped variants");
  return { productCount: products.size, variantCount: variants.size, liveCatalogVerified: false, skuFieldPresent: records.some((product) => product.variants.some((variant) => "sku" in variant && Boolean(variant.sku))) };
}

export const tb3PrintfulCatalogStatus = validateTb3PrintfulCatalog();
