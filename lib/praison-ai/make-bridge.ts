/**
 * Make.com bridge — fires after PraisonAI workforce package is QA-approved.
 * Make orchestrates software; PraisonAI orchestrates intelligence.
 */

import { fireMakeWebhook } from '@/lib/make-webhooks';
import type { ExecutiveIntelligencePackage } from './types';

export function buildPraisonMakePayload(pkg: ExecutiveIntelligencePackage): Record<string, unknown> {
  return {
    event: 'praison.package.ready',
    submissionId: pkg.submissionId,
    organizationId: pkg.organizationId,
    businessName: pkg.businessName,
    reviewStatus: pkg.reviewStatus,
    qaPassed: pkg.qa?.passed ?? false,
    executiveHeadline: pkg.executiveSummary.headline,
    executiveNarrative: pkg.executiveSummary.narrative,
    topOpportunities: pkg.executiveSummary.topOpportunities,
    topRisks: pkg.executiveSummary.topRisks,
    recommendedActions: pkg.executiveSummary.recommendedActions,
    confidence: pkg.executiveSummary.confidence,
    pulseInsights: pkg.pulseInsights,
    proposalScope: pkg.proposal?.data?.scope,
    proposalTimeline: pkg.proposal?.data?.timeline,
    proposalPricingNotes: pkg.proposal?.data?.pricingNotes,
    portalModules: pkg.portal?.data?.recommendedModules,
    websiteScore: pkg.websiteAudit?.data?.overallScore,
    knowledgeGraphRef: pkg.knowledgeGraphRef,
    generatedAt: pkg.generatedAt,
    packageId: pkg.id,
  };
}

export async function firePraisonPackageWebhook(pkg: ExecutiveIntelligencePackage): Promise<void> {
  if (!pkg.qa?.passed) {
    console.warn('[praison-make-bridge] QA did not pass — Make webhook skipped.');
    return;
  }

  await fireMakeWebhook(
    process.env.PRAISON_PACKAGE_WEBHOOK_URL ?? process.env.CTP_INTELLIGENCE_WEBHOOK_URL,
    buildPraisonMakePayload(pkg),
    'PRAISON_PACKAGE_WEBHOOK_URL',
  );
}
