import { getDefaultBrandProfile } from './brand-profile';
import type {
  AssetPreviewLayout,
  BrandProfile,
  CampaignAsset,
  CampaignBrief,
  CampaignGoalId,
  CampaignStrategy,
  CampaignTimelineItem,
  CreativeCampaign,
  SocialPlatform,
} from './types';

type CampaignBeat = {
  dayOffset: number;
  label: string;
  facebook: string;
  instagram: string;
};

const PLATFORM_BLUEPRINT: Record<
  SocialPlatform,
  {
    type: CampaignAsset['type'];
    label: string;
    channel: string;
    previewLayout: AssetPreviewLayout;
  }
> = {
  facebook: { type: 'social-facebook', label: 'Facebook Post', channel: 'Facebook', previewLayout: 'social-feed' },
  instagram: { type: 'social-instagram', label: 'Instagram Post', channel: 'Instagram', previewLayout: 'social-feed' },
  linkedin: { type: 'social-linkedin', label: 'LinkedIn Post', channel: 'LinkedIn', previewLayout: 'social-feed' },
  x: { type: 'social-x', label: 'X Post', channel: 'X', previewLayout: 'social-feed' },
};

const GENERATION_VERSION = 2;

function campaignLength(strategy: CampaignStrategy): number {
  if (!strategy.startDate || !strategy.endDate) return 4;
  const start = new Date(`${strategy.startDate}T12:00:00Z`);
  const end = new Date(`${strategy.endDate}T12:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 4;
  return Math.max(1, Math.min(14, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1));
}

function fallbackBeats(brief: CampaignBrief, strategy: CampaignStrategy, brand: BrandProfile): CampaignBeat[] {
  const organization = brief.organization || brand.organizationName;
  const link = brief.registrationLink ?? brief.website ?? '';
  const invitation = link ? `\n\nTake the first step: ${link}` : '';

  return [
    {
      dayOffset: 0,
      label: 'Recognition',
      facebook:
        `What is taking more of your time than it should?\n\n` +
        `The follow-up you keep meaning to send. The information only one person can find. ` +
        `The website that no longer reflects what your business has become.\n\n` +
        `Those small frustrations are rarely separate problems. They are signs that the business has outgrown the way it works.`,
      instagram:
        `What is taking more of your time than it should?\n\n` +
        `The follow-up. The searching. The repeated questions. The website that no longer fits.\n\n` +
        `Small frustrations often reveal a bigger truth: the business has outgrown the way it works.\n\n` +
        `#EfficiencyArchitects #SmallBusiness #BusinessGrowth`,
    },
    {
      dayOffset: 1,
      label: 'The hidden cost',
      facebook:
        `The problem usually is not effort.\n\n` +
        `Good people work harder, stay later, and add another tool—while the same work keeps coming back. ` +
        `Growth becomes exhausting when the business depends on memory, workarounds, and constant intervention.\n\n` +
        `A better answer begins by finding what is creating the friction.`,
      instagram:
        `The problem usually is not effort.\n\n` +
        `It is the work that keeps coming back. The questions that keep getting repeated. ` +
        `The business that cannot move unless you push it.\n\n` +
        `Growth should not require more of you every single day.\n\n` +
        `#EfficiencyArchitects #WorkSmarter #BusinessSystems`,
    },
    {
      dayOffset: 2,
      label: 'The possibility',
      facebook:
        `Imagine opening your business tomorrow and knowing what needs attention—without searching, chasing, or guessing.\n\n` +
        `Your website tells the right story. New inquiries receive a clear next step. Your team can find what it needs. ` +
        `Clients feel supported without everything depending on you.\n\n` +
        `That is not about adding more technology. It is about designing the business around the life and growth you actually want.`,
      instagram:
        `Imagine a business that keeps moving without everything depending on you.\n\n` +
        `A website that tells the right story. Clear next steps. Less searching. Less chasing. More room to lead.\n\n` +
        `Technology is not the goal. A better way to work is.\n\n` +
        `#EfficiencyArchitects #DigitalPresence #BusinessDesign`,
    },
    {
      dayOffset: 3,
      label: 'Invitation',
      facebook:
        `You do not need to know exactly what is wrong before asking what could be better.\n\n` +
        `${organization} created Consider the Possibilities™ to help you look at the way your business works, ` +
        `where opportunities may be slipping through, and what stronger systems or a clearer digital presence could make possible.` +
        invitation,
      instagram:
        `What could become possible if your business worked with you instead of constantly pulling you back in?\n\n` +
        `Consider the Possibilities™ is a simple place to begin. No jargon. No pressure. Just a clearer look at what may be getting in the way.` +
        (link ? `\n\nStart here: ${link}` : '') +
        `\n\n#EfficiencyArchitects #ConsiderThePossibilities #BusinessGrowth`,
    },
  ].slice(0, campaignLength(strategy));
}

function normalizeBeat(value: unknown, fallback: CampaignBeat): CampaignBeat {
  if (!value || typeof value !== 'object') return fallback;
  const beat = value as Partial<CampaignBeat>;
  return {
    dayOffset: Number.isInteger(beat.dayOffset) ? Math.max(0, Number(beat.dayOffset)) : fallback.dayOffset,
    label: String(beat.label ?? fallback.label).trim() || fallback.label,
    facebook: String(beat.facebook ?? fallback.facebook).trim() || fallback.facebook,
    instagram: String(beat.instagram ?? fallback.instagram).trim() || fallback.instagram,
  };
}

async function generateBeats(
  story: string,
  brief: CampaignBrief,
  strategy: CampaignStrategy,
  brand: BrandProfile,
): Promise<CampaignBeat[]> {
  const fallback = fallbackBeats(brief, strategy, brand);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return fallback;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior human campaign writer. Write emotionally intelligent, natural social copy that sounds spoken, specific, and credible. Never repeat the campaign brief. Never use corporate filler such as operational gaps, leverage, optimize, solutions, digital transformation, or support growth. Do not begin posts with the campaign title. Build a four-part narrative: recognition, hidden cost, possibility, invitation. Facebook may use short paragraphs. Instagram should be tighter and use at most three natural hashtags. Include the supplied URL only where it serves the invitation. Return JSON only: {"beats":[{"dayOffset":0,"label":"...","facebook":"...","instagram":"..."}]}.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              organization: brand.organizationName,
              brandVoice: brand.voice,
              originalStory: story,
              title: brief.title,
              audience: strategy.audience,
              objective: strategy.objective,
              dates: { start: strategy.startDate, end: strategy.endDate },
              contentPillars: strategy.contentPillars,
              callToAction: brief.callToAction,
              url: brief.registrationLink ?? brief.website,
              numberOfDays: campaignLength(strategy),
            }),
          },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content) as { beats?: unknown[] };
    if (!Array.isArray(parsed.beats) || parsed.beats.length < fallback.length) return fallback;
    return fallback.map((item, index) => normalizeBeat(parsed.beats?.[index], item));
  } catch {
    return fallback;
  }
}

function platformBody(platform: SocialPlatform, beat: CampaignBeat): string {
  if (platform === 'facebook') return beat.facebook;
  if (platform === 'instagram') return beat.instagram;
  if (platform === 'linkedin') return beat.facebook;
  return beat.instagram.slice(0, 280);
}

function buildAssets(
  beats: CampaignBeat[],
  strategy: CampaignStrategy,
  brief: CampaignBrief,
): CampaignAsset[] {
  const assets: CampaignAsset[] = [];
  for (const beat of beats) {
    for (const platform of strategy.platforms) {
      const blueprint = PLATFORM_BLUEPRINT[platform];
      assets.push({
        id: `asset-${platform}-day-${beat.dayOffset}`,
        type: blueprint.type,
        label: `${blueprint.label} · Day ${beat.dayOffset + 1}`,
        channel: blueprint.channel,
        status: 'draft',
        previewTitle: beat.label,
        previewBody: platformBody(platform, beat),
        previewLayout: blueprint.previewLayout,
        publishDestination: 'amplifi',
        href: brief.registrationLink ?? brief.website,
      });
    }
  }
  return assets;
}

function buildTimeline(assets: CampaignAsset[], beats: CampaignBeat[]): CampaignTimelineItem[] {
  return beats.map((beat) => ({
    id: `tl-day-${beat.dayOffset}`,
    offsetDays: beat.dayOffset,
    label: beat.label,
    assetIds: assets.filter((asset) => asset.id.endsWith(`day-${beat.dayOffset}`)).map((asset) => asset.id),
  }));
}

export async function generateCampaignPackage(input: {
  id: string;
  goalId: CampaignGoalId;
  goalLabel: string;
  story: string;
  brief: CampaignBrief;
  strategy: CampaignStrategy;
  organizationId: string;
  brand?: BrandProfile;
}): Promise<Pick<CreativeCampaign, 'assets' | 'timeline' | 'completionPercent'>> {
  const brand = input.brand ?? getDefaultBrandProfile(input.organizationId);
  const beats = await generateBeats(input.story, input.brief, input.strategy, brand);
  const assets = buildAssets(beats, input.strategy, input.brief);
  const timeline = buildTimeline(assets, beats);

  return { assets, timeline, completionPercent: 0 };
}

export { GENERATION_VERSION };
