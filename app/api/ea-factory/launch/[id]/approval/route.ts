import { NextRequest, NextResponse } from 'next/server';
import { decideEACPApproval, type EACPApprovalDecision } from '@/lib/eacp-launch';
import { EACPPersistenceConfigurationError, EACPStoreConflictError } from '@/lib/eacp-store';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
} from '@/lib/admin-session-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DECISIONS = new Set<EACPApprovalDecision>(['approved', 'rejected', 'revision-requested']);

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: PageProps) {
  const auth = await requireAdminActionFromRequest(request, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  const { id } = await params;
  const body = await request.json().catch(() => null) as {
    decision?: EACPApprovalDecision;
    reviewerName?: string;
    comments?: string;
  } | null;

  if (!body?.decision || !DECISIONS.has(body.decision)) {
    return NextResponse.json({ error: 'Choose Approve, Reject, or Request Revision.' }, { status: 400 });
  }

  const reviewerName = body.reviewerName?.trim() || 'EA Reviewer';
  const comments = body.comments?.trim() || '';
  let launch;
  try {
    launch = await decideEACPApproval(id, body.decision, reviewerName, comments);
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
