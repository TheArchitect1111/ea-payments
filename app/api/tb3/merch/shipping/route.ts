import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTb3Cart } from '@/lib/tb3/merch-cart';
import { tb3Printful, PrintfulError } from '@/lib/tb3/printful-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  cart: z.unknown(),
  recipient: z.object({
    address1: z.string().trim().min(1).max(150),
    address2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(1).max(100),
    state_code: z.string().trim().min(1).max(10),
    country_code: z.literal('US'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  }).strict(),
}).strict();

type Rate = {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
};

export async function POST(req: NextRequest) {
  const reply = (value: unknown, status = 200) =>
    NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

  if (req.headers.get('origin') !== req.nextUrl.origin)
    return reply({ error: 'Request origin denied.' }, 403);

  try {
    const raw = await req.text();
    if (raw.length > 20000)
      return reply({ error: 'Request too large.' }, 413);

    const input = requestSchema.parse(JSON.parse(raw));
    const cart = resolveTb3Cart(input.cart);
    const rates = await tb3Printful<Rate[]>('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify({
        recipient: input.recipient,
        currency: 'USD',
        items: cart.map(item => ({
          variant_id: item.catalogVariantId,
          quantity: item.quantity,
          value: (item.unitAmount / 100).toFixed(2),
        })),
      }),
    });

    if (!Array.isArray(rates) || !rates.length ||
        rates.some(rate => rate.currency !== 'USD' ||
          !Number.isFinite(Number(rate.rate)) || Number(rate.rate) < 0))
      return reply({ error: 'Shipping is unavailable for this order.' }, 503);

    return reply({ rates, quotedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof PrintfulError)
      return reply({ error: 'Shipping quotes are temporarily unavailable.' }, 503);
    return reply({ error: 'Check your cart and US shipping address.' }, 400);
  }
}
