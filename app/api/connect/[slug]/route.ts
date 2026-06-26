import { NextRequest, NextResponse } from 'next/server';
import { getConnectProfileBySlug } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getConnectProfileBySlug(slug);

  if (!profile || !profile.isActive) {
    return NextResponse.json({ ok: false, error: 'Connect profile not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile });
}
