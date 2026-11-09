import canonicalCatalog from "../../public/tb3/merch/manifest.json";

export type Tb3MerchVariant = {
  id: number;
  catalogVariantId: number;
  size: string;
  price: number;
  sku?: string;
};

export type Tb3MerchProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  color: string;
  image: string;
  provider: "printful";
  printfulProductId: number;
  status: string;
  fulfillmentMappingVerified: boolean;
  variants: Tb3MerchVariant[];
};

// This public JSON is the sole catalog source. SKU values stay absent until verified from Printful.
export const tb3MerchCatalog = canonicalCatalog as unknown as Tb3MerchProduct[];

export function findTb3CatalogVariant(
  productId: number,
  variantId: number,
  catalogVariantId?: number,
) {
  const product = tb3MerchCatalog.find((item) => item.printfulProductId === productId);
  const variant = product?.variants.find(
    (item) => item.id === variantId && (catalogVariantId === undefined || item.catalogVariantId === catalogVariantId),
  );
  return product && variant ? { product, variant } : null;
}

export function isTb3ProductPurchaseReady(
  product: Tb3MerchProduct,
  variant?: Tb3MerchVariant,
): boolean {
  const variants = variant ? [variant] : product.variants;
  return product.provider === "printful" &&
    product.status === "available" &&
    product.fulfillmentMappingVerified === true &&
    Number.isSafeInteger(product.printfulProductId) && product.printfulProductId > 0 &&
    variants.length > 0 &&
    variants.every((item) =>
      Number.isSafeInteger(item.id) && item.id > 0 &&
      Number.isSafeInteger(item.catalogVariantId) && item.catalogVariantId > 0 &&
      item.price === product.price &&
      (item.sku === undefined || (typeof item.sku === "string" && item.sku.trim().length > 0)),
    );
}

export default tb3MerchCatalog;
