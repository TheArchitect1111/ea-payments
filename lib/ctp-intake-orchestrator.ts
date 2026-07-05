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
import { emitPulseEvent } from '@/lib/pulse-bus';

function systemRequestId(): string {
  return `ctp_intake_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function buildIntakeQuery(submission: CtpSubmission): string {
  const parts = [
    `Analyze this Consider The Possibilities submission for ${submission.businessName}.`,
    `Contact: ${submission.contactName} (${submission.email}).`,
  ];
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

function buildSystemContext(submission: CtpSubmission): AIRequestContext {
  const requestId = systemRequestId();
  return {
    requestId,
    actor: { id: 'system-ctp-intake', type: 'system' },
    route: '/internal/ctp-intake-orchestrator',
    metadata: {
      ctpSubmissionId: submission.id,
      assessmentId: submission.assessmentId,
      proposalId: submission.proposalId,
    },
  };
}

export async function runCtpIntakeAnalysis(
  submissionId: string,
): Promise<{ ok: boolean; error?: string; analysis?: CtpIntakeAnalysisRecord }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (intakeAgent.status() !== 'available') {
    return { ok: false, error: 'Intake agent unavailable — configure OPENAI_API_KEY.' };
  }

  const context = buildSystemContext(submission);
  logAIEvent('ctp.intake.start', context, { submissionId });

  try {
    const result = await intakeAgent.execute(
      {
        intent: 'ctp submission',
        query: buildIntakeQuery(submission),
        context: {
          submissionId: submission.id,
          businessName: submission.businessName,
          assessmentId: submission.assessmentId,
          proposalId: submission.proposalId,
          considerSlug: submission.considerSlug ?? '',
          discoveryVersion: submission.discoveryVersion ?? '',
        },
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

    const updated = await updateCtpSubmission(submissionId, { intakeAnalysis: analysis });
    if (!updated.ok) {
      return { ok: false, error: updated.error ?? 'Failed to save intake analysis.' };
    }

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.intake.analyzed',
      title: `CTP intake analyzed — ${submission.businessName}`,
      detail: result.summary.slice(0, 180),
      priority: 'medium',
      href: '/admin/proposals',
      tenantId: submission.considerSlug,
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        confidence: result.confidence,
        assessmentId: submission.assessmentId,
      },
    });

    logAIEvent('ctp.intake.complete', context, {
      submissionId,
      confidence: result.confidence,
    });

    return { ok: true, analysis };
  } catch (err) {
    console.error('[ctp-intake-orchestrator] analysis failed:', err);
    logAIEvent('ctp.intake.failed', context, {
      submissionId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    return { ok: false, error: err instanceof Error ? err.message : 'Intake analysis failed.' };
  }
}

/** Fire-and-forget — never throws; safe to call from assessment submit. */
export function scheduleCtpIntakeAnalysis(submissionId: string): void {
  void runCtpIntakeAnalysis(submissionId).catch((err) => {
    console.error('[ctp-intake-orchestrator] scheduled run failed:', err);
  });
}
