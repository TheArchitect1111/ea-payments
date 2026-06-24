export type ConnectResource = {
  id: string;
  title: string;
  type: 'PDF' | 'Guide' | 'Video' | 'Landing Page' | 'Application' | 'Calendar Link' | 'Portal' | 'Custom URL';
  url: string;
  description: string;
};

export type ConnectSequenceStep = {
  id: string;
  delayDays: number;
  title: string;
  resourceId: string;
  channel: 'email' | 'sms' | 'both';
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
};

const demoResources: ConnectResource[] = [
  {
    id: 'parent-recruiting-guide',
    title: 'Parent Recruiting Guide',
    type: 'Guide',
    url: '/portal/demo-client/resources',
    description: 'A practical first resource for families exploring recruiting support.',
  },
  {
    id: 'recruiting-faq',
    title: 'Recruiting FAQ',
    type: 'PDF',
    url: '/scorecard',
    description: 'Answers to the questions families ask after an event conversation.',
  },
  {
    id: 'evaluation-invite',
    title: 'Athlete Evaluation Invitation',
    type: 'Application',
    url: '/assessment',
    description: 'A warm next step for qualified prospects.',
  },
  {
    id: 'consultation',
    title: 'Schedule Consultation',
    type: 'Calendar Link',
    url: '/contact',
    description: 'Direct booking path for high-intent relationships.',
  },
];

const orgs: ConnectOrgConfig[] = [
  {
    slug: 'cpr',
    name: 'Canadian Prospects Recruitment',
    colors: { ink: '#101820', accent: '#d91f2a', soft: '#f5f7fb' },
    qrCodeLabel: 'CPR Connect',
    nfcDestination: '/connect/cpr',
    redirectDestination: '/assessment',
    notificationEmails: ['freedom@efficiencyarchitects.online'],
    resources: demoResources,
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
    resources: demoResources,
    sequence: [
      { id: 'now-guide', delayDays: 0, title: 'Send Welcome Guide', resourceId: 'parent-recruiting-guide', channel: 'email' },
      { id: 'faq-3', delayDays: 3, title: 'Send FAQ', resourceId: 'recruiting-faq', channel: 'email' },
      { id: 'call-7', delayDays: 7, title: 'Invite Consultation', resourceId: 'consultation', channel: 'both' },
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

function buildRelationship(
  input: CreateRelationshipInput,
  createdAt = new Date().toISOString(),
  engagementOverrides: Partial<ConnectRelationship['engagement']> = {},
): ConnectRelationship {
  const org = getConnectOrg(input.orgSlug);
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
    engagement.messages * 12;
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
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.CONNECT_RELATIONSHIPS_TABLE_ID || process.env.AIRTABLE_CONNECT_RELATIONSHIPS_TABLE_ID;
  if (!apiKey || !baseId || !tableId) return null;
  return { apiKey, baseId, tableId };
}

async function postRelationshipToAirtable(relationship: ConnectRelationship) {
  const config = airtableConfig();
  if (!config) return;

  await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.tableId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
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
          },
        },
      ],
    }),
  });
}

export function getConnectOrg(slug: string): ConnectOrgConfig {
  return orgs.find((org) => org.slug === slug) ?? orgs[1];
}

export function listConnectOrgs(): ConnectOrgConfig[] {
  return orgs;
}

export async function createConnectRelationship(input: CreateRelationshipInput): Promise<ConnectRelationship> {
  const relationship = buildRelationship(input);
  localRelationships.unshift(relationship);
  try {
    await postRelationshipToAirtable(relationship);
  } catch (error) {
    console.error('[connect] Airtable write failed', error);
  }
  return relationship;
}

export async function listConnectRelationships(orgSlug?: string): Promise<ConnectRelationship[]> {
  return localRelationships.filter((relationship) => !orgSlug || relationship.orgSlug === orgSlug);
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
