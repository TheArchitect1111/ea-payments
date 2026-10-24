import catalog from '../../public/tb3/merch/manifest.json';
import { z } from 'zod';

const cartSchema = z.array(z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
}).strict()).min(1).max(20);

export function resolveTb3Cart(input: unknown) {
  const parsed = cartSchema.parse(input);
  const merged = new Map<number, number>();

  for (const item of parsed) {
    const quantity = (merged.get(item.variantId) ?? 0) + item.quantity;
    if (quantity > 10) throw new Error('Maximum 10 of each size per order.');
    merged.set(item.variantId, quantity);
  }

  if ([...merged.values()].reduce((sum, n) => sum + n, 0) > 20)
    throw new Error('Maximum 20 items per order.');

  return [...merged].map(([variantId, quantity]) => {
    const product = catalog.find(p =>
      p.variants.some(v => v.id === variantId));
    const variant = product?.variants.find(v => v.id === variantId);

    if (!product || !variant || product.provider !== 'printful')
      throw new Error('Selected product or size is unavailable.');

    const unitAmount = Math.round(variant.price * 100);
    if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0 ||
        unitAmount !== Math.round(product.price * 100))
      throw new Error('Product pricing needs verification.');

    return {
      productId: product.printfulProductId,
      variantId,
      catalogVariantId: variant.catalogVariantId,
      name: product.name,
      size: variant.size,
      image: product.image,
      quantity,
      unitAmount,
      currency: 'usd' as const,
    };
  });
}
