import { NextRequest, NextResponse } from 'next/server';
import { requestPartnerAccess } from '@/lib/ea-partner-password-reset';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string; name?: string; company?: string; message?: string };
  try {
    body = (await req.json()) as { email?: string; name?: string; company?: string; message?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const name = (body.name ?? '').trim();
  if (!email || !name) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  try {
    await requestPartnerAccess({
      email,
      name,
      company: body.company,
      message: body.message,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not submit request.' },
      { status: 500 },
    );
  }
}
