import { getDefaultBrandProfile } from './brand-profile';
import { CONVERSION_ENGINE_VERSION, getStrategyPack, selectConversionPlan } from './strategy-packs';
import type {
  AssetPreviewLayout,
  BrandProfile,
  CampaignAsset,
  CampaignBrief,
  CampaignContentType,
  CampaignGoalId,
  CampaignStrategy,
  CampaignTimelineItem,
  CreativeCampaign,
  FunnelStage,
  OrganizationStrategyPack,
  SocialFormat,
  SocialPlatform,
} from './types';

type CampaignBeat = {
  dayOffset: number;
  label: string;
  contentType: CampaignContentType;
  funnelStage: FunnelStage;
  format: SocialFormat;
  facebook: string;
  instagram: string;
};

const PLATFORM_BLUEPRINT: Record<SocialPlatform, {
  type: CampaignAsset['type'];
  label: string;
  channel: string;
  previewLayout: AssetPreviewLayout;
}> = {
  facebook: { type: 'social-facebook', label: 'Facebook Post', channel: 'Facebook', previewLayout: 'social-feed' },
  instagram: { type: 'social-instagram', label: 'Instagram Post', channel: 'Instagram', previewLayout: 'social-feed' },
  linkedin: { type: 'social-linkedin', label: 'LinkedIn Post', channel: 'LinkedIn', previewLayout: 'social-feed' },
  x: { type: 'social-x', label: 'X Post', channel: 'X', previewLayout: 'social-feed' },
};

const FORMAT_BY_TYPE: Record<CampaignContentType, SocialFormat> = {
  'problem-recognition': 'static',
  'client-transformation': 'carousel',
  diagnostic: 'carousel',
  'expert-video': 'reel',
  'before-after': 'carousel',
  proof: 'static',
  'objection-answer': 'reel',
  'direct-invitation': 'story',
};

const LABEL_BY_TYPE: Record<CampaignContentType, string> = {
  'problem-recognition': 'Name the problem',
  'client-transformation': 'Client transformation',
  diagnostic: 'Useful self-check',
  'expert-video': 'Expert point of view',
  'before-after': 'Show the difference',
  proof: 'Verified proof',
  'objection-answer': 'Answer the objection',
  'direct-invitation': 'Clear invitation',
};

function campaignLength(strategy: CampaignStrategy): number {
  if (!strategy.startDate || !strategy.endDate) return 4;
  const start = new Date(`${strategy.startDate}T12:00:00Z`);
  const end = new Date(`${strategy.endDate}T12:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 4;
  return Math.max(1, Math.min(30, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1));
}

function hasVerifiedProof(story: string): boolean {
  return /(?:verified proof|permission confirmed|approved quote|verified result|verified stat)\s*:/i.test(story);
}

function cta(pack: OrganizationStrategyPack, brief: CampaignBrief): string {
  const url = brief.registrationLink || brief.website || pack.conversionUrl;
  const action = brief.callToAction || pack.primaryAction;
  return url ? `${action}: ${url}` : action;
}

function fallbackCopy(
  type: CampaignContentType,
  pack: OrganizationStrategyPack,
  brief: CampaignBrief,
  strategy: CampaignStrategy,
): { facebook: string; instagram: string } {
  const audience = strategy.audience || pack.defaultAudience;
  const action = cta(pack, brief);
  const organization = brief.organization || pack.displayName;
  const hash = pack.hashtags.slice(0, 3).map((tag) => `#${tag}`).join(' ');
  const copy: Record<CampaignContentType, { facebook: string; instagram: string }> = {
    'problem-recognition': {
      facebook: `A lot of ${audience.toLowerCase()} have learned to live with a problem they should not have to accept.\n\nIt shows up as repeated questions, missed follow-up, unclear next steps, or opportunities that quietly disappear.\n\nWhich part feels most familiar right now?`,
      instagram: `What have you started treating as “normal” that is actually getting in the way?\n\nRepeated questions. Missed follow-up. Unclear next steps. Opportunities that quietly disappear.\n\nName the friction before you try to fix it.\n\n${hash}`,
    },
    diagnostic: {
      facebook: `A quick self-check:\n\n1. Can someone understand what you offer in under a minute?\n2. Is the next step obvious?\n3. Does follow-up happen without relying on memory?\n4. Can the right information be found when it is needed?\n\nOne “no” can point to the best place to begin.`,
      instagram: `Four questions worth asking today:\n\nCan people understand the offer?\nIs the next step obvious?\nDoes follow-up depend on memory?\nCan people find what they need?\n\nYour first “no” is useful information.\n\n${hash}`,
    },
    'expert-video': {
      facebook: `VIDEO SCRIPT\n\n“If growth keeps creating more work, the answer may not be more effort. Look at the handoffs: where does a person have to remember, chase, explain, or rescue the process? That is often where the real opportunity is.”\n\n— ${organization}`,
      instagram: `REEL SCRIPT\n\n“If growth keeps creating more work, look at the handoffs. Where does someone have to remember, chase, explain, or rescue the process? Start there.”\n\nOn-screen close: One clear improvement can change the whole experience.\n\n${hash}`,
    },
    'before-after': {
      facebook: `Before: people have to search, ask, wait, and hope they found the right next step.\n\nAfter: the message is clear, the path is visible, and follow-up happens when it should.\n\nThe difference is not “more technology.” It is a better-designed experience.`,
      instagram: `BEFORE → searching, asking, waiting, guessing\n\nAFTER → a clear message, a visible path, timely follow-up\n\nBetter design should make the experience feel simpler—not more technical.\n\n${hash}`,
    },
    'objection-answer': {
      facebook: `“We are too busy to change this right now.”\n\nThat feeling is real. It is also a clue. If the current way of working leaves no room to improve the way of working, start smaller: identify one repeated frustration and remove one unnecessary step.`,
      instagram: `“We are too busy to change it.”\n\nStart smaller.\n\nOne repeated frustration.\nOne unnecessary step.\nOne clearer next action.\n\nProgress does not have to begin with an overhaul.\n\n${hash}`,
    },
    'direct-invitation': {
      facebook: `You do not need a perfect plan before taking the first useful step.\n\nIf the current approach feels harder, less clear, or less effective than it should, ${organization} can help you see what deserves attention first.\n\n${action}`,
      instagram: `You do not need a perfect plan. You need a useful first step.\n\nIf the current approach feels harder or less clear than it should, let’s find what deserves attention first.\n\n${action}\n\n${hash}`,
    },
    'client-transformation': {
      facebook: `A client transformation belongs here only after the result, quote, and permission have been verified.\n\nUntil then, use the campaign’s diagnostic post to create value without inventing proof.`,
      instagram: `Verified client story required.\n\nNo invented quote. No inflated result. No borrowed credibility.`,
    },
    proof: {
      facebook: `Verified proof belongs here only when the source, result, and permission are documented. This draft is intentionally held until that proof is supplied.`,
      instagram: `Proof should be specific, sourced, and approved. This draft is waiting for verified material.`,
    },
  };
  return copy[type];
}

function normalizeBeat(value: unknown, fallback: CampaignBeat): CampaignBeat {
  if (!value || typeof value !== 'object') return fallback;
  const beat = value as Partial<CampaignBeat>;
  return {
    ...fallback,
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
  pack: OrganizationStrategyPack,
): Promise<CampaignBeat[]> {
  const verifiedProof = hasVerifiedProof(story);
  const plan = selectConversionPlan(pack, campaignLength(strategy), verifiedProof);
  const fallback = plan.map((item) => ({
    ...item,
    label: LABEL_BY_TYPE[item.contentType],
    format: FORMAT_BY_TYPE[item.contentType],
    ...fallbackCopy(item.contentType, pack, brief, strategy),
  }));
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return fallback;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are Amplifi's Conversion Content Engine. Create platform-native content that earns attention, builds trust, gives practical help, and invites a qualified next step. Every post must have a distinct job. Never paraphrase the campaign brief, repeat a boilerplate description, fabricate proof, or make a prohibited claim. A reel must include a spoken script and visual direction. A carousel must include slide copy. Facebook and Instagram must not be identical. Use at most three relevant hashtags on Instagram and none on Facebook. Follow this strategy pack exactly: ${JSON.stringify(pack)}. Return JSON only: {"beats":[{"label":"...","facebook":"...","instagram":"..."}]}.`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              organization: brand.organizationName,
              voice: brand.voice,
              story,
              brief,
              strategy,
              verifiedProof,
              requiredPlan: plan,
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
    if (!Array.isArray(parsed.beats) || parsed.beats.length !== fallback.length) return fallback;
    return fallback.map((item, index) => normalizeBeat(parsed.beats?.[index], item));
  } catch {
    return fallback;
  }
}

function platformBody(platform: SocialPlatform, beat: CampaignBeat): string {
  if (platform === 'facebook' || platform === 'linkedin') return beat.facebook;
  if (platform === 'x') return beat.instagram.slice(0, 280);
  return beat.instagram;
}

function quality(body: string, type: CampaignContentType): { score: number; issues: string[] } {
  const issues: string[] = [];
  if (body.length < 80) issues.push('Copy may be too thin to create value.');
  if (/operational gaps|support growth|leverage|optimi[sz]e|digital transformation/i.test(body)) {
    issues.push('Replace corporate filler with specific human language.');
  }
  if ((type === 'client-transformation' || type === 'proof') && !/verified|waiting|required/i.test(body)) {
    issues.push('Proof-based content must include verified source material.');
  }
  return { score: Math.max(0, 100 - issues.length * 25), issues };
}

function buildAssets(
  beats: CampaignBeat[],
  strategy: CampaignStrategy,
  brief: CampaignBrief,
  pack: OrganizationStrategyPack,
  verifiedProof: boolean,
): CampaignAsset[] {
  const assets: CampaignAsset[] = [];
  for (const beat of beats) {
    for (const platform of strategy.platforms) {
      const blueprint = PLATFORM_BLUEPRINT[platform];
      const body = platformBody(platform, beat);
      const review = quality(body, beat.contentType);
      const proofRequired = beat.contentType === 'client-transformation' || beat.contentType === 'proof';
      assets.push({
        id: `asset-${platform}-day-${beat.dayOffset}`,
        type: blueprint.type,
        label: `${blueprint.label} · Day ${beat.dayOffset + 1} · ${beat.format}`,
        channel: blueprint.channel,
        status: review.issues.length ? 'draft' : 'ready',
        previewTitle: beat.label,
        previewBody: body,
        previewLayout: blueprint.previewLayout,
        publishDestination: 'amplifi',
        href: brief.registrationLink || brief.website || pack.conversionUrl || undefined,
        contentType: beat.contentType,
        funnelStage: beat.funnelStage,
        socialFormat: beat.format,
        conversionAction: beat.funnelStage === 'convert' ? cta(pack, brief) : undefined,
        proofStatus: proofRequired ? (verifiedProof ? 'verified' : 'missing') : 'not-required',
        qualityScore: review.score,
        qualityIssues: review.issues,
        variantGroupId: `${beat.contentType}-day-${beat.dayOffset}`,
      });
    }
  }
  return assets;
}

function buildTimeline(assets: CampaignAsset[], beats: CampaignBeat[]): CampaignTimelineItem[] {
  return beats.map((beat) => ({
    id: `tl-day-${beat.dayOffset}`,
    offsetDays: beat.dayOffset,
    label: `${beat.funnelStage}: ${beat.label}`,
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
  const pack = getStrategyPack(input.organizationId, input.brief.organization || brand.organizationName);
  const verifiedProof = hasVerifiedProof(input.story);
  const beats = await generateBeats(input.story, input.brief, input.strategy, brand, pack);
  const assets = buildAssets(beats, input.strategy, input.brief, pack, verifiedProof);
  return { assets, timeline: buildTimeline(assets, beats), completionPercent: 0 };
}

export const GENERATION_VERSION = CONVERSION_ENGINE_VERSION;
