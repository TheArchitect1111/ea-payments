import { NextRequest } from 'next/server';
import { authorize } from '@/lib/tb3/server';
import { ingestVerifiedBonfireOrder, tb3BonfireReport } from '@/lib/tb3/bonfire-ledger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await authorize(req, true);
  } catch (e: any) {
    return Response.json({ error: e.message || 'Unauthorized' }, { status: e.status || 401 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file' }, { status: 400 });

  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  const results: any[] = [];
  const errors: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (!cols[0]) continue;
    try {
      // Expected Bonfire CSV: Order ID, Order Date, Product ID, Product Name, Amount, Customer Name, Customer Email
      const raw: any = {};
      header.forEach((h, idx) => raw[h] = cols[idx]?.replace(/^"|"$/g, '').trim());

      const order = {
        order_id: raw['order id'] || raw['order_id'] || raw['order number'] || `csv-${i}`,
        product_id: raw['product id'] || raw['product_id'] || raw['sku'] || 'BONFIRE-CSV',
        product_name: raw['product name'] || raw['product'] || raw['item'] || 'Bonfire CSV Item',
        amount_cents: Math.round(parseFloat((raw['amount'] || raw['total'] || raw['price'] || '0').replace(/[^0-9.]/g, '')) * 100) || 5000,
        currency: 'usd' as const,
        customer: {
          name: raw['customer'] || raw['customer name'] || raw['buyer'] || 'CSV Customer',
          email: (raw['customer email'] || raw['email'] || raw['buyer email'] || `csv${i}@example.com`).toLowerCase(),
        },
        status: 'paid' as const,
      };
      const orderDate = raw['order date'] || raw['date'] || raw['created'] || undefined;

      const res = await ingestVerifiedBonfireOrder(order, 'bonfire-csv', orderDate);
      results.push(res);
    } catch (err: any) {
      errors.push({ line: i, error: err.message });
    }
  }

  const report = await tb3BonfireReport();
  return Response.json({ ok: true, imported: results.length, errors, report });
}
