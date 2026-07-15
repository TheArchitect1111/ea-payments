/**
 * Lightweight platform observability logger (console-backed).
 */
export type ObservabilityDomain = 'audit' | 'pulse' | 'webhook' | 'auth' | 'platform';
export type ObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';

export type PlatformLogEvent = {
  domain: ObservabilityDomain;
  level: ObservabilityLevel;
  action: string;
  message: string;
  organizationId?: string;
  tenantId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export function createCorrelationId(prefix = 'ea'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function logPlatformEvent(event: PlatformLogEvent): void {
  const line = `[${event.domain}/${event.level}] ${event.action}: ${event.message}`;
  if (event.level === 'error') console.error(line, event.metadata ?? '');
  else if (event.level === 'warn') console.warn(line, event.metadata ?? '');
  else console.info(line, event.metadata ?? '');
}
