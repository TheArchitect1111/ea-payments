/**
 * Legal milestones overlaid on the client journey.
 * Does not replace Project State Engine — reflects legal completion alongside guide stages.
 */
import type { GuideLifecycleStage } from '@/lib/project-state-engine';
import type { ClientLegalProfile, LegalJourneyMilestone } from './types';
import { buildClientLegalStatus } from './status';

const MILESTONE_ORDER: LegalJourneyMilestone['id'][] = [
  'questionnaire',
  'opportunity_review',
  'proposal',
  'msa_signed',
  'sow_signed',
  'payment',
  'design',
  'development',
  'launch',
];

const LABELS: Record<LegalJourneyMilestone['id'], string> = {
  questionnaire: 'Questionnaire',
  opportunity_review: 'Opportunity Review',
  proposal: 'Proposal',
  msa_signed: 'MSA Signed',
  sow_signed: 'SOW Signed',
  payment: 'Payment',
  design: 'Design',
  development: 'Development',
  launch: 'Launch',
};

function stageIndex(stage: GuideLifecycleStage | undefined): number {
  const order: GuideLifecycleStage[] = [
    'Welcome',
    'Discovery',
    'Strategy',
    'Proposal',
    'Agreement',
    'Design',
    'Build',
    'Review',
    'Launch',
    'Care',
  ];
  if (!stage) return 0;
  const i = order.indexOf(stage);
  return i < 0 ? 0 : i;
}

/**
 * Map guide stage + legal profile → journey milestones for portal display.
 * Payment remains the Agreement→Design gate in Project State Engine;
 * MSA/SOW show as legal milestones that should complete around Agreement.
 */
export function buildLegalJourneyMilestones(input: {
  guideStage?: GuideLifecycleStage;
  profile?: ClientLegalProfile | null;
  paymentCompleted?: boolean;
  discoveryComplete?: boolean;
  proposalReady?: boolean;
}): LegalJourneyMilestone[] {
  const si = stageIndex(input.guideStage);
  const msaSigned = input.profile?.msaStatus === 'signed';
  const sowSigned = input.profile?.sowStatus === 'signed';
  const payment = Boolean(input.paymentCompleted) || si >= 5;

  const complete: Record<LegalJourneyMilestone['id'], boolean> = {
    questionnaire: si >= 1 || Boolean(input.discoveryComplete),
    opportunity_review: si >= 2,
    proposal: si >= 3 || Boolean(input.proposalReady),
    msa_signed: msaSigned,
    sow_signed: sowSigned,
    payment,
    design: si >= 5,
    development: si >= 6,
    launch: si >= 8,
  };

  const at: Partial<Record<LegalJourneyMilestone['id'], string>> = {};
  if (input.profile?.msaSignedAt) at.msa_signed = input.profile.msaSignedAt;
  if (input.profile?.sowSignedAt) at.sow_signed = input.profile.sowSignedAt;

  return MILESTONE_ORDER.map((id) => ({
    id,
    label: LABELS[id],
    complete: complete[id],
    completedAt: at[id],
    legalLinked: id === 'msa_signed' || id === 'sow_signed',
  }));
}

/** Whether legal blockers should pause normal portal access (checkbox docs only). */
export function shouldGatePortalForLegal(profile: ClientLegalProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.requiresReacceptance) return true;
  const status = buildClientLegalStatus({ productId: profile.productId, profile });
  return status.requiringAcceptance.some((d) => !d.requiresEsign);
}
