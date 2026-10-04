import { NextResponse } from 'next/server';
import { AMANDA_BASE_ID, AMANDA_TABLES } from '@/lib/amanda-catherine/storage';

export async function GET() {
  const KEY = process.env.AIRTABLE_API_KEY;
  if (!KEY) return NextResponse.json({ error: 'Missing AIRTABLE_API_KEY' }, { status: 500 });
  const baseId = AMANDA_BASE_ID;
  const results: Record<string, any> = {};

  for (const [key, tableName] of Object.entries(AMANDA_TABLES)) {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
      const json = await res.json();
      if (!res.ok) {
        results[key] = { table: tableName, exists: false, status: res.status, error: json, hint: 'Table may not exist or API key lacks access - check base ID and table name' };
      } else {
        const fields = Object.keys(json.records?.[0]?.fields || {});
        results[key] = { table: tableName, exists: true, sampleFieldCount: fields.length, sampleFields: fields.slice(0, 20), recordCountEstimate: json.records?.length || 0 };
      }
    } catch (e: any) {
      results[key] = { table: tableName, error: e.message };
    }
  }

  return NextResponse.json({
    baseId,
    baseIdSource: process.env.AIRTABLE_AMANDA_BASE_ID ? 'AIRTABLE_AMANDA_BASE_ID' : process.env.AIRTABLE_PAYMENTS_BASE_ID ? 'AIRTABLE_PAYMENTS_BASE_ID' : 'fallback appv0YoLIMY45fmDA',
    tables: results,
    guidance: 'Use this endpoint on Preview to verify live field names before production deploy. If a table shows exists:false, create it in Airtable or set env var to correct table ID/name.'
  });
}
