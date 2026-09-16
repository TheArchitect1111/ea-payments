import type {
  IntelligenceAdapter,
  IntelligenceCapability,
  IntelligenceObservation,
  IntelligenceRequest,
} from "../gateway";

export interface WebsiteSnapshot {
  status: number;
  contentType: string | null;
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  textSample: string;
  links: string[];
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function firstMatch(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return null;
}

function extractLinks(html: string, base: URL): string[] {
  const found = new Set<string>();
  const regex = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) && found.size < 100) {
    try {
      const url = new URL(match[1], base);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname === base.hostname) {
        url.hash = "";
        found.add(url.toString());
      }
    } catch {
      // Ignore malformed links.
    }
  }
  return [...found];
}

export class PublicWebsiteAdapter implements IntelligenceAdapter {
  readonly id = "public-website-v1";

  supports(capability: IntelligenceCapability): boolean {
    return capability === "INTEL.WEBSITE";
  }

  async collect(request: IntelligenceRequest): Promise<IntelligenceObservation<WebsiteSnapshot>[]> {
    const target = new URL(request.target);
    const response = await fetch(target, {
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "EA-Intelligence/1.0 (+public-web-research)",
      },
      signal: AbortSignal.timeout(12_000),
    });

    const contentType = response.headers.get("content-type");
    const html = (await response.text()).slice(0, 1_500_000);
    const finalUrl = new URL(response.url || target.toString());

    const title = firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
    const description = firstMatch(html, [
      /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i,
      /<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    ]);
    const canonicalUrl = firstMatch(html, [
      /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
      /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i,
    ]);

    return [
      {
        subjectId: request.subjectId,
        consumer: request.consumer,
        capability: request.capability,
        sourceUrl: finalUrl.toString(),
        provider: this.id,
        collectedAt: new Date().toISOString(),
        payload: {
          status: response.status,
          contentType,
          title,
          description,
          canonicalUrl: canonicalUrl ? new URL(canonicalUrl, finalUrl).toString() : null,
          textSample: cleanText(html).slice(0, 20_000),
          links: extractLinks(html, finalUrl),
        },
        provenance: { source: "public", adapter: this.id },
        retentionClass: "standard",
      },
    ];
  }
}
