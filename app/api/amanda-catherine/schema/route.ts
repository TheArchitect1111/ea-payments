import { NextResponse } from 'next/server';
import { registry } from '@/lib/amanda-catherine/registry';
import { listTablesSchema } from '@/lib/amanda-catherine/airtable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!baseId || !apiKey) {
    return NextResponse.json({
      ok: false,
      hasBaseId: Boolean(baseId),
      hasApiKey: Boolean(apiKey),
      squareLinksCount: 0,
      error: 'Missing Airtable environment variables',
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const [data, schema] = await Promise.all([registry(), listTablesSchema()]);
    const tables = (schema.tables || []).map((table: any) => ({
      name: table.name,
      id: table.id,
      fields: table.fields?.map((field: any) => field.name).slice(0, 30),
    }));
    const squareLinksCount = data.courses.filter(course => Boolean(course.square_checkout_url)).length;
    return NextResponse.json({
      ok: true,
      hasBaseId: true,
      hasApiKey: true,
      squareLinksCount,
      required: ['Organizations', 'Chassis Themes', 'Chassis Forms', 'Creative Studio'],
      tables,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      hasBaseId: true,
      hasApiKey: true,
      squareLinksCount: 0,
      error: error instanceof Error ? error.message : 'Amanda registry is unavailable',
    }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
