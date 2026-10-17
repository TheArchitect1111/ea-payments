import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // V3.1 Security: Preview-only guard
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const secret = req.headers.get('x-ea-bridge-secret');
  if (secret !== process.env.FRAPPE_BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = body.email || 'poc-v31@eapay.local';
  const persona = body.persona || 'student';

  const session = {
    email,
    persona,
    role: persona,
    sub: `synthetic:${email}`,
    iat: Math.floor(Date.now() / 1000),
    iss: 'ea-bridge-poc-v31',
  };

  const res = NextResponse.json({ ok: true, synthetic: true, session, preview_only: true });
  res.cookies.set('ea_session', JSON.stringify(session), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4,
  });
  return res;
}
