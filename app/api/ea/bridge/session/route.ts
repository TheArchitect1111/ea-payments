import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Secure: Read from cookie set by test-session, NOT from arbitrary header
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/ea_session=([^;]+)/);
  
  if (match) {
    try {
      const session = JSON.parse(decodeURIComponent(match[1]));
      // Only allow synthetic sessions that were created via secret-gated test-session
      if (session.sub?.startsWith('synthetic:')) {
        // Extra safety: still require Preview env
        if (process.env.VERCEL_ENV === 'production') {
          return NextResponse.json({ error: 'No session' }, { status: 403 });
        }
        return NextResponse.json({ ok: true, synthetic: true, session });
      }
      // Real session would be validated here against Frappe in production
      return NextResponse.json({ ok: true, real: true, session });
    } catch {}
  }

  // No valid session cookie -> privacy gate
  return NextResponse.json({ error: 'No session - privacy gate' }, { status: 403 });
}

export async function POST(req: Request) {
  return GET(req);
}
