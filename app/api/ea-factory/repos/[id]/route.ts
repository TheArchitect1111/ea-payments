import { NextRequest, NextResponse } from 'next/server';
import { getRepoIntelligenceById } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const repository = getRepoIntelligenceById(id);

  if (!repository) {
    return NextResponse.json({ error: 'Repository not found.' }, { status: 404 });
  }

  return NextResponse.json({ repository });
}
