import { NextRequest, NextResponse } from 'next/server';
import { getAmandaConfirmationLetter, type AmandaConfirmationType } from '@/lib/amanda-catherine/confirmation-letters';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  if (type !== 'live' && type !== 'waitlist') return NextResponse.json({ ok: false, error: 'Choose live or waitlist.' }, { status: 400 });
  const letter = await getAmandaConfirmationLetter(type as AmandaConfirmationType);
  return NextResponse.json({ ok: true, letter }, { headers: { 'Cache-Control': 'no-store' } });
}
