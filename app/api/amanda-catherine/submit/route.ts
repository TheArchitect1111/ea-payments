import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const logs: any[] = [];

  try {
    const ct = req.headers.get('content-type') || '';
    let data: any = {};

    if (ct.includes('application/json')) {
      data = await req.json();
    } else {
      const form = await req.formData();
      form.forEach((v, k) => {
        data[k] = String(v);
      });
    }

    logs.push({ in: data });
    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
    logs.push({ env: { hasBaseId: !!baseId, hasApiKey: !!apiKey } });

    let airtableResults: any = { skipped: 'no env' };
    if (baseId && apiKey) {
      try {
        const { handleAmandaSubmit } = await import('@/lib/amanda-catherine/storage');
        airtableResults = await handleAmandaSubmit(data);
        logs.push({ airtableResults });
      } catch (e: any) {
        logs.push({ airtableError: e.message });
        airtableResults = { error: e.message, logs };
      }
    } else {
      airtableResults = {
        warning: 'Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY in Vercel Preview',
        logs,
      };
    }

    if (ct.includes('application/json')) {
      return NextResponse.json({ ok: true, data, airtableResults, logs });
    }

    const url = new URL('/portal/amanda-catherine/thank-you', req.url);
    url.searchParams.set('type', data.type || 'submission');
    if (data.courseId) url.searchParams.set('course', data.courseId);
    if (data.formId) url.searchParams.set('form', data.formId);
    const writeDiagnostics = Array.isArray(airtableResults)
      ? airtableResults.flatMap((result) => {
          if (result?.success === false) {
            const initial = result.initialError
              ? ` (initial Airtable error: ${result.initialError})`
              : '';
            return [`${result.table}: ${result.error || 'write failed'}${initial}`];
          }
          if (result?.initialError) {
            return [
              `${result.table}: recovered field mismatch (${result.fallback?.from} → ${result.fallback?.to}); Airtable error: ${result.initialError}`,
            ];
          }
          return [];
        })
      : [];
    const writeDiagnostic = writeDiagnostics.join('; ');
    if (writeDiagnostic || airtableResults?.error || airtableResults?.warning) {
      url.searchParams.set(
        'debug',
        (writeDiagnostic || airtableResults.error || airtableResults.warning).slice(0, 200),
      );
    }

    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  return NextResponse.json({
    ok: true,
    endpoint: 'POST /api/amanda-catherine/submit',
    env: { hasBaseId: !!baseId, hasApiKey: !!apiKey },
    writesTo: [
      'Creative Studio',
      'Client Records',
      'Portal Form Submissions',
      'amanda_waitlist',
    ],
  });
}
