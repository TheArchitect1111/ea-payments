import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { getClientByPortalSlug, updateClientPassword } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await requirePortalSessionFromRequest(req);
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
