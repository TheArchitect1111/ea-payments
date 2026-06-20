import type { CaptureRecord } from './capture-records';
import type { ProposalWithAssessment } from './airtable';
import { computeAdoptionHealth } from './adoption-engine';

export interface TwinDimension {
  name: string;
  score: number;
  trend: 'rising' | 'stable' | 'at-risk';
  insight: string;
}

export interface DigitalTwinProfile {
  entityId: string;
  name: string;
  entityType: 'organization' | 'platform' | 'capture';
  dimensions: TwinDimension[];
  activeProducts: string[];
  pipeline: string[];
  narrative: string;
  adoptionScore?: number;
  lastUpdated: string;
}

export function buildPlatformTwin(
  captures: CaptureRecord[],
  proposals: ProposalWithAssessment[]
): DigitalTwinProfile {
  const avgEaFit =
    captures.filter((c) => c.eaFitScore != null).reduce((s, c) => s + (c.eaFitScore ?? 0), 0) /
    Math.max(1, captures.filter((c) => c.eaFitScore != null).length);

  const avgOpportunity =
    captures.filter((c) => c.opportunityScore != null).reduce((s, c) => s + (c.opportunityScore ?? 0), 0) /
    Math.max(1, captures.filter((c) => c.opportunityScore != null).length);

  const activeProjects = proposals.filter(
    (p) => p.status === 'Approved' || p.status === 'Sent' || p.status === 'Approved & Paid'
  ).length;

  const paidDeals = proposals.filter((p) => p.status === 'Approved & Paid').length;

  return {
    entityId: 'ea-platform',
    name: 'Efficiency Architects Platform',
    entityType: 'platform',
    dimensions: [
      {
        name: 'Intelligence capture',
        score: Math.round(avgEaFit || 50),
        trend: captures.length >= 5 ? 'rising' : 'stable',
        insight: `${captures.length} captures in organizational memory.`,
      },
      {
        name: 'Opportunity pipeline',
        score: Math.round(avgOpportunity || 45),
        trend: activeProjects > 0 ? 'rising' : 'stable',
        insight: `${activeProjects} active proposals · ${paidDeals} closed.`,
      },
      {
        name: 'Visibility',
        score: Math.min(100, 40 + captures.length * 5 + proposals.length * 2),
        trend: 'rising',
        insight: 'Knowledge Graph connects captures, products, partners, and proof.',
      },
      {
        name: 'Adoption posture',
        score: Math.round(
          proposals.length > 0
            ? proposals.reduce((s, p) => s + computeAdoptionHealth(p).score, 0) / proposals.length
            : 55
        ),
        trend: 'stable',
        insight: 'Weighted from proposal engagement and complexity signals.',
      },
      {
        name: 'Partner network',
        score: Math.min(100, 30 + paidDeals * 10),
        trend: paidDeals > 0 ? 'rising' : 'stable',
        insight: 'Partner Marketplace extends referral and satellite hub ecosystem.',
      },
    ],
    activeProducts: [
      'Mission Control',
      'Resource Radar',
      'Simplifi',
      'Magnifi',
      'EA Capture Engine',
      'Partner Marketplace',
    ],
    pipeline: [
      'Discover — Capture Engine + Resource Radar',
      'Clarify — Simplifi audits + Operational MRI',
      'Visualize — Magnifi blueprints',
      'Implement — Implementation packages',
      'Measure — Adoption Engine',
      'Learn — Knowledge Graph + Digital Twin',
    ],
    narrative:
      'The EA Digital Twin reflects live platform intelligence — captures, proposals, partners, and adoption health in one operational mirror.',
    lastUpdated: new Date().toISOString(),
  };
}

export function buildCaptureTwin(capture: CaptureRecord): DigitalTwinProfile {
  return {
    entityId: capture.id,
    name: capture.title,
    entityType: 'capture',
    dimensions: [
      {
        name: 'EA Fit',
        score: capture.eaFitScore ?? 0,
        trend: (capture.eaFitScore ?? 0) >= 70 ? 'rising' : 'stable',
        insight: capture.analysisSummary?.slice(0, 120) ?? 'Awaiting analysis.',
      },
      {
        name: 'Opportunity',
        score: capture.opportunityScore ?? 0,
        trend: capture.priority === 'High' ? 'rising' : 'stable',
        insight: `Priority: ${capture.priority} · Status: ${capture.status}`,
      },
      {
        name: 'Trust',
        score: capture.trustConfidence ?? 50,
        trend: (capture.trustConfidence ?? 0) >= 70 ? 'rising' : 'at-risk',
        insight: capture.blueprintTemplate ?? 'No template assigned yet.',
      },
    ],
    activeProducts: capture.productAlignment ?? ['Simplifi', 'Magnifi'],
    pipeline: [
      capture.status,
      capture.blueprintSummary ? 'Blueprint stub generated' : 'Blueprint pending',
      'Route to Mission Control',
    ],
    narrative: `Digital twin for captured entity — ${capture.category ?? capture.captureType} from ${capture.source}.`,
    lastUpdated: new Date().toISOString(),
  };
}

export function buildOrganizationTwin(
  name: string,
  captures: CaptureRecord[],
  proposals: ProposalWithAssessment[]
): DigitalTwinProfile {
  const slug = name.toLowerCase();
  const relatedCaptures = captures.filter((c) => c.title.toLowerCase().includes(slug));
  const relatedProposals = proposals.filter(
    (p) =>
      p.businessName.toLowerCase().includes(slug) ||
      p.contactName.toLowerCase().includes(slug)
  );

  const adoption =
    relatedProposals.length > 0
      ? computeAdoptionHealth(relatedProposals[0]).score
      : undefined;

  const avgFit =
    relatedCaptures.reduce((s, c) => s + (c.eaFitScore ?? 0), 0) /
    Math.max(1, relatedCaptures.length);

  return {
    entityId: `org-${slug.replace(/\s+/g, '-')}`,
    name,
    entityType: 'organization',
    dimensions: [
      {
        name: 'Discovery depth',
        score: Math.min(100, relatedCaptures.length * 25 + 20),
        trend: relatedCaptures.length > 0 ? 'rising' : 'at-risk',
        insight: `${relatedCaptures.length} related capture(s) in Knowledge Graph.`,
      },
      {
        name: 'Commercial readiness',
        score: relatedProposals.length > 0 ? relatedProposals[0].capacityScore : 40,
        trend: relatedProposals.some((p) => p.status.includes('Approved')) ? 'rising' : 'stable',
        insight: relatedProposals[0]?.status ?? 'No proposal yet.',
      },
      {
        name: 'Product alignment',
        score: Math.round(avgFit || 45),
        trend: 'stable',
        insight: (relatedCaptures[0]?.productAlignment ?? ['Simplifi']).join(', '),
      },
    ],
    activeProducts: [
      ...new Set(relatedCaptures.flatMap((c) => c.productAlignment ?? [])),
    ].slice(0, 5),
    pipeline: relatedProposals[0]
      ? [`Proposal: ${relatedProposals[0].status}`, relatedProposals[0].projectTypeLabel]
      : ['Capture → Analyze → Blueprint → Proposal'],
    narrative: `Organizational digital twin synthesized from ${relatedCaptures.length} captures and ${relatedProposals.length} proposals.`,
    adoptionScore: adoption,
    lastUpdated: new Date().toISOString(),
  };
}

export function listTwinEntities(
  captures: CaptureRecord[],
  proposals: ProposalWithAssessment[]
): { id: string; name: string; type: DigitalTwinProfile['entityType'] }[] {
  const entities: { id: string; name: string; type: DigitalTwinProfile['entityType'] }[] = [
    { id: 'ea-platform', name: 'EA Platform (aggregate)', type: 'platform' },
  ];

  for (const c of captures.slice(0, 15)) {
    entities.push({ id: c.id, name: c.title.slice(0, 50), type: 'capture' });
  }

  const orgNames = new Set<string>();
  for (const p of proposals.slice(0, 10)) {
    if (p.businessName) orgNames.add(p.businessName);
  }
  for (const name of orgNames) {
    entities.push({
      id: `org-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      type: 'organization',
    });
  }

  return entities;
}
