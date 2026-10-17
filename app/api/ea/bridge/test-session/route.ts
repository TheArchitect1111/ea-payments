import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = req.headers.get('x-ea-bridge-secret');
  const expected = process.env.FRAPPE_BRIDGE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Invalid bridge secret' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const email = body.email || req.headers.get('x-ea-synthetic-email') || 'poc-v31@eapay.local';
  const persona = body.persona || 'student';
  const session = {
    email,
    persona,
    role: persona,
    sub: `synthetic:${email}`,
    iat: Math.floor(Date.now() / 1000),
    iss: 'ea-bridge-poc-v31',
  };
  const res = NextResponse.json({ ok: true, synthetic: true, session });
  res.cookies.set('ea_session', JSON.stringify(session), { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 3600 });
  return res;
}
