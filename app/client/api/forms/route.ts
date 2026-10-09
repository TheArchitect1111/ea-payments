import { NextRequest, NextResponse } from 'next/server';
import { getHqProject, saveSubmission } from '../../_lib/hq-store';
import { createSign } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function base64url(value: string) {
  return Buffer.from(value).toString('base64url');
}

async function googleAccessToken() {
  const raw = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  const account = JSON.parse(raw) as { client_email?: string; private_key?: string };
  if (!account.client_email || !account.private_key) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: account.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256'); signer.update(unsigned); signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key.replace(/\\n/g, '\n')).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) return null;
  const body = await response.json() as { access_token?: string };
  return body.access_token ?? null;
}

async function appendToGoogleSheet(sheetUrl: string | undefined, values: string[]) {
  const id = sheetUrl?.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!id) return false;
  const token = await googleAccessToken().catch(() => null);
  if (!token) return false;
  const metadata = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!metadata?.ok) return false;
  const details = await metadata.json() as { sheets?: Array<{ properties?: { title?: string } }> };
  const title = details.sheets?.[0]?.properties?.title;
  if (!title) return false;
  const range = encodeURIComponent(`'${title.replace(/'/g, "''")}'!A:E`);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [values] }),
  }).catch(() => null);
  return Boolean(response?.ok);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { projectId?: string; itemId?: string; name?: string; email?: string; message?: string } | null;
  const id = body?.projectId ?? '';
  const project = await getHqProject(id);
  const now = Date.now();
  const item = project?.items.find((entry) => entry.id === body?.itemId && entry.shelf === 'form' && (entry.status === 'live' || Boolean(entry.scheduledAt && new Date(entry.scheduledAt).getTime() <= now)));
  if (!project || !item) return NextResponse.json({ error: 'This form is not available.' }, { status: 404 });
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 254) : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 3000) : '';
  const submission = {
    id: `sub_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    projectId: id, itemId: item.id, name, email, message, submittedAt: new Date().toISOString(),
  };
  try {
    await saveSubmission(id, submission);
  } catch (error) {
    console.error('[phone-hq] form submission save failed', error);
    return NextResponse.json({ error: 'Submission storage is unavailable. Please try again.' }, { status: 503 });
  }
  const destination = project.formDestinations[item.id];
  const recipients = destination?.emails ?? [];
  let emailed = false;
  const token = process.env.RESEND_API_KEY?.trim();
  const from = process.env.HQ_FORM_FROM_EMAIL?.trim() || process.env.RESEND_FROM_EMAIL?.trim();
  if (token && from && recipients.length) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: recipients, subject: `${project.name}: ${item.title} submission`,
        text: [`Project: ${project.name}`, `Form: ${item.title}`, `Name: ${submission.name}`, `Email: ${email}`, `Message: ${submission.message}`].join('\n'),
      }),
    }).catch(() => null);
    emailed = Boolean(response?.ok);
  }
  const sheetUpdated = await appendToGoogleSheet(destination?.sheetUrl, [
    submission.submittedAt, submission.name, submission.email, submission.message, item.title,
  ]).catch(() => false);
  return NextResponse.json({
    ok: true, emailed, sheetUpdated,
    message: emailed ? (destination?.sheetUrl && !sheetUpdated ? 'Submission received by email. Google Sheet could not be updated.' : 'Submission received.') : 'Submission saved. Email delivery is not configured.',
  }, { status: 201 });
}
