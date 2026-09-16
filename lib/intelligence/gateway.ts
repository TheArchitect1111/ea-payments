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
  provenance: { source: "public"; adapter: string };
  retentionClass: "ephemeral" | "standard";
}

export interface IntelligenceAdapter {
  readonly id: string;
  supports(capability: IntelligenceCapability): boolean;
  collect(request: IntelligenceRequest): Promise<IntelligenceObservation[]>;
}

export class IntelligencePolicyError extends Error {}
export class IntelligenceProviderError extends Error {}

function stripIpv6Brackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;

  const [a, b] = octets;
  return a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

function mappedIpv4FromIpv6(host: string): string | null {
  const match = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(host);
  return match?.[1] ?? null;
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  const mappedIpv4 = mappedIpv4FromIpv6(normalized);
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

function isLocalHostname(host: string): boolean {
  return host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "localhost.localdomain" ||
    host.endsWith(".localdomain") ||
    host.endsWith(".local");
}

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

  const host = stripIpv6Brackets(url.hostname.toLowerCase().replace(/\.$/, ""));
  const blocked = isLocalHostname(host) ||
    host === "0.0.0.0" ||
    isPrivateIpv4(host) ||
    isPrivateIpv6(host);

  if (blocked) {
    throw new IntelligencePolicyError("Private, local, and link-local targets are not allowed.");
  }

  url.username = "";
  url.password = "";
  return url;
}

export class IntelligenceGateway {
  private readonly adapters: IntelligenceAdapter[];
  constructor(adapters: IntelligenceAdapter[]) { this.adapters = [...adapters]; }

  async collect(request: IntelligenceRequest): Promise<IntelligenceObservation[]> {
    if (!request.subjectId.trim() || !request.purpose.trim()) {
      throw new IntelligencePolicyError("subjectId and purpose are required.");
    }
    const safeTarget = assertPublicTarget(request.target).toString();
    const adapter = this.adapters.find((candidate) => candidate.supports(request.capability));
    if (!adapter) throw new IntelligenceProviderError(`No approved adapter supports ${request.capability}.`);
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
