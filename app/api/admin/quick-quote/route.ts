import { NextRequest, NextResponse } from 'next/server';
import { createProposalRecord, updateProposal } from '@/lib/airtable';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';

export const dynamic = 'force-dynamic';

type QuickQuoteInput = {
  businessName?: string;
  contactName?: string;
  email?: string;
  projectName?: string;
  scopeSummary?: string;
  timeline?: string;
  totalFee?: number;
  depositAmount?: number;
};

function money(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let input: QuickQuoteInput;
  try {
    input = (await req.json()) as QuickQuoteInput;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const businessName = String(input.businessName ?? '').trim();
  const contactName = String(input.contactName ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const projectName = String(input.projectName ?? '').trim();
  const scopeSummary = String(input.scopeSummary ?? '').trim();
  const timeline = String(input.timeline ?? '').trim();
  const totalFee = money(input.totalFee);
  const depositAmount = money(input.depositAmount || 500);

  if (!businessName || !contactName || !email || !projectName || !scopeSummary) {
    return NextResponse.json({ error: 'Client, contact, email, project, and scope are required.' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (totalFee <= 0) {
    return NextResponse.json({ error: 'Project price must be greater than zero.' }, { status: 400 });
  }
  if (depositAmount <= 0 || depositAmount > totalFee) {
    return NextResponse.json({ error: 'Deposit must be greater than zero and no more than the project price.' }, { status: 400 });
  }

  const proposalId = `QQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const formattedScope = timeline
    ? `Estimated timeline: ${timeline}\n\n${scopeSummary}`
    : scopeSummary;

  const created = await createProposalRecord({
    proposalId,
    businessName,
    contactName,
    email,
    status: 'Sent',
    recommendedProjectType: 'Quick Quote',
    projectTypeLabel: projectName,
    capacityScore: 0,
    scoreBand: 'Quick Quote',
    primaryConstraint: 'Custom project scope',
    weeklyTimeRecovery: 0,
    opportunityLow: 0,
    opportunityHigh: 0,
    rawFee: depositAmount,
    recommendedFee: totalFee,
  });

  if (!created.ok || !created.recordId) {
    return NextResponse.json({ error: created.error || 'Could not create the quote.' }, { status: 500 });
  }

  const updated = await updateProposal(created.recordId, { scopeSummary: formattedScope });
  if (!updated.ok) {
    return NextResponse.json({ error: updated.error || 'Quote created but scope could not be saved.' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  return NextResponse.json({
    ok: true,
    proposalId,
    quoteUrl: `${baseUrl}/q/${encodeURIComponent(proposalId)}`,
    commitmentUrl: `${baseUrl}/commitment/${encodeURIComponent(proposalId)}`,
    totalFee,
    depositAmount,
  });
}
