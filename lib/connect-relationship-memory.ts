export type ConnectAiProfile = {
  summary: string;
  interestLevel: 'Low' | 'Medium' | 'High';
  engagementScore: number;
  opportunityScore: number;
  recommendedAction: string;
  followUpPriority: 'Low' | 'Medium' | 'High' | 'Immediate';
  reasons: string[];
  memorySource?: 'rules' | 'openai';
  memoryModel?: string;
  memoryRefreshedAt?: string;
  memoryConfidence?: number;
};

export type ConnectMemoryRelationship = {
  id: string;
  orgSlug: string;
  name: string;
  email: string;
  phone?: string;
  leadType: string;
  status: string;
  event?: string;
  representative?: string;
  conversationNotes?: string;
  tags: string[];
  engagement: {
    scans: number;
    opens: number;
    clicks: number;
    downloads: number;
    videoViews: number;
    portalVisits: number;
    applicationsStarted: number;
    applicationsCompleted: number;
    messages: number;
    followUpsCompleted: number;
  };
  aiProfile: ConnectAiProfile;
};

export type ConnectMemoryRefreshContext = {
  org?: {
    name: string;
    slug: string;
    offer?: { resourceTitle?: string };
  };
  trigger?: 'capture' | 'engagement' | 'voice_note' | 'admin' | 'matrix';
  engagementType?: string;
  voiceNote?: string;
};

type OpenAiProfilePayload = {
  summary?: string;
  interestLevel?: ConnectAiProfile['interestLevel'];
  engagementScore?: number;
  opportunityScore?: number;
  recommendedAction?: string;
  followUpPriority?: ConnectAiProfile['followUpPriority'];
  reasons?: string[];
  confidence?: number;
};

const DEFAULT_MODEL = process.env.CONNECT_OPENAI_MODEL?.trim() || 'gpt-4o-mini';

export function isConnectMemoryConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function clampScore(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeInterestLevel(value: unknown, fallback: ConnectAiProfile['interestLevel']): ConnectAiProfile['interestLevel'] {
  return value === 'Low' || value === 'Medium' || value === 'High' ? value : fallback;
}

function normalizeFollowUpPriority(
  value: unknown,
  fallback: ConnectAiProfile['followUpPriority'],
): ConnectAiProfile['followUpPriority'] {
  return value === 'Low' || value === 'Medium' || value === 'High' || value === 'Immediate' ? value : fallback;
}

function buildPrompt(
  relationship: ConnectMemoryRelationship,
  baseline: ConnectAiProfile,
  context?: ConnectMemoryRefreshContext,
): string {
  const orgName = context?.org?.name ?? relationship.orgSlug;
  const offer = context?.org?.offer?.resourceTitle ?? 'resource delivery';
  const trigger = context?.trigger ?? 'capture';
  const engagementType = context?.engagementType ? `Latest engagement: ${context.engagementType}.` : '';
  const voiceNote = context?.voiceNote ? `Voice note: ${context.voiceNote}` : '';

  return [
    'You update living relationship profiles for a Connect CRM.',
    'Return strict JSON with keys: summary, interestLevel, engagementScore, opportunityScore, recommendedAction, followUpPriority, reasons, confidence.',
    'interestLevel must be Low, Medium, or High.',
    'followUpPriority must be Low, Medium, High, or Immediate.',
    'reasons must be a short array of concrete signals.',
    'confidence is 0-100 for how certain you are.',
    '',
    `Organization: ${orgName}`,
    `Primary offer: ${offer}`,
    `Trigger: ${trigger}`,
    engagementType,
    voiceNote,
    '',
    `Name: ${relationship.name}`,
    `Email: ${relationship.email}`,
    `Phone: ${relationship.phone ?? 'none'}`,
    `Lead type: ${relationship.leadType}`,
    `Status: ${relationship.status}`,
    `Event: ${relationship.event ?? 'none'}`,
    `Representative: ${relationship.representative ?? 'none'}`,
    `Notes: ${relationship.conversationNotes ?? 'none'}`,
    `Tags: ${relationship.tags.join(', ') || 'none'}`,
    `Engagement: scans=${relationship.engagement.scans}, opens=${relationship.engagement.opens}, clicks=${relationship.engagement.clicks}, downloads=${relationship.engagement.downloads}, portalVisits=${relationship.engagement.portalVisits}, applicationsStarted=${relationship.engagement.applicationsStarted}, applicationsCompleted=${relationship.engagement.applicationsCompleted}, messages=${relationship.engagement.messages}, followUpsCompleted=${relationship.engagement.followUpsCompleted}`,
    `Rule baseline summary: ${baseline.summary}`,
    `Rule baseline opportunityScore: ${baseline.opportunityScore}`,
    `Rule baseline recommendedAction: ${baseline.recommendedAction}`,
  ].join('\n');
}

async function callOpenAiProfile(
  relationship: ConnectMemoryRelationship,
  baseline: ConnectAiProfile,
  context?: ConnectMemoryRefreshContext,
): Promise<ConnectAiProfile | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a relationship intelligence assistant for nonprofit and athletics recruiting teams. Be concise and actionable.',
        },
        {
          role: 'user',
          content: buildPrompt(relationship, baseline, context),
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error('[connect-memory] OpenAI request failed', response.status, await response.text().catch(() => ''));
    return null;
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  let parsed: OpenAiProfilePayload;
  try {
    parsed = JSON.parse(content) as OpenAiProfilePayload;
  } catch {
    console.error('[connect-memory] OpenAI JSON parse failed');
    return null;
  }

  const reasons = Array.isArray(parsed.reasons)
    ? parsed.reasons.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
    : baseline.reasons;

  return {
    summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : baseline.summary,
    interestLevel: normalizeInterestLevel(parsed.interestLevel, baseline.interestLevel),
    engagementScore: clampScore(parsed.engagementScore, baseline.engagementScore),
    opportunityScore: clampScore(parsed.opportunityScore, baseline.opportunityScore),
    recommendedAction:
      typeof parsed.recommendedAction === 'string' && parsed.recommendedAction.trim()
        ? parsed.recommendedAction.trim()
        : baseline.recommendedAction,
    followUpPriority: normalizeFollowUpPriority(parsed.followUpPriority, baseline.followUpPriority),
    reasons: reasons.length ? reasons : baseline.reasons,
    memorySource: 'openai',
    memoryModel: DEFAULT_MODEL,
    memoryRefreshedAt: new Date().toISOString(),
    memoryConfidence: clampScore(parsed.confidence, 70),
  };
}

export async function refreshConnectRelationshipMemory(
  relationship: ConnectMemoryRelationship,
  baseline: ConnectAiProfile,
  context?: ConnectMemoryRefreshContext,
): Promise<ConnectAiProfile> {
  if (!isConnectMemoryConfigured()) {
    return {
      ...baseline,
      memorySource: 'rules',
      memoryRefreshedAt: new Date().toISOString(),
    };
  }

  try {
    const aiProfile = await callOpenAiProfile(relationship, baseline, context);
    if (aiProfile) return aiProfile;
  } catch (error) {
    console.error('[connect-memory] refresh failed', error);
  }

  return {
    ...baseline,
    memorySource: 'rules',
    memoryRefreshedAt: new Date().toISOString(),
  };
}
