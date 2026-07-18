/**
 * Consultant-style Concept Pack eval — observation → why it matters → recommendation → evidence.
 */
import {
  formatUsdRange,
  type FactoryCapacityScorecard,
} from '@/lib/factory-capacity-score';

export type ConceptFinding = {
  title: string;
  observation: string;
  whyItMatters: string;
  recommendation: string;
  evidence: string;
};

export type ConceptOpportunity = {
  title: string;
  plainEnglish: string;
  whatChanges: string;
  impact: string;
  evidence: string;
};

export type ConceptConsultantEval = {
  headline: string;
  guideIntro: string;
  findings: ConceptFinding[];
  opportunities: ConceptOpportunity[];
  /** Flat bullets kept for older render paths */
  bullets: string[];
  opportunityLines: string[];
};

const DIMENSION_GUIDE: Record<
  string,
  { title: string; observation: string; why: string; recommend: string }
> = {
  visibility: {
    title: 'Clarity of the offer',
    observation:
      'A first-time visitor should understand who you serve and what to do next within a few seconds.',
    why: 'When the offer is unclear, people bounce — and you never get a chance to earn trust or a registration.',
    recommend:
      'Lead with one plain-language promise and one primary action on the public site.',
  },
  exposure: {
    title: 'Discoverability',
    observation:
      'Interest has to find you — search, referrals, and shareable pages all matter.',
    why: 'Low discoverability means you pay more (time or ads) for every new relationship.',
    recommend:
      'Tighten the public story so partners and members can share one clear entry point.',
  },
  conversion: {
    title: 'Next-step friction',
    observation:
      'Even interested people stall when the next step is buried or confusing.',
    why: 'Friction turns warm interest into “I’ll do it later” — which usually means never.',
    recommend:
      'Put one obvious CTA near the top, and repeat it where people decide.',
  },
  differentiation: {
    title: 'What makes you different',
    observation:
      'If you sound like every alternative, people default to price or familiarity.',
    why: 'Differentiation is what justifies joining your system instead of a generic option.',
    recommend:
      'Name your unique journey (programs, community, outcomes) in the first viewport.',
  },
  modernity: {
    title: 'Modern digital experience',
    observation:
      'People judge credibility by how current and calm the experience feels on a phone.',
    why: 'An outdated feel quietly trains people to expect outdated operations behind it.',
    recommend:
      'Present a clean, Apple-simple public face that matches the quality of the work you deliver.',
  },
  trust: {
    title: 'Trust near the ask',
    observation:
      'Proof, people, and clarity need to sit next to the registration or contact ask.',
    why: 'Without trust signals at the decision moment, capacity leaks even when interest is real.',
    recommend:
      'Place proof (outcomes, community, leadership) beside the primary CTA.',
  },
};

function dimKeyFromLabel(label: string): string | undefined {
  const lower = label.toLowerCase();
  if (lower.includes('visibility') || lower.includes('clarity')) return 'visibility';
  if (lower.includes('discover')) return 'exposure';
  if (lower.includes('conversion') || lower.includes('friction')) return 'conversion';
  if (lower.includes('different')) return 'differentiation';
  if (lower.includes('modern')) return 'modernity';
  if (lower.includes('trust') || lower.includes('proof')) return 'trust';
  return undefined;
}

export function buildConsultantEval(input: {
  clientName: string;
  scorecard: FactoryCapacityScorecard;
  signalNote: string;
  summary: string;
  rawOpportunityHints: string[];
}): ConceptConsultantEval {
  const { clientName, scorecard, signalNote, summary, rawOpportunityHints } = input;
  const lost = formatUsdRange(scorecard.capacityLost.annualLow, scorecard.capacityLost.annualHigh);
  const gained = formatUsdRange(
    scorecard.opportunityGained.annualLow,
    scorecard.opportunityGained.annualHigh,
  );

  const guideIntro = `Here’s how I’d walk ${clientName} through this in a sit-down: what we see, why it costs capacity, what to change first, and the evidence behind each recommendation. ${signalNote}`;

  const findings: ConceptFinding[] = [
    {
      title: 'Overall capacity score',
      observation: `${clientName} scores ${scorecard.overallScore}/100 against a healthy benchmark near ${scorecard.benchmark}/100.`,
      whyItMatters:
        'This is a snapshot of how much of your growth system is working in public — not a grade on your mission.',
      recommendation:
        'Use the three product surfaces below (website, ops portal, member home) to close the biggest gaps first.',
      evidence: `Score ${scorecard.overallScore}/100 · benchmark ~${scorecard.benchmark}/100 · ${summary.slice(0, 140)}`,
    },
    {
      title: 'Capacity left on the table',
      observation: `We estimate ${lost} per year in capacity currently leaking through unclear journeys, friction, and follow-up gaps.`,
      whyItMatters:
        'That number is not accounting — it is a working range so leadership can feel the cost of “good enough” digital.',
      recommendation:
        'Treat this as the case for a guided system: public clarity + ops control + member belonging.',
      evidence: `${scorecard.capacityLost.headline}. ${scorecard.opportunityGained.assumption}`,
    },
    {
      title: 'Opportunity if the system is in place',
      observation: `With a clearer website, ops portal, and member home, we estimate ${gained} per year in recoverable opportunity.`,
      whyItMatters:
        'This is the upside story for the room — not hype. It assumes you reclaim a meaningful share of what is already leaking.',
      recommendation:
        'Approve a Skin Brief so we brand and build the system to your offer, not a generic template.',
      evidence: scorecard.opportunityGained.headline,
    },
  ];

  for (const line of scorecard.capacityLost.breakdown.slice(0, 3)) {
    const key = dimKeyFromLabel(line.label);
    const guide = key ? DIMENSION_GUIDE[key] : undefined;
    findings.push({
      title: guide?.title || line.label,
      observation: guide?.observation || `We see pressure in ${line.label.toLowerCase()}.`,
      whyItMatters: guide?.why || line.why,
      recommendation: guide?.recommend || 'Address this gap in the public site and the member journey.',
      evidence: `${formatUsdRange(line.annualLow, line.annualHigh)}/yr tied to this gap · ${line.why}`,
    });
  }

  const defaultOpps: ConceptOpportunity[] = [
    {
      title: 'One clear public front door',
      plainEnglish:
        'Right now, people should not have to work to understand who you are for and what to do next.',
      whatChanges:
        'A calm Apple-simple landing page with one promise and one primary action.',
      impact: `Supports reclaiming part of the ${lost}/yr capacity range.`,
      evidence: `Conversion score ${scorecard.scores.conversion}/100 · Visibility ${scorecard.scores.visibility}/100`,
    },
    {
      title: 'One place to run the operation',
      plainEnglish:
        'Staff should not chase registrations, payments, and messages across scattered tools.',
      whatChanges:
        'An ops portal where today’s work, people, events, and money sit in one view.',
      impact: 'Reduces missed follow-up and speeds response when interest shows up.',
      evidence: `Modernity ${scorecard.scores.modernity}/100 · Trust ${scorecard.scores.trust}/100`,
    },
    {
      title: 'A member home that creates belonging',
      plainEnglish:
        'After someone says yes, they need a place that feels like “this is mine” — progress, schedule, resources, people.',
      whatChanges:
        'A member home with journey, schedule, highlights, and messages — not a dead login.',
      impact: `Supports the ${gained}/yr opportunity range by keeping people engaged after join.`,
      evidence: `Exposure ${scorecard.scores.exposure}/100 · Differentiation ${scorecard.scores.differentiation}/100`,
    },
  ];

  const hintOpps: ConceptOpportunity[] = rawOpportunityHints
    .filter((h) => h.trim().length > 12)
    .slice(0, 2)
    .map((hint) => ({
      title: hint.length > 60 ? `${hint.slice(0, 57)}…` : hint,
      plainEnglish: hint,
      whatChanges: 'Fold this into the website story and the member journey so it is visible, not buried.',
      impact: `Supports closing part of the ${lost}/yr gap.`,
      evidence: 'Drawn from your launch signal and capacity gaps.',
    }));

  const opportunities = [...hintOpps, ...defaultOpps].slice(0, 4);

  return {
    headline: 'Consultant briefing — evidence behind the recommendation',
    guideIntro,
    findings,
    opportunities,
    bullets: findings.map(
      (f) => `${f.title}: ${f.observation} → ${f.recommendation} (${f.evidence})`,
    ),
    opportunityLines: opportunities.map(
      (o) => `${o.title}: ${o.plainEnglish} Impact: ${o.impact}`,
    ),
  };
}
