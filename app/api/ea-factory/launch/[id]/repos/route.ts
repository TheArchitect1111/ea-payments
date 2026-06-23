import { NextRequest, NextResponse } from 'next/server';
import { reviewEACPRepos } from '@/lib/eacp-launch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: PageProps) {
  const { id } = await params;
  const body = await request.json().catch(() => null) as Parameters<typeof reviewEACPRepos>[1] | null;

  if (!body || !Array.isArray(body.repos)) {
    return NextResponse.json({ error: 'Repo review payload is required.' }, { status: 400 });
  }

  const launch = await reviewEACPRepos(id, body);
  if (!launch) {
    return NextResponse.json({ error: 'Launch not found.' }, { status: 404 });
  }

  return NextResponse.json({ launch });
}
