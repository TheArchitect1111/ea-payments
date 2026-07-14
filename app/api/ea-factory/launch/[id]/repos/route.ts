import { NextRequest, NextResponse } from 'next/server';
import { reviewEACPRepos } from '@/lib/eacp-launch';
import { EACPPersistenceConfigurationError, EACPStoreConflictError } from '@/lib/eacp-store';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
} from '@/lib/admin-session-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: PageProps) {
  const auth = await requireAdminActionFromRequest(request, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  const { id } = await params;
  const body = await request.json().catch(() => null) as Parameters<typeof reviewEACPRepos>[1] | null;

  if (!body || !Array.isArray(body.repos)) {
    return NextResponse.json({ error: 'Repo review payload is required.' }, { status: 400 });
  }

  let launch;
  try {
    launch = await reviewEACPRepos(id, body);
  } catch (error) {
    if (error instanceof EACPStoreConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof EACPPersistenceConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
  if (!launch) {
    return NextResponse.json({ error: 'Launch not found.' }, { status: 404 });
  }

  return NextResponse.json({ launch });
}
