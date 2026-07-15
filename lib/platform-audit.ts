/**
 * Platform audit trail — best-effort console/memory sink until chassis audit is wired.
 */

export type PlatformAuditAction =
  | 'pulse.ingested'
  | 'pulse.persist_failed'
  | 'admin.action'
  | 'auth.denied'
  | string;

export type ChassisAuditEvent = {
  id: string;
  organizationId: string;
  actorEmail?: string;
  action: PlatformAuditAction;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  tenantId?: string;
  createdAt: string;
};

const memory: ChassisAuditEvent[] = [];

export async function listPlatformAuditEvents(
  organizationId: string,
  limit = 50,
): Promise<ChassisAuditEvent[]> {
  return memory
    .filter((event) => event.organizationId === organizationId)
    .slice(-limit)
    .reverse();
}

export async function recordPlatformAuditEvent(input: {
  organizationId: string;
  actorEmail?: string;
  action: PlatformAuditAction;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  tenantId?: string;
}): Promise<ChassisAuditEvent> {
  const event: ChassisAuditEvent = {
    id: `audit_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  memory.push(event);
  if (memory.length > 500) memory.shift();
  return event;
}

export function recordAuthDenialAudit(input: {
  organizationId?: string;
  actorEmail?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): void {
  void recordPlatformAuditEvent({
    organizationId: input.organizationId ?? 'ea',
    actorEmail: input.actorEmail,
    action: 'auth.denied',
    targetType: 'auth',
    targetId: input.actorEmail ?? 'anonymous',
    summary: input.summary,
    metadata: input.metadata,
  });
}
