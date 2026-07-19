/**
 * EA Opportunity Experience™ — view models for dashboard, detail, and review.
 * Composes existing CTP submission data only. Never fabricates scores.
 */
import type { CtpClientType } from '@/lib/ctp-client-type';
import { buildCtpScheduleView } from '@/lib/ctp-schedule-view';
import {
  designStudioPath,
  opportunityDashboardPath,
  opportunityDetailPath,
  opportunityReviewPath,
} from '@/lib/ctp-opportunity-routes';
import type { CtpSubmission } from '@/lib/ctp-submissions';
import {
  consultingBeginCards,
  consultingCurrentStage,
  consultingJourneySteps,
  consultingLearnedCards,
  consultingMeaningFromSubmission,
  consultingPrimaryOpportunity,
  consultingRecommendedSolution,
  consultingTimeline,
  moneyRangeLabel,
  type ConsultingBeginCard,
  type ConsultingJourneyStep,
  type ConsultingLearnedCard,
} from '@/lib/ctp-consulting-narrative';
import type { DigitalPresenceScores } from '@/lib/ctp-digital-presence';

function isPresenceTrack(clientType: CtpClientType | undefined | null): boolean {
  return clientType === 'website' || clientType === 'website_portal';
}

export type OpportunityProgressState = 'complete' | 'active' | 'pending';

export type OpportunityProgressStep = {
  id: string;
  label: string;
  state: OpportunityProgressState;
  /** 0–100 visual fill */
  fill: number;
};

export type OpportunityHealthArea = {
  id: string;
  label: string;
  score: number;
  href: string;
};

export type OpportunityCard = {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  summary: string;
  impactStars: number;
  href: string;
  noticed: string;
  whyItMatters: string;
  improvements: string[];
  businessImpact: string[];
};

export type FoundationCard = {
  id: string;
  title: string;
  status: 'Included' | 'Recommended';
  why: string;
};

export type ProjectPreviewBlock = {
  id: string;
  title: string;
  pages: string[];
};

export type InvestmentDisplay =
  | { mode: 'assessment'; low: number; high: number; label?: string }
  | { mode: 'qualification' };

export type CtpOpportunityDashboardView = {
  firstName: string;
  businessName: string;
  greeting: string;
  welcomeLede: string;
  clientType?: CtpClientType;
  showDesignStudio: boolean;
  designStudioHref: string;
  readinessScore: number | null;
  opportunityStars: number;
  potentialLabel: string;
  executiveSummary: string;
  /** Executive Snapshot - consulting clarity, not scores. */
  organizationLabel: string;
  currentStage: string;
  primaryOpportunity: string;
  estimatedAnnualOpportunity: string;
  recommendedSolution: string;
  estimatedTimeline: string;
  learnedIntro: string;
  learnedCards: ConsultingLearnedCard[];
  meaningIntro: string;
  estimatedTimeSavings: string;
  potentialBusinessImpact: string;
  beginIntro: string;
  beginCards: ConsultingBeginCard[];
  estimatedProjectEffort: string;
  estimatedProjectInvestment: string;
  beginNote: string;
  journeySteps: ConsultingJourneyStep[];
  continueIntro: string;
  communicationHref: string;
  documentsHref: string;
  messagingHref: string;
  progress: OpportunityProgressStep[];
  opportunities: OpportunityCard[];
  healthAreas: OpportunityHealthArea[];
  foundation: FoundationCard[];
  projectPreview: ProjectPreviewBlock[];
  investment: InvestmentDisplay;
  reviewHref: string;
  primaryCtaLabel: string;
  utilities: Array<{ label: string; href: string }>;
};

export type CtpOpportunityDetailView = {
  opportunity: OpportunityCard;
  businessName: string;
  backHref: string;
};

export type CtpOpportunityReviewView = {
  businessName: string;
  firstName: string;
  headline: string;
  summary: string;
  agenda: string[];
  calendlyUrl: string;
  reviewLabel?: string;
  backHref: string;
  ctaLabel: string;
};

function avg(values: number[]): number | null {
  const nums = values.filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function starsFromScore(score: number | null): number {
  if (score == null) return 3;
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

function potentialFromStars(stars: number): string {
  if (stars >= 5) return 'Exceptional Growth Potential';
  if (stars >= 4) return 'Strong Growth Potential';
  if (stars >= 3) return 'Clear Growth Potential';
  if (stars >= 2) return 'Foundational Growth Potential';
  return 'Emerging Growth Potential';
}

function timeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'opportunity';
}

function resolveReadiness(submission: CtpSubmission): number | null {
  const scoring = submission.executiveScoring?.operationalHealthScore;
  if (typeof scoring === 'number') return Math.round(scoring);
  const capacity = submission.executiveSnapshot?.capacityScore;
  if (typeof capacity === 'number') return Math.round(capacity);
  const digital = submission.digitalPresenceAudit?.overallScore;
  if (typeof digital === 'number') return Math.round(digital);
  const draft = submission.executiveEmailDraft?.capacityScore;
  if (typeof draft === 'number') return Math.round(draft);
  return null;
}

function resolveSummary(submission: CtpSubmission): string {
  const snap = submission.executiveSnapshot?.summary?.trim();
  if (snap) return snap;
  const why = submission.executiveScoring?.why?.trim();
  if (why) return why;
  const intake = submission.intakeAnalysis?.summary?.trim();
  if (intake) return intake;
  const headline = submission.executiveSnapshot?.headline?.trim();
  if (headline) return headline;
  return `Your organization has a meaningful foundation with clear room to grow. Our initial review identified opportunities to strengthen how people experience ${submission.businessName}, clarify your online presence, and simplify everyday work.`;
}

function mapHealthAreas(submission: CtpSubmission, slug: string): OpportunityHealthArea[] {
  const scores = submission.digitalPresenceAudit?.scores;
  const areas: OpportunityHealthArea[] = [];
  const push = (id: string, label: string, value: number | null) => {
    if (value == null || !Number.isFinite(value)) return;
    areas.push({
      id,
      label,
      score: Math.round(value),
      href: opportunityDetailPath(slug, id),
    });
  };

  if (scores) {
    push(
      'first-impression',
      'First Impression',
      avg([scores.website, scores.brandConsistency, scores.messaging, scores.mobileExperience]),
    );
    push(
      'customer-experience',
      'Customer Experience',
      avg([scores.navigation, scores.callsToAction, scores.leadCapture, scores.conversionOptimization]),
    );
    push(
      'trust-credibility',
      'Trust & Credibility',
      avg([scores.trustSignals, scores.accessibility]),
    );
    push(
      'online-visibility',
      'Online Visibility',
      avg([scores.seo, scores.socialPresence, scores.googleBusinessProfile]),
    );
  }

  const growth = submission.executiveScoring?.areaScores?.growthReadiness?.score;
  if (typeof growth === 'number') {
    push('growth-readiness', 'Growth Readiness', growth);
  } else if (typeof submission.executiveSnapshot?.operationalMaturity === 'number') {
    push('growth-readiness', 'Growth Readiness', submission.executiveSnapshot.operationalMaturity);
  }

  const capacity = submission.executiveScoring?.areaScores?.capacity?.score;
  if (typeof capacity === 'number' && !areas.some((a) => a.id === 'organization')) {
    push('organization', 'Organization', capacity);
  }

  return areas;
}

function impactStarsFromText(text: string, index: number): number {
  const t = text.toLowerCase();
  if (/critical|urgent|significant|major|high/.test(t)) return 5;
  if (/strong|important|clear/.test(t)) return 4;
  return Math.max(3, 5 - index) as number;
}

function buildOpportunities(submission: CtpSubmission, slug: string): OpportunityCard[] {
  const cards: OpportunityCard[] = [];
  const intake = submission.intakeAnalysis?.opportunities ?? [];
  for (const item of intake.slice(0, 3)) {
    const id = slugify(item.title);
    cards.push({
      id,
      rank: (cards.length + 1) as 1 | 2 | 3,
      title: item.title,
      summary: item.detail,
      impactStars: impactStarsFromText(item.detail, cards.length),
      href: opportunityDetailPath(slug, id),
      noticed: item.detail,
      whyItMatters:
        'Addressing this area helps people understand your value faster and take the next step with confidence.',
      improvements: [
        'Clarify the experience people encounter first',
        'Strengthen calls to action',
        'Make next steps easier to find',
      ],
      businessImpact: [
        'Increase visitor engagement',
        'Improve lead generation',
        'Strengthen trust',
      ],
    });
  }

  if (cards.length < 3) {
    const steps = submission.executiveScoring?.prioritizedNextSteps ?? [];
    for (const step of steps) {
      if (cards.length >= 3) break;
      const id = slugify(step);
      if (cards.some((c) => c.id === id)) continue;
      cards.push({
        id,
        rank: (cards.length + 1) as 1 | 2 | 3,
        title: step,
        summary: submission.executiveScoring?.biggestOpportunity ?? step,
        impactStars: impactStarsFromText(step, cards.length),
        href: opportunityDetailPath(slug, id),
        noticed: submission.executiveScoring?.biggestOpportunity ?? step,
        whyItMatters:
          submission.executiveScoring?.why ??
          'This recommendation came directly from your assessment responses.',
        improvements: submission.executiveScoring?.whatsHoldingYouBack?.slice(0, 3) ?? [
          'Focus on the highest-impact change first',
        ],
        businessImpact: [
          'Reduce friction for customers',
          'Free leadership time',
          'Create a clearer path for growth',
        ],
      });
    }
  }

  if (cards.length < 3) {
    const findings = submission.executiveSnapshot?.findings ?? [];
    for (const finding of findings) {
      if (cards.length >= 3) break;
      const id = slugify(finding.title);
      if (cards.some((c) => c.id === id)) continue;
      cards.push({
        id,
        rank: (cards.length + 1) as 1 | 2 | 3,
        title: finding.title,
        summary: finding.detail,
        impactStars: finding.severity === 'critical' ? 5 : finding.severity === 'warning' ? 4 : 3,
        href: opportunityDetailPath(slug, id),
        noticed: finding.detail,
        whyItMatters: 'This finding came from your initial opportunity analysis.',
        improvements: ['Review this area during your Opportunity Review', 'Prioritize a clear next step'],
        businessImpact: ['Reduce uncertainty', 'Improve outcomes for the people you serve'],
      });
    }
  }

  // Health-area fallbacks so detail routes always resolve for mapped categories
  return cards.slice(0, 3).map((card, i) => ({ ...card, rank: (i + 1) as 1 | 2 | 3 }));
}

function healthAreaAsOpportunity(
  area: OpportunityHealthArea,
  submission: CtpSubmission,
): OpportunityCard {
  const digital = submission.digitalPresenceAudit;
  const relatedFindings =
    digital?.findings
      ?.filter((f) => f.title || f.detail)
      .slice(0, 3)
      .map((f) => f.title) ?? [];

  return {
    id: area.id,
    rank: 1,
    title: area.label,
    summary: `Current score: ${area.score} / 100`,
    impactStars: starsFromScore(area.score),
    href: area.href,
    noticed:
      area.score < 60
        ? `There is meaningful room to strengthen ${area.label.toLowerCase()} based on your current digital presence.`
        : area.score < 75
          ? `${area.label} shows a solid foundation with clear opportunities to improve.`
          : `${area.label} is a relative strength — refining it further can still improve outcomes.`,
    whyItMatters:
      'People form opinions quickly. Strengthening this area helps your organization earn trust and convert interest into action.',
    improvements:
      relatedFindings.length > 0
        ? relatedFindings
        : [
            'Make the first experience clearer',
            'Strengthen calls to action',
            'Ensure the experience works well on every device',
          ],
    businessImpact: [
      'Increase visitor engagement',
      'Improve lead generation',
      'Strengthen trust',
    ],
  };
}

function buildFoundation(submission: CtpSubmission): FoundationCard[] {
  const presence = isPresenceTrack(submission.clientType);
  const wantsWebsite =
    presence ||
    submission.clientType === 'website' ||
    submission.clientType === 'website_portal' ||
    submission.clientTypeClassification?.websiteRequired;
  const wantsPortal =
    submission.clientType === 'website_portal' ||
    submission.clientType === 'portal_only' ||
    submission.clientType === 'business_transformation' ||
    submission.clientTypeClassification?.portalRequired;

  const cards: FoundationCard[] = [];

  if (wantsWebsite || presence) {
    cards.push({
      id: 'website',
      title: 'Professional Website',
      status: 'Included',
      why: 'Creates a polished first impression and clearly communicates your value.',
    });
  }

  if (wantsPortal || !presence) {
    cards.push({
      id: 'portal',
      title: 'Private Management Portal',
      status: 'Included',
      why: 'Gives you one place to manage content, updates, and future growth.',
    });
  }

  cards.push({
    id: 'brand',
    title: 'Brand Discovery',
    status: 'Included',
    why: 'Ensures your presence reflects who you are.',
  });

  if (wantsWebsite || presence) {
    cards.push(
      {
        id: 'mobile',
        title: 'Mobile Experience',
        status: 'Included',
        why: 'Looks great on every device.',
      },
      {
        id: 'search',
        title: 'Search Foundation',
        status: 'Included',
        why: 'Helps people discover your organization online.',
      },
      {
        id: 'lead',
        title: 'Contact & Lead Capture',
        status: 'Included',
        why: 'Makes it easy for visitors to become customers.',
      },
    );
  }

  cards.push(
    {
      id: 'scheduling',
      title: 'Appointment Scheduling',
      status: 'Recommended',
      why: 'Makes it easy for people to book time without back-and-forth.',
    },
    {
      id: 'payments',
      title: 'Online Payments',
      status: 'Recommended',
      why: 'Reduces friction when someone is ready to move forward.',
    },
    {
      id: 'resources',
      title: 'Client Resource Center',
      status: 'Recommended',
      why: 'Gives clients a clear place for guides, updates, and next steps.',
    },
    {
      id: 'growth',
      title: 'Built For Growth',
      status: wantsWebsite || wantsPortal ? 'Included' : 'Recommended',
      why: 'Allows your platform to evolve without starting over.',
    },
  );

  return cards;
}

function buildProjectPreview(submission: CtpSubmission): ProjectPreviewBlock[] {
  const presence = isPresenceTrack(submission.clientType);
  const blocks: ProjectPreviewBlock[] = [];

  if (
    presence ||
    submission.clientType === 'website' ||
    submission.clientType === 'website_portal' ||
    submission.clientTypeClassification?.websiteRequired
  ) {
    blocks.push({
      id: 'website',
      title: 'Website',
      pages: ['Landing Page', 'About', 'Services', 'Resources', 'Contact'],
    });
  }

  if (
    !presence ||
    submission.clientType === 'portal_only' ||
    submission.clientType === 'website_portal' ||
    submission.clientType === 'business_transformation' ||
    submission.clientTypeClassification?.portalRequired
  ) {
    blocks.push({
      id: 'portal',
      title: 'Management Portal',
      pages: ['Dashboard', 'Updates', 'Resources', 'Support'],
    });
  }

  if (!blocks.length) {
    blocks.push({
      id: 'website',
      title: 'Digital Presence',
      pages: ['Landing Page', 'About', 'Contact'],
    });
  }

  return blocks;
}

function buildProgress(submission: CtpSubmission): OpportunityProgressStep[] {
  const hasSnapshot = Boolean(submission.executiveSnapshot || submission.executiveScoring);
  const hasRecs = Boolean(
    submission.intakeAnalysis?.opportunities?.length ||
      submission.recommendations ||
      submission.executiveScoring?.prioritizedNextSteps?.length,
  );
  const studioDone =
    submission.studioStatus === 'Ready For Review' || submission.studioStatus === 'Completed';
  const reviewDone = Boolean(submission.reviewScheduledAt) || submission.status === 'Review Scheduled';
  const buildDone = submission.status === 'Completed' || Boolean(submission.siteUrl);
  const launched = submission.status === 'Completed';

  const steps: Array<{ id: string; label: string; done: boolean; active: boolean }> = [
    { id: 'assessment', label: 'Assessment', done: true, active: false },
    { id: 'analysis', label: 'Analysis', done: true, active: false },
    { id: 'recommendations', label: 'Recommendations', done: hasRecs, active: hasSnapshot && !hasRecs },
    {
      id: 'planning',
      label: 'Project Planning',
      done: studioDone || submission.workspaceStatus === 'Active',
      active: hasRecs && !studioDone && !reviewDone,
    },
    {
      id: 'review',
      label: 'Opportunity Review',
      done: reviewDone,
      active: !reviewDone && (hasRecs || submission.workspaceStatus === 'Active'),
    },
    { id: 'build', label: 'Build', done: buildDone, active: reviewDone && !buildDone },
    { id: 'launch', label: 'Launch', done: launched, active: buildDone && !launched },
  ];

  return steps.map((step) => ({
    id: step.id,
    label: step.label,
    state: step.done ? 'complete' : step.active ? 'active' : 'pending',
    fill: step.done ? 100 : step.active ? 55 : 0,
  }));
}

function resolveInvestment(submission: CtpSubmission): InvestmentDisplay {
  const low =
    submission.executiveEmailDraft?.investmentLow ??
    submission.executiveSnapshot?.scope.investmentLow;
  const high =
    submission.executiveEmailDraft?.investmentHigh ??
    submission.executiveSnapshot?.scope.investmentHigh ??
    submission.executiveEmailDraft?.recommendedFee;
  if (typeof low === 'number' && typeof high === 'number' && low > 0 && high > 0) {
    return {
      mode: 'assessment',
      low,
      high,
      label: submission.executiveEmailDraft?.projectTypeLabel ?? submission.executiveSnapshot?.scope.projectTypeLabel,
    };
  }
  return { mode: 'qualification' };
}

export function buildCtpOpportunityDashboardView(
  submission: CtpSubmission,
  slug: string,
  options?: { firstName?: string },
): CtpOpportunityDashboardView {
  const firstName =
    options?.firstName?.trim() ||
    submission.contactName.split(' ')[0] ||
    submission.contactName;
  const readinessScore = resolveReadiness(submission);
  const opportunityStars = starsFromScore(readinessScore);
  const showDesignStudio =
    isPresenceTrack(submission.clientType) ||
    Boolean(submission.clientTypeClassification?.websiteRequired);

  const meaning = consultingMeaningFromSubmission(submission);
  const stage = consultingCurrentStage(submission);
  const recommended = consultingRecommendedSolution(submission);

  return {
    firstName,
    businessName: submission.businessName,
    greeting: `Welcome, ${firstName}`,
    welcomeLede: `We've started learning about ${submission.businessName} and have already identified several opportunities that could strengthen your organization. This workspace is where we'll continue building your project together.`,
    clientType: submission.clientType,
    showDesignStudio,
    designStudioHref: designStudioPath(slug),
    readinessScore,
    opportunityStars,
    potentialLabel: potentialFromStars(opportunityStars),
    executiveSummary: resolveSummary(submission),
    organizationLabel: submission.businessName,
    currentStage: stage,
    primaryOpportunity: consultingPrimaryOpportunity(submission),
    estimatedAnnualOpportunity: meaning.annualOpportunityLabel,
    recommendedSolution: recommended,
    estimatedTimeline: consultingTimeline(submission),
    learnedIntro: 'As we reviewed what you shared, a few opportunities began to stand out.',
    learnedCards: consultingLearnedCards(),
    meaningIntro:
      'Small improvements in how your organization communicates, serves customers, and manages daily operations often create meaningful long-term results.',
    estimatedTimeSavings: meaning.timeSavingsLabel,
    potentialBusinessImpact: meaning.businessImpactLabel,
    beginIntro: 'Based on what we\'ve learned so far, these are the areas we\'d recommend focusing on first.',
    beginCards: consultingBeginCards(),
    estimatedProjectEffort: '28-50 Hours',
    estimatedProjectInvestment: moneyRangeLabel(meaning.investLow, meaning.investHigh),
    beginNote:
      'Every organization is different. Some projects require a streamlined website and portal, while others include additional functionality. The estimate reflects the size and complexity of your organization. A final proposal will follow after discovery.',
    journeySteps: consultingJourneySteps(submission),
    continueIntro:
      "We've only scratched the surface. Share a little more so every recommendation becomes more tailored to your goals.",
    communicationHref: `/portal/${slug}/ctp/support`,
    documentsHref: `/portal/${slug}/ctp/documents`,
    messagingHref: `/portal/${slug}/updates/new`,
    progress: buildProgress(submission),
    opportunities: buildOpportunities(submission, slug),
    healthAreas: mapHealthAreas(submission, slug),
    foundation: buildFoundation(submission),
    projectPreview: buildProjectPreview(submission),
    investment: resolveInvestment(submission),
    reviewHref: opportunityReviewPath(slug),
    primaryCtaLabel: 'Continue the Conversation',
    utilities: [
      { label: 'Documents', href: `/portal/${slug}/ctp/documents` },
      { label: 'Messages', href: `/portal/${slug}/ctp/support` },
      { label: 'Project Progress', href: `/portal/${slug}/ctp/progress` },
      { label: 'Schedule a Conversation', href: opportunityReviewPath(slug) },
    ],
  };
}

export function buildCtpOpportunityDetailView(
  submission: CtpSubmission,
  slug: string,
  opportunityId: string,
): CtpOpportunityDetailView | null {
  const dashboard = buildCtpOpportunityDashboardView(submission, slug);
  const fromCards = dashboard.opportunities.find((o) => o.id === opportunityId);
  if (fromCards) {
    return {
      opportunity: fromCards,
      businessName: submission.businessName,
      backHref: opportunityDashboardPath(slug),
    };
  }

  const health = dashboard.healthAreas.find((a) => a.id === opportunityId);
  if (health) {
    return {
      opportunity: healthAreaAsOpportunity(health, submission),
      businessName: submission.businessName,
      backHref: opportunityDashboardPath(slug),
    };
  }

  return null;
}

export function buildCtpOpportunityReviewView(
  submission: CtpSubmission,
  slug: string,
  options?: { firstName?: string },
): CtpOpportunityReviewView {
  const firstName =
    options?.firstName?.trim() ||
    submission.contactName.split(' ')[0] ||
    submission.contactName;
  const schedule = buildCtpScheduleView(submission);

  return {
    businessName: submission.businessName,
    firstName,
    headline: schedule.headline,
    summary: schedule.summary,
    agenda: [
      'Review your assessment',
      'Discuss our findings',
      'Walk through recommended solutions',
      'Review project investment',
      'Answer questions',
      'Develop next steps',
    ],
    calendlyUrl: schedule.calendlyUrl,
    reviewLabel: schedule.reviewLabel,
    backHref: opportunityDashboardPath(slug),
    ctaLabel: 'Schedule My Opportunity Review',
  };
}

/** Shared helpers for email snapshot rows — only returns areas with real scores. */
export function opportunityEmailHealthRows(
  submission: CtpSubmission,
): Array<{ label: string; score: number }> {
  return mapHealthAreas(submission, 'email').map((a) => ({ label: a.label, score: a.score }));
}

export function opportunityEmailReadiness(submission: CtpSubmission): number | null {
  return resolveReadiness(submission);
}

export function opportunityEmailSummary(submission: CtpSubmission): string {
  return resolveSummary(submission);
}

export function opportunityEmailStars(score: number | null): number {
  return starsFromScore(score);
}

/** Exported for tests / email foundation table. */
export function opportunityFoundationRows(
  submission: Pick<CtpSubmission, 'clientType' | 'clientTypeClassification'>,
): Array<{ included: string; why: string }> {
  return buildFoundation(submission as CtpSubmission).map((c) => ({
    included: c.title,
    why: c.why,
  }));
}

export type { DigitalPresenceScores };
