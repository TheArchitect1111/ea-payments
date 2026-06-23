import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from '@/lib/ea-password-hash';
import { validatePasswordStrength } from '@/lib/password-policy';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const TABLE = process.env.AIRTABLE_CLIENT_RECORDS_TABLE_ID ?? 'Client Records';
const RESET_PREFIX = '[EA_PORTAL_RESET]';

type AirtableRecord = { id: string; fields: Record<string, unknown> };

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function text(record: AirtableRecord, field: string): string {
  const value = record.fields[field];
  return value === undefined || value === null ? '' : String(value);
}

type ResetPayload = {
  tokenHash: string;
  expires: string;
};

function stripResetBlock(notes: string): string {
  return notes
    .split('\n')
    .filter((line) => !line.startsWith(RESET_PREFIX))
    .join('\n')
    .trim();
}

function readResetBlock(notes: string): ResetPayload | null {
  const line = notes.split('\n').find((entry) => entry.startsWith(RESET_PREFIX));
  if (!line) return null;
  try {
    return JSON.parse(line.slice(RESET_PREFIX.length).trim()) as ResetPayload;
  } catch {
    return null;
  }
}

function writeResetBlock(notes: string, payload: ResetPayload): string {
  const base = stripResetBlock(notes);
  const line = `${RESET_PREFIX} ${JSON.stringify(payload)}`;
  return base ? `${base}\n\n${line}` : line;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function findClientByIdentifier(identifier: string): Promise<AirtableRecord | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;
  const safe = identifier.trim().toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(`OR(LOWER({Email})='${safe}', LOWER({Portal Username})='${safe}')`);
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?maxRecords=1&filterByFormula=${formula}`,
    { headers: authHeaders(), cache: 'no-store' },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records?.[0] ?? null;
}

export async function requestPortalPasswordReset(
  identifier: string,
  origin: string,
  resetPath = '/portal/reset-password',
): Promise<{ resetUrl: string; email: string } | null> {
  const record = await findClientByIdentifier(identifier);
  if (!record) return null;

  const email = text(record, 'Email').trim().toLowerCase();
  if (!email) return null;

  const token = randomBytes(32).toString('base64url');
  const payload: ResetPayload = {
    tokenHash: hashToken(token),
    expires: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  };

  const notes = text(record, 'Notes');
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${record.id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      fields: { Notes: writeResetBlock(notes, payload) },
      typecast: true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());

  return {
    email,
    resetUrl: `${origin}${resetPath}?recordId=${encodeURIComponent(record.id)}&token=${encodeURIComponent(token)}`,
  };
}

export async function resetPortalPassword(recordId: string, token: string, password: string): Promise<void> {
  const validation = validatePasswordStrength(password);
  if (!validation.ok) throw new Error(validation.message);

  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Reset link is invalid.');
  const record = (await res.json()) as AirtableRecord;
  const notes = text(record, 'Notes');
  const reset = readResetBlock(notes);
  if (!reset || reset.tokenHash !== hashToken(token) || Date.parse(reset.expires) < Date.now()) {
    throw new Error('Reset link is invalid or expired.');
  }

  const patch = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      fields: {
        'Password Hash': hashPassword(password),
        'Password Changed': true,
        'Temp Password': '',
        Notes: stripResetBlock(notes),
      },
      typecast: true,
    }),
  });
  if (!patch.ok) throw new Error(await patch.text());
}

export async function requestPortalAccess(input: {
  email: string;
  name: string;
  company?: string;
  message?: string;
}): Promise<void> {
  const notify = process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ea-payments.vercel.app';
  const { sendAuthEmail } = await import('@/lib/ea-auth-email');
  await sendAuthEmail({
    to: notify,
    subject: `Portal access request — ${input.name}`,
    title: 'New portal access request',
    bodyHtml: `
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Company:</strong> ${input.company || 'Not provided'}</p>
      <p><strong>Message:</strong> ${input.message || 'No message provided.'}</p>
      <p>Prospect can also start at <a href="${appUrl}/assessment">/assessment</a>.</p>
    `,
    text: `Portal access request from ${input.name} (${input.email}).`,
  });
}
