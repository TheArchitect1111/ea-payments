import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug, updateClientPassword } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const password = (body.password ?? '').trim();
  if (password.length < 8) {
    return NextResponse.json({ error: 'Please use at least 8 characters.' }, { status: 400 });
  }

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ error: 'Portal record not found.' }, { status: 404 });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const hash = `scrypt$${salt}$${derived}`;
  const result = await updateClientPassword(client.id, hash);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Password update failed.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
