import type { WebsiteAuditResult, AuditFinding } from './website-audit';

export interface SimplifiPriority {
  rank: 1 | 2 | 3;
  title: string;
  rationale: string;
  impact: string;
  ease: 'High' | 'Medium' | 'Low';
}

export interface SimplifiGuidanceResult {
  openingInsight: string;
  whatWeFound: {
    topIssues: string[];
    patterns: string[];
    missedOpportunities: string[];
    strengths: string[];
  };
  whyItMatters: string[];
  topPriorities: SimplifiPriority[];
  firstStep: { action: string; cta: string };
  roadmap: { phase: string; focus: string }[];
  clarityScore: number;
  auditSource: string;
}

const FINDING_TO_PRIORITY: Record<string, Partial<SimplifiPriority>> = {
  'meta-description': {
    title: 'Rewrite your search & social preview',
    rationale: 'A clear meta description improves discovery and click-through.',
    impact: 'Search visibility and first impressions',
    ease: 'High',
  },
  'missing-h1': {
    title: 'Clarify your primary headline',
    rationale: 'One strong H1 tells visitors exactly what you offer in 5 seconds.',
    impact: 'Conversion and bounce rate',
    ease: 'High',
  },
  'no-cta': {
    title: 'Add one obvious next step',
    rationale: 'Every page needs a single call-to-action — book, contact, or start.',
    impact: 'Lead capture',
    ease: 'High',
  },
  'no-contact': {
    title: 'Open a direct contact pathway',
    rationale: 'Forms, email, or phone reduce friction for ready buyers.',
    impact: 'Lost leads',
    ease: 'Medium',
  },
  'no-viewport': {
    title: 'Fix mobile viewport configuration',
    rationale: 'Mobile-first hubs and member experiences require proper viewport meta.',
    impact: 'Mobile engagement',
    ease: 'High',
  },
  'thin-content': {
    title: 'Strengthen trust-building content',
    rationale: 'Thin pages under-explain value — add proof, outcomes, and clarity.',
    impact: 'Trust and conversion',
    ease: 'Medium',
  },
};

export function generateSimplifiGuidance(audit: WebsiteAuditResult): SimplifiGuidanceResult {
  const critical = audit.findings.filter((f) => f.severity === 'critical');
  const warnings = audit.findings.filter((f) => f.severity === 'warning');

  const openingInsight = buildOpeningInsight(audit, critical);

  const whyItMatters = [
    audit.missedOpportunities[0]
      ? `Missed opportunity: ${audit.missedOpportunities[0]}.`
      : 'Visibility gaps often hide revenue and engagement losses.',
    critical.length > 0
      ? `${critical.length} critical clarity issue${critical.length > 1 ? 's' : ''} may be costing leads today.`
      : 'Minor improvements can still unlock conversion gains.',
    'What leadership cannot see on the website, the business cannot improve.',
  ];

  const topPriorities = buildTopPriorities(audit.findings);
  const firstStep = {
    action: topPriorities[0]
      ? `Start with: ${topPriorities[0].title.toLowerCase()}.`
      : 'Run a full Operational MRI to map priorities beyond the website.',
    cta: topPriorities[0]?.title ?? 'Start Operational MRI',
  };

  const roadmap = [
    {
      phase: '30 Days',
      focus: topPriorities[0]?.title ?? 'Website clarity quick wins',
    },
    {
      phase: '60 Days',
      focus: topPriorities[1]?.title ?? 'Conversion path and follow-up automation',
    },
    {
      phase: '90 Days',
      focus: topPriorities[2]?.title ?? 'Mission Control visibility and adoption tracking',
    },
  ];

  return {
    openingInsight,
    whatWeFound: {
      topIssues: [...critical, ...warnings].slice(0, 5).map((f) => f.title),
      patterns: audit.patterns,
      missedOpportunities: audit.missedOpportunities,
      strengths: audit.strengths,
    },
    whyItMatters,
    topPriorities,
    firstStep,
    roadmap,
    clarityScore: audit.clarityScore,
    auditSource: audit.source,
  };
}

function buildOpeningInsight(audit: WebsiteAuditResult, critical: AuditFinding[]): string {
  if (audit.patterns.some((p) => p.includes('explain itself'))) {
    return `${audit.title} is working harder to explain itself than it is to attract customers.`;
  }
  if (critical.some((f) => f.id === 'no-cta')) {
    return `${audit.title} communicates what you do — but visitors may not know what to do next.`;
  }
  if (critical.length >= 2) {
    return `${audit.title} has multiple clarity gaps that may be hiding leads right now.`;
  }
  if (audit.clarityScore >= 75) {
    return `${audit.title} has a solid foundation — a few targeted improvements could unlock more conversion.`;
  }
  return `${audit.title} has untapped visibility — small clarity changes can recover meaningful engagement.`;
}

function buildTopPriorities(findings: AuditFinding[]): SimplifiPriority[] {
  const ordered = [...findings].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  const priorities: SimplifiPriority[] = [];

  for (const finding of ordered) {
    const template = FINDING_TO_PRIORITY[finding.id];
    if (!template?.title) continue;
    priorities.push({
      rank: (priorities.length + 1) as 1 | 2 | 3,
      title: template.title,
      rationale: template.rationale ?? finding.detail,
      impact: template.impact ?? 'Operational clarity',
      ease: template.ease ?? 'Medium',
    });
    if (priorities.length >= 3) break;
  }

  while (priorities.length < 3) {
    const fallbacks: SimplifiPriority[] = [
      {
        rank: (priorities.length + 1) as 1 | 2 | 3,
        title: 'Run Operational MRI assessment',
        rationale: 'Map friction beyond the website — systems, workflows, and visibility.',
        impact: 'Full operational clarity',
        ease: 'High',
      },
      {
        rank: (priorities.length + 1) as 1 | 2 | 3,
        title: 'Connect website to Mission Control',
        rationale: 'Track leads, follow-up, and adoption in one place.',
        impact: 'Visibility for leadership',
        ease: 'Medium',
      },
      {
        rank: (priorities.length + 1) as 1 | 2 | 3,
        title: 'Launch Update Hub communications',
        rationale: 'Consistent touchpoints turn visitors into engaged members.',
        impact: 'Engagement and retention',
        ease: 'Medium',
      },
    ];
    priorities.push(fallbacks[priorities.length]);
  }

  return priorities.slice(0, 3) as SimplifiPriority[];
}

function severityRank(s: AuditFinding['severity']): number {
  if (s === 'critical') return 0;
  if (s === 'warning') return 1;
  if (s === 'info') return 2;
  return 3;
}

export function formatSimplifiGuidanceSummary(
  audit: WebsiteAuditResult,
  guidance: SimplifiGuidanceResult
): string {
  return [
    `Simplifi Website Clarity Audit · ${audit.url}`,
    `Clarity Score: ${guidance.clarityScore}/100 · Source: ${guidance.auditSource}`,
    '',
    `Opening Insight: ${guidance.openingInsight}`,
    '',
    'Top Issues:',
    ...guidance.whatWeFound.topIssues.map((t) => `- ${t}`),
    '',
    'Top 3 Priorities:',
    ...guidance.topPriorities.map((p) => `#${p.rank} ${p.title} — ${p.rationale}`),
    '',
    `First Step: ${guidance.firstStep.action}`,
  ].join('\n');
}
