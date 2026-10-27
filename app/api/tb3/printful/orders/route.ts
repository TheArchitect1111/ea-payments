import type { NextRequest } from 'next/server';
import { authorize, handled, json } from '@/lib/tb3/server';
import { tb3Printful } from '@/lib/tb3/printful-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Order = {
  id: number;
  external_id?: string | null;
  status: string;
  created: number;
  items?: { name?: string; quantity: number }[];
  retail_costs?: { currency?: string; total?: string | number | null } | null;
  costs?: { currency?: string; total?: string | number | null } | null;
  shipments?: {
    carrier?: string;
    tracking_number?: string;
    tracking_url?: string;
  }[];
};

function safeTrackingUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  return handled(async () => {
    await authorize(req, true);
    const rawOffset = req.nextUrl.searchParams.get('offset') ?? '0';
    if (!/^[0-9]{1,6}$/.test(rawOffset))
      return json({ error: 'Invalid page.' }, 400);
    const offset = Number(rawOffset);
    const orders = await tb3Printful<Order[]>(
      '/orders?limit=100&offset=' + offset);

    return json({
      orders: orders.map(order => ({
        id: order.id,
        reference: order.external_id || String(order.id),
        status: order.status,
        created: order.created,
        products: (order.items ?? []).map(item => ({
          name: item.name || 'Merchandise',
          quantity: item.quantity,
        })),
        retailTotal: order.retail_costs?.total ?? null,
        fulfillmentCost: order.costs?.total ?? null,
        fulfillmentCurrency: order.costs?.currency ?? null,
        currency: order.retail_costs?.currency ?? null,
        shipments: (order.shipments ?? []).map(shipment => ({
          carrier: shipment.carrier || '',
          trackingNumber: shipment.tracking_number || '',
          trackingUrl: safeTrackingUrl(shipment.tracking_url),
        })),
      })),
      nextOffset: orders.length === 100 ? offset + 100 : null,
      source: 'printful',
      paymentVerification: 'not-included',
    });
  });
}
