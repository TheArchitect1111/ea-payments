export interface ProofStory {
  id: string;
  title: string;
  industry: string;
  pattern: string;
  problem: string;
  outcome: string;
  metric: string;
  products: string[];
  tags: string[];
}

export const PROOF_LIBRARY: ProofStory[] = [
  {
    id: 'cpr-athlete',
    title: 'Canadian Prospects Recruitment',
    industry: 'Athletics',
    pattern: 'Athlete Development™',
    problem: 'Athletes lacked exposure and structured development pathways.',
    outcome: 'Camps, showcases, and recruiting visibility in one hub.',
    metric: 'Full athlete pipeline · CPR platform live',
    products: ['Amplifi', 'CPR', 'Magnifi'],
    tags: ['athlete', 'recruiting', 'sports'],
  },
  {
    id: 'bas-community',
    title: 'Brotherhood Association System',
    industry: 'Community',
    pattern: 'Community Blueprint™',
    problem: 'Chapter engagement fragmented across email and spreadsheets.',
    outcome: 'Legacy → connection → measurable chapter impact.',
    metric: 'BrotherHub chapter coordination',
    products: ['Community Hub', 'Update Hub', 'Magnifi'],
    tags: ['fraternity', 'nonprofit', 'membership'],
  },
  {
    id: 'consulting-leads',
    title: 'Consulting Firm Lead Follow-Up',
    industry: 'Professional Services',
    pattern: 'Executive Transformation™',
    problem: '37 unanswered leads sitting in email.',
    outcome: 'Automated lead response + follow-up sequence.',
    metric: '$40,000/yr protected · 6 hrs/week recovered',
    products: ['Simplifi', 'Mission Control'],
    tags: ['leads', 'automation', 'consulting'],
  },
  {
    id: 'real-estate-admin',
    title: 'Real Estate Team Scheduling',
    industry: 'Real Estate',
    pattern: 'Entrepreneur Launch™',
    problem: 'Manual scheduling, confirmations, document collection.',
    outcome: 'Automated scheduling + document workflows.',
    metric: '12 hrs/week recovered',
    products: ['Simplifi', 'Mission Control'],
    tags: ['scheduling', 'workflow', 'services'],
  },
  {
    id: 'coaching-onboard',
    title: 'Coaching Business Onboarding',
    industry: 'Coaching',
    pattern: 'Entrepreneur Launch™',
    problem: 'No consistent onboarding — every client was manual.',
    outcome: 'Standardized onboarding with automated touchpoints.',
    metric: '8 hrs/week recovered · satisfaction up',
    products: ['Training Transformation', 'Update Hub'],
    tags: ['onboarding', 'coaching', 'training'],
  },
  {
    id: 'jcsu-alumni',
    title: 'University Alumni Ecosystem',
    industry: 'Education',
    pattern: 'University Ecosystem™',
    problem: 'Graduates disconnected from mentors, donors, and legacy programs.',
    outcome: 'Students → alumni → mentors → donors journey mapped.',
    metric: 'Advancement pipeline clarity',
    products: ['Magnifi', 'Community Hub'],
    tags: ['university', 'alumni', 'advancement'],
  },
];

export function matchProofStories(proposal: {
  recommendedProjectType?: string;
  projectTypeLabel?: string;
  primaryConstraint?: string;
  operationalChallenges?: string[];
  businessName?: string;
}): ProofStory[] {
  const blob = [
    proposal.recommendedProjectType,
    proposal.projectTypeLabel,
    proposal.primaryConstraint,
    proposal.businessName,
    ...(proposal.operationalChallenges ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const scored = PROOF_LIBRARY.map((story) => {
    let score = 0;
    for (const tag of story.tags) {
      if (blob.includes(tag)) score += 3;
    }
    if (blob.includes('lead') && story.id === 'consulting-leads') score += 5;
    if (blob.includes('schedul') && story.id === 'real-estate-admin') score += 5;
    if (blob.includes('onboard') && story.id === 'coaching-onboard') score += 5;
    if (/workflow|system|operational/.test(blob) && story.products.includes('Simplifi'))
      score += 2;
    return { story, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.story);
}

export function defaultProofStories(): ProofStory[] {
  return PROOF_LIBRARY.slice(0, 3);
}
