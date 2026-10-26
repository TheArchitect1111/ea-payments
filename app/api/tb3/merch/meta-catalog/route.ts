import {NextResponse} from 'next/server';
import catalog from '@/public/tb3/merch/manifest.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Meta can only import products that are actually purchasable on the
// seller's verified domain. Never advertise pending products as in stock.
function ready() {
  return process.env.VERCEL_ENV === 'production' &&
    process.env.TB3_MERCH_CHECKOUT_ENABLED === 'true' &&
    process.env.TB3_MERCH_AUTO_FULFILLMENT_APPROVED === 'true' &&
    process.env.TB3_PRINTFUL_FUNDING_VERIFIED === 'true' &&
    process.env.TB3_PRINTFUL_CATALOG_VERIFIED === 'true';
}
function csvField(value: string | number) {
  const s = String(value).replace(/"/g, '""');
  return '"' + s + '"';
}

export async function GET() {
  if (!ready()) return NextResponse.json({
    error: 'TB3 catalog is not yet eligible for public sales.',
  }, {status:503,headers:{'Cache-Control':'no-store'}});
  const header = [
    'id','title','description','availability','condition','price',
    'link','image_link','brand','item_group_id','size'
  ];
  const rows = [header.join(',')];
  for (const product of catalog) {
    for (const variant of product.variants) {
      const values = [
        'tb3-' + variant.id,
        product.name + ' / ' + variant.size,
        'Official TB3 Tarris Bouie personal-brand merchandise. Not affiliated with University of Alabama.',
        'in stock','new',variant.price.toFixed(2) + ' USD',
        'https://tb3.online/tarris#merch-' + product.id,
        'https://tb3.online' + product.image,
        'TB3',product.id,variant.size,
      ];
      rows.push(values.map(csvField).join(','));
    }
  }
  return new NextResponse(rows.join('\n') + '\n',{
    status:200,
    headers:{
      'Content-Type':'text/csv; charset=utf-8',
      'Content-Disposition':'inline; filename="tb3-meta-catalog.csv"',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
    },
  });
}
