import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '@/lib/ea-password-hash';
import {
  createAdminPasswordResetToken,
  verifyAdminPasswordResetToken,
} from '@/lib/ea-admin-reset-token';
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

/**
 * Resolve an admin account by email only (no password) — used by SSO/Clerk
 * sign-in. Sources: Airtable Admin Users → ADMIN_USERS env → ADMIN_CLERK_ALLOWLIST.
 */
/** Owner / architect emails that must be able to request admin magic links. */
function configuredOwnerEmails(): string[] {
  const emails = new Set<string>();
  for (const source of [
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_USER,
    process.env.ADMIN_CLERK_ALLOWLIST,
    process.env.ARCHITECT_EMAILS,
  ]) {
    for (const part of String(source || '').split(/[,\n;]/)) {
      const normalized = part.trim().toLowerCase();
      if (normalized.includes('@')) emails.add(normalized);
    }
  }
  // Canonical EA owner fallback when env is incomplete on Production.
  emails.add('freedom@efficiencyarchitects.online');
  return [...emails];
}

export async function findAdminAccount(email: string): Promise<Omit<AdminUser, 'password'> | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const airtable = await findAirtableAdmin(normalized);
  if (airtable) {
    return { email: airtable.email, role: airtable.role || 'admin', name: airtable.name || normalized };
  }

  const envUser = adminUsers().find((user) => user.email === normalized);
  if (envUser) {
    return { email: envUser.email, role: envUser.role || 'admin', name: envUser.name || normalized };
  }

  const owners = configuredOwnerEmails();
  if (owners.includes(normalized)) {
    const primary = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    return {
      email: normalized,
      role: !primary || normalized === primary ? 'owner' : 'admin',
      name: normalized === 'freedom@efficiencyarchitects.online' ? 'Robert' : 'Admin',
    };
  }

  return null;
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
  const account = await findAdminAccount(normalized);
  if (!account) return null;

  let user = await findAirtableAdmin(normalized);
  if (!user && ADMIN_USERS_TABLE && airtableToken()) {
    try {
      user = await createAirtableAdmin(normalized, account.name);
    } catch (err) {
      console.warn('Could not create Airtable admin for password reset:', err);
    }
  }

  const rawToken = randomBytes(32).toString('base64url');

  if (user && ADMIN_USERS_TABLE && airtableToken()) {
    try {
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
                'Password Reset Token': hashToken(rawToken),
                'Password Reset Expires': expires,
              },
            },
          ],
          typecast: true,
        }),
      });
      if (res.ok) {
        return `${origin}/admin/reset-password?email=${encodeURIComponent(normalized)}&token=${encodeURIComponent(rawToken)}`;
      }
      console.warn('Airtable password reset PATCH failed:', await res.text());
    } catch (err) {
      console.warn('Airtable password reset store failed:', err);
    }
  }

  const signedToken = createAdminPasswordResetToken(normalized);
  if (!signedToken) {
    throw new Error(
      'Password reset is not configured. Set ADMIN_SESSION_SECRET or AIRTABLE_ADMIN_USERS_TABLE_ID.',
    );
  }

  return `${origin}/admin/reset-password?email=${encodeURIComponent(normalized)}&token=${encodeURIComponent(signedToken)}`;
}

export async function resetAdminPassword(email: string, token: string, password: string) {
  const validation = validatePasswordStrength(password);
  if (!validation.ok) throw new Error(validation.message);

  const normalized = email.trim().toLowerCase();
  let tokenValid = verifyAdminPasswordResetToken(normalized, token);

  let user = await findAirtableAdmin(normalized);
  if (!tokenValid && user && ADMIN_USERS_TABLE) {
    const headers = await airtableHeaders();
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(ADMIN_USERS_TABLE)}/${user.id}`,
      { headers, cache: 'no-store' },
    );
    if (res.ok) {
      const record = (await res.json()) as AirtableRecord;
      const storedToken = text(record, 'Password Reset Token');
      const expires = Date.parse(text(record, 'Password Reset Expires'));
      if (storedToken && storedToken === hashToken(token) && expires && expires >= Date.now()) {
        tokenValid = true;
      }
    }
  }

  if (!tokenValid) throw new Error('Reset link is invalid or expired.');

  if (!user && ADMIN_USERS_TABLE && airtableToken()) {
    const account = await findAdminAccount(normalized);
    if (account) {
      try {
        user = await createAirtableAdmin(normalized, account.name);
      } catch (err) {
        console.warn('Could not create Airtable admin during reset:', err);
      }
    }
  }

  if (!user || !ADMIN_USERS_TABLE) {
    throw new Error('Could not save your new password. Ask the owner to finish admin storage setup.');
  }

  const headers = await airtableHeaders();
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
