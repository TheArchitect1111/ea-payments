import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const SIGNER_EMAIL = 'tarrisb73@yahoo.com';
const DOC_NAME = 'Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf';
const DOC_HASH = '390ed4546f66522f1ed84ccecd95bc037b24acd87eee7288913c9288027ac667';
const PRODUCT = 'tarris_bouie_agreement';
const DOC_TYPE = 'client_services_agreement';
const CLIENT_ID = 'contract_tarris_bouie';
const ORG_ID = 'tarris_bouie';

function headers() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function airtableCreate(table: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${table} write failed: ${await res.text()}`);
  return res.json();
}

async function markClientSigned(acceptedAt: string) {
  const formula = encodeURIComponent(`LOWER({Email})='${SIGNER_EMAIL}'`);
  const lookup = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('Client Records')}?filterByFormula=${formula}&maxRecords=1`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!lookup.ok) return;
  const data = await lookup.json() as { records?: Array<{ id: string }> };
  const id = data.records?.[0]?.id;
  if (!id) return;
  await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('Client Records')}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields: { 'Docs Signed At': acceptedAt, 'Onboarding Status': 'Docs Signed' }, typecast: true }),
    cache: 'no-store',
  });
}

export async function GET() {
  return NextResponse.json({
    ok: Boolean(process.env.AIRTABLE_API_KEY),
    agreement: DOC_NAME,
    agreementSha256: DOC_HASH,
    paymentNext: '/pay/tarris-bouie',
  }, { status: process.env.AIRTABLE_API_KEY ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.AIRTABLE_API_KEY) return NextResponse.json({ error: 'Signature storage is not configured.' }, { status: 503 });
    const body = await req.json().catch(() => ({})) as { legalName?: string; consent?: boolean };
    const legalName = String(body.legalName || '').trim().replace(/\s+/g, ' ');
    if (legalName.length < 2 || legalName.length > 120) return NextResponse.json({ error: 'Enter the signer’s full legal name.' }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ error: 'Electronic signature consent is required.' }, { status: 400 });

    const acceptedAt = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const acceptanceId = `tarris-${randomUUID()}`;
    const eventId = `tarris-sign-${randomUUID()}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app';
    const href = `${baseUrl}/tarris/future/agreement`;

    await airtableCreate('Legal Acceptances', {
      'Acceptance ID': acceptanceId,
      'User ID': SIGNER_EMAIL,
      'Client ID': CLIENT_ID,
      'Organization ID': ORG_ID,
      'Product': PRODUCT,
      'Document Type': DOC_TYPE,
      'Accepted Version': `sha256:${DOC_HASH}`,
      'Accepted At': acceptedAt,
      'IP Address': ip,
      'User Agent': userAgent,
      'Source': 'api.tarris.sign',
      'Href': href,
    });

    await airtableCreate('Legal Audit Events', {
      'Event ID': eventId,
      'Event Type': 'electronic_signature',
      'User ID': SIGNER_EMAIL,
      'Client ID': CLIENT_ID,
      'Organization ID': ORG_ID,
      'Product': PRODUCT,
      'Document Type': DOC_TYPE,
      'Document Version': `sha256:${DOC_HASH}`,
      'Timestamp': acceptedAt,
      'IP Address': ip,
      'Metadata JSON': JSON.stringify({
        legalName,
        signerEmail: SIGNER_EMAIL,
        documentName: DOC_NAME,
        documentSha256: DOC_HASH,
        consentToElectronicRecordsAndSignature: true,
        intentToSign: true,
        paymentNext: '/pay/tarris-bouie',
        userAgent,
      }),
      'Summary': `${legalName} electronically signed ${DOC_NAME}.`,
      'Email': SIGNER_EMAIL,
      'Organization Name': 'Tarris Bouie',
    });

    await markClientSigned(acceptedAt).catch((error) => console.error('[tarris-sign] client status update failed', error));

    return NextResponse.json({ ok: true, acceptedAt, acceptanceId, next: '/pay/tarris-bouie' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[tarris-sign] failed', error);
    return NextResponse.json({ error: 'Unable to record the electronic signature. Please try again.' }, { status: 500 });
  }
}
