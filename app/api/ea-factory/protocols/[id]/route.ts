import { NextRequest, NextResponse } from 'next/server';
import { getProtocolLibraryFromGitHub } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const library = await getProtocolLibraryFromGitHub();
  const protocol = library.protocols.find((item) => item.id === id);

  if (!protocol) {
    return NextResponse.json({ error: 'Protocol not found.' }, { status: 404 });
  }

  return NextResponse.json({ protocol });
}
