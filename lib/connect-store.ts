import type {
  ConnectDestinationRule,
  ConnectionClassification,
  ConnectionRecord,
  ConnectProfile,
  ConnectResource,
  NewConnectionInput,
  NewConnectProfileInput,
} from './connect-types';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const PROFILES_TABLE = process.env.AIRTABLE_CONNECT_PROFILES_TABLE ?? 'connect_profiles';
const CONNECTIONS_TABLE = process.env.AIRTABLE_CONNECTIONS_TABLE ?? 'connections';

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };

function key() {
  const value = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? '';
  return value.length > 12 ? value : '';
}

function baseId() {
  return BASE_ID.length > 8 ? BASE_ID : '';
}

function fallbackProfile(slug = 'ea-test'): ConnectProfile {
  const now = nowIso();
  if (slug === 'bob-rumball-discovery') {
    return {
      id: 'local-bob-rumball-discovery',
      ownerUserId: 'demo@efficiencyarchitects.online',
      slug,
      brandName: 'Bob Rumball Training Transformation',
      primaryColor: '#2563EB',
      headline: 'Help us map the knowledge that matters',
      subheadline:
        'This discovery intake helps capture roles, workflows, training gaps, accessibility needs, and the institutional knowledge that should become part of the future Knowledge Operating System.',
      ctaText: 'Join Discovery',
      defaultDestinationUrl: '',
      destinations: [],
      resources: [
        {
          label: 'Discovery focus',
          url: 'https://efficiencyarchitects.online',
          tags: ['discovery', 'training-transformation', 'knowledge-capture'],
        },
      ],
      welcomeEmailSubject: 'Thanks for joining the training transformation discovery',
      welcomeEmailBody:
        'Thanks for sharing your context. The discovery process will focus on understanding responsibilities, workflows, training gaps, accessibility needs, and critical knowledge before anything is built.',
      ownerNotificationEmail: 'demo@efficiencyarchitects.online',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }
  return {
    id: `local-${slug}`,
    ownerUserId: 'demo@efficiencyarchitects.online',
    slug,
    brandName: 'Efficiency Architects',
    primaryColor: '#5B8CFF',
    headline: 'Start the right conversation',
    subheadline: 'Share who you are, why you are here, and how we should follow up. Connect will capture the context, guide the next step, and route you forward.',
    ctaText: 'Register',
    defaultDestinationUrl: 'https://efficiencyarchitects.online',
    destinations: [],
    resources: [{ label: 'Efficiency Architects', url: 'https://efficiencyarchitects.online', tags: ['intro'] }],
    welcomeEmailSubject: 'Thanks for connecting with Efficiency Architects',
    welcomeEmailBody: 'Thanks for connecting. We received your information and will follow up soon.',
    ownerNotificationEmail: 'demo@efficiencyarchitects.online',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${key()}`,
    'Content-Type': 'application/json',
  };
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toJson(value: unknown) {
  return JSON.stringify(value ?? []);
}

function text(fields: Record<string, unknown>, name: string) {
  return String(fields[name] ?? '').trim();
}

function bool(fields: Record<string, unknown>, name: string, fallback = false) {
  const value = fields[name];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
}

function num(fields: Record<string, unknown>, name: string) {
  const value = fields[name];
  return typeof value === 'number' ? value : undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function mapProfile(record: AirtableRecord): ConnectProfile {
  const f = record.fields;
  return {
    id: record.id,
    ownerUserId: text(f, 'owner_user_id') || 'admin',
    slug: text(f, 'slug'),
    brandName: text(f, 'brand_name') || 'Efficiency Architects',
    logoUrl: text(f, 'logo_url') || undefined,
    primaryColor: text(f, 'primary_color') || '#0A66FF',
    headline: text(f, 'headline') || 'Let us stay connected.',
    subheadline: text(f, 'subheadline') || undefined,
    ctaText: text(f, 'cta_text') || 'Connect',
    defaultDestinationUrl: text(f, 'default_destination_url') || undefined,
    destinations: parseJsonArray<ConnectDestinationRule>(f.destinations),
    resources: parseJsonArray<ConnectResource>(f.resources),
    welcomeEmailSubject: text(f, 'welcome_email_subject') || undefined,
    welcomeEmailBody: text(f, 'welcome_email_body') || undefined,
    ownerNotificationEmail: text(f, 'owner_notification_email') || undefined,
    isActive: bool(f, 'is_active', true),
    createdAt: text(f, 'created_at') || record.createdTime || '',
    updatedAt: text(f, 'updated_at') || text(f, 'created_at') || record.createdTime || '',
  };
}

function profileFields(input: NewConnectProfileInput | Partial<NewConnectProfileInput>) {
  const fields: Record<string, string | boolean> = {};
  if (input.ownerUserId != null) fields.owner_user_id = input.ownerUserId;
  if (input.slug != null) fields.slug = input.slug;
  if (input.brandName != null) fields.brand_name = input.brandName;
  if (input.logoUrl != null) fields.logo_url = input.logoUrl;
  if (input.primaryColor != null) fields.primary_color = input.primaryColor;
  if (input.headline != null) fields.headline = input.headline;
  if (input.subheadline != null) fields.subheadline = input.subheadline;
  if (input.ctaText != null) fields.cta_text = input.ctaText;
  if (input.defaultDestinationUrl != null) fields.default_destination_url = input.defaultDestinationUrl;
  if (input.destinations != null) fields.destinations = toJson(input.destinations);
  if (input.resources != null) fields.resources = toJson(input.resources);
  if (input.welcomeEmailSubject != null) fields.welcome_email_subject = input.welcomeEmailSubject;
  if (input.welcomeEmailBody != null) fields.welcome_email_body = input.welcomeEmailBody;
  if (input.ownerNotificationEmail != null) fields.owner_notification_email = input.ownerNotificationEmail;
  if (input.isActive != null) fields.is_active = input.isActive;
  fields.updated_at = nowIso();
  return fields;
}

function mapConnection(record: AirtableRecord): ConnectionRecord {
  const f = record.fields;
  return {
    id: record.id,
    connectProfileId: text(f, 'connect_profile_id'),
    ownerUserId: text(f, 'owner_user_id') || 'admin',
    name: text(f, 'name'),
    email: text(f, 'email').toLowerCase(),
    phone: text(f, 'phone') || undefined,
    company: text(f, 'company') || undefined,
    role: text(f, 'role') || undefined,
    location: text(f, 'location') || undefined,
    notes: text(f, 'notes') || undefined,
    campaign: text(f, 'campaign') || undefined,
    referralSource: text(f, 'referral_source') || undefined,
    utmSource: text(f, 'utm_source') || undefined,
    utmMedium: text(f, 'utm_medium') || undefined,
    utmCampaign: text(f, 'utm_campaign') || undefined,
    connectionMethod: (text(f, 'connection_method') || 'email') as ConnectionRecord['connectionMethod'],
    device: text(f, 'device') || undefined,
    browser: text(f, 'browser') || undefined,
    aiIndustry: text(f, 'ai_industry') || undefined,
    aiConnectionType: text(f, 'ai_connection_type') || undefined,
    aiOpportunityType: text(f, 'ai_opportunity_type') || undefined,
    aiPriority: (text(f, 'ai_priority') || undefined) as ConnectionRecord['aiPriority'],
    aiRecommendedFollowUp: text(f, 'ai_recommended_follow_up') || undefined,
    aiRecommendedDestination: text(f, 'ai_recommended_destination') || undefined,
    aiSuggestedResource: text(f, 'ai_suggested_resource') || undefined,
    aiWatchListMatch: text(f, 'ai_watch_list_match') || undefined,
    aiRelationshipScore: num(f, 'ai_relationship_score'),
    destinationUrl: text(f, 'destination_url') || undefined,
    automationStatus: text(f, 'automation_status') || 'pending',
    createdAt: text(f, 'created_at') || record.createdTime || '',
    updatedAt: text(f, 'updated_at') || text(f, 'created_at') || record.createdTime || '',
  };
}

function connectionFields(
  input: NewConnectionInput,
  classification: ConnectionClassification,
  destinationUrl: string | undefined,
) {
  const ts = nowIso();
  const fields: Record<string, string | number> = {
    connect_profile_id: input.connectProfileId,
    owner_user_id: input.ownerUserId,
    name: input.name,
    email: input.email,
    connection_method: input.connectionMethod,
    ai_industry: classification.industry,
    ai_connection_type: classification.connectionType,
    ai_opportunity_type: classification.opportunityType,
    ai_priority: classification.priority,
    ai_recommended_follow_up: classification.recommendedFollowUp,
    ai_watch_list_match: classification.watchListMatch,
    ai_relationship_score: classification.relationshipScore,
    automation_status: 'pending',
    created_at: ts,
    updated_at: ts,
  };
  if (input.phone) fields.phone = input.phone;
  if (input.company) fields.company = input.company;
  if (input.role) fields.role = input.role;
  if (input.location) fields.location = input.location;
  if (input.notes) fields.notes = input.notes;
  if (input.campaign) fields.campaign = input.campaign;
  if (input.referralSource) fields.referral_source = input.referralSource;
  if (input.utmSource) fields.utm_source = input.utmSource;
  if (input.utmMedium) fields.utm_medium = input.utmMedium;
  if (input.utmCampaign) fields.utm_campaign = input.utmCampaign;
  if (input.device) fields.device = input.device;
  if (input.browser) fields.browser = input.browser;
  if (classification.recommendedDestination) fields.ai_recommended_destination = classification.recommendedDestination;
  if (classification.suggestedResource) fields.ai_suggested_resource = classification.suggestedResource;
  if (destinationUrl) fields.destination_url = destinationUrl;
  return fields;
}

function airtableError(status: number, detail: string, table: string) {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string } };
    if (parsed.error?.message) return `${table}: ${parsed.error.message}`;
  } catch {
    // ignore
  }
  return `${table}: Airtable request failed (${status}).`;
}

async function listRecords(table: string, params: URLSearchParams): Promise<AirtableRecord[]> {
  if (!key() || !baseId()) return [];
  const url = `https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(table)}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records ?? [];
}

export async function listConnectProfiles(): Promise<ConnectProfile[]> {
  if (!key() || !baseId()) return [fallbackProfile(), fallbackProfile('bob-rumball-discovery')];
  const params = new URLSearchParams({
    'sort[0][field]': 'updated_at',
    'sort[0][direction]': 'desc',
    maxRecords: '100',
  });
  return (await listRecords(PROFILES_TABLE, params)).map(mapProfile);
}

export async function getConnectProfileBySlug(slug: string): Promise<ConnectProfile | null> {
  if (!key() || !baseId()) {
    const safeSlug = slug.trim().toLowerCase();
    if (safeSlug === 'ea-test') return fallbackProfile('ea-test');
    if (safeSlug === 'bob-rumball-discovery') return fallbackProfile('bob-rumball-discovery');
    return null;
  }
  const safe = slug.trim().toLowerCase().replace(/'/g, "\\'");
  const params = new URLSearchParams({
    filterByFormula: `LOWER({slug})='${safe}'`,
    maxRecords: '1',
  });
  const rec = (await listRecords(PROFILES_TABLE, params))[0];
  return rec ? mapProfile(rec) : null;
}

export async function getConnectProfileById(id: string): Promise<ConnectProfile | null> {
  if (!key() || !baseId()) {
    if (id === 'local-ea-test') return fallbackProfile();
    if (id === 'local-bob-rumball-discovery') return fallbackProfile('bob-rumball-discovery');
    return null;
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(PROFILES_TABLE)}/${id}`,
    { headers: authHeaders(), cache: 'no-store' },
  );
  if (!res.ok) return null;
  return mapProfile((await res.json()) as AirtableRecord);
}

export async function createConnectProfile(input: NewConnectProfileInput) {
  if (!key() || !baseId()) return { ok: false, error: 'Airtable is not configured locally. Use /connect/ea-test for local preview.' };
  const fields = { ...profileFields(input), created_at: nowIso() };
  const res = await fetch(`https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(PROFILES_TABLE)}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) return { ok: false, error: airtableError(res.status, await res.text(), PROFILES_TABLE) };
  const data = (await res.json()) as { records?: AirtableRecord[] };
  const rec = data.records?.[0];
  return rec ? { ok: true, profile: mapProfile(rec) } : { ok: false, error: 'Empty Airtable response.' };
}

export async function updateConnectProfile(id: string, input: Partial<NewConnectProfileInput>) {
  if (!key() || !baseId()) return { ok: false, error: 'Airtable is not configured locally. Use /connect/ea-test for local preview.' };
  const res = await fetch(`https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(PROFILES_TABLE)}/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ fields: profileFields(input), typecast: true }),
  });
  if (!res.ok) return { ok: false, error: airtableError(res.status, await res.text(), PROFILES_TABLE) };
  return { ok: true, profile: mapProfile((await res.json()) as AirtableRecord) };
}

export async function listConnections(limit = 100): Promise<ConnectionRecord[]> {
  if (!key() || !baseId()) return [];
  const params = new URLSearchParams({
    'sort[0][field]': 'created_at',
    'sort[0][direction]': 'desc',
    maxRecords: String(limit),
  });
  return (await listRecords(CONNECTIONS_TABLE, params)).map(mapConnection);
}

export async function createConnectionRecord(
  input: NewConnectionInput,
  classification: ConnectionClassification,
  destinationUrl: string | undefined,
) {
  if (!key() || !baseId()) {
    const now = nowIso();
    return {
      ok: true,
      connection: {
        id: `local-connection-${Date.now()}`,
        ...input,
        aiIndustry: classification.industry,
        aiConnectionType: classification.connectionType,
        aiOpportunityType: classification.opportunityType,
        aiPriority: classification.priority,
        aiRecommendedFollowUp: classification.recommendedFollowUp,
        aiRecommendedDestination: classification.recommendedDestination,
        aiSuggestedResource: classification.suggestedResource,
        aiWatchListMatch: classification.watchListMatch,
        aiRelationshipScore: classification.relationshipScore,
        destinationUrl,
        automationStatus: 'local-preview',
        createdAt: now,
        updatedAt: now,
      },
    };
  }
  const res = await fetch(`https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(CONNECTIONS_TABLE)}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ records: [{ fields: connectionFields(input, classification, destinationUrl) }], typecast: true }),
  });
  if (!res.ok) return { ok: false, error: airtableError(res.status, await res.text(), CONNECTIONS_TABLE) };
  const data = (await res.json()) as { records?: AirtableRecord[] };
  const rec = data.records?.[0];
  return rec ? { ok: true, connection: mapConnection(rec) } : { ok: false, error: 'Empty Airtable response.' };
}

export async function updateConnectionAutomationStatus(id: string, status: string) {
  if (!key() || !baseId() || id.startsWith('local-')) return { ok: true };
  const res = await fetch(`https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(CONNECTIONS_TABLE)}/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ fields: { automation_status: status, updated_at: nowIso() }, typecast: true }),
  });
  if (!res.ok) return { ok: false, error: airtableError(res.status, await res.text(), CONNECTIONS_TABLE) };
  return { ok: true };
}
