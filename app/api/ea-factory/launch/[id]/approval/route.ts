import { NextRequest, NextResponse } from 'next/server';
import { decideEACPApproval, type EACPApprovalDecision } from '@/lib/eacp-launch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DECISIONS = new Set<EACPApprovalDecision>(['approved', 'rejected', 'revision-requested']);

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: PageProps) {
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
  const launch = await decideEACPApproval(id, body.decision, reviewerName, comments);

  if (!launch) {
    return NextResponse.json({ error: 'Launch not found.' }, { status: 404 });
  }

  return NextResponse.json({ launch });
}
