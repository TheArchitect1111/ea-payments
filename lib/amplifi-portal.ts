import type { PortalClientRecord } from './airtable';
import type { CaptureRecord } from './capture-records';
import type { ClientSuccessProfile } from './client-success';
import { rebuildCaptureContext } from './capture-experience';
import {
  getMagnifiTemplate,
  type MagnifiTemplateId,
  resolveMagnifiTemplateId,
} from './ea-template-registry';

export type AmplifiPortalMode = 'visibility' | 'athlete' | 'media';

export interface AmplifiJourneyStep {
  title: string;
  copy: string;
}

export interface AmplifiPortalExperience {
  mode: AmplifiPortalMode;
  modeLabel: string;
  firstName: string;
  organization: string;
  headline: string;
  headlineAccent: string;
  lede: string;
  journey: AmplifiJourneyStep[];
  stats: { label: string; value: string; detail: string }[];
  insightCopy: string;
  futureTitle: string;
  futureBullets: string[];
  ctaLine: string;
  /** Hub never auto-posts — drafts are for review and manual share. */
  shareDisclaimer: string;
  captureCount: number;
  theme: {
    revealFrom: string;
    revealVia: string;
    revealTo: string;
    accent: string;
    ctaFrom: string;
    ctaTo: string;
  };
  magnifiUrl?: string;
  guidanceUrl?: string;
  /** /amplifi draft tool prefilled with latest Magnifi when available. */
  draftShareUrl?: string;
  latestCaptureTitle?: string;
  latestCaptureId?: string;
}

const VISIBILITY_JOURNEY: AmplifiJourneyStep[] = [
  { title: 'Message', copy: 'One clear story — what you do and why it matters.' },
  { title: 'Reach', copy: 'Updates and wins visible to the people who need to see them.' },
  { title: 'Momentum', copy: 'Progress tracked in Pulse so stakeholders feel movement.' },
  { title: 'Opportunity', copy: 'Simplifi captures every lead; Magnifi builds buy-in.' },
  { title: 'Impact', copy: 'Less chasing updates. More forward motion.' },
];

const ATHLETE_JOURNEY: AmplifiJourneyStep[] = [
  { title: 'Potential', copy: 'The talent is there. The opportunity is finding the right stage.' },
  { title: 'Development', copy: 'Habits, film, and preparation coaches evaluate every season.' },
  { title: 'Exposure', copy: 'Profiles and showcases that put you in front of decision-makers.' },
  { title: 'Opportunity', copy: 'Conversations with programs that fit your goals and your game.' },
  { title: 'Success', copy: 'The right fit — and a future you can see clearly.' },
];

const MEDIA_JOURNEY: AmplifiJourneyStep[] = [
  { title: 'Audience', copy: 'You have attention. The system should compound it.' },
  { title: 'Content', copy: 'Rhythm and quality without burnout.' },
  { title: 'Community', copy: 'Engagement that feels personal at scale.' },
  { title: 'Platform', copy: 'One hub for sponsors, fans, and next moves.' },
  { title: 'Network', copy: 'Your voice becomes an asset — not a grind.' },
];

function onboardingPct(status?: string): number {
  switch (status) {
    case 'Complete':
      return 100;
    case 'Docs Signed':
      return 85;
    case 'Docs Sent':
      return 70;
    case 'In Progress':
      return 55;
    default:
      return 25;
  }
}

function resolveMode(templateId: MagnifiTemplateId, org: string): AmplifiPortalMode {
  if (templateId === 'athlete-development') return 'athlete';
  if (templateId === 'media-empire') return 'media';
  if (/athlete|recruit|sport|cpr|basketball/i.test(org)) return 'athlete';
  if (/podcast|media|creator|content/i.test(org)) return 'media';
  return 'visibility';
}

function themeForMode(mode: AmplifiPortalMode) {
  if (mode === 'athlete') {
    return {
      revealFrom: '#0f1829',
      revealVia: '#1B2B4D',
      revealTo: '#2d4a6e',
      accent: '#C9A844',
      ctaFrom: '#1B2B4D',
      ctaTo: '#243a66',
    };
  }
  if (mode === 'media') {
    return {
      revealFrom: '#0f1419',
      revealVia: '#1a2433',
      revealTo: '#2a3a52',
      accent: '#4A90D9',
      ctaFrom: '#1a2433',
      ctaTo: '#2a3a52',
    };
  }
  return {
    revealFrom: '#0f1829',
    revealVia: '#1B2B4D',
    revealTo: '#243a66',
    accent: '#C9A844',
    ctaFrom: '#1B2B4D',
    ctaTo: '#2a3f5f',
  };
}

export function buildAmplifiPortalExperience(
  client: PortalClientRecord,
  captures: CaptureRecord[],
  profile: ClientSuccessProfile,
): AmplifiPortalExperience {
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;
  const organization = client.organization || client.clientName;
  const latestCapture = captures[0];
  const blob = `${organization} ${client.packagePurchased} ${captures.map((c) => c.title).join(' ')}`;
  const templateId = latestCapture
    ? rebuildCaptureContext(latestCapture).templateId
    : resolveMagnifiTemplateId(blob, client.packagePurchased);
  const mode = resolveMode(templateId, blob);
  const magnifiDef = getMagnifiTemplate(templateId);
  const pct = onboardingPct(client.onboardingStatus);
  const captureCount = captures.length;

  const magnifiUrl = latestCapture ? `/magnifi/${latestCapture.id}` : undefined;
  const guidanceUrl = latestCapture ? `/simplifi/guidance/${latestCapture.id}` : undefined;
  const draftShareUrl = latestCapture
    ? `/amplifi?capture=${encodeURIComponent(latestCapture.id)}`
    : '/amplifi';
  const shareDisclaimer =
    'Amplifi helps you draft and share Magnifi stories. Nothing auto-posts — you review every draft before you (or your team) publish. Anyone with the link can view this story.';

  const emptyLede =
    'Capture once in Simplifi to create a Magnifi story you can open, draft from, and share. Amplifi does not auto-post or run a content calendar.';

  if (mode === 'athlete') {
    return {
      mode,
      modeLabel: 'Amplifi™ · Athlete Development',
      firstName,
      organization,
      headline: captureCount === 0 ? `${firstName}, start with one story` : `${firstName}, your future`,
      headlineAccent: captureCount === 0 ? ' worth sharing.' : ' is bigger than you think.',
      lede: captureCount === 0 ? emptyLede : 'This is not a report. This is your development story — told the way it deserves to be told.',
      journey: ATHLETE_JOURNEY,
      stats: [
        { label: 'Profile', value: organization, detail: client.packagePurchased },
        { label: 'Onboarding', value: `${pct}%`, detail: client.onboardingStatus ?? 'In progress' },
        { label: 'Stories', value: String(captureCount), detail: captureCount ? 'Ready to open & share' : 'Capture once to begin' },
      ],
      insightCopy:
        'Decision-makers are not looking for perfect. They are looking for prepared, visible, and ready. Amplifi makes that story easy to open and share — you stay in control of every post.',
      futureTitle: 'Twelve months from now',
      futureBullets: [
        'Your story is active with programs and partners that match your goals.',
        'Progress is visible in Pulse — no guessing, no silence.',
        'Conversations turn into visits, offers, and decisions you control.',
        'You are not chasing opportunity. Opportunity knows where to find you.',
      ],
      ctaLine:
        captureCount === 0
          ? 'Capture once. Then open your Magnifi story and share when you are ready.'
          : 'Open your Magnifi story. Review a draft before you post.',
      shareDisclaimer,
      captureCount,
      theme: themeForMode(mode),
      magnifiUrl,
      guidanceUrl,
      draftShareUrl,
      latestCaptureTitle: latestCapture?.title,
      latestCaptureId: latestCapture?.id,
    };
  }

  if (mode === 'media') {
    return {
      mode,
      modeLabel: 'Amplifi™ · Media & Reach',
      firstName,
      organization,
      headline: captureCount === 0 ? `${firstName}, start with one story` : `${firstName}, your audience`,
      headlineAccent: captureCount === 0 ? ' worth sharing.' : ' deserves a platform.',
      lede: captureCount === 0 ? emptyLede : magnifiDef.cinematicHook(organization),
      journey: MEDIA_JOURNEY,
      stats: [
        { label: 'Brand', value: organization, detail: 'Creator / media profile' },
        { label: 'Pulse health', value: profile.healthLabel, detail: `${profile.operationalHealth}/100 operational` },
        { label: 'Stories', value: String(captureCount), detail: captureCount ? 'Ready to open & share' : 'Capture once to begin' },
      ],
      insightCopy:
        'Attention without systems becomes exhaustion. Amplifi turns Simplifi captures into Magnifi stories and share drafts you review — not an auto-publish calendar.',
      futureTitle: 'Twelve months from now',
      futureBullets: [
        'Editorial rhythm runs without burning you out.',
        'Community and sponsors see consistent, premium presence.',
        'Simplifi captures ideas once; Magnifi turns them into experiences you share.',
        'Your platform compounds — it does not reset every Monday.',
      ],
      ctaLine:
        captureCount === 0
          ? 'Capture once. Then open your Magnifi story and share when you are ready.'
          : 'Open your Magnifi story. Review a draft before you post.',
      shareDisclaimer,
      captureCount,
      theme: themeForMode(mode),
      magnifiUrl,
      guidanceUrl,
      draftShareUrl,
      latestCaptureTitle: latestCapture?.title,
      latestCaptureId: latestCapture?.id,
    };
  }

  return {
    mode: 'visibility',
    modeLabel: 'Amplifi™ · Share More. Reach More.',
    firstName,
    organization,
    headline: captureCount === 0 ? `${firstName}, start with one story` : `${firstName}, your impact`,
    headlineAccent: captureCount === 0 ? ' worth sharing.' : ' should be visible.',
    lede:
      captureCount === 0
        ? emptyLede
        : 'Open Magnifi stories from your Simplifi captures. Draft copy to share — Amplifi never auto-posts.',
    journey: VISIBILITY_JOURNEY,
    stats: [
      { label: 'Organization', value: organization, detail: client.packagePurchased },
      { label: 'Onboarding', value: `${pct}%`, detail: client.onboardingStatus ?? 'Getting started' },
      { label: 'Stories', value: String(captureCount), detail: captureCount ? 'Ready to open & share' : 'Capture once to begin' },
    ],
    insightCopy:
      'Amplifi connects Simplifi captures to Magnifi stories you can open and share. Drafts stay under review until you (or your team) decide to post — no Communications calendar, no auto-publish.',
    futureTitle: 'Twelve months from now',
    futureBullets: [
      'Stakeholders see progress without another status meeting.',
      'Opportunities captured in Simplifi become Magnifi experiences you can share.',
      'Pulse tracks client success scores your team can stand behind.',
      'You spend less time explaining — more time executing.',
    ],
    ctaLine:
      captureCount === 0
        ? 'Capture once. Then open your Magnifi story and share when you are ready.'
        : 'Open your Magnifi story. Review a draft before you post.',
    shareDisclaimer,
    captureCount,
    theme: themeForMode('visibility'),
    magnifiUrl,
    guidanceUrl,
    draftShareUrl,
    latestCaptureTitle: latestCapture?.title,
    latestCaptureId: latestCapture?.id,
  };
}
