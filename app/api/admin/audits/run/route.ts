import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { runWebsiteAudit } from '@/lib/website-audit';
import {
  generateSimplifiGuidance,
  formatSimplifiGuidanceSummary,
} from '@/lib/simplifi-guidance';
import { buildTrustMetadata } from '@/lib/trust-metadata';
import type { ResourceClassification } from '@/lib/resource-radar';
import type { OpportunityScores } from '@/lib/opportunity-engine';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url) {
    return Response.json({ ok: false, error: 'URL is required.' }, { status: 400 });
  }

  try {
    const audit = await runWebsiteAudit(url);
    const guidance = generateSimplifiGuidance(audit);

    const stubClassification: ResourceClassification = {
      captureType: 'Signal',
      category: 'Website',
      industry: 'General Business',
      primaryFunction: 'Web presence',
      useCases: ['Website clarity assessment'],
      productAlignment: ['Simplifi'],
      buildVsBuy: 'Partner',
      implementationComplexity: 'Low',
      innovationScore: 40,
      implementationScore: 50,
      strategicValueScore: guidance.clarityScore,
    };

    const stubScores: OpportunityScores = {
      eaFitScore: guidance.clarityScore,
      opportunityScore: Math.max(0, 100 - guidance.clarityScore),
      revenuePotentialScore: 50,
      automationOpportunityScore: 40,
      communicationOpportunityScore: 55,
      trainingOpportunityScore: 30,
      portalOpportunityScore: 35,
      implementationReadinessScore: 60,
      priority: guidance.clarityScore >= 70 ? 'Normal' : 'High',
    };

    const stubPage = {
      url: audit.url,
      title: audit.title,
      description: audit.description,
      markdown: formatSimplifiGuidanceSummary(audit, guidance),
      source: audit.source === 'playwright-pipeline' ? ('firecrawl' as const) : ('fallback' as const),
    };

    const trust = buildTrustMetadata(stubPage, stubClassification, stubScores, url);
    trust.method = `Simplifi Playwright Audit Pipeline (${audit.source})`;
    trust.reasoning = [
      `Website clarity score: ${guidance.clarityScore}/100.`,
      `${audit.findings.filter((f) => f.severity === 'critical').length} critical findings.`,
      `${audit.strengths.length} strengths identified.`,
      'Simplifi Guidance Engine ranked top 3 priorities by impact and ease.',
    ];

    return Response.json({
      ok: true,
      audit,
      guidance,
      trust,
      summary: formatSimplifiGuidanceSummary(audit, guidance),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed.';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
