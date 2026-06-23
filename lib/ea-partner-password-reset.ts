import { createHash, randomBytes } from 'node:crypto';
import { validatePasswordStrength } from '@/lib/password-policy';

const PARTNER_BASE_ID = process.env.AIRTABLE_PARTNER_NETWORK_BASE_ID ?? 'appnyHBarTuXIG9Ke';
const PARTNERS_TABLE = process.env.AIRTABLE_PARTNERS_TABLE_ID ?? 'Partners';
const RESET_PREFIX = '[EA_PARTNER_RESET]';

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

async function findPartnerBySlug(slug: string): Promise<AirtableRecord | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;
  const safeSlug = slug.trim().replace(/"/g, '');
  if (!safeSlug || !/^[a-z0-9_-]+$/i.test(safeSlug)) return null;

  const params = new URLSearchParams({
    filterByFormula: `{Profile Slug}="${safeSlug}"`,
    maxRecords: '1',
  });
  const res = await fetch(
    `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(PARTNERS_TABLE)}?${params}`,
    { headers: authHeaders(), cache: 'no-store' },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records?.[0] ?? null;
}

export async function requestPartnerPasswordReset(
  slug: string,
  origin: string,
): Promise<{ resetUrl: string; email: string } | null> {
  const record = await findPartnerBySlug(slug);
  if (!record) return null;

  const email = text(record, 'Email').trim().toLowerCase() || text(record, 'Partner Email').trim().toLowerCase();
  if (!email) return null;

  const token = randomBytes(32).toString('base64url');
  const payload: ResetPayload = {
    tokenHash: hashToken(token),
    expires: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  };

  const notesField = text(record, 'Notes') || text(record, 'Partner Notes');
  const res = await fetch(
    `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(PARTNERS_TABLE)}/${record.id}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        fields: { Notes: writeResetBlock(notesField, payload) },
        typecast: true,
      }),
    },
  );
  if (!res.ok) throw new Error(await res.text());

  return {
    email,
    resetUrl: `${origin}/partners/reset-password?slug=${encodeURIComponent(slug)}&recordId=${encodeURIComponent(record.id)}&token=${encodeURIComponent(token)}`,
  };
}

export async function resetPartnerPassword(
  recordId: string,
  slug: string,
  token: string,
  password: string,
): Promise<void> {
  const validation = validatePasswordStrength(password);
  if (!validation.ok) throw new Error(validation.message);

  const res = await fetch(
    `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(PARTNERS_TABLE)}/${recordId}`,
    { headers: authHeaders(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Reset link is invalid.');
  const record = (await res.json()) as AirtableRecord;
  const recordSlug = text(record, 'Profile Slug').trim().toLowerCase();
  if (recordSlug !== slug.trim().toLowerCase()) throw new Error('Reset link is invalid.');

  const notesField = text(record, 'Notes') || text(record, 'Partner Notes');
  const reset = readResetBlock(notesField);
  if (!reset || reset.tokenHash !== hashToken(token) || Date.parse(reset.expires) < Date.now()) {
    throw new Error('Reset link is invalid or expired.');
  }

  const patch = await fetch(
    `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(PARTNERS_TABLE)}/${recordId}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        fields: {
          'Portal Password': password,
          Notes: stripResetBlock(notesField),
        },
        typecast: true,
      }),
    },
  );
  if (!patch.ok) throw new Error(await patch.text());
}

export async function requestPartnerAccess(input: {
  email: string;
  name: string;
  company?: string;
  message?: string;
}): Promise<void> {
  const notify = process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';
  const { sendAuthEmail } = await import('@/lib/ea-auth-email');
  await sendAuthEmail({
    to: notify,
    subject: `Partner access request — ${input.name}`,
    title: 'New partner access request',
    bodyHtml: `
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Company:</strong> ${input.company || 'Not provided'}</p>
      <p><strong>Message:</strong> ${input.message || 'No message provided.'}</p>
    `,
    text: `Partner access request from ${input.name} (${input.email}).`,
  });
}
