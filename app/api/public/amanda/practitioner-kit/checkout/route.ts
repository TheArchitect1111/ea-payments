import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'The Practitioner Starter Kit is available by inquiry only.' },
    { status: 410 },
  );
}
