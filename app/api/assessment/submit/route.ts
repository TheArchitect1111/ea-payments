import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { analyzeAssessment, OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';
import type { RevenueRange, Complexity } from '@/lib/analysis-engine';
import { calculateFee } from '@/lib/pricing-engine';
import { createAssessmentRecord, createProposalRecord, upsertProspectFromAssessment } from '@/lib/airtable';
import {
  sendAssessmentAdminNotification,
  sendAssessmentConfirmationEmail,
} from '@/lib/email';
import { trackConsiderEvent } from '@/lib/opportunity-tracking';
import { emitPulseEvent } from '@/lib/pulse-bus';
import {
  createCtpSubmission,
  isCtpDiscoverySubmit,
  updateCtpSubmission,
} from '@/lib/ctp-submissions';
import { sendCtpExecutiveEmailForSubmission } from '@/lib/ctp-executive-email-send';
import { ctpAssetStagingScope, finalizeCtpAssetManifest, parseAssetUploads } from '@/lib/ctp-asset-store';
import { resolveCtpOrganizationId } from '@/lib/ctp-studio-bridge';
import { scheduleCtpIntakeAnalysis } from '@/lib/ctp-intake-orchestrator';
import { runCtpWorkspaceProvision } from '@/lib/ctp-workspace-provision';
import { scheduleCtpStudioCampaign } from '@/lib/ctp-studio-bridge';
import { scheduleCtpWebsiteProvision } from '@/lib/ctp-website-provision';
import {
  runCtpDigitalPresenceAudit,
  scheduleCtpDigitalPresenceAudit,
} from '@/lib/ctp-digital-presence-run';
import { auditDigitalPresence, type DigitalPresenceAudit } from '@/lib/ctp-digital-presence';
import { classifyCtpClientType, parseInvestmentRangeLabel } from '@/lib/ctp-client-type';
import { buildDiscoveryRecommendations, type DiscoveryAnswers } from '@/lib/discovery-engine';
import { runCtpExecutiveSnapshot } from '@/lib/ctp-executive-snapshot-run';
import type { CtpExecutiveScore } from '@/lib/ctp-executive-scoring';
import { normalizeFactoryOpportunity } from '@/lib/factory-opportunities';

function mapTeamSize(label: string): number {
  const map: Record<string, number> = {
    'Just me':             1,
    '2-5 people':          3,
    '6-15 people':         10,
    '16-50 people':        33,
    'More than 50 people': 65,
  };
  return map[label] ?? 1;
}

function mapRevenueRange(label: string): RevenueRange {
  const map: Record<string, RevenueRange> = {
    'Under $100k':    'under_100k',
    '$100k to $500k': '100k_500k',
    '$500k to $1M':   '500k_1m',
    '$1M to $5M':     '1m_5m',
    'More than $5M':  '5m_plus',
  };
  return map[label] ?? 'under_100k';
}

function mapComplexity(label: string): Complexity {
  const map: Record<string, Complexity> = {
    Low:    'low',
    Medium: 'medium',
    High:   'high',
  };
  return map[label] ?? 'medium';
}

// Accepts challenge IDs (from the redesigned form) or legacy labels.
// Falls back to the input value so IDs pass through unchanged.
function mapChallengeLabelsToIds(labels: string[]): string[] {
  return labels.map((label) => {
    const found = OPERATIONAL_CHALLENGES.find((c) => c.label === label);
    return found?.id ?? label;
  });
}

// ---------------------------------------------------------------------------
// Scope derivation (replaces the removed prospect-facing Scope section)
// ---------------------------------------------------------------------------

function deriveWorkflowCount(teamSizeLabel: string): number {
  const map: Record<string, number> = {
    'Just me':             1,
    '2-5 people':          2,
    '6-15 people':         4,
    '16-50 people':        6,
    'More than 50 people': 9,
  };
  return map[teamSizeLabel] ?? 1;
}

function deriveUserCount(teamSizeLabel: string): number {
  const map: Record<string, number> = {
    'Just me':             1,
    '2-5 people':          3,
    '6-15 people':         10,
    '16-50 people':        33,
    'More than 50 people': 65,
  };
  return map[teamSizeLabel] ?? 1;
}

function deriveDashboardRequired(teamSizeLabel: string): boolean {
  return ['6-15 people', '16-50 people', 'More than 50 people'].includes(teamSizeLabel);
}

function derivePortalRequired(teamSizeLabel: string): boolean {
  return ['16-50 people', 'More than 50 people'].includes(teamSizeLabel);
}

function deriveComplexity(revenueRange: string): string {
  if (revenueRange === 'Under $100k' || revenueRange === '$100k to $500k') return 'Low';
  if (revenueRange === '$500k to $1M') return 'Medium';
  return 'High';
}

// Count comma-separated tools in the currentSystems string (capped at 8).
// The form joins the multi-select array with ', ' before sending.
function deriveSystemsCount(currentSystems: string): number {
  if (!currentSystems.trim()) return 0;
  const count = currentSystems.split(',').filter((s) => s.trim().length > 0).length;
  return Math.min(count, 8);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const rawText = await req.text();
  console.log('[assessment/submit] raw body:', rawText);

  // Outer catch ensures the client always receives JSON, never an HTML error page.
  try {
    let body: Record<string, unknown>;
    try {
      body = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch (err) {
      console.error('[assessment/submit] failed to parse body:', err);
      return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
    }

    console.log('[assessment/submit] parsed body:', JSON.stringify(body));

    // Bundled into one object (see note below on the `scope` object) rather
    // than bare sequential consts, for the same Turbopack-safety reason.
    const input = {
      businessName: String(body.businessName ?? '').trim(),
      contactName: String(body.contactName ?? '').trim(),
      email: String(body.email ?? '').trim(),
      teamSizeLabel: String(body.teamSizeLabel ?? ''),
      revenueRange: String(body.revenueRange ?? ''),
      currentSystems: String(body.currentSystems ?? '').trim(),
      operationalChallenges: Array.isArray(body.operationalChallenges)
        ? (body.operationalChallenges as string[])
        : [],
      growthGoals: String(body.growthGoals ?? '').trim(),
      capacityConstraints: String(body.capacityConstraints ?? '').trim(),
      considerSlug: String(body.considerSlug ?? '').trim() || undefined,
      partnerSlug: String(body.partnerSlug ?? '').trim() || undefined,
      factoryOpportunity: normalizeFactoryOpportunity(String(body.factoryOpportunity ?? body.opportunity ?? '')),
      discoveryVersion: String(body.discoveryVersion ?? '').trim() || undefined,
      discoveryAnswers:
        body.discoveryAnswers && typeof body.discoveryAnswers === 'object'
          ? (body.discoveryAnswers as Record<string, unknown>)
          : undefined,
      desiredExperiences: Array.isArray(body.desiredExperiences)
        ? (body.desiredExperiences as string[])
        : undefined,
      journeyKey: String(body.journeyKey ?? '').trim() || undefined,
      primaryJourney: String(body.primaryJourney ?? '').trim() || undefined,
      estimatedInvestmentRange: String(body.estimatedInvestmentRange ?? '').trim() || undefined,
      preliminaryProjectScope: Array.isArray(body.preliminaryProjectScope)
        ? (body.preliminaryProjectScope as string[]).map(String).filter(Boolean)
        : undefined,
      assetUploads: body.assetUploads,
      executiveScoring:
        body.executiveScoring && typeof body.executiveScoring === 'object'
          ? (body.executiveScoring as CtpExecutiveScore)
          : undefined,
    };

    const isCtpFlow = isCtpDiscoverySubmit(body);

    if (
      !input.businessName ||
      !input.contactName ||
      !input.email ||
      !input.teamSizeLabel ||
      !input.revenueRange
    ) {
      return NextResponse.json(
        { ok: false, error: 'Required fields are missing.' },
        { status: 400 }
      );
    }

    // Derive all scope values from the prospect's answers.
    // Bundled into one object and accessed via dot-notation everywhere below
    // (never destructured into bare identifiers) to avoid a Turbopack
    // production-build bug where bare local consts referenced only through
    // object-literal shorthand across multiple call sites get dropped,
    // producing "X is not defined" at runtime despite valid source.
    const scope = {
      teamSize: mapTeamSize(input.teamSizeLabel),
      workflowCount: deriveWorkflowCount(input.teamSizeLabel),
      userCount: deriveUserCount(input.teamSizeLabel),
      dashboardRequired: deriveDashboardRequired(input.teamSizeLabel),
      portalRequired: derivePortalRequired(input.teamSizeLabel),
      businessComplexity: deriveComplexity(input.revenueRange),
      systemsCount: deriveSystemsCount(input.currentSystems),
    };

    const challengeIds = mapChallengeLabelsToIds(input.operationalChallenges);

    const analysis = analyzeAssessment({
      teamSize: scope.teamSize,
      revenueRange: mapRevenueRange(input.revenueRange),
      systemsCount: scope.systemsCount,
      operationalChallenges: challengeIds,
      complexity: mapComplexity(scope.businessComplexity),
    });

    const pricing = calculateFee({
      projectType: analysis.recommendedProjectType,
      workflowCount: scope.workflowCount,
      automationCount: 0,
      integrationCount: scope.systemsCount,
      dashboardRequired: scope.dashboardRequired,
      portalRequired: scope.portalRequired,
      userCount: scope.userCount,
    });

    const assessmentId = `ASSESS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const proposalId   = `PROP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const autoApprove = process.env.LAUNCH_AUTO_APPROVE_PROPOSALS === 'true';

    const proposalResult = await createProposalRecord({
      proposalId,
      businessName: input.businessName,
      contactName: input.contactName,
      email: input.email,
      status: autoApprove ? 'Approved' : 'Pending Review',
      recommendedProjectType: analysis.recommendedProjectType,
      projectTypeLabel:       pricing.projectTypeLabel,
      capacityScore:          analysis.capacityScore,
      scoreBand:              analysis.scoreBand,
      primaryConstraint:      analysis.primaryConstraint,
      weeklyTimeRecovery:     analysis.weeklyTimeRecovery,
      opportunityLow:         analysis.opportunityLow,
      opportunityHigh:        analysis.opportunityHigh,
      rawFee:                 pricing.rawFee,
      recommendedFee:         pricing.recommendedFee,
    });

    const assessmentResult = await createAssessmentRecord({
      assessmentId,
      businessName: input.businessName,
      contactName: input.contactName,
      email: input.email,
      teamSize: scope.teamSize,
      revenueRange: input.revenueRange,
      currentSystems: input.currentSystems,
      systemsCount: scope.systemsCount,
      operationalChallenges: input.operationalChallenges,
      growthGoals: input.growthGoals,
      capacityConstraints: input.capacityConstraints,
      workflowCount: scope.workflowCount,
      automationCount: 0,
      integrationCount: scope.systemsCount,
      dashboardRequired: scope.dashboardRequired,
      portalRequired: scope.portalRequired,
      userCount: scope.userCount,
      businessComplexity: scope.businessComplexity,
      linkedProposalId: proposalResult.recordId,
    });

    if (!proposalResult.ok) {
      console.error('Proposal write failed:', proposalResult.error);
      return NextResponse.json({
        ok: true,
        saved: false,
        message:
          'We received your assessment. Our team will follow up by email within 1–2 business days.',
      });
    }

    if (!assessmentResult.ok) {
      console.error('Assessment write failed:', assessmentResult.error);
    }

    try {
      await upsertProspectFromAssessment({
        contactName: input.contactName,
        businessName: input.businessName,
        email: input.email,
        assessmentId,
      });
    } catch (err) {
      console.error('Prospect client record upsert failed:', err);
    }

    try {
      await emitPulseEvent({
        product: 'ea-platform',
        type: 'assessment.submitted',
        title: `Assessment submitted — ${input.businessName}`,
        detail: `${input.contactName} · score band pending review`,
        priority: 'medium',
        href: '/admin/proposals',
        objectId: assessmentResult.recordId,
        metadata: {
          email: input.email,
          proposalId,
          ...(input.factoryOpportunity ? { factoryOpportunity: input.factoryOpportunity } : {}),
        },
      });
    } catch (err) {
      console.error('Pulse assessment.submitted failed:', err);
    }

    let ctpClassification: ReturnType<typeof classifyCtpClientType> | undefined;
    let recommendations: unknown;
    let digitalPresenceAudit: DigitalPresenceAudit | undefined;
    let ctpSubmissionId: string | undefined;

    if (isCtpFlow) {
      if (input.discoveryAnswers) {
        try {
          recommendations = buildDiscoveryRecommendations(input.discoveryAnswers as DiscoveryAnswers);
        } catch (err) {
          console.error('[assessment/submit] discovery recommendations failed:', err);
        }
      }

      ctpClassification = classifyCtpClientType({
        desiredExperiences: input.desiredExperiences,
        discoveryAnswers: {
          ...(input.discoveryAnswers ?? {}),
          ...(input.journeyKey ? { journeyKey: input.journeyKey } : {}),
          ...(input.primaryJourney ? { primaryJourney: input.primaryJourney } : {}),
        },
        operationalChallenges: challengeIds,
        recommendedProjectType: analysis.recommendedProjectType,
      });

      const journeyInvestment = parseInvestmentRangeLabel(input.estimatedInvestmentRange);
      const presenceProjectLabel =
        input.primaryJourney ||
        (ctpClassification.clientType === 'website' || ctpClassification.clientType === 'website_portal'
          ? 'Website / Digital Presence'
          : pricing.projectTypeLabel);

      try {
        const parsedUploads = parseAssetUploads(input.assetUploads);
        const assetManifest = parsedUploads
          ? await finalizeCtpAssetManifest(
              parsedUploads,
              ctpAssetStagingScope(input.considerSlug || input.email),
            )
          : undefined;

        const discoveryAnswers = input.discoveryAnswers
          ? {
              ...input.discoveryAnswers,
              ...(input.factoryOpportunity ? { factory_opportunity: input.factoryOpportunity } : {}),
              ...(assetManifest ? { asset_uploads: assetManifest } : {}),
              ...(input.journeyKey ? { journeyKey: input.journeyKey } : {}),
              ...(input.primaryJourney ? { primaryJourney: input.primaryJourney } : {}),
              ...(input.estimatedInvestmentRange
                ? { estimatedInvestmentRange: input.estimatedInvestmentRange }
                : {}),
              ...(input.preliminaryProjectScope?.length
                ? { preliminaryProjectScope: input.preliminaryProjectScope }
                : {}),
            }
          : assetManifest
            ? {
                ...(input.factoryOpportunity ? { factory_opportunity: input.factoryOpportunity } : {}),
                asset_uploads: assetManifest,
                ...(input.journeyKey ? { journeyKey: input.journeyKey } : {}),
                ...(input.primaryJourney ? { primaryJourney: input.primaryJourney } : {}),
                ...(input.estimatedInvestmentRange
                  ? { estimatedInvestmentRange: input.estimatedInvestmentRange }
                  : {}),
                ...(input.preliminaryProjectScope?.length
                  ? { preliminaryProjectScope: input.preliminaryProjectScope }
                  : {}),
              }
            : {
                ...(input.factoryOpportunity ? { factory_opportunity: input.factoryOpportunity } : {}),
                ...(input.journeyKey ? { journeyKey: input.journeyKey } : {}),
                ...(input.primaryJourney ? { primaryJourney: input.primaryJourney } : {}),
                ...(input.estimatedInvestmentRange
                  ? { estimatedInvestmentRange: input.estimatedInvestmentRange }
                  : {}),
                ...(input.preliminaryProjectScope?.length
                  ? { preliminaryProjectScope: input.preliminaryProjectScope }
                  : {}),
              };

        const portalRequired = scope.portalRequired || ctpClassification.portalRequired;

        const ctpResult = await createCtpSubmission({
          businessName: input.businessName,
          contactName: input.contactName,
          email: input.email,
          assessmentId,
          proposalId,
          factoryOpportunity: input.factoryOpportunity,
          considerSlug: input.considerSlug,
          partnerSlug: input.partnerSlug,
          discoveryVersion: input.discoveryVersion,
          discoveryAnswers,
          desiredExperiences: input.desiredExperiences,
          recommendations,
          clientType: ctpClassification.clientType,
          clientTypeClassification: ctpClassification,
          executiveScoring: input.executiveScoring,
          assetManifest,
          portalRequired,
        });

        if (ctpResult.submission) {
          ctpSubmissionId = ctpResult.submission.id;
          await emitPulseEvent({
            product: 'ea-platform',
            type: 'ctp.submitted',
            title: `CTP submitted — ${input.businessName}`,
            detail: `${input.contactName} · ${ctpClassification.label} · ${ctpResult.submission.id}`,
            priority: 'medium',
            href: '/admin/ctp',
            tenantId: input.considerSlug,
            objectId: ctpResult.submission.id,
            metadata: {
              email: input.email,
              proposalId,
              assessmentId,
              ctpSubmissionId: ctpResult.submission.id,
              clientType: ctpClassification.clientType,
              flow: 'ctp',
              ...(input.factoryOpportunity
                ? { factoryOpportunity: input.factoryOpportunity }
                : {}),
            },
          });
          scheduleCtpIntakeAnalysis(ctpResult.submission.id);

          if (ctpClassification.digitalAudit) {
            try {
              const urlFromAnswers =
                (typeof input.discoveryAnswers?.current_url === 'string'
                  ? input.discoveryAnswers.current_url
                  : undefined) || undefined;
              digitalPresenceAudit = await auditDigitalPresence({
                url: urlFromAnswers,
                businessName: input.businessName,
                discoveryAnswers: input.discoveryAnswers ?? undefined,
              });
              await updateCtpSubmission(ctpResult.submission.id, {
                digitalPresenceAudit,
              });
            } catch (err) {
              console.error('[assessment/submit] digital presence audit failed:', err);
              scheduleCtpDigitalPresenceAudit(ctpResult.submission.id);
            }
          }

          if (ctpClassification.businessIntelligence) {
            try {
              await runCtpExecutiveSnapshot(ctpResult.submission.id, {
                analysis: {
                  capacityScore: analysis.capacityScore,
                  scoreBand: analysis.scoreBand,
                  primaryConstraint: analysis.primaryConstraint,
                  weeklyTimeRecovery: analysis.weeklyTimeRecovery,
                  opportunityLow: analysis.opportunityLow,
                  opportunityHigh: analysis.opportunityHigh,
                },
                projectTypeLabel: pricing.projectTypeLabel,
                recommendedFee: pricing.recommendedFee,
                operationalChallenges: challengeIds,
                recommendations,
              });
            } catch (err) {
              console.error('[assessment/submit] executive snapshot failed:', err);
            }
          }

          // Persist email draft before scheduling provision so the deferred send has context.
          await updateCtpSubmission(ctpResult.submission.id, {
            executiveEmailDraft: {
              clientType: ctpClassification.clientType,
              capacityScore: analysis.capacityScore,
              scoreBand: analysis.scoreBand,
              primaryConstraint: analysis.primaryConstraint,
              weeklyTimeRecovery: analysis.weeklyTimeRecovery,
              opportunityLow: analysis.opportunityLow,
              opportunityHigh: analysis.opportunityHigh,
              projectTypeLabel:
                ctpClassification.clientType === 'website' ||
                ctpClassification.clientType === 'website_portal'
                  ? presenceProjectLabel
                  : pricing.projectTypeLabel,
              recommendedFee: journeyInvestment?.high ?? pricing.recommendedFee,
              investmentLow: journeyInvestment?.low,
              investmentHigh: journeyInvestment?.high,
              timelineLabel:
                ctpClassification.clientType === 'website' ||
                ctpClassification.clientType === 'website_portal'
                  ? '3-5 Weeks'
                  : undefined,
              scopePhases: input.preliminaryProjectScope,
              recommendations,
              operationalChallenges: challengeIds,
            },
          });

          if (ctpResult.submission.workspaceStatus === 'Pending') {
            // Await provision so the welcome email CTA has a branded portal URL
            // (not bare /portal/login → Simplifi hub).
            try {
              await runCtpWorkspaceProvision(ctpResult.submission.id);
            } catch (err) {
              console.error('[assessment/submit] CTP workspace provision failed:', err);
            }
          } else {
            scheduleCtpStudioCampaign(ctpResult.submission.id);
            // Website-only tracks skip portal Pending — still auto-build the site.
            if (ctpClassification.websiteRequired) {
              scheduleCtpWebsiteProvision(ctpResult.submission.id);
            }
          }
        }
      } catch (err) {
        console.error('[assessment/submit] CTP submission failed:', err);
      }
    }

    try {
      await sendAssessmentAdminNotification({
        businessName: input.businessName,
        contactName: input.contactName,
        email: input.email,
        teamSize: scope.teamSize,
        revenueRange: input.revenueRange,
        operationalChallenges: input.operationalChallenges,
        workflowCount: scope.workflowCount,
        automationCount: 0,
        integrationCount: scope.systemsCount,
        dashboardRequired: scope.dashboardRequired,
        portalRequired: scope.portalRequired,
        userCount: scope.userCount,
        businessComplexity: scope.businessComplexity,
        capacityScore:          analysis.capacityScore,
        scoreBand:              analysis.scoreBand,
        primaryConstraint:      analysis.primaryConstraint,
        weeklyTimeRecovery:     analysis.weeklyTimeRecovery,
        opportunityLow:         analysis.opportunityLow,
        opportunityHigh:        analysis.opportunityHigh,
        recommendedProjectType: analysis.recommendedProjectType,
        projectTypeLabel:       pricing.projectTypeLabel,
        rawFee:                 pricing.rawFee,
        recommendedFee:         pricing.recommendedFee,
        assessmentRecordId:     assessmentResult.recordId,
        proposalRecordId:       proposalResult.recordId,
      });
    } catch (err) {
      console.error('Assessment admin notification error:', err);
    }

    if (proposalResult.recordId) {
      try {
        if (isCtpFlow && ctpClassification && ctpSubmissionId) {
          if (!digitalPresenceAudit && ctpClassification.digitalAudit) {
            try {
              await runCtpDigitalPresenceAudit(ctpSubmissionId);
            } catch {
              /* non-blocking */
            }
          }

          // Await provision above when portal is required so the CTA has a branded URL.
          // Always call send here too — idempotent if provision already sent; covers slow/failed provision.
          const execMail = await sendCtpExecutiveEmailForSubmission(ctpSubmissionId);
          if (!execMail.ok && !execMail.skipped) {
            console.error('[assessment/submit] CTP client email failed:', execMail.error);
            await sendAssessmentConfirmationEmail({
              email: input.email,
              contactName: input.contactName,
              capacityScore: analysis.capacityScore,
              scoreBand: analysis.scoreBand,
              weeklyTimeRecovery: analysis.weeklyTimeRecovery,
              opportunityLow: analysis.opportunityLow,
              opportunityHigh: analysis.opportunityHigh,
              projectTypeLabel: pricing.projectTypeLabel,
              recommendedFee: pricing.recommendedFee,
              proposalId,
              clientTypeLabel: ctpClassification?.label,
            });
          }
        } else if (!isCtpFlow) {
          await sendAssessmentConfirmationEmail({
            email: input.email,
            contactName: input.contactName,
            capacityScore: analysis.capacityScore,
            scoreBand: analysis.scoreBand,
            weeklyTimeRecovery: analysis.weeklyTimeRecovery,
            opportunityLow: analysis.opportunityLow,
            opportunityHigh: analysis.opportunityHigh,
            projectTypeLabel: pricing.projectTypeLabel,
            recommendedFee: pricing.recommendedFee,
            proposalId,
            clientTypeLabel: ctpClassification?.label,
          });
        }
      } catch (err) {
        console.error('Assessment confirmation email error:', err);
      }
    }

    if (input.considerSlug) {
      try {
        await trackConsiderEvent(input.considerSlug, 'assessment_completed');
      } catch (err) {
        console.error('Consider tracking error:', err);
      }
    }

    return NextResponse.json({
      ok: true,
      proposalId,
      ...(isCtpFlow
        ? {
            flow: 'ctp' as const,
            clientType: ctpClassification?.clientType,
            clientTypeLabel: ctpClassification?.label,
          }
        : {}),
    });
  } catch (err) {
    console.error(
      'Assessment submit unhandled error:',
      err instanceof Error ? err.stack ?? err.message : err
    );
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
