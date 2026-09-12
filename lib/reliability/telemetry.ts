export type ReliabilityTelemetry = {
  event: string;
  tenantId?: string;
  projectId?: string;
  provider?: string;
  attempt?: number;
  status?: string;
  durationMs?: number;
  errorClass?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
};

export function emitReliabilityTelemetry(entry: ReliabilityTelemetry): void {
  console.info('[ea-reliability]', {
    at: new Date().toISOString(),
    ...entry,
  });
}
