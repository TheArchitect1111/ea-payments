import { NextResponse } from 'next/server';
import { createEscalation, listEscalations } from '@/lib/ea-guide-store';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';
import { emitPulseEvent } from '@/lib/pulse-bus';
import type { EscalationDraft, EscalationRecord } from '@/lib/ea-guide-types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '50');
  const escalations = await listEscalations(Number.isFinite(limit) ? limit : 50);
  return NextResponse.json({ escalations });
}

export async function POST(request: Request) {
  const body = (await request.json()) as EscalationDraft;
  if (!body.issueSummary?.trim()) {
    return NextResponse.json({ error: 'issueSummary required' }, { status: 400 });
  }

  const context = resolveGuidePageContext(body.page ?? '/', body.userId);
  const record: EscalationRecord = {
    id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'ea-guide',
    status: 'open',
    createdAt: new Date().toISOString(),
    page: body.page ?? context.pathname,
    portalType: body.portalType ?? context.portalType,
    role: body.role ?? context.role,
    organizationId: body.organizationId ?? context.organizationId,
    userId: body.userId,
    workflow: body.workflow ?? context.workflow,
    issueSummary: body.issueSummary.trim(),
    details: body.details,
    screenshotDataUrl: body.screenshotDataUrl,
  };

  // Persist to the durable store, but never block notifying the team. If durable
  // persistence is not configured in production, the Pulse event still reaches admin.
  let persisted = true;
  try {
    await createEscalation(record);
  } catch (error) {
    persisted = false;
    console.error('[ea-guide] escalation persistence failed:', error);
  }

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'guide.escalated',
    title: `EA Guide escalation: ${record.issueSummary.slice(0, 80)}`,
    detail: `${record.portalType} · ${record.role} · ${record.page}`,
    priority: 'high',
    href: '/admin/ea-guide',
    tenantId: record.organizationId,
    objectId: record.id,
    metadata: {
      workflow: record.workflow ?? '',
      userId: record.userId ?? '',
      persisted: String(persisted),
    },
  });

  return NextResponse.json({
    ok: true,
    persisted,
    escalation: record,
    message: "I've sent this to the EA team with the details from your current page.",
  });
}
