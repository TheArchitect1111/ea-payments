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
  latestCaptureTitle?: string;
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

  if (mode === 'athlete') {
    return {
      mode,
      modeLabel: 'Amplifi™ · Athlete Development',
      firstName,
      organization,
      headline: `${firstName}, your future`,
      headlineAccent: ' is bigger than you think.',
      lede: 'This is not a report. This is your development story — told the way it deserves to be told.',
      journey: ATHLETE_JOURNEY,
      stats: [
        { label: 'Profile', value: organization, detail: client.packagePurchased },
        { label: 'Onboarding', value: `${pct}%`, detail: client.onboardingStatus ?? 'In progress' },
        { label: 'Captures', value: String(captureCount), detail: 'Simplifi opportunities tracked' },
      ],
      insightCopy:
        'Decision-makers are not looking for perfect. They are looking for prepared, visible, and ready. Amplifi exists to make that preparation impossible to miss.',
      futureTitle: 'Twelve months from now',
      futureBullets: [
        'Your story is active with programs and partners that match your goals.',
        'Progress is visible in Pulse — no guessing, no silence.',
        'Conversations turn into visits, offers, and decisions you control.',
        'You are not chasing opportunity. Opportunity knows where to find you.',
      ],
      ctaLine: 'I can see it. I believe it. I know how to get there.',
      theme: themeForMode(mode),
      magnifiUrl,
      guidanceUrl,
      latestCaptureTitle: latestCapture?.title,
    };
  }

  if (mode === 'media') {
    return {
      mode,
      modeLabel: 'Amplifi™ · Media & Reach',
      firstName,
      organization,
      headline: `${firstName}, your audience`,
      headlineAccent: ' deserves a platform.',
      lede: magnifiDef.cinematicHook(organization),
      journey: MEDIA_JOURNEY,
      stats: [
        { label: 'Brand', value: organization, detail: 'Creator / media profile' },
        { label: 'Pulse health', value: profile.healthLabel, detail: `${profile.operationalHealth}/100 operational` },
        { label: 'Captures', value: String(captureCount), detail: 'Content & opportunity signals' },
      ],
      insightCopy:
        'Attention without systems becomes exhaustion. Amplifi turns your message into momentum people can see and share.',
      futureTitle: 'Twelve months from now',
      futureBullets: [
        'Editorial rhythm runs without burning you out.',
        'Community and sponsors see consistent, premium presence.',
        'Simplifi captures ideas once; Magnifi turns them into experiences.',
        'Your platform compounds — it does not reset every Monday.',
      ],
      ctaLine: 'I can see the platform. I am ready to build it.',
      theme: themeForMode(mode),
      magnifiUrl,
      guidanceUrl,
      latestCaptureTitle: latestCapture?.title,
    };
  }

  return {
    mode: 'visibility',
    modeLabel: 'Amplifi™ · Share More. Reach More.',
    firstName,
    organization,
    headline: `${firstName}, your impact`,
    headlineAccent: ' should be visible.',
    lede: 'One message can create visibility across your entire organization. Show reach. Show momentum. Show progress.',
    journey: VISIBILITY_JOURNEY,
    stats: [
      { label: 'Organization', value: organization, detail: client.packagePurchased },
      { label: 'Onboarding', value: `${pct}%`, detail: client.onboardingStatus ?? 'Getting started' },
      { label: 'Pulse', value: profile.healthLabel, detail: `${profile.operationalHealth}/100 health score` },
    ],
    insightCopy:
      'Leaders lose hours chasing updates. Amplifi connects Simplifi captures, Magnifi stories, and Pulse scores so everyone sees what is happening.',
    futureTitle: 'Twelve months from now',
    futureBullets: [
      'Stakeholders see progress without another status meeting.',
      'Opportunities captured in Simplifi become Magnifi experiences you can share.',
      'Pulse tracks client success scores your team can stand behind.',
      'You spend less time explaining — more time executing.',
    ],
    ctaLine: 'I can see it. I know how to amplify it.',
    theme: themeForMode('visibility'),
    magnifiUrl,
    guidanceUrl,
    latestCaptureTitle: latestCapture?.title,
  };
}
