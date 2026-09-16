export const INTELLIGENCE_CAPABILITIES = [
  "INTEL.WEBSITE",
  "INTEL.PROFILE",
  "INTEL.POSTS",
  "INTEL.VIDEO",
  "INTEL.COMMENTS",
  "INTEL.ENGAGEMENT",
  "INTEL.SEARCH",
  "INTEL.CHANGES",
] as const;

export type IntelligenceCapability = (typeof INTELLIGENCE_CAPABILITIES)[number];

export type IntelligenceConsumer =
  | "eva"
  | "amplifi"
  | "automated-builder"
  | "capacity-impact"
  | "proposal-engine"
  | "player-one"
  | "cpr"
  | "csap"
  | "monitoring";

export interface IntelligenceRequest {
  subjectId: string;
  consumer: IntelligenceConsumer;
  capability: IntelligenceCapability;
  target: string;
  purpose: string;
}

export interface IntelligenceObservation<T = unknown> {
  subjectId: string;
  consumer: IntelligenceConsumer;
  capability: IntelligenceCapability;
  sourceUrl: string;
  provider: string;
  collectedAt: string;
  observedAt?: string;
  payload: T;
  provenance: {
    source: "public";
    adapter: string;
  };
  retentionClass: "ephemeral" | "standard";
}

export interface IntelligenceAdapter {
  readonly id: string;
  supports(capability: IntelligenceCapability): boolean;
  collect(request: IntelligenceRequest): Promise<IntelligenceObservation[]>;
}

export class IntelligencePolicyError extends Error {}
export class IntelligenceProviderError extends Error {}

function assertPublicTarget(target: string): URL {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new IntelligencePolicyError("Intelligence targets must be valid public URLs.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new IntelligencePolicyError("Only HTTP(S) public targets are allowed.");
  }

  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (blocked) {
    throw new IntelligencePolicyError("Private, local, and link-local targets are not allowed.");
  }

  url.username = "";
  url.password = "";
  return url;
}

export class IntelligenceGateway {
  private readonly adapters: IntelligenceAdapter[];

  constructor(adapters: IntelligenceAdapter[]) {
    this.adapters = [...adapters];
  }

  async collect(request: IntelligenceRequest): Promise<IntelligenceObservation[]> {
    if (!request.subjectId.trim() || !request.purpose.trim()) {
      throw new IntelligencePolicyError("subjectId and purpose are required.");
    }

    const safeTarget = assertPublicTarget(request.target).toString();
    const adapter = this.adapters.find((candidate) => candidate.supports(request.capability));
    if (!adapter) {
      throw new IntelligenceProviderError(`No approved adapter supports ${request.capability}.`);
    }

    const observations = await adapter.collect({ ...request, target: safeTarget });

    return observations.map((observation) => ({
      ...observation,
      subjectId: request.subjectId,
      consumer: request.consumer,
      capability: request.capability,
      provider: observation.provider || adapter.id,
      collectedAt: observation.collectedAt || new Date().toISOString(),
      provenance: { source: "public", adapter: adapter.id },
      retentionClass: observation.retentionClass || "standard",
    }));
  }
}
