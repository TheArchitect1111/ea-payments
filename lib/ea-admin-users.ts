import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '@/lib/ea-password-hash';
import { validatePasswordStrength } from '@/lib/password-policy';

export type AdminUser = { email: string; password: string; role: string; name: string };
type AirtableRecord = { id: string; fields: Record<string, unknown> };

const BASE = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const ADMIN_USERS_TABLE = process.env.AIRTABLE_ADMIN_USERS_TABLE_ID ?? '';

function airtableToken() {
  return process.env.AIRTABLE_API_KEY ?? '';
}

async function airtableHeaders() {
  const token = airtableToken();
  if (!token) throw new Error('Missing AIRTABLE_API_KEY');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function text(record: AirtableRecord, field: string): string {
  const value = record.fields[field];
  return value === undefined || value === null ? '' : String(value);
}

export function adminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Array<Partial<AdminUser> & { username?: string }>;
      return parsed
        .map((user) => ({
          email: String(user.email || user.username || '').trim().toLowerCase(),
          password: String(user.password || ''),
          role: String(user.role || 'admin'),
          name: String(user.name || user.email || user.username || 'Admin'),
        }))
        .filter((user) => user.email && user.password);
    } catch {
      return raw
        .split(/[;\n]/)
        .map((row) => {
          const [email, password, role = 'admin', name = email] = row.split(':').map((part) => part.trim());
          return { email: email.toLowerCase(), password, role, name };
        })
        .filter((user) => user.email && user.password);
    }
  }

  const legacyPassword = process.env.ADMIN_PASSWORD;
  if (!legacyPassword) return [];
  const legacyEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || 'admin').toLowerCase();
  return [{ email: legacyEmail, password: legacyPassword, role: 'owner', name: 'Admin' }];
}

function adminUserFromRecord(record: AirtableRecord): AdminUser & { id: string } {
  return {
    id: record.id,
    email: text(record, 'Email').trim().toLowerCase(),
    password: text(record, 'Password Hash') || text(record, 'Password'),
    role: text(record, 'Role') || 'admin',
    name: text(record, 'Name') || text(record, 'Email') || 'Admin',
  };
}

async function findAirtableAdmin(email: string) {
  if (!ADMIN_USERS_TABLE || !airtableToken()) return null;
  const headers = await airtableHeaders();
  const safe = email.trim().toLowerCase().replace(/'/g, "\\'");
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(ADMIN_USERS_TABLE)}?maxRecords=1&filterByFormula=${encodeURIComponent(`LOWER({Email})='${safe}'`)}`,
    { headers, cache: 'no-store' },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { records?: AirtableRecord[] };
  const record = data.records?.[0];
  return record ? adminUserFromRecord(record) : null;
}

async function createAirtableAdmin(email: string, name = 'Admin') {
  if (!ADMIN_USERS_TABLE || !airtableToken()) {
    throw new Error('Admin user table is not configured.');
  }
  const headers = await airtableHeaders();
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(ADMIN_USERS_TABLE)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      records: [
        {
          fields: {
            Email: email.trim().toLowerCase(),
            Name: name,
            Role: 'owner',
            Status: 'Active',
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { records: AirtableRecord[] };
  return adminUserFromRecord(data.records[0]);
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function authenticateAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = adminUsers().find((item) => item.email === normalized);
  if (!user || !password) return null;
  return verifyPassword(password, user.password) ? user : null;
}

export async function authenticateAdminAsync(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const airtableUser = await findAirtableAdmin(normalized);
  if (airtableUser && verifyPassword(password, airtableUser.password)) return airtableUser;
  return authenticateAdmin(email, password);
}

export async function requestAdminPasswordReset(email: string, origin: string) {
  const normalized = email.trim().toLowerCase();
  const knownEnvUser = adminUsers().find((user) => user.email === normalized);
  let user = await findAirtableAdmin(normalized);
  if (!user && knownEnvUser) user = await createAirtableAdmin(normalized, knownEnvUser.name);
  if (!user) return null;

  if (!ADMIN_USERS_TABLE) {
    throw new Error('Password reset requires AIRTABLE_ADMIN_USERS_TABLE_ID.');
  }

  const token = randomBytes(32).toString('base64url');
  const headers = await airtableHeaders();
  const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(ADMIN_USERS_TABLE)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      records: [
        {
          id: user.id,
          fields: {
            'Password Reset Token': hashToken(token),
            'Password Reset Expires': expires,
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return `${origin}/admin/reset-password?email=${encodeURIComponent(normalized)}&token=${encodeURIComponent(token)}`;
}

export async function resetAdminPassword(email: string, token: string, password: string) {
  const validation = validatePasswordStrength(password);
  if (!validation.ok) throw new Error(validation.message);
  const user = await findAirtableAdmin(email);
  if (!user) throw new Error('Reset link is invalid.');
  const headers = await airtableHeaders();
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(ADMIN_USERS_TABLE)}/${user.id}`,
    { headers, cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Reset link is invalid.');
  const record = (await res.json()) as AirtableRecord;
  const storedToken = text(record, 'Password Reset Token');
  const expires = Date.parse(text(record, 'Password Reset Expires'));
  if (!storedToken || storedToken !== hashToken(token) || !expires || expires < Date.now()) {
    throw new Error('Reset link is invalid or expired.');
  }
  const patch = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(ADMIN_USERS_TABLE)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      records: [
        {
          id: user.id,
          fields: {
            'Password Hash': hashPassword(password),
            'Password Reset Token': '',
            'Password Reset Expires': null,
            'Last Password Reset': new Date().toISOString(),
            Status: 'Active',
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!patch.ok) throw new Error(await patch.text());
}

export async function requestAdminAccess(input: {
  email: string;
  name: string;
  message?: string;
}): Promise<void> {
  const notify =
    process.env.ADMIN_ACCESS_REQUEST_EMAIL ??
    process.env.ADMIN_NOTIFICATION_EMAIL ??
    process.env.SUPPORT_EMAIL ??
    'freedom@efficiencyarchitects.online';

  const { sendAuthEmail } = await import('@/lib/ea-auth-email');
  await sendAuthEmail({
    to: notify,
    subject: `Admin access request — ${input.name}`,
    title: 'New admin access request',
    bodyHtml: `
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Message:</strong> ${input.message || 'No message provided.'}</p>
    `,
    text: `Admin access request from ${input.name} (${input.email}): ${input.message || 'No message.'}`,
  });
}

export type { AdminUser as EaAdminUser };
