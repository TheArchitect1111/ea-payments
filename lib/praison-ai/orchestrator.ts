/**
 * PraisonAI orchestrator — coordinates the EA intelligence workforce.
 */

import crypto from 'crypto';
import { logAIEvent } from '@/lib/ai/logging';
import type { AIRequestContext } from '@/lib/ai/types';
import { intakeAgent } from '@/lib/agents/intake-agent';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpIntakeAnalysisRecord,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { scheduleCtpStudioCampaign } from '@/lib/ctp-studio-bridge';
import { scheduleCtpProduction } from '@/lib/ctp-production-run';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { buildPulseInsights, mergeExecutiveSummary } from './executive-agent';
import { runQaValidation } from './qa-agent';
import { buildKnowledgeGraph } from './knowledge-graph';
import { firePraisonPackageWebhook } from './make-bridge';
import { praisonExternalConfigured, runExternalPraisonWorkforce } from './client';
import { runSpecialistAgent } from './specialist-runner';
import {
  agentsInBatch,
  maxBatch,
  PRAISON_WORKFORCE,
  type WorkforceAgentDefinition,
} from './workforce-registry';
import type {
  ExecutiveIntelligencePackage,
  SpecialistAgentOutput,
  WorkforceAgentId,
  WorkforceAgentLog,
  WorkforceReviewStatus,
  WorkforceTriggerInput,
} from './types';

function newPackageId(): string {
  return `praison_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function systemRequestId(): string {
  return `praison_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function buildQuery(submission: CtpSubmission): string {
  const parts = [
    `Executive intelligence for ${submission.businessName}.`,
    `Contact: ${submission.contactName} (${submission.email}).`,
  ];
  if (submission.siteUrl) parts.push(`Website: ${submission.siteUrl}.`);
  if (submission.desiredExperiences?.length) {
    parts.push(`Desired experiences: ${submission.desiredExperiences.join(', ')}.`);
  }
  if (submission.recommendations) {
    parts.push(`Discovery recommendations: ${JSON.stringify(submission.recommendations).slice(0, 2000)}.`);
  }
  if (submission.discoveryAnswers) {
    parts.push(`Discovery answers: ${JSON.stringify(submission.discoveryAnswers).slice(0, 6000)}.`);
  }
  return parts.join('\n');
}

function buildContext(submission: CtpSubmission): Record<string, unknown> {
  return {
    submissionId: submission.id,
    businessName: submission.businessName,
    contactName: submission.contactName,
    email: submission.email,
    assessmentId: submission.assessmentId,
    proposalId: submission.proposalId,
    considerSlug: submission.considerSlug ?? '',
    siteUrl: submission.siteUrl ?? '',
    clientType: submission.clientType ?? '',
    digitalPresenceAudit: submission.digitalPresenceAudit,
    executiveSnapshot: submission.executiveSnapshot,
    executiveScoring: submission.executiveScoring,
    discoveryAnswers: submission.discoveryAnswers,
    recommendations: submission.recommendations,
  };
}

function buildAiContext(submission: CtpSubmission): AIRequestContext {
  return {
    requestId: systemRequestId(),
    actor: { id: 'system-praison-workforce', type: 'system' },
    route: '/internal/praison-workforce',
    metadata: {
      ctpSubmissionId: submission.id,
      assessmentId: submission.assessmentId,
      proposalId: submission.proposalId,
    },
  };
}

function reviewStatusFromProgress(
  outputs: Partial<Record<WorkforceAgentId, SpecialistAgentOutput>>,
  qaPassed: boolean,
): WorkforceReviewStatus {
  if (!outputs.research) return 'research-complete';
  if (!outputs['website-auditor']) return 'website-review-complete';
  if (!outputs['proposal-architect']) return 'proposal-draft-ready';
  if (!qaPassed) return 'qa-failed';
  if (!outputs['portal-architect']) return 'blueprint-ready';
  return 'awaiting-executive-review';
}

function packageToIntakeAnalysis(
  pkg: ExecutiveIntelligencePackage,
  requestId: string,
): CtpIntakeAnalysisRecord {
  return {
    agent: 'praison-workforce',
    summary: pkg.executiveSummary.narrative,
    keyFindings: pkg.executiveSummary.topOpportunities.map((o) => ({
      title: o.title,
      detail: o.detail,
    })),
    opportunities: pkg.executiveSummary.topOpportunities,
    risks: pkg.executiveSummary.topRisks,
    recommendedNextSteps: pkg.executiveSummary.recommendedActions,
    confidence: pkg.executiveSummary.confidence,
    sources: pkg.agentLogs.flatMap((l) => l.evidence.map((e) => e.source)),
    analyzedAt: pkg.generatedAt,
    requestId,
  };
}

function isSpecialist(def: WorkforceAgentDefinition): boolean {
  return def.id !== 'qa' && def.id !== 'executive';
}

async function runInternalWorkforce(
  submission: CtpSubmission,
  aiContext: AIRequestContext,
): Promise<ExecutiveIntelligencePackage> {
  const query = buildQuery(submission);
  const context = buildContext(submission);
  const outputs: Partial<Record<WorkforceAgentId, SpecialistAgentOutput>> = {};
  const agentLogs: WorkforceAgentLog[] = [];

  const organizationId = submission.considerSlug ?? submission.portalSlug ?? 'ea';

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'praison.workforce.started',
    title: `Intelligence workforce started — ${submission.businessName}`,
    detail: 'Specialist agents analyzing business, website, operations, finance, and marketing.',
    priority: 'medium',
    href: '/admin/ctp',
    tenantId: organizationId,
    objectId: submission.id,
    metadata: { ctpSubmissionId: submission.id },
  });

  for (let batch = 1; batch <= maxBatch(); batch += 1) {
    const defs = agentsInBatch(batch).filter(isSpecialist);
    if (defs.length === 0) continue;

    const results = await Promise.all(
      defs.map(async (def) => {
        const startedAt = new Date().toISOString();
        const t0 = Date.now();
        try {
          const output = await runSpecialistAgent(def, query, context, aiContext, outputs);
          outputs[def.id] = output;
          const completedAt = new Date().toISOString();
          const log: WorkforceAgentLog = {
            agentId: def.id,
            status: 'complete',
            startedAt,
            completedAt,
            executionTimeMs: Date.now() - t0,
            confidence: output.confidence,
            recommendations: output.recommendations,
            evidence: output.evidence,
          };
          agentLogs.push(log);

          await emitPulseEvent({
            product: 'ea-platform',
            type: 'praison.agent.complete',
            title: `${def.label} complete — ${submission.businessName}`,
            detail: output.summary.slice(0, 160),
            priority: 'low',
            href: '/admin/ctp',
            tenantId: organizationId,
            objectId: submission.id,
            metadata: {
              agentId: def.id,
              confidence: output.confidence,
              executionTimeMs: log.executionTimeMs ?? 0,
            },
          });

          return output;
        } catch (err) {
          const log: WorkforceAgentLog = {
            agentId: def.id,
            status: 'failed',
            startedAt,
            completedAt: new Date().toISOString(),
            executionTimeMs: Date.now() - t0,
            confidence: 0,
            recommendations: [],
            evidence: [],
            error: err instanceof Error ? err.message : 'unknown',
          };
          agentLogs.push(log);
          throw err;
        }
      }),
    );

    void results;
  }

  const executiveSummary = mergeExecutiveSummary(submission.businessName, outputs);
  const qa = runQaValidation(outputs, { executiveSummary });

  agentLogs.push({
    agentId: 'qa',
    status: qa.passed ? 'complete' : 'failed',
    startedAt: new Date().toISOString(),
    completedAt: qa.reviewedAt,
    confidence: qa.confidence,
    recommendations: qa.blockers,
    evidence: [],
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: qa.passed ? 'praison.qa.passed' : 'praison.qa.failed',
    title: qa.passed
      ? `QA passed — ${submission.businessName}`
      : `QA blocked — ${submission.businessName}`,
    detail: qa.passed
      ? 'All workforce outputs passed quality review.'
      : (qa.blockers[0] ?? 'Quality review failed.'),
    priority: qa.passed ? 'medium' : 'high',
    href: '/admin/ctp',
    tenantId: organizationId,
    objectId: submission.id,
    metadata: { passed: qa.passed, blockers: qa.blockers.length },
  });

  const pulseInsights = buildPulseInsights(outputs);
  const reviewStatus = reviewStatusFromProgress(outputs, qa.passed);

  const pkg: ExecutiveIntelligencePackage = {
    id: newPackageId(),
    organizationId,
    submissionId: submission.id,
    businessName: submission.businessName,
    reviewStatus: qa.passed ? reviewStatus : 'qa-failed',
    executiveSummary,
    research: outputs.research,
    websiteAudit: outputs['website-auditor'] as ExecutiveIntelligencePackage['websiteAudit'],
    operations: outputs['operations-analyst'],
    finance: outputs['financial-analyst'],
    marketing: outputs['marketing-analyst'],
    proposal: outputs['proposal-architect'] as ExecutiveIntelligencePackage['proposal'],
    portal: outputs['portal-architect'] as ExecutiveIntelligencePackage['portal'],
    executiveWriter: outputs['executive-writer'],
    qa,
    agentLogs,
    pulseInsights,
    generatedAt: new Date().toISOString(),
    knowledgeGraphRef: '',
  };

  const graph = buildKnowledgeGraph(pkg);
  pkg.knowledgeGraphRef = graph.ref;

  agentLogs.push({
    agentId: 'executive',
    status: 'complete',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    confidence: executiveSummary.confidence,
    recommendations: executiveSummary.recommendedActions,
    evidence: [],
  });

  return pkg;
}

export function triggerInputFromSubmission(submission: CtpSubmission): WorkforceTriggerInput {
  return {
    submissionId: submission.id,
    organizationId: submission.considerSlug ?? submission.portalSlug ?? 'ea',
    businessName: submission.businessName,
    contactName: submission.contactName,
    email: submission.email,
    query: buildQuery(submission),
    context: buildContext(submission),
    siteUrl: submission.siteUrl,
    digitalAudit: submission.digitalPresenceAudit,
  };
}

export async function runPraisonWorkforce(
  submissionId: string,
): Promise<{ ok: boolean; error?: string; package?: ExecutiveIntelligencePackage }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  const aiContext = buildAiContext(submission);
  logAIEvent('praison.workforce.start', aiContext, { submissionId });

  try {
    let pkg: ExecutiveIntelligencePackage;

    if (praisonExternalConfigured()) {
      pkg = await runExternalPraisonWorkforce(triggerInputFromSubmission(submission));
    } else if (process.env.OPENAI_API_KEY) {
      pkg = await runInternalWorkforce(submission, aiContext);
    } else if (intakeAgent.status() === 'available') {
      return runLegacyIntakeFallback(submission, aiContext);
    } else {
      return { ok: false, error: 'PraisonAI workforce unavailable — configure OPENAI_API_KEY or PRAISON_AI_API_URL.' };
    }

    const intakeAnalysis = packageToIntakeAnalysis(pkg, aiContext.requestId);
    const updated = await updateCtpSubmission(submissionId, {
      intakeAnalysis,
      workforcePackage: pkg,
    });
    if (!updated.ok) {
      return { ok: false, error: updated.error ?? 'Failed to save workforce package.' };
    }

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'praison.package.ready',
      title: `Executive intelligence ready — ${submission.businessName}`,
      detail: pkg.executiveSummary.headline,
      priority: 'high',
      href: '/admin/ctp',
      tenantId: pkg.organizationId,
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        reviewStatus: pkg.reviewStatus,
        confidence: pkg.executiveSummary.confidence,
      },
    });

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.intake.analyzed',
      title: `CTP intake analyzed — ${submission.businessName}`,
      detail: pkg.executiveSummary.narrative.slice(0, 180),
      priority: 'medium',
      href: '/admin/ctp',
      tenantId: pkg.organizationId,
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        confidence: pkg.executiveSummary.confidence,
        workforce: true,
      },
    });

    await firePraisonPackageWebhook(pkg);

    logAIEvent('praison.workforce.complete', aiContext, {
      submissionId,
      packageId: pkg.id,
      qaPassed: pkg.qa?.passed ?? false,
    });

    scheduleCtpStudioCampaign(submissionId);
    scheduleCtpProduction(submissionId);

    return { ok: true, package: pkg };
  } catch (err) {
    console.error('[praison-orchestrator] workforce failed:', err);
    logAIEvent('praison.workforce.failed', aiContext, {
      submissionId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    return { ok: false, error: err instanceof Error ? err.message : 'Workforce run failed.' };
  }
}

async function runLegacyIntakeFallback(
  submission: CtpSubmission,
  context: AIRequestContext,
): Promise<{ ok: boolean; error?: string; package?: ExecutiveIntelligencePackage }> {
  const result = await intakeAgent.execute(
    {
      intent: 'ctp submission',
      query: buildQuery(submission),
      context: buildContext(submission),
    },
    context,
  );

  const analysis: CtpIntakeAnalysisRecord = {
    agent: result.agent,
    summary: result.summary,
    keyFindings: result.keyFindings,
    opportunities: result.opportunities,
    risks: result.risks,
    recommendedNextSteps: result.recommendedNextSteps,
    confidence: result.confidence,
    sources: result.sources,
    analyzedAt: new Date().toISOString(),
    requestId: context.requestId,
  };

  await updateCtpSubmission(submission.id, { intakeAnalysis: analysis });
  scheduleCtpStudioCampaign(submission.id);
  scheduleCtpProduction(submission.id);
  return { ok: true };
}

/** Fire-and-forget — safe to call from assessment submit. */
export function schedulePraisonWorkforce(submissionId: string): void {
  void runPraisonWorkforce(submissionId).catch((err) => {
    console.error('[praison-orchestrator] scheduled run failed:', err);
  });
}

export function workforceAgentCount(): number {
  return PRAISON_WORKFORCE.length;
}
