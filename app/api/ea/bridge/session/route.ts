import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const syntheticEmail = req.headers.get('x-ea-synthetic-email');
  
  if (syntheticEmail) {
    // Allow synthetic session for POC V3.1 testing
    const session = {
      email: syntheticEmail,
      persona: 'student',
      role: 'student',
      sub: `synthetic:${syntheticEmail}`,
      iat: Math.floor(Date.now() / 1000),
      iss: 'ea-bridge-poc-v31',
    };
    return NextResponse.json({ ok: true, synthetic: true, session });
  }

  // No synthetic header and no real EA session -> block (privacy gate)
  // In real implementation would check cookies/auth, for POC return 403
  return NextResponse.json({ error: 'No session - privacy gate' }, { status: 403 });
}

export async function POST(req: Request) {
  return GET(req);
}
