import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { resolveSessionFromRequest } from '@/lib/auth/session';
import { createEscalation, listEscalations } from '@/lib/ea-guide-store';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';
import { emitPulseEvent } from '@/lib/pulse-bus';
import type { EscalationDraft, EscalationRecord } from '@/lib/ea-guide-types';

export async function GET(request: NextRequest) {
  const auth = await guardAdminApi(request);
  if (!auth.ok) return adminApiUnauthorized(auth);
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '50');
  const escalations = await listEscalations(Number.isFinite(limit) ? limit : 50);
  return NextResponse.json({ escalations });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as EscalationDraft;
  if (!body.issueSummary?.trim()) {
    return NextResponse.json({ error: 'issueSummary required' }, { status: 400 });
  }

  const session = await resolveSessionFromRequest(request);
  const userId = session?.email ?? session?.sub;
  const organizationId = session?.orgId ?? session?.slug;
  const context = resolveGuidePageContext(body.page ?? '/', userId);
  context.organizationId = organizationId;

  const record: EscalationRecord = {
    id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'ea-guide',
    status: 'open',
    createdAt: new Date().toISOString(),
    page: body.page ?? context.pathname,
    portalType: context.portalType,
    role: context.role,
    organizationId,
    userId,
    workflow: body.workflow ?? context.workflow,
    issueSummary: body.issueSummary.trim(),
    details: body.details,
    screenshotDataUrl: body.screenshotDataUrl,
  };

  await createEscalation(record);
  await emitPulseEvent({
    product: 'ea-platform',
    type: 'guide.escalated',
    title: `EA Guide escalation: ${record.issueSummary.slice(0, 80)}`,
    detail: `${record.portalType} � ${record.role} � ${record.page}`,
    priority: 'high',
    href: '/admin/ea-guide',
    tenantId: record.organizationId,
    objectId: record.id,
    metadata: { workflow: record.workflow ?? '', userId: record.userId ?? '' },
  });

  return NextResponse.json({
    ok: true,
    escalation: record,
    message: "I've sent this to the EA team with the details from your current page.",
  });
}
