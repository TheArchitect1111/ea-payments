import { NextResponse } from 'next/server';

export async function GET() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;

  if (!baseId || !apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing env vars',
        hasBaseId: !!baseId,
        hasApiKey: !!apiKey,
        hint: 'Add AIRTABLE_BASE_ID and AIRTABLE_API_KEY in Vercel Dashboard > Settings > Environment Variables (enable Preview + Production) then Redeploy',
        expectedTables: [
          'Portal Form Submissions',
          'amanda_waitlist',
          'Creative Studio',
          'Client Records',
        ],
      },
      { status: 200 },
    );
  }

  try {
    const { listTablesSchema } = await import('@/lib/amanda-catherine/airtable');
    const schema = await listTablesSchema();
    const tables = (schema.tables || []).map((t: any) => ({
      name: t.name,
      id: t.id,
      fields: t.fields?.map((f: any) => f.name).slice(0, 30),
    }));
    const required = [
      'Portal Form Submissions',
      'amanda_waitlist',
      'Creative Studio',
      'Client Records',
    ];
    const found = required.map((name) => ({
      name,
      exists: tables.some((t: any) => t.name === name),
    }));

    return NextResponse.json({
      ok: true,
      baseId: baseId.slice(0, 10) + '…',
      required,
      found,
      tables,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e.message,
        hasBaseId: !!baseId,
        hasApiKey: !!apiKey,
        hint: 'Check if Base ID is correct and API key has access',
      },
      { status: 500 },
    );
  }
}
