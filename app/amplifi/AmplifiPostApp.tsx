'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AmplifiHome from './AmplifiHome';
import './amplifi-home.css';
import StoryDraftPanel from '@/app/components/StoryDraftPanel';
import '@/app/components/story-draft-panel.css';
import { buildAmplifiSocialDraft } from '@/lib/amplifi-draft';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import { openSocialShare } from '@/lib/amplifi-social-share';
import {
  absoluteAmplifiShareUrl,
  MAGNIFI_PUBLIC_LINK_WARNING,
  preferPortalMagnifiUrl,
} from '@/lib/amplifi-share-policy';
import { DEMO_CONSIDER_SLUG } from '@/lib/demo-consider-selena';
import { PUBLIC_LINKS } from '@/lib/marketing-urls';
import type { CampaignArchitecture } from '@/lib/creative-studio/types';
import PortfolioCampaignCommandCenter from './PortfolioCampaignCommandCenter';
import { findPortfolioScheduleConflicts } from '@/lib/amplifi-campaign-command';

const DEMO_STORY_URL = `${PUBLIC_LINKS.platform.replace(/\/$/, '')}/consider/${DEMO_CONSIDER_SLUG}`;

type CaptureOption = {
  id: string;
  title: string;
  shareUrl?: string;
  businessName?: string;
  magnifiUrl?: string;
};

type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  kind: string;
  publishedAt?: string | null;
  withinRange?: boolean;
};

type ResearchMeta = {
  topic: string;
  dateFrom: string;
  dateTo: string;
  researchedAt: string;
  sources: ResearchSource[];
  warnings: string[];
};

type AmplifiPath = 'publish' | 'research' | 'smartchitecture';
type ApprovedPost = { requestId?: string; title: string; caption: string; status: string; };
type SocialConnection = { id: string; platform: string; name: string; picture?: string; };
type NativeProviderStatus = { provider: 'meta' | 'linkedin' | 'tiktok' | 'x'; label: string; configured: boolean; accounts: SocialConnection[]; };

type TopicWatch = {
  id: string;
  topic: string;
  cadence: 'twice-weekly' | 'weekly';
  status: 'active' | 'paused' | 'stopped';
  timezone: string;
  endAt: string;
  postsPerRun: 1 | 2 | 3;
  discoveries: Array<{
    id: string;
    at: string;
    note: string;
    newSourceCount: number;
  }>;
  lastRunAt?: string;
};

type CampaignPost = { title: string; caption: string; callToAction: string; imageDirection: string; productId?: string; audienceId?: string; waveId?: string };
type PromotionScope = 'single' | 'portfolio';
type PortfolioProductInput = {
  id: string;
  name: string;
  audience: string;
  callToAction: string;
  ctaUrl: string;
};
type GeneratedCampaign = {
  id?: string;
  durable?: boolean;
  persistenceError?: string;
  title: string;
  strategy: string;
  posts: CampaignPost[];
  architecture?: CampaignArchitecture;
};
type CampaignTone = 'Bold and direct' | 'Provocative and challenging' | 'Authoritative and premium' | 'Warm and human';
const CAMPAIGN_BRIEF_STORAGE_KEY = 'amplifi:create-for-me:brief';
const CAMPAIGN_WORKSPACE_STORAGE_KEY = 'amplifi:campaign-workspace:v1';

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function defaultMonitorEndDate(): string {
  const end = new Date();
  end.setUTCMonth(end.getUTCMonth() + 1);
  return end.toISOString().slice(0, 10);
}

export default function AmplifiPostApp({
  loggedIn,
  slug,
  captureId,
  initialUrl,
  initialTitle,
}: {
  loggedIn: boolean;
  slug: string | null;
  captureId?: string;
  initialUrl?: string;
  initialTitle?: string;
}) {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [businessName, setBusinessName] = useState(initialTitle ?? '');
  const [storyUrl, setStoryUrl] = useState(initialUrl ?? '');
  const [headline, setHeadline] = useState('');
  const [quickWin, setQuickWin] = useState('');
  const [draft, setDraft] = useState<AmplifiSocialDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPath, setSelectedPath] = useState<AmplifiPath | null>(null);
  const [approvedPost, setApprovedPost] = useState<ApprovedPost | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState('');
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(loggedIn);
  const [connectionsConfigured, setConnectionsConfigured] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<NativeProviderStatus[]>([]);
  const [publishingNow, setPublishingNow] = useState(false);
  const [publishResult, setPublishResult] = useState('');
  const [captures, setCaptures] = useState<CaptureOption[]>([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState(captureId ?? '');
  const [topic, setTopic] = useState('');
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta | null>(null);
  const [researchDrafts, setResearchDrafts] = useState<AmplifiSocialDraft[]>([]);
  const [searchMode, setSearchMode] = useState<'once' | 'watch'>('once');
  const [watchCadence, setWatchCadence] = useState<'twice-weekly' | 'weekly'>('weekly');
  const [watchEndDate, setWatchEndDate] = useState(defaultMonitorEndDate);
  const [postsPerSearch, setPostsPerSearch] = useState<1 | 2 | 3>(1);
  const [topicWatches, setTopicWatches] = useState<TopicWatch[]>([]);
  const [watchBusyId, setWatchBusyId] = useState<string | null>(null);
  const [promotion, setPromotion] = useState('');
  const [promotionScope, setPromotionScope] = useState<PromotionScope>('single');
  const [portfolioProducts, setPortfolioProducts] = useState<PortfolioProductInput[]>([
    { id: 'product-1', name: '', audience: '', callToAction: '', ctaUrl: '' },
    { id: 'product-2', name: '', audience: '', callToAction: '', ctaUrl: '' },
  ]);
  const [campaignAudience, setCampaignAudience] = useState('');
  const [campaignResult, setCampaignResult] = useState('');
  const [campaignCallToAction, setCampaignCallToAction] = useState('');
  const [campaignDetails, setCampaignDetails] = useState('');
  const [campaignTone, setCampaignTone] = useState<CampaignTone>('Bold and direct');
  const [campaignProofPoint, setCampaignProofPoint] = useState('');
  const [campaignPainQuestion, setCampaignPainQuestion] = useState('');
  const [campaignCtaUrl, setCampaignCtaUrl] = useState('');
  const [campaignGenerating, setCampaignGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [editingCampaignPost, setEditingCampaignPost] = useState<number | null>(null);
  const [approvedCampaignPosts, setApprovedCampaignPosts] = useState<number[]>([]);
  const [campaignImageVariants, setCampaignImageVariants] = useState<Record<number, number>>({});
  const [campaignUploadedImages, setCampaignUploadedImages] = useState<Record<number, string>>({});
  const [showCampaignControls, setShowCampaignControls] = useState(false);
  const [campaignToneStrength, setCampaignToneStrength] = useState('Strong');
  const [campaignWordsUse, setCampaignWordsUse] = useState('');
  const [campaignWordsAvoid, setCampaignWordsAvoid] = useState('');
  const [campaignPlatforms, setCampaignPlatforms] = useState<string[]>(['Facebook', 'LinkedIn']);
  const [campaignImageStyle, setCampaignImageStyle] = useState('Branded proof graphics');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [saveBrandDefaults, setSaveBrandDefaults] = useState(false);
  const [regenerationInstructions, setRegenerationInstructions] = useState<Record<number, string>>({});
  const [campaignScheduleTimes, setCampaignScheduleTimes] = useState<Record<number, string>>({});
  const [campaignScheduled, setCampaignScheduled] = useState(false);
  const [campaignScheduleSaving, setCampaignScheduleSaving] = useState(false);
  const portfolioScheduleConflicts = generatedCampaign?.architecture?.mode === 'portfolio'
    ? findPortfolioScheduleConflicts(generatedCampaign.posts, campaignScheduleTimes, generatedCampaign.architecture)
    : [];

  useEffect(() => {
    const savedPath = window.localStorage.getItem('amplifi:onboarding:path') as AmplifiPath | null;
    if (savedPath === 'publish' || savedPath === 'research' || savedPath === 'smartchitecture') setSelectedPath(savedPath);
    else setShowWelcome(false);

    const savedBrief = window.sessionStorage.getItem(CAMPAIGN_BRIEF_STORAGE_KEY);
    if (savedBrief) {
      try {
        const brief = JSON.parse(savedBrief) as {
          promotion?: string;
          audience?: string;
          result?: string;
          callToAction?: string;
          details?: string;
          tone?: CampaignTone;
          proofPoint?: string;
          painQuestion?: string;
          ctaUrl?: string;
          promotionScope?: PromotionScope;
          portfolioProducts?: PortfolioProductInput[];
        };
        setPromotion(brief.promotion ?? '');
        setCampaignAudience(brief.audience ?? '');
        setCampaignResult(brief.result ?? '');
        setCampaignCallToAction(brief.callToAction ?? '');
        setCampaignDetails(brief.details ?? '');
        setCampaignTone(brief.tone ?? 'Bold and direct');
        setCampaignProofPoint(brief.proofPoint ?? '');
        setCampaignPainQuestion(brief.painQuestion ?? '');
        setCampaignCtaUrl(brief.ctaUrl ?? '');
        setPromotionScope(brief.promotionScope === 'portfolio' ? 'portfolio' : 'single');
        if (Array.isArray(brief.portfolioProducts) && brief.portfolioProducts.length >= 2) {
          setPortfolioProducts(brief.portfolioProducts);
        }
        setSelectedPath('smartchitecture');
        setShowHome(false);
        window.sessionStorage.removeItem(CAMPAIGN_BRIEF_STORAGE_KEY);
      } catch {
        window.sessionStorage.removeItem(CAMPAIGN_BRIEF_STORAGE_KEY);
      }
    }
    const savedWorkspace = window.localStorage.getItem(CAMPAIGN_WORKSPACE_STORAGE_KEY);
    if (savedWorkspace) {
      try {
        const saved = JSON.parse(savedWorkspace) as { campaign?: GeneratedCampaign; approved?: number[]; schedule?: Record<number, string> };
        setGeneratedCampaign(saved.campaign ?? null);
        setApprovedCampaignPosts(saved.approved ?? []);
        setCampaignScheduleTimes(saved.schedule ?? {});
      } catch { window.localStorage.removeItem(CAMPAIGN_WORKSPACE_STORAGE_KEY); }
    }
  }, []);

  useEffect(() => {
    if (!generatedCampaign) return;
    window.localStorage.setItem(CAMPAIGN_WORKSPACE_STORAGE_KEY, JSON.stringify({ campaign: generatedCampaign, approved: approvedCampaignPosts, schedule: campaignScheduleTimes }));
  }, [generatedCampaign, approvedCampaignPosts, campaignScheduleTimes]);

  const choosePath = (path: AmplifiPath) => {
    setShowHome(false);
    setSelectedPath(path);
    setShowWelcome(false);
    window.localStorage.setItem('amplifi:onboarding:path', path);
    window.setTimeout(() => {
      const target = path === 'research' ? 'search' : path === 'smartchitecture' ? 'smartchitecture' : 'content';
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const createCampaignForMe = async () => {
    const portfolioComplete = promotionScope === 'portfolio' && portfolioProducts.length >= 2 && portfolioProducts.every(
      (product) => product.name.trim() && product.audience.trim() && product.callToAction.trim(),
    );
    const singleComplete = promotionScope === 'single' && campaignAudience.trim() && campaignCallToAction.trim();
    if (!promotion.trim() || !campaignResult.trim() || (!singleComplete && !portfolioComplete)) {
      setMessage(promotionScope === 'portfolio'
        ? 'Add at least two products, including the audience and next action for each.'
        : 'Complete the promotion, audience, result and call to action.');
      return;
    }
    if (!loggedIn) {
      window.sessionStorage.setItem(CAMPAIGN_BRIEF_STORAGE_KEY, JSON.stringify({
        promotion: promotion.trim(),
        audience: campaignAudience.trim(),
        result: campaignResult.trim(),
        callToAction: campaignCallToAction.trim(),
        details: campaignDetails.trim(),
        tone: campaignTone,
        proofPoint: campaignProofPoint.trim(),
        painQuestion: campaignPainQuestion.trim(),
        ctaUrl: campaignCtaUrl.trim(),
        promotionScope,
        portfolioProducts,
      }));
      window.location.assign('/portal/login?next=%2Famplifi%2Fworkspace');
      return;
    }
    setCampaignGenerating(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion: promotion.trim(),
          audience: campaignAudience.trim(),
          result: campaignResult.trim(),
          callToAction: campaignCallToAction.trim(),
          details: campaignDetails.trim(),
          tone: campaignTone,
          proofPoint: campaignProofPoint.trim(),
          painQuestion: campaignPainQuestion.trim(),
          ctaUrl: campaignCtaUrl.trim(),
          promotionScope,
          portfolioProducts: promotionScope === 'portfolio' ? portfolioProducts : undefined,
          toneStrength: campaignToneStrength,
          wordsUse: campaignWordsUse.trim(),
          wordsAvoid: campaignWordsAvoid.trim(),
          platforms: campaignPlatforms,
          imageStyle: campaignImageStyle,
          startDate: campaignStartDate,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; campaign?: GeneratedCampaign };
      if (!res.ok || !data.ok || !data.campaign || data.campaign.posts.length !== 5) {
        setMessage(data.error || 'Amplifi could not create all five campaign posts.');
        return;
      }
      setGeneratedCampaign(data.campaign);
      setApprovedCampaignPosts([]);
      setBusinessName(data.campaign.title);
      if (data.campaign.architecture?.mode === 'portfolio' && data.campaign.durable !== true) {
        setMessage('The campaign was created, but durable server storage is not configured. Do not schedule it yet.');
      } else {
        setSuccess('Amplifi created five coordinated posts. Review each one before approval.');
      }
    } catch {
      setMessage('Amplifi could not create the campaign right now.');
    } finally {
      setCampaignGenerating(false);
    }
  };

  const toggleCampaignPlatform = (platform: string) => setCampaignPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);

  const saveCampaignSchedule = async () => {
    if (generatedCampaign?.architecture?.mode !== 'portfolio') {
      setCampaignScheduled(true);
      return;
    }
    if (!generatedCampaign.id) {
      setMessage('This portfolio campaign does not have a durable campaign record.');
      return;
    }
    setCampaignScheduleSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/portal/amplifi/campaigns/${encodeURIComponent(generatedCampaign.id)}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: campaignScheduleTimes, approvedPostIndexes: approvedCampaignPosts, timezone: 'America/New_York' }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; conflicts?: string[] };
      if (!response.ok || !data.ok) {
        setMessage(data.conflicts?.join(' ') || data.error || 'The campaign schedule could not be saved.');
        return;
      }
      setCampaignScheduled(true);
      setSuccess('Campaign schedule saved to Amplifi.');
    } catch {
      setMessage('The campaign schedule could not reach Amplifi.');
    } finally {
      setCampaignScheduleSaving(false);
    }
  };

  const updatePortfolioProduct = (id: string, patch: Partial<PortfolioProductInput>) => {
    setPortfolioProducts((current) => current.map((product) => product.id === id ? { ...product, ...patch } : product));
  };

  const addPortfolioProduct = () => {
    setPortfolioProducts((current) => [
      ...current,
      { id: `product-${Date.now().toString(36)}`, name: '', audience: '', callToAction: '', ctaUrl: '' },
    ]);
  };

  const updateCampaignPost = (index: number, patch: Partial<CampaignPost>) => {
    setGeneratedCampaign((current) => current ? {
      ...current,
      posts: current.posts.map((post, postIndex) => postIndex === index ? { ...post, ...patch } : post),
    } : current);
  };

  const regenerateCampaignPost = (index: number) => {
    if (!generatedCampaign) return;
    const assignedPost = generatedCampaign.posts[index];
    const assignedProduct = generatedCampaign.architecture?.products.find((product) => product.id === assignedPost?.productId);
    const assignedAudience = generatedCampaign.architecture?.audiences.find((audience) => audience.id === assignedPost?.audienceId)?.name;
    const pain = campaignPainQuestion.trim() || 'Is your business leaking time, money and resources?';
    const proof = campaignProofPoint.trim() || `The right system gives ${assignedAudience || campaignAudience.trim() || 'your team'} capacity back.`;
    const cta = assignedProduct
      ? `${assignedProduct.callToAction.label}${assignedProduct.callToAction.url ? ` ${assignedProduct.callToAction.url}` : ''}`.trim()
      : `${campaignCallToAction.trim()}${campaignCtaUrl.trim() ? ` ${campaignCtaUrl.trim()}` : ''}`.trim();
    const toneLead = campaignTone === 'Provocative and challenging' ? 'Here is the uncomfortable truth: ' : campaignTone === 'Authoritative and premium' ? 'Operationally, the issue is clear: ' : campaignTone === 'Warm and human' ? 'Your people deserve a better way to work. ' : '';
    const requestedChange = regenerationInstructions[index]?.trim();
    const directionLead = requestedChange ? `${requestedChange.replace(/[.!?]+$/, '')}: ` : '';
    const replacements: CampaignPost[] = [
      { title: pain, caption: `${toneLead}${pain}\n\nThe cost is hiding inside repeated tasks, delayed follow-up and processes everyone has learned to tolerate. ${promotion.trim()} is built to expose that friction and remove it.`, callToAction: cta, imageDirection: `Bold question-led graphic: ${pain}` },
      { title: 'Busy is not the same as efficient', caption: `Every manual handoff creates another place for time, money or opportunity to disappear. That is not a people problem. It is a system problem—and system problems can be redesigned.`, callToAction: cta, imageDirection: 'Time, money and resources shown as three visible operational leaks.' },
      { title: proof, caption: `${proof}\n\nThat is the difference between adding another tool and fixing the process that is creating the loss. The result should be specific, measurable and felt by the people doing the work.`, callToAction: cta, imageDirection: `Proof-led result card featuring: ${proof}` },
      { title: 'We did not ask the team to work harder', caption: `We changed the system. The repeated work moved into automation, the handoffs became visible and the team got capacity back for work that actually requires judgment.`, callToAction: cta, imageDirection: 'Before-and-after workflow graphic contrasting friction with a clean automated path.' },
      { title: 'Find the leak', caption: `${pain}\n\nStop guessing. Identify where your business is losing capacity and what to address first. ${cta}`, callToAction: cta, imageDirection: 'High-contrast Find the leak CTA graphic with the destination link.' },
    ];
    const replacement = replacements[index] ?? replacements[0];
    updateCampaignPost(index, { ...replacement, caption: `${directionLead}${replacement.caption}` });
    setApprovedCampaignPosts((current) => current.filter((postIndex) => postIndex !== index));
  };

  const loadConnections = useCallback(async () => {
    if (!loggedIn) { setConnectionsLoading(false); return; }
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await fetch('/api/portal/amplifi/native-connections', { cache: 'no-store' });
      const data = (await res.json()) as { providers?: NativeProviderStatus[]; connections?: SocialConnection[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Amplifi could not load social connections.');
      setProviderStatuses(data.providers ?? []);
      setConnectionsConfigured(Boolean(data.providers?.some((provider) => provider.configured)));
      setSocialConnections(data.connections ?? []);
    } catch (error) {
      setConnectionsError(error instanceof Error ? error.message : 'Amplifi could not load social connections.');
    } finally {
      setConnectionsLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => { void loadConnections(); }, [loadConnections]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('connections');
    if (!status) return;
    setShowHome(false);
    if (status.endsWith('-connected')) setConnectionResult('Social accounts connected. Amplifi is refreshing the available pages now.');
    else if (status.endsWith('-state-expired')) setConnectionsError('The authorization session expired before Meta returned to Amplifi. Start the connection again.');
    else if (status.endsWith('-denied')) setConnectionsError('Meta authorization was not completed. No connection was changed.');
    else if (status.endsWith('-failed')) setConnectionsError('Meta returned to Amplifi, but the social accounts could not be saved.');
    window.setTimeout(() => document.getElementById('connections')?.scrollIntoView({ block: 'start' }), 50);
  }, []);

  const generateDraft = useCallback(
    (input?: { businessName: string; storyUrl: string; headline?: string; quickWin?: string }) => {
      const name = (input?.businessName ?? businessName).trim();
      const url = (input?.storyUrl ?? storyUrl).trim();
      if (!name || !url) {
        setMessage('Add a title and story link first.');
        setDraft(null);
        return;
      }
      setMessage('');
      setResearchMeta(null);
      setDraft(
        buildAmplifiSocialDraft({
          businessName: name,
          considerUrl: url,
          headline: input?.headline ?? headline,
          quickWin: input?.quickWin ?? quickWin,
        }),
      );
    },
    [businessName, storyUrl, headline, quickWin],
  );

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/portal/captures')
      .then((res) => res.json())
      .then((data: { ok?: boolean; captures?: CaptureOption[] }) => {
        if (data.ok && data.captures) setCaptures(data.captures);
      })
      .catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/portal/amplifi/topic-research/watch')
      .then((res) => res.json())
      .then((data: { watches?: TopicWatch[] }) => {
        if (Array.isArray(data.watches)) setTopicWatches(data.watches);
      })
      .catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    if (!captureId || !loggedIn) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/portal/captures/${encodeURIComponent(captureId)}/story`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; draft?: AmplifiSocialDraft; error?: string }) => {
        if (cancelled || !data.ok || !data.draft) {
          if (!cancelled && data.error) setMessage(data.error);
          return;
        }
        setDraft(data.draft);
        if (!businessName) setBusinessName('Your capture');
        if (!storyUrl && initialUrl) setStoryUrl(initialUrl);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [captureId, loggedIn, businessName, initialUrl, storyUrl]);

  useEffect(() => {
    if (!initialUrl?.trim() || !initialTitle?.trim() || captureId) return;
    setDraft(
      buildAmplifiSocialDraft({
        businessName: initialTitle.trim(),
        considerUrl: initialUrl.trim(),
      }),
    );
  }, [initialUrl, initialTitle, captureId]);

  const loadDemo = () => {
    setBusinessName('Selena Executive Coaching');
    setStoryUrl(DEMO_STORY_URL);
    setHeadline('Executive coaching with room to grow visibility and engagement.');
    setQuickWin('A clearer story and stronger next step for their audience.');
    setMessage('');
    setResearchMeta(null);
    generateDraft({
      businessName: 'Selena Executive Coaching',
      storyUrl: DEMO_STORY_URL,
      headline: 'Executive coaching with room to grow visibility and engagement.',
      quickWin: 'A clearer story and stronger next step for their audience.',
    });
  };

  const pickCapture = (id: string) => {
    setSelectedCaptureId(id);
    const capture = captures.find((c) => c.id === id);
    if (!capture) return;
    setResearchMeta(null);
    setBusinessName(capture.businessName ?? capture.title);
    const rawUrl =
      preferPortalMagnifiUrl({
        magnifiUrl: capture.magnifiUrl,
        shareUrl: capture.shareUrl,
        captureId: capture.id,
      }) ?? '';
    const fullUrl = rawUrl.startsWith('/')
      ? absoluteAmplifiShareUrl(rawUrl, PUBLIC_LINKS.platform.replace(/\/$/, ''))
      : rawUrl;
    setStoryUrl(fullUrl);
    setLoading(true);
    fetch(`/api/portal/captures/${encodeURIComponent(id)}/story`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; draft?: AmplifiSocialDraft }) => {
        if (data.ok && data.draft) setDraft(data.draft);
        else generateDraft({ businessName: capture.businessName ?? capture.title, storyUrl: fullUrl });
      })
      .catch(() => generateDraft({ businessName: capture.businessName ?? capture.title, storyUrl: fullUrl }))
      .finally(() => setLoading(false));
  };

  const runAmplifiSearch = async () => {
    if (!loggedIn) {
      setMessage('Sign in to use Amplifi Search.');
      return;
    }
    if (!topic.trim()) {
      setMessage('Enter a topic for Amplifi Search.');
      return;
    }
    setResearching(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/topic-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), dateFrom, dateTo, postCount: postsPerSearch }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        research?: {
          topic: string;
          dateFrom: string;
          dateTo: string;
          researchedAt: string;
          sources: ResearchSource[];
          draft: AmplifiSocialDraft;
          drafts: AmplifiSocialDraft[];
          draftTitle: string;
          warnings: string[];
        };
      };
      if (!res.ok || !data.ok || !data.research) {
        setMessage(data.error ?? 'Amplifi Search could not complete.');
        return;
      }
      const research = data.research;
      setDraft(research.draft);
      setResearchDrafts(Array.isArray(research.drafts) ? research.drafts : [research.draft]);
      setBusinessName(research.draftTitle || topic.trim());
      setStoryUrl(research.sources[0]?.url || '');
      setResearchMeta({
        topic: research.topic,
        dateFrom: research.dateFrom,
        dateTo: research.dateTo,
        researchedAt: research.researchedAt,
        sources: research.sources,
        warnings: research.warnings || [],
      });
      if (research.warnings?.length) setMessage(research.warnings[0] || '');
      setSuccess(`Found ${research.sources.length} source(s) and created ${postsPerSearch} post${postsPerSearch === 1 ? '' : 's'}. Review everything before approval.`);
    } catch {
      setMessage('Network error during Amplifi Search.');
    } finally {
      setResearching(false);
    }
  };

  const keepWatching = async () => {
    if (!loggedIn) {
      setMessage('Sign in to use Keep Watching.');
      return;
    }
    if (!topic.trim()) {
      setMessage('Enter a topic before enabling Keep Watching.');
      return;
    }
    setResearching(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/topic-research/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          topic: topic.trim(),
          cadence: watchCadence,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          endAt: `${watchEndDate}T23:59:59.999Z`,
          postsPerRun: postsPerSearch,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; watch?: TopicWatch };
      if (!res.ok || !data.ok || !data.watch) {
        setMessage(data.error ?? 'Could not enable Keep Watching.');
        return;
      }
      setTopicWatches((current) => [data.watch!, ...current.filter((watch) => watch.id !== data.watch!.id)]);
      setSuccess(`Automatic research enabled through ${watchEndDate}. Amplifi will create ${postsPerSearch} post${postsPerSearch === 1 ? '' : 's'} per search.`);
    } catch {
      setMessage('Could not enable Keep Watching right now.');
    } finally {
      setResearching(false);
    }
  };

  const updateWatch = async (
    watchId: string,
    action: 'pause' | 'resume' | 'stop' | 'run',
  ) => {
    setWatchBusyId(`${action}:${watchId}`);
    try {
      const res = await fetch('/api/portal/amplifi/topic-research/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, watchId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        watch?: TopicWatch;
        research?: {
          topic: string;
          dateFrom: string;
          dateTo: string;
          researchedAt: string;
          sources: ResearchSource[];
          draft: AmplifiSocialDraft;
          drafts: AmplifiSocialDraft[];
          draftTitle: string;
          warnings: string[];
        };
        newSources?: number;
      };
      if (!res.ok || !data.ok || !data.watch) {
        setMessage(data.error ?? 'Watch update failed.');
        return;
      }
      setTopicWatches((current) => current.map((watch) => (watch.id === watchId ? data.watch! : watch)));
      if (action === 'run' && data.research) {
        setDraft(data.research.draft);
        setResearchDrafts(Array.isArray(data.research.drafts) ? data.research.drafts : [data.research.draft]);
        setBusinessName(data.research.draftTitle || data.research.topic);
        setStoryUrl(data.research.sources[0]?.url || '');
        setResearchMeta({
          topic: data.research.topic,
          dateFrom: data.research.dateFrom,
          dateTo: data.research.dateTo,
          researchedAt: data.research.researchedAt,
          sources: data.research.sources,
          warnings: data.research.warnings || [],
        });
        setSuccess(
          data.newSources
            ? `Keep Watching found ${data.newSources} new source${data.newSources === 1 ? '' : 's'}.`
            : 'No genuinely new sources this run.',
        );
      }
    } catch {
      setMessage('Watch update failed due to a network error.');
    } finally {
      setWatchBusyId(null);
    }
  };

  const submitForApproval = async () => {
    if (!loggedIn) {
      setMessage('Sign in to store posts for approval.');
      return;
    }
    if (!draft) {
      setMessage('Generate posts first.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/submit-for-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: businessName.trim(),
          linkedIn: draft.linkedIn,
          caption: draft.shortCaption,
          storyUrl: storyUrl.trim(),
          captureId: selectedCaptureId || captureId,
          research: researchMeta
            ? {
                topic: researchMeta.topic,
                dateFrom: researchMeta.dateFrom,
                dateTo: researchMeta.dateTo,
                researchedAt: researchMeta.researchedAt,
                sources: researchMeta.sources,
                warnings: researchMeta.warnings,
              }
            : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; updatesUrl?: string; requestId?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Could not submit for approval.');
        return;
      }
      setApprovedPost({ requestId: data.requestId, title: businessName.trim() || 'Untitled post', caption: draft.linkedIn, status: 'Ready for publishing review' });
      setSuccess('Post accepted. It is saved in Amplifi and ready for the publishing step.');
      window.setTimeout(() => document.getElementById('approved-posts')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const testPublishingConnection = async () => {
    if (!loggedIn) { setMessage('Sign in to test the publishing connection.'); return; }
    setTestingConnection(true); setConnectionResult('');
    try {
      const res = await fetch('/api/portal/amplifi/test-publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: approvedPost?.title || businessName.trim() || 'Amplifi connection test' }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setConnectionResult(data.ok
        ? 'Connection confirmed. Amplifi reached the publishing workflow without creating a social post.'
        : data.error || 'The publishing connection did not respond. No social post was created.');
    } catch { setConnectionResult('The publishing connection could not be tested. No social post was created.'); }
    finally { setTestingConnection(false); }
  };

  const publishNow = async () => {
    if (!draft) return;
    setPublishingNow(true); setPublishResult('');
    try {
      const res = await fetch('/api/portal/amplifi/native-publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft.linkedIn }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; results?: Array<{ ok: boolean; account: { platform: string }; error?: string }> };
      if (!data.ok) { setPublishResult(data.error || data.results?.map((item) => `${item.account.platform}: ${item.error || 'failed'}`).join(' · ') || 'Publishing failed.'); return; }
      const live = data.results?.filter((item) => item.ok).map((item) => item.account.platform).join(', ');
      const skipped = data.results?.filter((item) => !item.ok).map((item) => `${item.account.platform}: ${item.error}`).join(' · ');
      setPublishResult(`Published to ${live || 'connected channels'}.${skipped ? ` ${skipped}` : ''}`);
    } catch { setPublishResult('Publishing could not be completed.'); }
    finally { setPublishingNow(false); }
  };

  const portalAmplifi = slug ? `/portal/${slug}/amplifi` : null;
  const campaignName = businessName.trim() || 'Your next campaign';
  const sourceCount = researchMeta?.sources.length ?? 0;
  const connectedChannels = [...new Set(socialConnections.map((connection) => connection.platform))];

  const openSection = (sectionId: string) => {
    setShowHome(false);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (showHome) {
    return (
      <AmplifiHome
        ownerMode={slug === 'ea'}
        loggedIn={loggedIn}
        connectedChannels={connectedChannels}
        connectionsLoading={connectionsLoading}
        connectionsError={connectionsError}
        approvedPostTitle={approvedPost?.title}
        onChoosePath={choosePath}
        onOpenSection={openSection}
      />
    );
  }

  return (
    <div className="af-shell">
      {showWelcome ? (
        <div className="af-modal-backdrop" role="presentation">
          <section className="af-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="amplifi-welcome-title">
            <span className="af-eyebrow">Welcome to Amplifi</span>
            <h2 id="amplifi-welcome-title">How would you like Amplifi to help?</h2>
            <p>Choose the outcome you want. Amplifi will take you directly to the right workspace.</p>
            <div className="af-path-grid">
              <button type="button" onClick={() => choosePath('publish')}><span>1</span><strong>I’ll create it</strong><small>Enter your information and build the post or campaign with Amplifi’s guidance.</small></button>
              <button type="button" onClick={() => choosePath('smartchitecture')}><span>2</span><strong>Create it for me</strong><small>Give Amplifi a short brief and receive a complete five-post campaign.</small></button>
              <button type="button" onClick={() => choosePath('research')}><span>3</span><strong>Research and create it</strong><small>Set a topic, timeframe, frequency and 1–3 posts per search. Automatic searches can continue for up to three months.</small></button>
            </div>
            <button type="button" className="af-text-button" onClick={() => setShowWelcome(false)}>I’ll explore on my own</button>
          </section>
        </div>
      ) : null}
      {showHelp ? (
        <div className="af-modal-backdrop" role="presentation" onMouseDown={() => setShowHelp(false)}>
          <section className="af-help-drawer" role="dialog" aria-modal="true" aria-labelledby="amplifi-help-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="af-close-button" aria-label="Close help" onClick={() => setShowHelp(false)}>×</button>
            <span className="af-eyebrow">Amplifi guide</span><h2 id="amplifi-help-title">What would you like to do?</h2>
            <button type="button" onClick={() => { setShowHelp(false); choosePath('publish'); }}><strong>Create or enter a post</strong><small>Start with your words, or let Amplifi generate the message.</small></button>
            <button type="button" onClick={() => { setShowHelp(false); choosePath('research'); }}><strong>Research and create</strong><small>Find timely sources, choose an angle and generate a post.</small></button>
            <button type="button" onClick={() => { setShowHelp(false); choosePath('smartchitecture'); }}><strong>Build from a business goal</strong><small>Turn an objective into a coordinated campaign.</small></button>
            <div className="af-help-note"><strong>Your control is protected.</strong><p>Amplifi shows what happens next before anything is published.</p></div>
          </section>
        </div>
      ) : null}
      <aside className="af-sidebar">
        <Link href="/amplifi/workspace" className="af-logo" aria-label="Amplifi workspace" onClick={(event) => { event.preventDefault(); setShowHome(true); }}>
          <Image className="af-workspace-logo" src="/amplifi/amplifi-logo-premium.png" alt="Amplifi by Efficiency Architects" width={1973} height={797} priority />
        </Link>

        {!showHome ? <div className="af-campaign-context"><button type="button" onClick={() => setShowHome(true)}>← Back to campaigns</button><span>{selectedPath === 'research' ? 'Option 3 of 3' : selectedPath === 'smartchitecture' ? 'Option 2 of 3' : 'Option 1 of 3'}</span><strong>{selectedPath === 'smartchitecture' && generatedCampaign ? `${approvedCampaignPosts.length} of 5 approved` : selectedPath === 'research' ? 'Research & Create' : 'Create a post'}</strong></div> : null}
      </aside>

      <main className={`af-workspace${selectedPath === 'smartchitecture' || selectedPath === 'research' ? ' af-guided-workspace' : ''}`}>
        <header className="af-topbar">
          <div>
            <div className="af-title-row">
              <h1>{campaignName}</h1>
              <span className="af-status-pill">Draft workspace</span>
            </div>
            <p>Build, research and review the next piece of your campaign.</p>
          </div>
          <div className="af-top-actions">
            {loggedIn && portalAmplifi ? <Link href={portalAmplifi} className="af-quiet-link">Portal hub</Link> : <Link href="/portal/login?next=%2Famplifi" className="af-quiet-link">Sign in</Link>}
            <button type="button" className="af-help-button" onClick={() => setShowHelp(true)}>Help</button>
            <button type="button" className="af-create-button" onClick={() => choosePath('publish')}>＋ Create new</button>
          </div>
        </header>

        <div className="af-tabs" id="campaign">
          <a className="af-tab af-tab-active" href="#campaign">Overview</a>
          <a className="af-tab" href="#content">Posts</a>
          <a className="af-tab" href="#search">Research</a>
          <a className="af-tab" href="#results">Results</a>
        </div>

        <div className="af-dashboard-grid">
          <section className="af-primary-column">
            <section className="af-panel af-path-summary" aria-label="Amplifi starting option">
              <div><span className="af-eyebrow">Your Amplifi path</span><h2>{selectedPath === 'research' ? 'Research, create and publish' : selectedPath === 'smartchitecture' ? 'Set the goal. Amplifi builds the campaign.' : 'Create and publish'}</h2></div>
              <button type="button" className="af-secondary-button" onClick={() => setShowWelcome(true)}>Change path</button>
            </section>
            <section className="af-panel af-intro-panel">
              <div>
                <span className="af-eyebrow">Campaign workspace</span>
                <h2>Create work people actually want to stop and read.</h2>
                <p>Start from an EA capture, a source link or fresh research. Amplifi keeps review and publishing controls visible at every step.</p>
              </div>
              <div className="af-intro-orb" aria-hidden="true">A</div>
            </section>

            {loggedIn && captures.length > 0 ? (
              <section className="af-panel af-compact-panel">
                <div className="af-section-heading">
                  <div><span className="af-eyebrow">Campaign source</span><h3>Start from an existing capture</h3></div>
                  <Link href="/capture" className="af-text-action">New capture</Link>
                </div>
                <select className="af-input" value={selectedCaptureId} onChange={(e) => pickCapture(e.target.value)}>
                  <option value="">Select a capture…</option>
                  {captures.map((capture) => <option key={capture.id} value={capture.id}>{capture.title}{capture.businessName ? ` · ${capture.businessName}` : ''}</option>)}
                </select>
              </section>
            ) : null}

            {selectedPath === 'research' ? <section className="af-panel" id="search">
              <div className="af-section-heading">
                <div>
                  <span className="af-eyebrow">Option 3 of 3 — Research &amp; Create</span>
                  <h3>Tell Amplifi what to research and what the campaign must accomplish.</h3>
                  <p>Amplifi searches timely public sources, identifies a useful angle and creates posts for your review.</p>
                </div>
              </div>

                <div className="af-research-form">
                  <label className="af-field af-field-wide"><span>Topic</span><textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What should Amplifi research?" /></label>
                  <label className="af-field"><span>Campaign objective</span><input value={campaignResult} onChange={(e) => setCampaignResult(e.target.value)} placeholder="What should this campaign accomplish?" /></label>
                  <label className="af-field"><span>Audience</span><input value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} placeholder="Who should this reach?" /></label>
                  <label className="af-field"><span>Search content from</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
                  <label className="af-field"><span>Search content through</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
                  <div className="af-field af-monitor-field">
                    <span>Search mode</span>
                    <div className="af-mode-pills">
                      <button
                        type="button"
                        className={searchMode === 'once' ? 'af-mode-active' : ''}
                        onClick={() => setSearchMode('once')}
                      >
                        Search once
                      </button>
                      <button
                        type="button"
                        className={searchMode === 'watch' ? 'af-mode-active' : ''}
                        onClick={() => setSearchMode('watch')}
                      >
                        Keep watching
                      </button>
                    </div>
                  </div>
                  {searchMode === 'watch' ? (
                    <>
                      <label className="af-field">
                        <span>Automatic search frequency</span>
                        <select value={watchCadence} onChange={(e) => setWatchCadence(e.target.value as 'twice-weekly' | 'weekly')}>
                          <option value="weekly">Once weekly</option>
                          <option value="twice-weekly">Twice weekly</option>
                        </select>
                      </label>
                      <label className="af-field">
                        <span>Keep searching through</span>
                        <input type="date" value={watchEndDate} min={new Date().toISOString().slice(0, 10)} max={(() => { const max = new Date(); max.setMonth(max.getMonth() + 3); return max.toISOString().slice(0, 10); })()} onChange={(e) => setWatchEndDate(e.target.value)} />
                        <small>Choose any end date up to three months from today.</small>
                      </label>
                    </>
                  ) : null}
                  <label className="af-field">
                    <span>Posts created per search</span>
                    <select value={postsPerSearch} onChange={(e) => setPostsPerSearch(Number(e.target.value) as 1 | 2 | 3)}>
                      <option value={1}>1 post</option>
                      <option value={2}>2 posts</option>
                      <option value={3}>3 posts</option>
                    </select>
                  </label>
                  <label className="af-field"><span>Tone</span><select value={campaignTone} onChange={(e) => setCampaignTone(e.target.value as CampaignTone)}><option>Bold and direct</option><option>Provocative and challenging</option><option>Authoritative and premium</option><option>Warm and human</option></select></label>
                  <label className="af-field"><span>Call to action</span><input value={campaignCallToAction} onChange={(e) => setCampaignCallToAction(e.target.value)} placeholder="Take the CTP" /></label>
                  <label className="af-field af-field-wide"><span>CTA link</span><input type="url" value={campaignCtaUrl} onChange={(e) => setCampaignCtaUrl(e.target.value)} placeholder="https://cc.efficiencyarchitects.online/ctp" /></label>
                  <button
                    type="button"
                    className="af-primary-button af-research-submit"
                    disabled={researching || !loggedIn}
                    onClick={() => void (searchMode === 'watch' ? keepWatching() : runAmplifiSearch())}
                  >
                    {researching
                      ? 'Working…'
                      : searchMode === 'watch'
                        ? 'Enable Keep Watching'
                        : 'Start research and create posts'}
                  </button>
                </div>

              {!loggedIn ? <p className="af-inline-note">Sign in to start research and save the posts.</p> : null}

              {researchMeta?.sources?.length ? (
                <div className="af-source-grid">
                  {researchMeta.sources.slice(0, 4).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="af-source-card">
                      <span>{source.kind}</span><strong>{source.title}</strong><p>{source.snippet}</p><small>{source.publishedAt || 'Date unconfirmed'}</small>
                    </a>
                  ))}
                </div>
              ) : null}

              {researchDrafts.length ? <div className="af-campaign-results"><h4>{researchDrafts.length} research-based post{researchDrafts.length === 1 ? '' : 's'} created</h4>{researchDrafts.map((post, index) => <article className="af-campaign-post" key={`research-post-${index}`}><span>POST {index + 1} OF {researchDrafts.length}</span><p>{post.linkedIn}</p><small>{post.hashtags.join(' ')}</small></article>)}</div> : null}

              {topicWatches.length ? (
                <div className="af-watch-list">
                  <h4>Keep Watching topics</h4>
                  {topicWatches.map((watch) => (
                    <div key={watch.id} className="af-watch-item">
                      <div>
                        <strong>{watch.topic}</strong>
                        <p>
                          {watch.cadence.replace('-', ' ')} · {watch.status}
                          {watch.lastRunAt ? ` · last run ${new Date(watch.lastRunAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="af-watch-actions">
                        <button
                          type="button"
                          onClick={() => void updateWatch(watch.id, 'run')}
                          disabled={watchBusyId === `run:${watch.id}`}
                        >
                          Run now
                        </button>
                        {watch.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => void updateWatch(watch.id, 'pause')}
                            disabled={watchBusyId === `pause:${watch.id}`}
                          >
                            Pause
                          </button>
                        ) : null}
                        {watch.status === 'paused' ? (
                          <button
                            type="button"
                            onClick={() => void updateWatch(watch.id, 'resume')}
                            disabled={watchBusyId === `resume:${watch.id}`}
                          >
                            Resume
                          </button>
                        ) : null}
                        {watch.status !== 'stopped' ? (
                          <button
                            type="button"
                            onClick={() => void updateWatch(watch.id, 'stop')}
                            disabled={watchBusyId === `stop:${watch.id}`}
                          >
                            Stop
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section> : null}

            {selectedPath === 'smartchitecture' ? <section className="af-panel af-smartchitecture-panel" id="smartchitecture">
              <div className="af-section-heading"><div><span className="af-eyebrow">Create it for me</span><h3>Tell Amplifi what the campaign needs to accomplish.</h3><p>Give Amplifi the brief—not the copy. Amplifi will create five coordinated posts.</p></div></div>
              <fieldset className="af-promotion-scope">
                <legend>What are you promoting?</legend>
                <div>
                  <button type="button" className={promotionScope === 'single' ? 'is-selected' : ''} aria-pressed={promotionScope === 'single'} onClick={() => setPromotionScope('single')}><strong>One product or service</strong><span>Use the simple campaign builder.</span></button>
                  <button type="button" className={promotionScope === 'portfolio' ? 'is-selected' : ''} aria-pressed={promotionScope === 'portfolio'} onClick={() => setPromotionScope('portfolio')}><strong>Multiple products or services</strong><span>Coordinate them under one campaign.</span></button>
                </div>
              </fieldset>
              <div className="af-editor-grid">
                <label className="af-field af-field-wide"><span>{promotionScope === 'portfolio' ? 'Master campaign name' : 'Describe what you are promoting'}</span><textarea value={promotion} onChange={(e) => setPromotion(e.target.value)} placeholder={promotionScope === 'portfolio' ? 'Example: See What EA Can Build' : 'Describe the service, event, offer or idea'} /></label>
                {promotionScope === 'single' ? <label className="af-field"><span>Who should this campaign reach?</span><input value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} placeholder="Your intended audience" /></label> : null}
                <label className="af-field"><span>What result do you want?</span><input value={campaignResult} onChange={(e) => setCampaignResult(e.target.value)} placeholder="The campaign goal" /></label>
                <label className="af-field"><span>Tone</span><select value={campaignTone} onChange={(e) => setCampaignTone(e.target.value as CampaignTone)}><option>Bold and direct</option><option>Provocative and challenging</option><option>Authoritative and premium</option><option>Warm and human</option></select></label>
                <label className="af-field af-field-wide"><span>Verified proof or result</span><input value={campaignProofPoint} onChange={(e) => setCampaignProofPoint(e.target.value)} placeholder="We saved one client $17,000 by automating one process." /></label>
                <label className="af-field af-field-wide"><span>Audience pain question</span><input value={campaignPainQuestion} onChange={(e) => setCampaignPainQuestion(e.target.value)} placeholder="Is your business leaking time, money and resources?" /></label>
                {promotionScope === 'single' ? <><label className="af-field"><span>What should people do next?</span><input value={campaignCallToAction} onChange={(e) => setCampaignCallToAction(e.target.value)} placeholder="Take the CTP" /></label>
                <label className="af-field"><span>CTA link</span><input type="url" value={campaignCtaUrl} onChange={(e) => setCampaignCtaUrl(e.target.value)} placeholder="https://cc.efficiencyarchitects.online/ctp" /></label></> : null}
              </div>
              {promotionScope === 'portfolio' ? <section className="af-portfolio-products" aria-label="Products in this campaign">
                <div className="af-portfolio-heading"><div><span className="af-eyebrow">Campaign products</span><h4>Give each product its own audience and next step.</h4></div><span>{portfolioProducts.length} products</span></div>
                {portfolioProducts.map((product, index) => <article key={product.id} className="af-product-brief">
                  <div className="af-product-brief-head"><strong>Product {index + 1}</strong>{portfolioProducts.length > 2 ? <button type="button" onClick={() => setPortfolioProducts((current) => current.filter((item) => item.id !== product.id))}>Remove</button> : null}</div>
                  <div className="af-editor-grid">
                    <label className="af-field"><span>Product or service</span><input value={product.name} onChange={(e) => updatePortfolioProduct(product.id, { name: e.target.value })} placeholder="Website + client portal" /></label>
                    <label className="af-field"><span>Audience</span><input value={product.audience} onChange={(e) => updatePortfolioProduct(product.id, { audience: e.target.value })} placeholder="Nonprofits and service businesses" /></label>
                    <label className="af-field"><span>What should they do next?</span><input value={product.callToAction} onChange={(e) => updatePortfolioProduct(product.id, { callToAction: e.target.value })} placeholder="View the product demonstration" /></label>
                    <label className="af-field"><span>CTA link <small>optional</small></span><input type="url" value={product.ctaUrl} onChange={(e) => updatePortfolioProduct(product.id, { ctaUrl: e.target.value })} placeholder="https://…" /></label>
                  </div>
                </article>)}
                <button type="button" className="af-add-product" onClick={addPortfolioProduct}>＋ Add another product</button>
              </section> : null}
              <button type="button" className="af-more-control" aria-expanded={showCampaignControls} onClick={() => setShowCampaignControls((value) => !value)}>More control <span>{showCampaignControls ? '−' : '+'}</span></button>
              {showCampaignControls ? <div className="af-editor-grid af-advanced-controls">
                <label className="af-field"><span>Tone strength</span><select value={campaignToneStrength} onChange={(e) => setCampaignToneStrength(e.target.value)}><option>Measured</option><option>Balanced</option><option>Strong</option></select></label>
                <label className="af-field"><span>Image style</span><select value={campaignImageStyle} onChange={(e) => setCampaignImageStyle(e.target.value)}><option>Branded proof graphics</option><option>Bold text graphics</option><option>Clean photography</option><option>Minimal editorial</option></select></label>
                <label className="af-field"><span>Words to use</span><input value={campaignWordsUse} onChange={(e) => setCampaignWordsUse(e.target.value)} placeholder="capacity, control, measurable" /></label>
                <label className="af-field"><span>Words to avoid</span><input value={campaignWordsAvoid} onChange={(e) => setCampaignWordsAvoid(e.target.value)} placeholder="revolutionary, game-changing" /></label>
                <fieldset className="af-field af-platform-choice"><legend>Platforms</legend>{['Facebook','Instagram','LinkedIn','X'].map((platform) => <label key={platform}><input type="checkbox" checked={campaignPlatforms.includes(platform)} onChange={() => toggleCampaignPlatform(platform)} /> {platform}</label>)}</fieldset>
                <label className="af-field"><span>Campaign start date</span><input type="date" value={campaignStartDate} onChange={(e) => setCampaignStartDate(e.target.value)} /></label>
                <label className="af-field af-field-wide"><span>Important dates and details</span><input value={campaignDetails} onChange={(e) => setCampaignDetails(e.target.value)} placeholder="Dates, pricing or requirements" /></label>
                <label className="af-check-row af-field-wide"><input type="checkbox" checked={saveBrandDefaults} onChange={(e) => setSaveBrandDefaults(e.target.checked)} /> Save these as my brand defaults</label>
              </div> : null}
              {message ? <p className="af-message af-message-error">{message}</p> : null}
              {success ? <p className="af-message af-message-success">{success}</p> : null}
              <div className="af-action-row"><button type="button" className="af-primary-button" disabled={campaignGenerating} onClick={() => void createCampaignForMe()}>{campaignGenerating ? 'Amplifi is creating…' : loggedIn ? 'Create my 5-post campaign' : 'Sign in & create my 5-post campaign'}</button><span>{loggedIn ? 'Nothing publishes until you approve it.' : 'Your brief will be saved while you sign in.'}</span></div>
              {generatedCampaign ? <div className="af-campaign-results">{generatedCampaign.architecture?.mode === 'portfolio' ? <PortfolioCampaignCommandCenter campaignId={generatedCampaign.id} architecture={generatedCampaign.architecture} posts={generatedCampaign.posts} approvedPostIndexes={approvedCampaignPosts} schedule={campaignScheduleTimes} /> : null}<h4>{generatedCampaign.title}</h4>{generatedCampaign.strategy ? <p>{generatedCampaign.strategy}</p> : null}{generatedCampaign.posts.map((post, index) => {
                const approved = approvedCampaignPosts.includes(index);
                const imageVariant = (campaignImageVariants[index] ?? 0) % 3;
                const assignedProduct = generatedCampaign.architecture?.products.find((product) => product.id === post.productId);
                const assignedWave = generatedCampaign.architecture?.waves.find((wave) => wave.id === post.waveId);
                return <article className="af-campaign-post" key={`campaign-post-${index}`}>
                  <span>POST {index + 1} OF 5</span>
                  {assignedProduct ? <div className="af-post-assignment"><strong>{assignedProduct.name}</strong><small>{assignedWave?.name || 'Launch wave pending'}</small></div> : null}
                  {campaignUploadedImages[index] ? <img className="af-generated-post-image af-uploaded-post-image" src={campaignUploadedImages[index]} alt={`Uploaded visual for ${post.title}`} /> : <div className={`af-generated-post-image af-image-variant-${imageVariant}`} role="img" aria-label={`Branded image for ${post.title}`}><small>AMPLIFI</small><strong>{index === 2 && campaignProofPoint.trim() ? campaignProofPoint : post.title}</strong><em>{campaignCtaUrl ? 'Take the next step' : campaignTone}</em></div>}
                  {editingCampaignPost === index ? <div className="af-campaign-editor"><label className="af-field"><span>Headline</span><input value={post.title} onChange={(e) => updateCampaignPost(index, { title: e.target.value })} /></label><label className="af-field"><span>Post copy</span><textarea value={post.caption} onChange={(e) => updateCampaignPost(index, { caption: e.target.value })} /></label><label className="af-field"><span>Call to action</span><input value={post.callToAction} onChange={(e) => updateCampaignPost(index, { callToAction: e.target.value })} /></label></div> : <><h4>{post.title}</h4><p>{post.caption}</p><strong>Call to action</strong><p>{post.callToAction}</p></>}
                  <div className="af-platform-preview">Preview: {campaignPlatforms.join(' · ') || 'Choose a platform'}</div>
                  <label className="af-regen-field"><span>Want a different version?</span><input value={regenerationInstructions[index] ?? ''} onChange={(e) => setRegenerationInstructions((current) => ({ ...current, [index]: e.target.value }))} placeholder="Make it sharper, shorter, or more specific…" /></label>
                  <div className="af-post-controls"><button type="button" onClick={() => setEditingCampaignPost(editingCampaignPost === index ? null : index)}>{editingCampaignPost === index ? 'Save edit' : 'Edit'}</button><button type="button" onClick={() => regenerateCampaignPost(index)}>Regenerate with instructions</button><button type="button" className={approved ? 'is-approved' : ''} onClick={() => setApprovedCampaignPosts((current) => approved ? current.filter((postIndex) => postIndex !== index) : [...current, index])}>{approved ? 'Approved' : 'Approve'}</button><label className="af-upload-button">Upload image<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCampaignUploadedImages((current) => ({ ...current, [index]: URL.createObjectURL(file) })); }} /></label></div>
                </article>;
              })}{approvedCampaignPosts.length === 5 ? <section className="af-schedule-panel" id="campaign-schedule"><span className="af-eyebrow">All 5 posts approved</span><h3>Review and schedule campaign</h3><p>Choose where and when each approved post should publish. Social connections appear here only when you are ready to schedule.</p><div className="af-schedule-list">{generatedCampaign.posts.map((post, index) => <label className="af-field" key={`schedule-${index}`}><span>Post {index + 1}: {post.title}</span><input type="datetime-local" value={campaignScheduleTimes[index] ?? ''} onChange={(e) => setCampaignScheduleTimes((current) => ({ ...current, [index]: e.target.value }))} /></label>)}</div>{portfolioScheduleConflicts.length ? <div className="af-schedule-conflicts" role="alert"><strong>Resolve schedule conflicts before saving.</strong>{portfolioScheduleConflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}</div> : null}<div className="af-schedule-platforms"><strong>Publish to</strong>{campaignPlatforms.map((platform) => <span key={platform}>{platform}</span>)}</div><a className="af-secondary-button af-connect-action" href="#connections">Review social connections</a><button type="button" className="af-primary-button" disabled={campaignPlatforms.length === 0 || Object.keys(campaignScheduleTimes).length < 5 || portfolioScheduleConflicts.length > 0 || campaignScheduleSaving} onClick={() => void saveCampaignSchedule()}>{campaignScheduleSaving ? 'Saving schedule…' : campaignScheduled ? 'Campaign schedule saved' : 'Save campaign schedule'}</button>{campaignScheduled ? <p className="af-message af-message-success">Schedule saved. Publishing will proceed only after account and media checks pass.</p> : null}</section> : null}</div> : null}
            </section> : null}
            {selectedPath === 'publish' ? <section className="af-panel" id="content">
              <div className="af-section-heading">
                <div><span className="af-eyebrow">Content studio</span><h3>Shape the post</h3><p>Keep the inputs simple. Amplifi turns the source and angle into usable social copy.</p></div>
                <button type="button" className="af-text-action af-button-link" onClick={loadDemo}>Load demo</button>
              </div>

              <div className="af-editor-grid">
                <label className="af-field"><span>Post title</span><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Campaign or post title" /></label>
                <label className="af-field"><span>Primary source</span><input value={storyUrl} onChange={(e) => setStoryUrl(e.target.value)} placeholder="https://…" /></label>
                <label className="af-field af-field-wide"><span>Hook <small>optional</small></span><textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Opening thought that earns attention" /></label>
                <label className="af-field af-field-wide"><span>Useful takeaway <small>optional</small></span><input value={quickWin} onChange={(e) => setQuickWin(e.target.value)} placeholder="One thing the reader should leave with" /></label>
              </div>

              {message ? <p className="af-message af-message-error">{message}</p> : null}
              {success ? <p className="af-message af-message-success">{success}</p> : null}

              <div className="af-action-row">
                <button type="button" className="af-primary-button" disabled={loading} onClick={() => generateDraft()}>{loading ? 'Loading…' : draft ? 'Regenerate draft' : 'Generate draft'}</button>
                <span>Nothing publishes from this screen without review.</span>
              </div>
            </section> : null}

            {draft ? (
              <section className="af-panel af-draft-panel">
                <div className="af-section-heading">
                  <div><span className="af-eyebrow">Planned post</span><h3>Review the creative before it moves forward.</h3></div>
                  <span className="af-review-chip">Needs review</span>
                </div>

                <div className="af-social-preview">
                  <div className="af-social-preview-head"><span className="af-network-mark">in</span><div><strong>LinkedIn draft</strong><small>Preview</small></div></div>
                  <div className="af-creative-card"><div className="af-creative-glow" /><span className="af-creative-brand">AMPLIFI</span><h4>{headline.trim() || businessName.trim() || 'A clearer story deserves a stronger next step.'}</h4><p>{quickWin.trim() || 'Turn useful insight into content your audience can act on.'}</p></div>
                  <StoryDraftPanel draft={draft} />
                </div>

                <div className="af-review-actions">
                  <button type="button" className="af-approve-button" disabled={submitting || !loggedIn || Boolean(approvedPost)} onClick={() => void submitForApproval()}>{submitting ? 'Saving…' : approvedPost ? '✓ Accepted and saved' : '✓ Accept post'}</button>
                  <button type="button" className="af-edit-button" onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}>✎ Edit</button>
                  <button type="button" className="af-reject-button" onClick={() => { setDraft(null); setSuccess('Draft removed. Your source and inputs are still here.'); }}>⊘ Reject</button>
                </div>

                <div className="af-manual-share">
                  <span>Manual share</span>
                  <button type="button" onClick={() => openSocialShare('linkedin', draft, storyUrl.trim() || DEMO_STORY_URL)}>LinkedIn</button>
                  <button type="button" onClick={() => openSocialShare('facebook', draft, storyUrl.trim() || DEMO_STORY_URL)}>Facebook</button>
                  <button type="button" onClick={() => openSocialShare('x', draft, storyUrl.trim() || DEMO_STORY_URL)}>X</button>
                  {loggedIn ? <a href="#approved-posts">Approved posts →</a> : null}
                </div>
              </section>
            ) : (
              <section className="af-empty-creative"><span>✦</span><div><strong>Your creative preview will appear here.</strong><p>Add a source and generate a draft, or start with Smart Research.</p></div></section>
            )}

            <section className="af-panel af-approved-panel" id="approved-posts">
              <div className="af-section-heading"><div><span className="af-eyebrow">Approved posts</span><h3>{approvedPost ? 'Your post is saved and ready for the next step.' : 'Accepted posts will appear here.'}</h3></div>{approvedPost ? <span className="af-review-chip af-approved-chip">Accepted</span> : null}</div>
              {approvedPost ? <div className="af-approved-card"><div><strong>{approvedPost.title}</strong><small>{approvedPost.status}{approvedPost.requestId ? ` · ${approvedPost.requestId}` : ''}</small></div><div className="af-approved-actions"><button type="button" className="af-primary-button" disabled={publishingNow || !socialConnections.length} onClick={() => void publishNow()}>{publishingNow ? 'Publishing…' : socialConnections.length ? 'Publish now' : 'Connect accounts first'}</button><button type="button" className="af-secondary-button" disabled={testingConnection} onClick={() => void testPublishingConnection()}>{testingConnection ? 'Testing…' : 'Test publishing connection'}</button></div></div> : <p>Create a draft, review it and select “Accept post.” You will stay inside Amplifi.</p>}
              {connectionResult ? <p className="af-message af-message-success" role="status">{connectionResult}</p> : null}
              {publishResult ? <p className={publishResult.startsWith('Published') ? 'af-message af-message-success' : 'af-message af-message-error'} role="status">{publishResult}</p> : null}
            </section>
            <section className="af-next-strip" id="calendar">
              <div><span className="af-strip-icon">✓</span><p><strong>Next step</strong><small>{approvedPost ? 'Post saved. Test the publishing connection or choose a publishing time.' : draft ? 'Review the draft and accept it.' : 'Choose a path and create the first draft.'}</small></p></div>
              <div><span className="af-strip-icon">◷</span><p><strong>Optimal times</strong><small>Scheduling recommendations appear with approved campaign posts.</small></p></div>
              <div><span className="af-strip-icon">⌕</span><p><strong>Smart Research</strong><small>{sourceCount ? `${sourceCount} source${sourceCount === 1 ? '' : 's'} found in this session.` : 'Research is ready when you need a fresh angle.'}</small></p></div>
            </section>
          </section>

          <aside className="af-insights-column">
            <section className="af-panel af-connections-panel" id="connections">
              <div className="af-section-heading"><div><span className="af-eyebrow">Social connections</span><h3>Connect directly to Amplifi.</h3></div></div>
              <p>Use each platform’s official authorization. Amplifi never asks for or stores your social-media password.</p>
              <div className="af-platform-grid">
                {[
                  { name: 'Facebook', provider: 'meta' as const },
                  { name: 'Instagram', provider: 'meta' as const },
                  { name: 'LinkedIn', provider: 'linkedin' as const },
                  { name: 'TikTok', provider: 'tiktok' as const },
                  { name: 'X', provider: 'x' as const },
                ].map(({ name, provider }) => {
                  const connection = socialConnections.find((item) => item.platform.toLowerCase() === name.toLowerCase());
                  const status = providerStatuses.find((item) => item.provider === provider);
                  return <div className={connection ? 'af-platform-card af-platform-connected' : 'af-platform-card'} key={name}>
                    <span>{connection ? '✓' : '○'}</span>
                    <div><strong>{name}</strong><small>{connection ? connection.name || 'Connected' : status?.configured ? 'Ready to connect' : 'Developer setup required'}</small></div>
                    {status?.configured && !connection ? <a href={`/api/portal/amplifi/native-connections/${provider}/start`}>Connect</a> : null}
                  </div>;
                })}
              </div>
              {connectionsLoading ? <p className="af-connection-note">Checking connections…</p> : null}
              {!connectionsLoading && connectionsError ? <p className="af-message af-message-error" role="alert">{connectionsError} Your saved connection status has not been changed.</p> : null}
              {!connectionsLoading && !connectionsConfigured ? <p className="af-message af-message-error">EA’s platform credentials must be approved and added before client authorization can open.</p> : null}
              {socialConnections.length ? <button type="button" className="af-text-button" onClick={() => void loadConnections()}>Refresh connections</button> : null}
            </section>
            <div id="results">
            <section className="af-panel af-performance-panel">
              <div className="af-section-heading af-tight-heading"><div><span className="af-eyebrow">Campaign performance</span><h3>Results</h3></div><span className="af-live-dot">Live after publish</span></div>
              <div className="af-metric-grid">
                <div><span>Reach</span><strong>—</strong><small>Waiting for live data</small></div>
                <div><span>Engagements</span><strong>—</strong><small>Waiting for live data</small></div>
                <div><span>Link clicks</span><strong>—</strong><small>Tracked after publish</small></div>
                <div><span>Conversions</span><strong>—</strong><small>Attributed when available</small></div>
              </div>
              <div className="af-chart-placeholder"><span /><span /><span /><span /><span /><span /><span /></div>
              <p className="af-data-note">No vanity numbers. This panel stays empty until Amplifi has real campaign data to report.</p>
            </section>

            <section className="af-panel af-health-panel">
              <span className="af-eyebrow">Campaign health</span>
              <div className="af-health-title"><strong>{draft ? 'Creative ready for review' : 'Build in progress'}</strong><span>{draft ? '75%' : '35%'}</span></div>
              <div className="af-health-track"><span style={{ width: draft ? '75%' : '35%' }} /></div>
              <ul>
                <li className={storyUrl ? 'is-ready' : ''}><span />Source connected</li>
                <li className={researchMeta ? 'is-ready' : ''}><span />Research grounded</li>
                <li className={draft ? 'is-ready' : ''}><span />Creative generated</li>
                <li><span />Approval complete</li>
              </ul>
            </section>

            <section className="af-panel af-rules-panel">
              <span className="af-eyebrow">Publishing guardrail</span>
              <h3>Human approval stays in the loop.</h3>
              <p>{MAGNIFI_PUBLIC_LINK_WARNING}</p>
              <Link href="/amplifi/install" className="af-text-action">Install Amplifi →</Link>
            </section>
                      </div>
</aside>
        </div>
      </main>
    </div>
  );
}
