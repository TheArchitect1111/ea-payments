/**
 * CTP AI production package builder (Phase 10).
 * Deterministic first-pass artifacts from discovery + intake + track —
 * no OpenAI required so production always advances the timeline.
 */
import type { CtpClientType } from '@/lib/ctp-client-type';
import { CTP_CLIENT_TYPE_LABELS } from '@/lib/ctp-client-type';
import type { DigitalPresenceAudit } from '@/lib/ctp-digital-presence';
import type { CtpIntakeAnalysisRecord, CtpSubmission } from '@/lib/ctp-submissions';

export type CtpProductionArtifactKind =
  | 'executive_blueprint'
  | 'website_brief'
  | 'portal_blueprint'
  | 'seo_baseline'
  | 'copy_outline'
  | 'ops_roadmap';

export type CtpProductionArtifact = {
  id: string;
  kind: CtpProductionArtifactKind;
  title: string;
  summary: string;
  bullets: string[];
};

export type CtpProductionPackage = {
  version: 1;
  generatedAt: string;
  clientType: CtpClientType;
  clientTypeLabel: string;
  headline: string;
  summary: string;
  stack: string[];
  timelineLabel: string;
  artifacts: CtpProductionArtifact[];
  nextInternalActions: string[];
  siteUrl?: string;
  digitalScore?: number;
  intakeConfidence?: number;
};

function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function discoveryString(answers: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = answers?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function trackStack(clientType: CtpClientType): string[] {
  switch (clientType) {
    case 'website':
      return ['EA hub website', 'Offer + CTA messaging', 'Lead capture', 'SEO / mobile baseline'];
    case 'website_portal':
      return [
        'EA hub website',
        'Lean client portal',
        'Entitled modules',
        'Welcome access + progress workspace',
      ];
    case 'portal_only':
      return ['Client / member portal', 'Resources + documents', 'Secure access', 'Progress visibility'];
    case 'business_transformation':
      return [
        'Executive capacity snapshot',
        'Operational blueprint',
        'Systems / workflow roadmap',
        'Phased implementation plan',
      ];
    default:
      return ['Discovery synthesis', 'Recommended first product path', 'Scoped next-step plan'];
  }
}

function timelineLabel(clientType: CtpClientType): string {
  switch (clientType) {
    case 'website':
      return '2–4 weeks to first live presence';
    case 'website_portal':
      return '3–6 weeks to live website + portal';
    case 'portal_only':
      return '2–4 weeks to portal launch';
    case 'business_transformation':
      return '6–12 weeks for phased transformation';
    default:
      return '2–6 weeks for the first focused deliverable';
  }
}

function artifact(
  kind: CtpProductionArtifactKind,
  title: string,
  summary: string,
  bullets: string[],
): CtpProductionArtifact {
  return {
    id: kind,
    kind,
    title,
    summary,
    bullets: bullets.filter(Boolean).slice(0, 8),
  };
}

function buildArtifacts(input: {
  clientType: CtpClientType;
  businessName: string;
  intake?: CtpIntakeAnalysisRecord;
  digital?: DigitalPresenceAudit;
  siteUrl?: string;
  recommendations: string[];
  brandVoice?: string;
  offerSummary?: string;
}): CtpProductionArtifact[] {
  const findings = (input.intake?.keyFindings ?? []).map((f) => f.title).slice(0, 4);
  const nextSteps = (input.intake?.recommendedNextSteps ?? []).slice(0, 4);
  const recs = input.recommendations.slice(0, 4);
  const digitalBits =
    typeof input.digital?.overallScore === 'number'
      ? [
          `Digital Presence Score ${input.digital.overallScore}/100`,
          ...(input.digital.findings ?? []).slice(0, 3).map((f) => f.title),
        ]
      : [];

  const artifacts: CtpProductionArtifact[] = [];

  if (
    input.clientType === 'business_transformation' ||
    input.clientType === 'other' ||
    input.clientType === 'portal_only'
  ) {
    artifacts.push(
      artifact(
        'executive_blueprint',
        'Executive blueprint',
        `Priority operating plan for ${input.businessName}.`,
        [
          input.intake?.summary?.slice(0, 220) ||
            'Synthesize discovery into a clear transformation narrative.',
          ...findings,
          ...recs,
        ],
      ),
    );
    artifacts.push(
      artifact(
        'ops_roadmap',
        'Operations roadmap',
        'Sequenced systems and workflow moves.',
        nextSteps.length
          ? nextSteps
          : [
              'Stabilize the highest-friction workflow first',
              'Instrument progress in the client portal',
              'Review outcomes in the executive desk before reveal',
            ],
      ),
    );
  }

  if (input.clientType === 'website' || input.clientType === 'website_portal') {
    artifacts.push(
      artifact(
        'website_brief',
        'Website production brief',
        input.siteUrl
          ? `Starter site live — refine messaging and conversion.`
          : `Assemble the first branded presence for ${input.businessName}.`,
        [
          input.offerSummary || 'Clarify primary offer and audience',
          input.brandVoice || 'Warm, premium, trustworthy brand voice',
          input.siteUrl ? `Live URL: ${input.siteUrl}` : 'Provision hub site from CTP website track',
          ...recs,
        ],
      ),
    );
    artifacts.push(
      artifact(
        'seo_baseline',
        'SEO + presence baseline',
        'Search and digital presence starting points.',
        digitalBits.length
          ? digitalBits
          : [
              'Capture current URL and brand keywords',
              'Ensure mobile-first layout and clear CTA',
              'Add meta title / description on launch pages',
            ],
      ),
    );
    artifacts.push(
      artifact(
        'copy_outline',
        'Copy outline',
        'Hero, offer, proof, and CTA structure.',
        [
          'Hero: transformation promise in one line',
          'Offer: what they get in the first 30 days',
          'Proof: capacity / presence findings',
          'CTA: enter portal or book strategy session',
        ],
      ),
    );
  }

  if (input.clientType === 'website_portal' || input.clientType === 'portal_only') {
    artifacts.push(
      artifact(
        'portal_blueprint',
        'Portal blueprint',
        'Modules and client experience for the first unlock.',
        [
          'Progress workspace (CTP timeline)',
          'Resources / documents',
          'Updates and messaging',
          'Reveal unlock after executive approval',
          ...nextSteps.slice(0, 2),
        ],
      ),
    );
  }

  if (!artifacts.length) {
    artifacts.push(
      artifact(
        'executive_blueprint',
        'Discovery synthesis',
        `First production package for ${input.businessName}.`,
        findings.length ? findings : recs.length ? recs : ['Confirm track and preferred first deliverable'],
      ),
    );
  }

  return artifacts;
}

export function buildCtpProductionPackage(submission: CtpSubmission): CtpProductionPackage {
  const clientType = submission.clientType ?? 'other';
  const clientTypeLabel = CTP_CLIENT_TYPE_LABELS[clientType];
  const recommendations = asLines(submission.recommendations);
  const brandVoice = discoveryString(submission.discoveryAnswers, 'brand_voice');
  const offerSummary =
    discoveryString(submission.discoveryAnswers, 'offer_summary') ||
    discoveryString(submission.discoveryAnswers, 'success_definition');

  const artifacts = buildArtifacts({
    clientType,
    businessName: submission.businessName,
    intake: submission.intakeAnalysis,
    digital: submission.digitalPresenceAudit,
    siteUrl: submission.siteUrl,
    recommendations,
    brandVoice,
    offerSummary,
  });

  const headline = `${submission.businessName} — ${clientTypeLabel} production package`;
  const summary = [
    submission.intakeAnalysis?.summary?.slice(0, 280),
    `Track: ${clientTypeLabel}.`,
    submission.siteUrl ? `Starter site: ${submission.siteUrl}.` : null,
    typeof submission.digitalPresenceAudit?.overallScore === 'number'
      ? `Digital Presence ${submission.digitalPresenceAudit.overallScore}/100.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    clientType,
    clientTypeLabel,
    headline,
    summary:
      summary ||
      `First AI production package for ${submission.businessName} on the ${clientTypeLabel} track.`,
    stack: trackStack(clientType),
    timelineLabel: timelineLabel(clientType),
    artifacts,
    nextInternalActions: [
      'Review production package in /admin/ctp',
      'Mark ready for review when quality bar is met',
      'Approve & reveal to unlock the client celebration',
    ],
    siteUrl: submission.siteUrl,
    digitalScore: submission.digitalPresenceAudit?.overallScore,
    intakeConfidence: submission.intakeAnalysis?.confidence,
  };
}
