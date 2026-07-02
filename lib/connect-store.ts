export type ConnectResource = {
  id: string;
  title: string;
  type: 'PDF' | 'Guide' | 'Video' | 'Landing Page' | 'Application' | 'Calendar Link' | 'Portal' | 'Custom URL';
  url: string;
  description: string;
  audience: string;
  permission: 'public' | 'captured-leads' | 'internal';
  analytics: {
    opens: number;
    clicks: number;
    downloads: number;
    videoViews: number;
  };
};

export type ConnectSequenceStep = {
  id: string;
  delayDays: number;
  title: string;
  resourceId: string;
  channel: 'email' | 'sms' | 'both';
};

export type ConnectTemplate = {
  name: string;
  logo?: string;
  domain: string;
  font: string;
  emailFrom: string;
  emailTemplates: {
    welcome: string;
    followUp: string;
    hotLeadAlert: string;
  };
  smsTemplates: {
    welcome: string;
    followUp: string;
    hotLeadAlert: string;
  };
};

export type ConnectCampaign = {
  id: string;
  name: string;
  type: 'Campaign QR' | 'Event QR' | 'Staff QR' | 'Location QR' | 'NFC Destination';
  destination: string;
  event?: string;
  representative?: string;
  location?: string;
  scans: number;
  conversions: number;
  resourceOpens: number;
  applications: number;
};

export type ConnectAutomationRule = {
  id: string;
  name: string;
  trigger: 'New connection' | 'Guide opened' | 'Video watched' | 'Application started' | 'Application completed' | 'High opportunity score' | 'No follow-up';
  actions: Array<'Send email' | 'Send SMS' | 'Notify staff' | 'Add tag' | 'Start sequence' | 'Create task'>;
  enabled: boolean;
};

export type ConnectReadinessItem = {
  area: string;
  score: number;
  currentState: string;
  gaps: string[];
  recommendation: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
};

export type ConnectGuideContent = {
  title: string;
  intro: string;
  sections: Array<{
    number: string;
    title: string;
    copy: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export type ConnectJourneyContent = {
  kicker: string;
  title: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  pillars: Array<{
    title: string;
    copy: string;
  }>;
  eventsTitle: string;
  events: string[];
  eventNote: string;
  consultationTitle: string;
  consultationCopy: string;
  consultationCta: string;
};

export type ConnectOrgConfig = {
  slug: string;
  name: string;
  logo?: string;
  colors: {
    ink: string;
    accent: string;
    soft: string;
  };
  qrCodeLabel: string;
  nfcDestination: string;
  redirectDestination: string;
  notificationEmails: string[];
  offer: {
    headline: string;
    resourceTitle: string;
    promise: string;
  };
  trustSignals: string[];
  socialProof: string[];
  theme: 'default' | 'cpr';
  guide: ConnectGuideContent;
  journey: ConnectJourneyContent;
  template: ConnectTemplate;
  campaigns: ConnectCampaign[];
  automationRules: ConnectAutomationRule[];
  resources: ConnectResource[];
  sequence: ConnectSequenceStep[];
  leadTypes: string[];
  teams: string[];
};

export type RelationshipStatus = 'New' | 'Engaged' | 'Hot' | 'Needs Follow-Up' | 'Converted' | 'Dormant';

export type ConnectRelationship = {
  id: string;
  orgSlug: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  role?: string;
  source: 'QR' | 'NFC' | 'Direct' | 'Representative';
  event?: string;
  dateMet: string;
  representative?: string;
  conversationNotes?: string;
  tags: string[];
  status: RelationshipStatus;
  leadType: string;
  routedTeam: string;
  resourcesSent: string[];
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
  aiProfile: {
    summary: string;
    interestLevel: 'Low' | 'Medium' | 'High';
    engagementScore: number;
    opportunityScore: number;
    recommendedAction: string;
    followUpPriority: 'Low' | 'Medium' | 'High' | 'Immediate';
    reasons: string[];
  };
  campaignId?: string;
  simplifiCaptureId?: string;
  amplifiShareUrl?: string;
  sequenceSent: string[];
  airtableRecordId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRelationshipInput = {
  orgSlug: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  role?: string;
  source?: ConnectRelationship['source'];
  event?: string;
  representative?: string;
  conversationNotes?: string;
  leadType?: string;
  tags?: string[];
  campaignId?: string;
};

export type ConnectEngagementEvent = {
  relationshipId?: string;
  orgSlug: string;
  type: 'scan' | 'contact_exchange' | 'email_open' | 'link_click' | 'resource_download' | 'video_view' | 'portal_visit' | 'application_started' | 'application_completed' | 'message' | 'follow_up_completed';
  campaignId?: string;
  resourceId?: string;
  createdAt: string;
};

const cprResources: ConnectResource[] = [
  {
    id: 'parent-recruiting-guide',
    title: 'Parent Recruiting Guide',
    type: 'Guide',
    url: '/connect/cpr/guide',
    description: 'What parents need to know about the recruiting journey.',
    audience: 'Parents and athletes',
    permission: 'captured-leads',
    analytics: { opens: 37, clicks: 24, downloads: 18, videoViews: 0 },
  },
  {
    id: 'recruiting-faq',
    title: 'Recruiting FAQ',
    type: 'PDF',
    url: '/connect/cpr/guide#faq',
    description: 'Answers to the questions families ask after an event conversation.',
    audience: 'Parents',
    permission: 'captured-leads',
    analytics: { opens: 22, clicks: 16, downloads: 11, videoViews: 0 },
  },
  {
    id: 'evaluation-invite',
    title: 'Athlete Evaluation Invitation',
    type: 'Application',
    url: '/connect/cpr/journey#evaluation',
    description: 'A warm next step for qualified prospects.',
    audience: 'High-intent prospects',
    permission: 'captured-leads',
    analytics: { opens: 14, clicks: 9, downloads: 0, videoViews: 0 },
  },
  {
    id: 'consultation',
    title: 'Schedule Consultation',
    type: 'Calendar Link',
    url: '/connect/cpr/journey#consultation',
    description: 'Direct booking path for high-intent relationships.',
    audience: 'Hot opportunities',
    permission: 'public',
    analytics: { opens: 10, clicks: 7, downloads: 0, videoViews: 0 },
  },
];

const cprCampaigns: ConnectCampaign[] = [
  {
    id: 'parent-guide-qr',
    name: 'Parent Guide QR (resource-first)',
    type: 'Campaign QR',
    destination: '/connect/cpr/go/parent-recruiting-guide?campaign=parent-guide-qr',
    scans: 0,
    conversions: 0,
    resourceOpens: 0,
    applications: 0,
  },
  {
    id: 'coach-mike-charlotte',
    name: 'Coach Mike QR',
    type: 'Staff QR',
    destination: '/connect/cpr?event=Charlotte%20Tournament&rep=Coach%20Mike&campaign=coach-mike-charlotte',
    event: 'Charlotte Tournament',
    representative: 'Coach Mike',
    scans: 42,
    conversions: 31,
    resourceOpens: 24,
    applications: 6,
  },
  {
    id: 'toronto-showcase',
    name: 'Toronto Showcase QR',
    type: 'Event QR',
    destination: '/connect/cpr?event=Toronto%20Showcase&campaign=toronto-showcase',
    event: 'Toronto Showcase',
    scans: 31,
    conversions: 19,
    resourceOpens: 15,
    applications: 4,
  },
  {
    id: 'summer-camp',
    name: 'Summer Camp NFC',
    type: 'NFC Destination',
    destination: '/connect/cpr?event=Summer%20Camp&source=NFC&campaign=summer-camp',
    event: 'Summer Camp',
    location: 'Main entrance',
    scans: 18,
    conversions: 12,
    resourceOpens: 9,
    applications: 2,
  },
];

const defaultAutomationRules: ConnectAutomationRule[] = [
  {
    id: 'new-connection',
    name: 'Activate new connection',
    trigger: 'New connection',
    actions: ['Send email', 'Notify staff', 'Start sequence', 'Add tag'],
    enabled: true,
  },
  {
    id: 'guide-opened',
    name: 'Guide opened follow-up',
    trigger: 'Guide opened',
    actions: ['Add tag', 'Create task'],
    enabled: true,
  },
  {
    id: 'hot-lead',
    name: 'Hot opportunity alert',
    trigger: 'High opportunity score',
    actions: ['Notify staff', 'Send SMS', 'Create task'],
    enabled: true,
  },
  {
    id: 'forgotten-opportunity',
    name: 'Forgotten opportunity rescue',
    trigger: 'No follow-up',
    actions: ['Notify staff', 'Create task'],
    enabled: true,
  },
];

const cprGuide: ConnectGuideContent = {
  title: 'Parent Recruiting Guide',
  intro: 'A clear first look at what families should understand after meeting Canadian Prospects: visibility, development, exposure, academics, and the next right conversation.',
  sections: [
    { number: '1', title: 'Know the path', copy: 'Recruiting is a process, not a single event. Families need a plan for development, exposure, communication, and decisions.' },
    { number: '2', title: 'Build the profile', copy: 'Academics, video, measurable growth, coachability, and consistency all shape the opportunity picture.' },
    { number: '3', title: 'Choose the next step', copy: 'The right next step is usually evaluation, guidance, and a realistic plan for where the athlete can grow.' },
  ],
  faqTitle: 'Recruiting FAQ',
  faqs: [
    { question: 'When should families start?', answer: "Start by understanding the athlete's current level, development needs, academics, and realistic opportunities." },
    { question: 'What happens after a showcase?', answer: 'The best follow-up is specific: profile review, film/evaluation, academic fit, and a clear next action.' },
    { question: 'How does CPR help?', answer: "CPR helps families move from confusion to a guided pathway built around the athlete's future." },
  ],
};

const cprJourney: ConnectJourneyContent = {
  kicker: 'Faith. Family. Basketball. Future.',
  title: 'Your journey starts here.',
  intro: 'Explore programs, tryouts, camps, and opportunities built to help athletes train, compete, grow, and succeed.',
  primaryCta: 'Programs & Camps',
  secondaryCta: 'Upcoming Events',
  pillars: [
    { title: 'Train', copy: 'Skill development, evaluation, and habits that translate.' },
    { title: 'Compete', copy: 'Showcase, camp, and team opportunities with the right visibility.' },
    { title: 'Grow', copy: 'Academic, recruiting, and leadership guidance for the long game.' },
    { title: 'Succeed', copy: 'A guided pathway toward the next level and the future beyond basketball.' },
  ],
  eventsTitle: 'Next opportunities',
  events: ['Toronto Showcase', 'Charlotte Tournament Follow-Up', 'Summer Camp Evaluation', 'Open Gym Invitation'],
  eventNote: 'Details and registration pathway coming through CPR.',
  consultationTitle: 'Want CPR to review the best next step?',
  consultationCopy: 'Use the connection you already made. Mike and the CPR team can follow up with the right pathway.',
  consultationCta: 'Request Follow-Up',
};

const demoGuide: ConnectGuideContent = {
  title: 'Relationship Activation Blueprint',
  intro: 'A practical blueprint for turning a real-world conversation into value delivery, follow-up, and measurable opportunity.',
  sections: [
    { number: '1', title: 'Capture the moment', copy: 'Make the first exchange feel simple, useful, and worth completing.' },
    { number: '2', title: 'Deliver value', copy: 'Send the promised resource immediately so the relationship starts with trust.' },
    { number: '3', title: 'Follow the signal', copy: 'Use engagement to know who needs a call, resource, invite, or task.' },
  ],
  faqTitle: 'Activation FAQ',
  faqs: [
    { question: 'What is Connect?', answer: 'Connect is a relationship activation platform for events, teams, communities, and client-facing organizations.' },
    { question: 'What happens after someone connects?', answer: 'A relationship record is created, resources are delivered, tracking begins, and follow-up can be routed.' },
    { question: 'Can this be white-labeled?', answer: 'Yes. The tenant template controls name, colors, copy, offers, resources, campaigns, and sequences.' },
  ],
};

const demoJourney: ConnectJourneyContent = {
  kicker: 'Connect. Grow. Impact.',
  title: 'Your next step is ready.',
  intro: 'Explore the resource, choose the next action, and let the organization continue the relationship with clarity.',
  primaryCta: 'Explore Resources',
  secondaryCta: 'Next Steps',
  pillars: [
    { title: 'Connect', copy: 'Capture the relationship while the conversation is still fresh.' },
    { title: 'Deliver', copy: 'Send the resource that makes the exchange immediately useful.' },
    { title: 'Track', copy: 'Measure opens, clicks, visits, and applications.' },
    { title: 'Follow Up', copy: 'Turn engagement into recommended next actions.' },
  ],
  eventsTitle: 'Next steps',
  events: ['Resource Review', 'Follow-Up Call', 'Application Pathway', 'Consultation'],
  eventNote: 'Configured by the organization inside the Connect template.',
  consultationTitle: 'Want the next best action?',
  consultationCopy: 'Use this connection to request follow-up from the team.',
  consultationCta: 'Request Follow-Up',
};

function createDefaultResources(slug: string, resourceTitle: string): ConnectResource[] {
  return [
    {
      id: `${slug}-primary-resource`,
      title: resourceTitle,
      type: 'Guide',
      url: `/connect/${slug}/guide`,
      description: `Primary Connect resource for ${slug}.`,
      audience: 'Prospects',
      permission: 'captured-leads',
      analytics: { opens: 0, clicks: 0, downloads: 0, videoViews: 0 },
    },
    {
      id: `${slug}-journey`,
      title: 'Journey Page',
      type: 'Landing Page',
      url: `/connect/${slug}/journey`,
      description: 'Next-step landing page after the first resource.',
      audience: 'Captured leads',
      permission: 'captured-leads',
      analytics: { opens: 0, clicks: 0, downloads: 0, videoViews: 0 },
    },
    {
      id: `${slug}-consultation`,
      title: 'Request Follow-Up',
      type: 'Calendar Link',
      url: `/connect/${slug}/journey#consultation`,
      description: 'Direct follow-up path for high-intent relationships.',
      audience: 'Hot opportunities',
      permission: 'public',
      analytics: { opens: 0, clicks: 0, downloads: 0, videoViews: 0 },
    },
  ];
}

const orgs: ConnectOrgConfig[] = [
  {
    slug: 'cpr',
    name: 'Canadian Prospects Recruitment',
    colors: { ink: '#101820', accent: '#d91f2a', soft: '#f5f7fb' },
    qrCodeLabel: 'CPR Connect',
    nfcDestination: '/connect/cpr',
    redirectDestination: '/connect/cpr/journey',
    notificationEmails: ['freedom@efficiencyarchitects.online'],
    offer: {
      headline: 'Get the Parent Recruiting Guide',
      resourceTitle: 'Parent Recruiting Guide',
      promise: 'Understand the next step in the recruiting process before you leave the event.',
    },
    trustSignals: ['Used after tournaments, camps, showcases, and family recruiting conversations', 'No spam. The first resource arrives immediately.', 'Follow-up is routed to the right CPR team member.'],
    socialProof: ['Charlotte Tournament: 42 connections', 'Toronto Showcase: 31 connections', 'Parent guide is the highest-opening CPR resource'],
    theme: 'cpr',
    guide: cprGuide,
    journey: cprJourney,
    template: {
      name: 'CPR Connect',
      domain: 'www.efficiencyarchitects.online',
      font: 'Inter',
      emailFrom: 'Canadian Prospects Recruitment <noreply@prospects.ca>',
      emailTemplates: {
        welcome: 'Thanks for connecting with CPR. Here is the Parent Recruiting Guide we promised.',
        followUp: 'Checking in with the next recruiting resource for your family.',
        hotLeadAlert: 'High-interest CPR connection needs follow-up within 48 hours.',
      },
      smsTemplates: {
        welcome: 'Thanks for connecting with CPR. Your recruiting guide is on the way.',
        followUp: 'CPR follow-up: here is the next recruiting resource.',
        hotLeadAlert: 'Hot CPR lead needs attention.',
      },
    },
    campaigns: cprCampaigns,
    automationRules: defaultAutomationRules,
    resources: cprResources,
    sequence: [
      { id: 'now-guide', delayDays: 0, title: 'Send Parent Recruiting Guide', resourceId: 'parent-recruiting-guide', channel: 'email' },
      { id: 'faq-3', delayDays: 3, title: 'Send Recruiting FAQ', resourceId: 'recruiting-faq', channel: 'email' },
      { id: 'eval-7', delayDays: 7, title: 'Invite Athlete Evaluation', resourceId: 'evaluation-invite', channel: 'both' },
      { id: 'call-14', delayDays: 14, title: 'Schedule Consultation', resourceId: 'consultation', channel: 'both' },
    ],
    leadTypes: ['Athlete Parent', 'Athlete', 'Coach', 'Partner', 'Sponsor'],
    teams: ['Recruiting Team', 'Admissions Team', 'Partnership Team'],
  },
  {
    slug: 'demo',
    name: 'Connect Demo Organization',
    colors: { ink: '#171717', accent: '#c9a844', soft: '#fbfaf7' },
    qrCodeLabel: 'Connect Demo',
    nfcDestination: '/connect/demo',
    redirectDestination: '/contact',
    notificationEmails: ['freedom@efficiencyarchitects.online'],
    offer: {
      headline: 'Get the Relationship Activation Blueprint',
      resourceTitle: 'Relationship Activation Blueprint',
      promise: 'Turn one conversation into a trackable relationship and guided next step.',
    },
    trustSignals: ['Built for events, churches, schools, nonprofits, creators, and teams', 'No digital business card experience', 'Every connection becomes measurable'],
    socialProof: ['Demo organization: live capture, nurture, routing, and intelligence enabled'],
    theme: 'default',
    guide: demoGuide,
    journey: demoJourney,
    template: {
      name: 'Connect Demo',
      domain: 'www.efficiencyarchitects.online',
      font: 'Inter',
      emailFrom: 'Efficiency Architects <freedom@efficiencyarchitects.online>',
      emailTemplates: {
        welcome: 'Thanks for connecting. Here is the resource we promised.',
        followUp: 'Here is the next resource in your sequence.',
        hotLeadAlert: 'A high-interest relationship needs follow-up.',
      },
      smsTemplates: {
        welcome: 'Thanks for connecting. Your resource is on the way.',
        followUp: 'Here is the next resource from Connect.',
        hotLeadAlert: 'Connect alert: high-interest relationship.',
      },
    },
    campaigns: [
      {
        id: 'demo-event',
        name: 'Demo Event QR',
        type: 'Event QR',
        destination: '/connect/demo?event=Demo%20Event&campaign=demo-event',
        event: 'Demo Event',
        scans: 12,
        conversions: 8,
        resourceOpens: 6,
        applications: 1,
      },
    ],
    automationRules: defaultAutomationRules,
    resources: createDefaultResources('demo', 'Relationship Activation Blueprint'),
    sequence: [
      { id: 'now-guide', delayDays: 0, title: 'Send Welcome Guide', resourceId: 'demo-primary-resource', channel: 'email' },
      { id: 'journey-3', delayDays: 3, title: 'Send Journey Page', resourceId: 'demo-journey', channel: 'email' },
      { id: 'call-7', delayDays: 7, title: 'Invite Consultation', resourceId: 'demo-consultation', channel: 'both' },
    ],
    leadTypes: ['Prospect', 'Donor', 'Member', 'Volunteer', 'Partner'],
    teams: ['Relationship Team', 'Membership Team', 'Development Team'],
  },
];

const seededRelationships: ConnectRelationship[] = [
  buildRelationship({
    orgSlug: 'cpr',
    name: 'Angela Morris',
    email: 'angela.parent@example.com',
    phone: '555-0142',
    organization: 'Charlotte Elite',
    role: 'Parent',
    source: 'QR',
    event: 'Charlotte Tournament',
    representative: 'Coach Mike',
    conversationNotes: 'Parent of a 2028 point guard from Charlotte. Interested in Division I recruiting. Strong academic profile.',
    leadType: 'Athlete Parent',
    tags: ['2028', 'point guard', 'academics', 'division-i'],
  }, new Date(Date.now() - 14 * 86400000).toISOString(), {
    opens: 5,
    clicks: 4,
    downloads: 2,
    videoViews: 1,
    portalVisits: 3,
    applicationsStarted: 1,
  }),
  buildRelationship({
    orgSlug: 'cpr',
    name: 'David Chen',
    email: 'david.coach@example.com',
    organization: 'Raleigh Showcase',
    role: 'Coach',
    source: 'NFC',
    event: 'Raleigh Showcase',
    representative: 'Coach Mike',
    conversationNotes: 'Coach interested in sending multiple athletes through evaluation pathway.',
    leadType: 'Coach',
    tags: ['team-lead', 'evaluation'],
  }, new Date(Date.now() - 5 * 86400000).toISOString(), {
    opens: 2,
    clicks: 1,
    portalVisits: 1,
    messages: 1,
  }),
];

const localRelationships: ConnectRelationship[] = [...seededRelationships];
const localTenantOverrides: ConnectOrgConfig[] = [];
const CONNECT_TENANTS_TABLE = (
  process.env.CONNECT_TENANTS_TABLE_ID ||
  process.env.AIRTABLE_CONNECT_TENANTS_TABLE_ID ||
  process.env.CONNECT_TENANTS_TABLE ||
  'Connect Tenants'
).trim();
const CONNECT_TENANTS_TABLE_NAME = process.env.CONNECT_TENANTS_TABLE || 'Connect Tenants';
const CONNECT_RELATIONSHIPS_TABLE = (
  process.env.CONNECT_RELATIONSHIPS_TABLE_ID ||
  process.env.AIRTABLE_CONNECT_RELATIONSHIPS_TABLE_ID ||
  process.env.CONNECT_RELATIONSHIPS_TABLE ||
  'Connect Relationships'
).trim();
const CONNECT_RELATIONSHIPS_TABLE_NAME = process.env.CONNECT_RELATIONSHIPS_TABLE || 'Connect Relationships';

function sanitizeConnectSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function connectTenantAirtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
  if (!apiKey || !baseId || !CONNECT_TENANTS_TABLE) return null;
  return { apiKey, baseId, tableRef: CONNECT_TENANTS_TABLE };
}

function orgFromAirtableRecord(record: { id: string; fields?: Record<string, unknown> }): ConnectOrgConfig | null {
  const rawConfig = record.fields?.['Config JSON'] ?? record.fields?.Config;
  if (typeof rawConfig !== 'string') return null;
  try {
    const parsed = JSON.parse(rawConfig) as ConnectOrgConfig;
    return parsed.slug && parsed.name ? parsed : null;
  } catch {
    return null;
  }
}

async function listAirtableTenants(): Promise<ConnectOrgConfig[]> {
  const config = connectTenantAirtableConfig();
  if (!config) return [];

  const response = await fetch(`https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableRef)}?pageSize=100`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('[connect] tenant Airtable read failed', response.status, await response.text());
    return [];
  }

  const data = await response.json() as { records?: Array<{ id: string; fields?: Record<string, unknown> }> };
  return (data.records ?? [])
    .map(orgFromAirtableRecord)
    .filter((tenant): tenant is ConnectOrgConfig => Boolean(tenant));
}

type AirtableMetaField = {
  id?: string;
  name: string;
  type: string;
};

type AirtableMetaTable = {
  id: string;
  name: string;
  fields?: AirtableMetaField[];
};

async function fetchAirtableTables(apiKey: string, baseId: string): Promise<AirtableMetaTable[]> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Airtable metadata read failed (${response.status}).`);
  }
  const data = await response.json() as { tables?: AirtableMetaTable[] };
  return data.tables ?? [];
}

async function createAirtableField(apiKey: string, baseId: string, tableId: string, name: string, type: string) {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, type }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Airtable field setup failed for ${name} (${response.status}). ${detail}`.trim());
  }
}

export async function ensureConnectTenantStorage() {
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
  if (!apiKey) {
    return { ok: false, error: 'AIRTABLE_API_KEY or AIRTABLE_TOKEN is not configured.' };
  }
  const airtableApiKey = apiKey;

  const tableName = CONNECT_TENANTS_TABLE_NAME;
  const tables = await fetchAirtableTables(airtableApiKey, baseId);
  async function ensureTable(tableNameToEnsure: string, tableRef: string, fields: Array<[string, string]>) {
    let table = tables.find((item) => item.name === tableNameToEnsure || item.id === tableRef);
    let tableCreated = false;

    if (!table) {
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tableNameToEnsure,
          fields: fields.map(([name, type]) => ({ name, type })),
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Airtable table setup failed for ${tableNameToEnsure} (${response.status}). ${detail}`.trim());
      }
      table = await response.json() as AirtableMetaTable;
      tableCreated = true;
    }

    if (!table) throw new Error(`Airtable table setup failed for ${tableNameToEnsure}.`);

    const ensuredTable = table;
    const fieldNames = new Set((ensuredTable.fields ?? []).map((field) => field.name));
    const fieldsCreated: string[] = [];

    for (const [name, type] of fields) {
      if (!fieldNames.has(name)) {
        await createAirtableField(airtableApiKey, baseId, ensuredTable.id, name, type);
        fieldsCreated.push(name);
      }
    }

    return {
      tableId: ensuredTable.id,
      tableName: ensuredTable.name,
      tableRef,
      tableCreated,
      fieldsCreated,
    };
  }

  const tenantFields: Array<[string, string]> = [
    ['Slug', 'singleLineText'],
    ['Name', 'singleLineText'],
    ['Status', 'singleLineText'],
    ['Config JSON', 'multilineText'],
    ['Created At', 'singleLineText'],
    ['Updated At', 'singleLineText'],
  ];
  const relationshipFields: Array<[string, string]> = [
    ['Name', 'singleLineText'],
    ['Email', 'email'],
    ['Phone', 'phoneNumber'],
    ['Organization', 'singleLineText'],
    ['Role', 'singleLineText'],
    ['Source', 'singleLineText'],
    ['Event', 'singleLineText'],
    ['Date Met', 'singleLineText'],
    ['Representative', 'singleLineText'],
    ['Notes', 'multilineText'],
    ['Tags', 'multilineText'],
    ['Status', 'singleLineText'],
    ['Lead Type', 'singleLineText'],
    ['Routed Team', 'singleLineText'],
    ['Opportunity Score', 'singleLineText'],
    ['Recommended Action', 'multilineText'],
  ];

  const tenantTable = await ensureTable(tableName, CONNECT_TENANTS_TABLE, tenantFields);
  const relationshipTable = await ensureTable(CONNECT_RELATIONSHIPS_TABLE_NAME, CONNECT_RELATIONSHIPS_TABLE, relationshipFields);

  return {
    ok: true,
    baseId,
    tenantTable,
    relationshipTable,
  };
}

export async function getConnectSystemStatus() {
  const tenantConfig = connectTenantAirtableConfig();
  let tenantStorage: {
    ok: boolean;
    label: string;
    detail: string;
  };

  if (!tenantConfig) {
    tenantStorage = {
      ok: false,
      label: 'Tenant Storage',
      detail: 'Airtable API key is missing. Tenant Creator will use temporary memory storage.',
    };
  } else {
    try {
      await listAirtableTenants();
      tenantStorage = {
        ok: true,
        label: 'Tenant Storage',
        detail: `Airtable tenant table is reachable: ${tenantConfig.tableRef}.`,
      };
    } catch (error) {
      tenantStorage = {
        ok: false,
        label: 'Tenant Storage',
        detail: error instanceof Error ? error.message : 'Airtable tenant table is not reachable.',
      };
    }
  }

  const relationshipStorage = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN
    ? `Airtable relationship table is configured by default: ${CONNECT_RELATIONSHIPS_TABLE}.`
    : 'Airtable API key is missing; relationships will not persist to Airtable.';
  const resendOk = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
  const twilioOk = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    (process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim())
  );
  const n8nOk = Boolean(process.env.N8N_WEBHOOK_URL?.trim() || process.env.CONNECT_N8N_WEBHOOK_URL?.trim());

  const checks = [
    tenantStorage,
    { ok: Boolean(process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN), label: 'Relationship Storage', detail: relationshipStorage },
    { ok: resendOk, label: 'Resend Email', detail: resendOk ? 'RESEND_API_KEY and RESEND_FROM_EMAIL are configured.' : 'Set RESEND_API_KEY and RESEND_FROM_EMAIL.' },
    { ok: twilioOk, label: 'Twilio SMS', detail: twilioOk ? 'Twilio credentials and sender number are configured.' : 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.' },
    { ok: n8nOk, label: 'Automation Webhook', detail: n8nOk ? 'n8n webhook is configured.' : 'Delayed nurture automation webhook is not configured yet.' },
  ];

  const readyCount = checks.filter((check) => check.ok).length;
  return {
    ready: checks.every((check) => check.ok),
    score: Math.round((readyCount / checks.length) * 100),
    checks,
  };
}

function buildRelationship(
  input: CreateRelationshipInput,
  createdAt = new Date().toISOString(),
  engagementOverrides: Partial<ConnectRelationship['engagement']> = {},
  orgOverride?: ConnectOrgConfig,
): ConnectRelationship {
  const org = orgOverride ?? orgs.find((item) => item.slug === input.orgSlug) ?? orgs[1];
  const tags = Array.from(new Set([...(input.tags ?? []), ...(input.leadType ? [input.leadType] : [])].filter(Boolean)));
  const engagement = {
    scans: 1,
    opens: 0,
    clicks: 0,
    downloads: 0,
    videoViews: 0,
    portalVisits: 0,
    applicationsStarted: 0,
    applicationsCompleted: 0,
    messages: 0,
    followUpsCompleted: 0,
    ...engagementOverrides,
  };
  const routedTeam = routeRelationship(input.leadType ?? org.leadTypes[0], org);
  const aiProfile = generateOpportunityIntelligence(input, engagement, createdAt);
  const status: RelationshipStatus =
    aiProfile.followUpPriority === 'Immediate' ? 'Needs Follow-Up' :
    aiProfile.interestLevel === 'High' ? 'Hot' :
    aiProfile.engagementScore > 25 ? 'Engaged' : 'New';

  return {
    id: `con_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    orgSlug: input.orgSlug,
    name: input.name,
    email: input.email,
    phone: input.phone,
    organization: input.organization,
    role: input.role,
    source: input.source ?? 'QR',
    event: input.event,
    dateMet: createdAt,
    representative: input.representative,
    conversationNotes: input.conversationNotes,
    tags,
    status,
    leadType: input.leadType ?? org.leadTypes[0],
    routedTeam,
    resourcesSent: org.sequence.filter((step) => step.delayDays === 0).map((step) => step.resourceId),
    engagement,
    aiProfile,
    campaignId: input.campaignId,
    sequenceSent: [],
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

function routeRelationship(leadType: string, org: ConnectOrgConfig): string {
  const normalized = leadType.toLowerCase();
  if (normalized.includes('parent') || normalized.includes('athlete') || normalized.includes('coach')) return org.teams[0];
  if (normalized.includes('admission')) return org.teams[1] ?? org.teams[0];
  if (normalized.includes('sponsor') || normalized.includes('partner') || normalized.includes('donor')) return org.teams[2] ?? org.teams[0];
  return org.teams[0];
}

function generateOpportunityIntelligence(
  input: CreateRelationshipInput,
  engagement: ConnectRelationship['engagement'],
  createdAt: string,
): ConnectRelationship['aiProfile'] {
  const engagementScore =
    engagement.opens * 8 +
    engagement.clicks * 10 +
    engagement.downloads * 12 +
    engagement.videoViews * 10 +
    engagement.portalVisits * 9 +
    engagement.applicationsStarted * 18 +
    engagement.applicationsCompleted * 30 +
    engagement.messages * 12 +
    engagement.followUpsCompleted * 5;
  const daysOld = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
  const notes = `${input.conversationNotes ?? ''} ${input.role ?? ''} ${input.leadType ?? ''}`.toLowerCase();
  const intentWords = ['interested', 'division', 'evaluate', 'consultation', 'urgent', 'ready', 'apply'];
  const intentScore = intentWords.filter((word) => notes.includes(word)).length * 8;
  const opportunityScore = Math.min(100, engagementScore + intentScore + (input.phone ? 8 : 0));
  const interestLevel = opportunityScore >= 65 ? 'High' : opportunityScore >= 30 ? 'Medium' : 'Low';
  const followUpPriority =
    opportunityScore >= 70 && daysOld >= 7 ? 'Immediate' :
    opportunityScore >= 55 ? 'High' :
    opportunityScore >= 25 ? 'Medium' : 'Low';
  const reasons = [
    engagement.opens > 0 ? `Opened ${engagement.opens} resource${engagement.opens === 1 ? '' : 's'}` : '',
    engagement.clicks > 0 ? `Clicked ${engagement.clicks} link${engagement.clicks === 1 ? '' : 's'}` : '',
    engagement.portalVisits > 0 ? `Returned ${engagement.portalVisits} time${engagement.portalVisits === 1 ? '' : 's'}` : '',
    engagement.applicationsStarted > 0 ? 'Started an application' : '',
    engagement.followUpsCompleted === 0 && daysOld >= 7 ? 'No follow-up completed' : '',
    daysOld >= 7 ? `Connected ${daysOld} days ago` : '',
    input.conversationNotes ? 'Conversation notes captured' : '',
  ].filter(Boolean);

  return {
    summary: `${input.name} connected${input.event ? ` at ${input.event}` : ''}${input.representative ? ` with ${input.representative}` : ''}. ${input.conversationNotes ?? 'Relationship is ready for follow-up.'}`,
    interestLevel,
    engagementScore: Math.min(100, engagementScore),
    opportunityScore,
    recommendedAction:
      followUpPriority === 'Immediate' ? 'Contact immediately.' :
      followUpPriority === 'High' ? 'Call within 48 hours.' :
      followUpPriority === 'Medium' ? 'Send the next resource and assign a follow-up owner.' :
      'Keep in nurture sequence.',
    followUpPriority,
    reasons: reasons.length ? reasons : ['New connection created'],
  };
}

function airtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
  const tableId = CONNECT_RELATIONSHIPS_TABLE;
  if (!apiKey || !baseId || !tableId) return null;
  return { apiKey, baseId, tableId };
}

async function postRelationshipToAirtable(relationship: ConnectRelationship): Promise<string | null> {
  const config = airtableConfig();
  if (!config) return null;

  const response = await fetch(`https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            'Connect ID': relationship.id,
            'Org Slug': relationship.orgSlug,
            Name: relationship.name,
            Email: relationship.email,
            Phone: relationship.phone,
            Organization: relationship.organization,
            Role: relationship.role,
            Source: relationship.source,
            Event: relationship.event,
            'Date Met': relationship.dateMet,
            Representative: relationship.representative,
            Notes: relationship.conversationNotes,
            Tags: relationship.tags.join(', '),
            Status: relationship.status,
            'Lead Type': relationship.leadType,
            'Routed Team': relationship.routedTeam,
            'Opportunity Score': relationship.aiProfile.opportunityScore,
            'Recommended Action': relationship.aiProfile.recommendedAction,
            'Sequence Sent': relationship.sequenceSent.join(', '),
            'Simplifi Capture ID': relationship.simplifiCaptureId ?? '',
            'Amplifi URL': relationship.amplifiShareUrl ?? '',
          },
        },
      ],
      typecast: true,
    }),
  });

  if (!response.ok) {
    console.error('[connect] Airtable relationship write failed', response.status, await response.text().catch(() => ''));
    return null;
  }

  const data = (await response.json()) as { records?: { id: string }[] };
  return data.records?.[0]?.id ?? null;
}

function mapAirtableRelationship(record: { id: string; fields: Record<string, unknown> }): ConnectRelationship | null {
  const email = String(record.fields.Email ?? '').trim();
  const name = String(record.fields.Name ?? '').trim();
  if (!email || !name) return null;

  const connectId = String(record.fields['Connect ID'] ?? record.id);
  const sequenceRaw = String(record.fields['Sequence Sent'] ?? '');
  const dateMet = String(record.fields['Date Met'] ?? record.fields['Created At'] ?? new Date().toISOString());
  const opportunityScore = Number(record.fields['Opportunity Score'] ?? 50);

  return {
    id: connectId,
    orgSlug: String(record.fields['Org Slug'] ?? 'cpr'),
    name,
    email,
    phone: String(record.fields.Phone ?? '') || undefined,
    organization: String(record.fields.Organization ?? '') || undefined,
    role: String(record.fields.Role ?? '') || undefined,
    source: (String(record.fields.Source ?? 'QR') as ConnectRelationship['source']) || 'QR',
    event: String(record.fields.Event ?? '') || undefined,
    dateMet,
    representative: String(record.fields.Representative ?? '') || undefined,
    conversationNotes: String(record.fields.Notes ?? '') || undefined,
    tags: String(record.fields.Tags ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    status: (String(record.fields.Status ?? 'New') as RelationshipStatus) || 'New',
    leadType: String(record.fields['Lead Type'] ?? 'Prospect'),
    routedTeam: String(record.fields['Routed Team'] ?? ''),
    resourcesSent: [],
    engagement: {
      scans: 0,
      opens: 0,
      clicks: 0,
      downloads: 0,
      videoViews: 0,
      portalVisits: 0,
      applicationsStarted: 0,
      applicationsCompleted: 0,
      messages: 0,
      followUpsCompleted: 0,
    },
    aiProfile: {
      summary: String(record.fields.Notes ?? 'Imported from Airtable'),
      interestLevel: 'Medium',
      engagementScore: 0,
      opportunityScore: Number.isFinite(opportunityScore) ? opportunityScore : 50,
      recommendedAction: String(record.fields['Recommended Action'] ?? 'Continue nurture sequence.'),
      followUpPriority: 'Medium',
      reasons: ['Loaded from Airtable'],
    },
    campaignId: undefined,
    simplifiCaptureId: String(record.fields['Simplifi Capture ID'] ?? '') || undefined,
    amplifiShareUrl: String(record.fields['Amplifi URL'] ?? '') || undefined,
    sequenceSent: sequenceRaw.split(',').map((s) => s.trim()).filter(Boolean),
    airtableRecordId: record.id,
    createdAt: dateMet,
    updatedAt: dateMet,
  };
}

async function fetchRelationshipsFromAirtable(orgSlug?: string): Promise<ConnectRelationship[]> {
  const config = airtableConfig();
  if (!config) return [];

  const params = new URLSearchParams({ maxRecords: '200' });
  if (orgSlug) {
    const safe = orgSlug.replace(/'/g, "\\'");
    params.set('filterByFormula', `{Org Slug}='${safe}'`);
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableId)}?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    records?: { id: string; fields: Record<string, unknown> }[];
  };

  return (data.records ?? [])
    .map(mapAirtableRelationship)
    .filter((item): item is ConnectRelationship => Boolean(item));
}

async function patchRelationshipInAirtable(relationship: ConnectRelationship): Promise<void> {
  if (!relationship.airtableRecordId) return;
  const config = airtableConfig();
  if (!config) return;

  await fetch(`https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        {
          id: relationship.airtableRecordId,
          fields: {
            'Sequence Sent': relationship.sequenceSent.join(', '),
            'Simplifi Capture ID': relationship.simplifiCaptureId ?? '',
            'Amplifi URL': relationship.amplifiShareUrl ?? '',
          },
        },
      ],
      typecast: true,
    }),
  }).catch((error) => console.error('[connect] Airtable patch failed', error));
}

export async function updateConnectRelationshipHandoff(
  relationshipId: string,
  handoff: { simplifiCaptureId?: string; amplifiShareUrl?: string },
): Promise<void> {
  const target = localRelationships.find((item) => item.id === relationshipId);
  if (!target) return;
  if (handoff.simplifiCaptureId) target.simplifiCaptureId = handoff.simplifiCaptureId;
  if (handoff.amplifiShareUrl) target.amplifiShareUrl = handoff.amplifiShareUrl;
  target.updatedAt = new Date().toISOString();
  await patchRelationshipInAirtable(target);
}

export async function markSequenceStepSent(relationshipId: string, stepId: string): Promise<void> {
  const target = localRelationships.find((item) => item.id === relationshipId);
  if (!target) return;
  if (!target.sequenceSent.includes(stepId)) target.sequenceSent.push(stepId);
  target.engagement.followUpsCompleted += 1;
  target.updatedAt = new Date().toISOString();
  await patchRelationshipInAirtable(target);
}

export async function listConnectRelationshipsForSequence(): Promise<ConnectRelationship[]> {
  const fromAirtable = await fetchRelationshipsFromAirtable();
  const byId = new Map<string, ConnectRelationship>();

  for (const relationship of fromAirtable) byId.set(relationship.id, relationship);
  for (const relationship of localRelationships) {
    const existing = byId.get(relationship.id);
    if (existing) {
      byId.set(relationship.id, {
        ...existing,
        ...relationship,
        sequenceSent: [...new Set([...existing.sequenceSent, ...relationship.sequenceSent])],
      });
    } else {
      byId.set(relationship.id, relationship);
    }
  }

  return [...byId.values()];
}

export function createConnectTenantTemplate(input: {
  slug: string;
  name: string;
  offerHeadline: string;
  resourceTitle: string;
  redirectPath?: string;
  accent?: string;
  leadTypes?: string[];
  teams?: string[];
}): ConnectOrgConfig {
  const slug = sanitizeConnectSlug(input.slug) || 'connect-tenant';
  const resourceId = `${slug}-primary-resource`;
  return {
    slug,
    name: input.name,
    colors: { ink: '#171717', accent: input.accent ?? '#c9a844', soft: '#fbfaf7' },
    qrCodeLabel: `${input.name} Connect`,
    nfcDestination: `/connect/${slug}`,
    redirectDestination: input.redirectPath ?? `/connect/${slug}/journey`,
    notificationEmails: ['freedom@efficiencyarchitects.online'],
    offer: {
      headline: input.offerHeadline,
      resourceTitle: input.resourceTitle,
      promise: `Get ${input.resourceTitle} and receive a clear next step from ${input.name}.`,
    },
    trustSignals: ['Instant resource delivery', 'Smart follow-up', 'No business card to lose'],
    socialProof: ['New Connect tenant template ready for launch'],
    theme: 'default',
    guide: demoGuide,
    journey: demoJourney,
    template: {
      name: `${input.name} Connect`,
      domain: (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app').replace(/\/$/, '').replace(/^https?:\/\//, ''),
      font: 'Inter',
      emailFrom: 'Efficiency Architects <freedom@efficiencyarchitects.online>',
      emailTemplates: {
        welcome: `Thanks for connecting with ${input.name}. Here is ${input.resourceTitle}.`,
        followUp: `Here is the next resource from ${input.name}.`,
        hotLeadAlert: `A high-interest ${input.name} relationship needs follow-up.`,
      },
      smsTemplates: {
        welcome: `Thanks for connecting with ${input.name}. Your resource is on the way.`,
        followUp: `Here is the next step from ${input.name}.`,
        hotLeadAlert: `Connect alert: high-interest relationship for ${input.name}.`,
      },
    },
    campaigns: [
      {
        id: `${slug}-launch-qr`,
        name: `${input.name} Launch QR`,
        type: 'Campaign QR',
        destination: `/connect/${slug}?campaign=${slug}-launch-qr`,
        scans: 0,
        conversions: 0,
        resourceOpens: 0,
        applications: 0,
      },
    ],
    automationRules: defaultAutomationRules,
    resources: [
      {
        id: resourceId,
        title: input.resourceTitle,
        type: 'Guide',
        url: `/connect/${slug}/guide`,
        description: `Primary Connect resource for ${input.name}.`,
        audience: 'Prospects',
        permission: 'captured-leads',
        analytics: { opens: 0, clicks: 0, downloads: 0, videoViews: 0 },
      },
    ],
    sequence: [
      { id: 'now-guide', delayDays: 0, title: `Send ${input.resourceTitle}`, resourceId, channel: 'email' },
      { id: 'follow-up-3', delayDays: 3, title: 'Send follow-up resource', resourceId, channel: 'email' },
      { id: 'consult-7', delayDays: 7, title: 'Invite consultation', resourceId, channel: 'both' },
    ],
    leadTypes: input.leadTypes ?? ['Prospect', 'Member', 'Donor', 'Volunteer', 'Partner'],
    teams: input.teams ?? ['Relationship Team', 'Growth Team', 'Support Team'],
  };
}

export async function listConnectOrgs(): Promise<ConnectOrgConfig[]> {
  const airtableTenants = await listAirtableTenants();
  const bySlug = new Map<string, ConnectOrgConfig>();
  [...orgs, ...localTenantOverrides, ...airtableTenants].forEach((org) => bySlug.set(org.slug, org));
  return [...bySlug.values()];
}

async function findAirtableTenantRecordBySlug(
  slug: string,
): Promise<{ recordId: string; org: ConnectOrgConfig } | null> {
  const config = connectTenantAirtableConfig();
  if (!config) return null;

  const safe = sanitizeConnectSlug(slug).replace(/'/g, "\\'");
  const formula = encodeURIComponent(`{Slug}='${safe}'`);
  const url = `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableRef)}?filterByFormula=${formula}&maxRecords=1`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { records?: Array<{ id: string; fields?: Record<string, unknown> }> };
  const record = data.records?.[0];
  if (!record) return null;

  const org = orgFromAirtableRecord(record);
  if (!org) return null;

  return { recordId: record.id, org };
}

export async function persistConnectOrg(
  org: ConnectOrgConfig,
): Promise<{ persisted: boolean; storage: 'airtable' | 'memory'; warning?: string }> {
  const normalized: ConnectOrgConfig = { ...org, slug: sanitizeConnectSlug(org.slug) };

  const overrideIndex = localTenantOverrides.findIndex((item) => item.slug === normalized.slug);
  if (overrideIndex >= 0) localTenantOverrides.splice(overrideIndex, 1);
  localTenantOverrides.unshift(normalized);

  const config = connectTenantAirtableConfig();
  if (!config) {
    return {
      persisted: false,
      storage: 'memory',
      warning: 'Airtable tenant storage is not configured; changes apply only for this server instance.',
    };
  }

  const now = new Date().toISOString();
  const existing = await findAirtableTenantRecordBySlug(normalized.slug);

  if (existing) {
    const response = await fetch(
      `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableRef)}/${existing.recordId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Name: normalized.name,
            Status: 'Active',
            'Config JSON': JSON.stringify(normalized),
            'Updated At': now,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Unable to update Connect tenant (${response.status}). ${error}`.trim());
    }

    return { persisted: true, storage: 'airtable' };
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableRef)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Slug: normalized.slug,
              Name: normalized.name,
              Status: 'Active',
              'Config JSON': JSON.stringify(normalized),
              'Created At': now,
              'Updated At': now,
            },
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Unable to save Connect tenant (${response.status}). ${error}`.trim());
  }

  return { persisted: true, storage: 'airtable' };
}

export async function addConnectCampaign(input: {
  orgSlug: string;
  campaign: ConnectCampaign;
}): Promise<{
  org: ConnectOrgConfig;
  campaign: ConnectCampaign;
  created: boolean;
  persisted: boolean;
  warning?: string;
}> {
  const slug = sanitizeConnectSlug(input.orgSlug);
  const org = await getConnectOrg(slug);
  if (org.slug !== slug) {
    throw new Error(`Connect tenant not found for "${slug}".`);
  }

  const existingCampaign = org.campaigns.find((item) => item.id === input.campaign.id);
  if (existingCampaign) {
    return { org, campaign: existingCampaign, created: false, persisted: true };
  }

  const updatedOrg: ConnectOrgConfig = {
    ...org,
    campaigns: [input.campaign, ...org.campaigns],
  };

  const saveResult = await persistConnectOrg(updatedOrg);
  return {
    org: updatedOrg,
    campaign: input.campaign,
    created: true,
    persisted: saveResult.persisted,
    warning: saveResult.warning,
  };
}

export async function updateConnectOrgCopy(input: {
  orgSlug: string;
  offerHeadline?: string;
  resourceTitle?: string;
  guideIntro?: string;
  journeyIntro?: string;
}): Promise<{ org: ConnectOrgConfig; persisted: boolean; warning?: string }> {
  const slug = sanitizeConnectSlug(input.orgSlug);
  const org = await getConnectOrg(slug);
  if (org.slug !== slug) {
    throw new Error(`Connect tenant not found for "${slug}".`);
  }

  const offerHeadline = input.offerHeadline?.trim();
  const resourceTitle = input.resourceTitle?.trim();
  const guideIntro = input.guideIntro?.trim();
  const journeyIntro = input.journeyIntro?.trim();

  const updatedOrg: ConnectOrgConfig = {
    ...org,
    offer: {
      ...org.offer,
      headline: offerHeadline || org.offer.headline,
      resourceTitle: resourceTitle || org.offer.resourceTitle,
      promise: resourceTitle
        ? `Get ${resourceTitle} and receive a clear next step from ${org.name}.`
        : org.offer.promise,
    },
    guide: {
      ...org.guide,
      title: resourceTitle || org.guide.title,
      intro: guideIntro || org.guide.intro,
    },
    journey: {
      ...org.journey,
      intro: journeyIntro || org.journey.intro,
    },
  };

  const saveResult = await persistConnectOrg(updatedOrg);
  return {
    org: updatedOrg,
    persisted: saveResult.persisted,
    warning: saveResult.warning,
  };
}

export async function getConnectOrg(slug: string): Promise<ConnectOrgConfig> {
  const normalized = sanitizeConnectSlug(slug);
  const orgList = await listConnectOrgs();
  return orgList.find((org) => org.slug === normalized) ?? orgs[1];
}

export async function createConnectTenant(input: {
  slug: string;
  name: string;
  offerHeadline: string;
  resourceTitle: string;
  accent?: string;
  notificationEmails?: string[];
  leadTypes?: string[];
  teams?: string[];
  guideTitle?: string;
  guideIntro?: string;
  journeyTitle?: string;
  journeyIntro?: string;
}): Promise<{ tenant: ConnectOrgConfig; persisted: boolean; storage: 'airtable' | 'memory'; warning?: string }> {
  const tenant = createConnectTenantTemplate({
    slug: input.slug,
    name: input.name,
    offerHeadline: input.offerHeadline,
    resourceTitle: input.resourceTitle,
    accent: input.accent,
    leadTypes: input.leadTypes,
    teams: input.teams,
  });

  tenant.notificationEmails = input.notificationEmails?.length
    ? input.notificationEmails
    : tenant.notificationEmails;
  tenant.guide = {
    ...tenant.guide,
    title: input.guideTitle || input.resourceTitle,
    intro: input.guideIntro || tenant.guide.intro,
  };
  tenant.journey = {
    ...tenant.journey,
    title: input.journeyTitle || tenant.journey.title,
    intro: input.journeyIntro || tenant.journey.intro,
  };

  const existing = await listConnectOrgs();
  if (existing.some((org) => org.slug === tenant.slug)) {
    throw new Error(`A Connect tenant already exists for slug "${tenant.slug}".`);
  }

  const config = connectTenantAirtableConfig();
  if (!config) {
    localTenantOverrides.unshift(tenant);
    return {
      tenant,
      persisted: false,
      storage: 'memory',
      warning: 'Airtable tenant storage is not configured, so this tenant is available only until the serverless instance restarts.',
    };
  }

  const now = new Date().toISOString();
  const response = await fetch(`https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableRef)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Slug: tenant.slug,
            Name: tenant.name,
            Status: 'Active',
            'Config JSON': JSON.stringify(tenant),
            'Created At': now,
            'Updated At': now,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[connect] tenant Airtable write failed', response.status, error);
    throw new Error('Unable to save tenant to Airtable. Run Connect storage setup and check Airtable permissions.');
  }

  localTenantOverrides.unshift(tenant);
  return { tenant, persisted: true, storage: 'airtable' };
}

export async function createConnectRelationship(input: CreateRelationshipInput): Promise<ConnectRelationship> {
  const org = await getConnectOrg(input.orgSlug);
  const relationship = buildRelationship(input, new Date().toISOString(), {}, org);
  localRelationships.unshift(relationship);
  try {
    const airtableRecordId = await postRelationshipToAirtable(relationship);
    if (airtableRecordId) relationship.airtableRecordId = airtableRecordId;
  } catch (error) {
    console.error('[connect] Airtable write failed', error);
  }
  return relationship;
}

/** Backdated test relationship so day-3 nurture is due immediately (admin verification). */
export async function seedNurtureVerificationRelationship(orgSlug: string): Promise<ConnectRelationship> {
  const slug = sanitizeConnectSlug(orgSlug);
  const org = await getConnectOrg(slug);
  if (org.slug !== slug) {
    throw new Error(`Connect tenant not found for "${slug}".`);
  }

  const welcomeStep = org.sequence.find((step) => step.delayDays === 0);
  const createdAt = new Date(Date.now() - 4 * 86_400_000).toISOString();
  const relationship = buildRelationship(
    {
      orgSlug: slug,
      name: 'Connect Nurture Verify',
      email: `connect-nurture+${Date.now()}@efficiencyarchitects.online`,
      source: 'Direct',
      event: 'Nurture verification',
      tags: ['nurture-verify'],
    },
    createdAt,
    {},
    org,
  );
  relationship.sequenceSent = welcomeStep ? [welcomeStep.id] : [];

  localRelationships.unshift(relationship);
  try {
    const airtableRecordId = await postRelationshipToAirtable(relationship);
    if (airtableRecordId) relationship.airtableRecordId = airtableRecordId;
  } catch (error) {
    console.error('[connect] nurture verify seed failed', error);
  }

  return relationship;
}

export async function listConnectRelationships(orgSlug?: string): Promise<ConnectRelationship[]> {
  return localRelationships.filter((relationship) => !orgSlug || relationship.orgSlug === orgSlug);
}

export function getConnectCampaignUrl(org: ConnectOrgConfig, campaign: ConnectCampaign): string {
  const domain = org.template.domain.startsWith('http') ? org.template.domain : `https://${org.template.domain}`;
  return `${domain}${campaign.destination}`;
}

export function getConnectReadinessAudit(): ConnectReadinessItem[] {
  return [
    {
      area: 'Core Infrastructure',
      score: 58,
      currentState: 'Next.js routes, API handlers, build-safe store, Airtable write hook, and seeded multi-tenant config exist.',
      gaps: ['No durable first-party database tables for every Connect object yet', 'No production event log table verified', 'Limited structured logging'],
      recommendation: 'Create Airtable/DB tables for orgs, resources, campaigns, events, relationships, journeys, tasks, and alerts; add request logging.',
      priority: 'Critical',
    },
    {
      area: 'Connect Experience',
      score: 72,
      currentState: 'Mobile guided flow exists with resource delivery and relationship activation.',
      gaps: ['No native contact autofill', 'No SMS/email delivery confirmation in UI', 'No consent preferences'],
      recommendation: 'Add consent language, delivery status, and Apple/Google contact-saving support after activation.',
      priority: 'High',
    },
    {
      area: 'Resource Library',
      score: 61,
      currentState: 'Resource objects, analytics fields, permissions, and admin visibility exist.',
      gaps: ['No file upload/storage yet', 'No resource edit form persistence', 'No foldering/collections'],
      recommendation: 'Wire Vercel Blob or Airtable attachment upload plus CRUD forms and collection builder.',
      priority: 'High',
    },
    {
      area: 'QR Management',
      score: 70,
      currentState: 'Campaign, staff, event, location, and NFC destinations exist with scan/conversion metrics.',
      gaps: ['Generated QR is SVG endpoint only', 'No bulk download pack', 'No per-scan device/location analytics'],
      recommendation: 'Add campaign creation form, PNG/PDF export, and scan event logging by campaign.',
      priority: 'High',
    },
    {
      area: 'Automation/Nurture',
      score: 63,
      currentState: 'Rules and sequence model are present with trigger/action vocabulary.',
      gaps: ['n8n workflows are not invoked yet', 'No scheduled worker for delayed steps', 'No task completion UI'],
      recommendation: 'Wire n8n webhook dispatch and scheduled sequence runner; add staff task board.',
      priority: 'Critical',
    },
    {
      area: 'AI Opportunity Engine',
      score: 67,
      currentState: 'Rule-based opportunity score, priority, recommended action, and forgotten opportunity detection exist.',
      gaps: ['No OpenAI-generated living relationship profile yet', 'No model audit trail or confidence scoring'],
      recommendation: 'Call OpenAI after every engagement event to update profile, risk, recommended next action, and reasons.',
      priority: 'High',
    },
    {
      area: 'Launch Testing',
      score: 35,
      currentState: 'Build and basic live API/page smoke tests passed.',
      gaps: ['No 20-scan/contact/email/SMS/redirect/AI test run completed', 'No verified Resend/Twilio delivery logs'],
      recommendation: 'Run scripted production test matrix after Airtable, Resend, Twilio, and n8n envs are connected.',
      priority: 'Critical',
    },
  ];
}

export async function getConnectDashboard(orgSlug?: string) {
  const relationships = await listConnectRelationships(orgSlug);
  const total = relationships.length;
  const hot = relationships.filter((item) => item.status === 'Hot' || item.aiProfile.followUpPriority === 'High' || item.aiProfile.followUpPriority === 'Immediate');
  const needsFollowUp = relationships.filter((item) => item.status === 'Needs Follow-Up' || item.aiProfile.followUpPriority === 'Immediate');
  const events = new Map<string, number>();
  const reps = new Map<string, number>();
  const resources = new Map<string, number>();

  relationships.forEach((relationship) => {
    if (relationship.event) events.set(relationship.event, (events.get(relationship.event) ?? 0) + 1);
    if (relationship.representative) reps.set(relationship.representative, (reps.get(relationship.representative) ?? 0) + 1);
    relationship.resourcesSent.forEach((resource) => resources.set(resource, (resources.get(resource) ?? 0) + 1));
  });

  return {
    total,
    hot: hot.length,
    needsFollowUp: needsFollowUp.length,
    activeOpportunities: relationships.filter((item) => item.status !== 'Dormant' && item.status !== 'Converted').length,
    averageOpportunityScore: total
      ? Math.round(relationships.reduce((sum, item) => sum + item.aiProfile.opportunityScore, 0) / total)
      : 0,
    relationships,
    forgottenOpportunities: relationships.filter((item) => item.aiProfile.followUpPriority === 'Immediate'),
    topEvents: [...events.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    topRepresentatives: [...reps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    topResources: [...resources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    conversionRate: total ? Math.round((relationships.filter((item) => item.engagement.applicationsStarted > 0 || item.status === 'Converted').length / total) * 100) : 0,
    engagementTrend: [
      { label: 'Scans', value: relationships.reduce((sum, item) => sum + item.engagement.scans, 0) },
      { label: 'Opens', value: relationships.reduce((sum, item) => sum + item.engagement.opens, 0) },
      { label: 'Clicks', value: relationships.reduce((sum, item) => sum + item.engagement.clicks, 0) },
      { label: 'Applications', value: relationships.reduce((sum, item) => sum + item.engagement.applicationsStarted + item.engagement.applicationsCompleted, 0) },
    ],
  };
}

export async function recordConnectEngagement(event: Omit<ConnectEngagementEvent, 'createdAt'>) {
  const relationship = localRelationships.find((item) => item.id === event.relationshipId);
  if (relationship) {
    const keyByType: Partial<Record<ConnectEngagementEvent['type'], keyof ConnectRelationship['engagement']>> = {
      scan: 'scans',
      email_open: 'opens',
      link_click: 'clicks',
      resource_download: 'downloads',
      video_view: 'videoViews',
      portal_visit: 'portalVisits',
      application_started: 'applicationsStarted',
      application_completed: 'applicationsCompleted',
      message: 'messages',
      follow_up_completed: 'followUpsCompleted',
    };
    const key = keyByType[event.type];
    if (key) relationship.engagement[key] += 1;
    relationship.aiProfile = generateOpportunityIntelligence(relationship, relationship.engagement, relationship.createdAt);
    relationship.updatedAt = new Date().toISOString();
  }

  return {
    ...event,
    createdAt: new Date().toISOString(),
  };
}

export function summarizeVoiceNote(note: string) {
  const text = note.trim();
  const tags = Array.from(new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
      .filter((word) => ['parent', 'athlete', 'coach', 'donor', 'volunteer', 'division', 'academic', 'interested', 'recruiting'].includes(word)),
  ));
  return {
    transcript: text,
    summary: text.length > 180 ? `${text.slice(0, 177)}...` : text,
    tags,
  };
}
