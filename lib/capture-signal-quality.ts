/**
 * Capture signal quality — thin-page detection + website-audit merge.
 * Keeps Magnifi honest when URL scrape has little content.
 */
import type { OpportunityAnalysis } from '@/lib/simplifi-business-analysis';
import type { TrustMetadata } from '@/lib/trust-metadata';
import type { WebsiteAuditResult } from '@/lib/website-audit';
import type { ScrapedPage } from '@/lib/firecrawl';

export const THIN_CONTENT_WORD_THRESHOLD = 150;

export function countPageWords(page: ScrapedPage): number {
  const text = `${page.title} ${page.description ?? ''} ${page.markdown}`.trim();
  return text.split(/\s+/).filter(Boolean).length;
}

export function isThinPage(page: ScrapedPage, threshold = THIN_CONTENT_WORD_THRESHOLD): boolean {
  return countPageWords(page) < threshold;
}

export function applyThinContentTrustPenalty(
  trust: TrustMetadata,
  wordCount: number,
): TrustMetadata {
  if (wordCount >= THIN_CONTENT_WORD_THRESHOLD) return trust;

  const confidence = Math.max(15, Math.min(trust.confidence, 42));
  return {
    ...trust,
    confidence,
    confidenceLabel: 'Low',
    reasoning: [
      ...trust.reasoning,
      `Thin page content (${wordCount} words) — Magnifi signal is limited; prefer a deeper URL or screenshot upload.`,
    ],
    sources: [
      ...trust.sources,
      { label: `Thin content (${wordCount} words)`, type: 'pattern' },
    ],
  };
}

function uniqueStrings(values: string[], limit = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
    if (out.length >= limit) break;
  }
  return out;
}

/** Merge website-audit findings into keyword business analysis. */
export function mergeAuditIntoAnalysis(
  analysis: OpportunityAnalysis,
  audit: WebsiteAuditResult,
): OpportunityAnalysis {
  const auditMissed = [
    ...audit.missedOpportunities,
    ...audit.findings
      .filter((f) => f.severity === 'critical' || f.severity === 'warning')
      .map((f) => `${f.title}: ${f.detail}`),
  ];
  const auditWeak = audit.findings
    .filter((f) => f.id === 'thin-content' || f.severity === 'critical')
    .map((f) => f.detail);

  const thin = audit.findings.some((f) => f.id === 'thin-content');
  const estimates = thin
    ? {
        revenueLeftOnTable: {
          low: 0,
          high: 0,
          assumption:
            'Insufficient page content to estimate revenue impact — capture a richer URL or screenshot.',
        },
        leadsMissed: {
          low: 0,
          high: 0,
          assumption: 'Lead estimates withheld until stronger page signal is available.',
        },
        engagementLoss: {
          low: 0,
          high: 0,
          assumption: 'Engagement estimates withheld for thin-content captures.',
        },
      }
    : analysis.estimates;

  return {
    ...analysis,
    strengths: uniqueStrings([...audit.strengths, ...analysis.strengths]),
    weaknesses: uniqueStrings([...auditWeak, ...analysis.weaknesses]),
    missedOpportunities: uniqueStrings([...auditMissed, ...analysis.missedOpportunities]),
    messagingGaps: uniqueStrings([
      ...(thin
        ? ['Page content is too thin for visitors to understand value or next steps.']
        : []),
      ...analysis.messagingGaps,
    ]),
    estimates,
    scores: {
      ...analysis.scores,
      trust: thin ? Math.min(analysis.scores.trust, 40) : analysis.scores.trust,
      visibility: thin ? Math.min(analysis.scores.visibility, 45) : analysis.scores.visibility,
    },
  };
}

export function thinContentUserNote(wordCount: number): string {
  return `Limited page content (${wordCount} words) — upload a screenshot or use a deeper URL for richer Magnifi output.`;
}
