const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const TABLE = 'Client Records';

export type AirtablePackage =
  | 'Capacity Assessment'
  | 'Capacity Blueprint'
  | 'Implementation Package';

export type PortalAccessStatus = 'Pending' | 'Active' | 'Suspended';
export type OnboardingStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface ClientRecord {
  clientName: string;
  organization?: string;
  email: string;
  phone?: string;
  packagePurchased: AirtablePackage;
  amountPaid: number;
  paymentDate: string;
  stripeTransactionId: string;
  portalAccessStatus?: PortalAccessStatus;
  onboardingStatus?: OnboardingStatus;
}

export interface PortalClientRecord {
  id: string;
  clientName: string;
  email: string;
  organization?: string;
  packagePurchased: AirtablePackage;
  amountPaid: number;
  paymentDate: string;
  portalAccessStatus: PortalAccessStatus;
  portalSlug: string;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function findRecordByEmail(email: string): Promise<string | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;

  const safe = email.toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(`LOWER({Email})='${safe}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return null;
    const data = (await res.json()) as { records?: { id: string }[] };
    return data.records?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function createOrUpdateClientRecord(
  record: ClientRecord
): Promise<{ ok: boolean; error?: string; recordId?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const raw: Record<string, string | number | boolean> = {
    'Client Name': record.clientName,
    'Email': record.email,
    'Package Purchased': record.packagePurchased,
    'Amount Paid': record.amountPaid,
    'Payment Date': record.paymentDate,
    'Stripe Transaction ID': record.stripeTransactionId,
    'Portal Access Status': record.portalAccessStatus ?? 'Pending',
    'Onboarding Status': record.onboardingStatus ?? 'Not Started',
  };

  if (record.organization) raw['Organization'] = record.organization;
  if (record.phone) raw['Phone'] = record.phone;

  try {
    const existingId = await findRecordByEmail(record.email);
    let recordId: string | undefined;

    if (existingId) {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${existingId}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ fields: raw, typecast: true }),
        }
      );
      if (!res.ok) {
        const detail = await res.text();
        console.error('Airtable PATCH failed:', detail);
        return { ok: false, error: 'Failed to update client record.' };
      }
      recordId = existingId;
    } else {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ records: [{ fields: raw }], typecast: true }),
        }
      );
      if (!res.ok) {
        const detail = await res.text();
        console.error('Airtable POST failed:', detail);
        return { ok: false, error: 'Failed to create client record.' };
      }
      const data = (await res.json()) as { records?: { id: string }[] };
      recordId = data.records?.[0]?.id;
    }

    return { ok: true, recordId };
  } catch (err) {
    console.error('Airtable error:', err);
    return { ok: false, error: 'Unexpected error writing to Airtable.' };
  }
}

export async function setPortalCredentials(
  recordId: string,
  portalSlug: string,
  tempPassword: string,
  portalUsername: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, string> = {
    'Portal Username': portalUsername,
    'Temp Password': tempPassword,
    'Portal Slug': portalSlug,
    'Portal Access Status': 'Active',
  };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('setPortalCredentials PATCH failed:', detail);
      return { ok: false, error: 'Failed to set portal credentials.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('setPortalCredentials error:', err);
    return { ok: false, error: 'Unexpected error setting portal credentials.' };
  }
}

export async function getClientByPortalSlug(slug: string): Promise<PortalClientRecord | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;

  const safe = slug.replace(/'/g, "\\'");
  const formula = encodeURIComponent(`{Portal Slug}='${safe}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return null;

    const f = rec.fields;
    return {
      id: rec.id,
      clientName: (f['Client Name'] as string) ?? '',
      email: (f['Email'] as string) ?? '',
      organization: (f['Organization'] as string) || undefined,
      packagePurchased: (f['Package Purchased'] as AirtablePackage) ?? 'Capacity Assessment',
      amountPaid: (f['Amount Paid'] as number) ?? 0,
      paymentDate: (f['Payment Date'] as string) ?? '',
      portalAccessStatus: (f['Portal Access Status'] as PortalAccessStatus) ?? 'Pending',
      portalSlug: slug,
    };
  } catch {
    return null;
  }
}

const ASSESSMENTS_TABLE =
  process.env.AIRTABLE_ASSESSMENTS_TABLE_ID ?? 'tblbDbNP5PCMojNe1';
const PROPOSALS_TABLE =
  process.env.AIRTABLE_PROPOSALS_TABLE_ID ?? 'tbl3P26zyteiPNLQY';

export interface AssessmentRecord {
  assessmentId: string;
  businessName: string;
  contactName: string;
  email: string;
  teamSize: number;
  revenueRange: string;
  currentSystems: string;
  systemsCount: number;
  operationalChallenges: string[];
  growthGoals: string;
  capacityConstraints: string;
  workflowCount: number;
  automationCount: number;
  integrationCount: number;
  dashboardRequired: boolean;
  portalRequired: boolean;
  userCount: number;
  businessComplexity: string;
  linkedProposalId?: string;
}

export interface ProposalRecord {
  proposalId: string;
  businessName: string;
  contactName: string;
  email: string;
  status: string;
  recommendedProjectType: string;
  projectTypeLabel: string;
  capacityScore: number;
  scoreBand: string;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  rawFee: number;
  recommendedFee: number;
}

export async function createProposalRecord(
  record: ProposalRecord
): Promise<{ ok: boolean; error?: string; recordId?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('createProposalRecord: AIRTABLE_API_KEY not set.');
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {
    'Proposal ID': record.proposalId,
    'Business Name': record.businessName,
    'Contact Name': record.contactName,
    'Email': record.email,
    'Status': record.status,
    'Recommended Project Type': record.recommendedProjectType,
    'Project Type Label': record.projectTypeLabel,
    'Capacity Score': record.capacityScore,
    'Score Band': record.scoreBand,
    'Primary Constraint': record.primaryConstraint,
    'Weekly Time Recovery': record.weeklyTimeRecovery,
    'Opportunity Low': record.opportunityLow,
    'Opportunity High': record.opportunityHigh,
    'Raw Fee': record.rawFee,
    'Recommended Fee': record.recommendedFee,
  };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${PROPOSALS_TABLE}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('createProposalRecord POST failed:', detail);
      return { ok: false, error: 'Failed to create proposal record.' };
    }

    const data = (await res.json()) as { records?: { id: string }[] };
    return { ok: true, recordId: data.records?.[0]?.id };
  } catch (err) {
    console.error('createProposalRecord error:', err);
    return { ok: false, error: 'Unexpected error creating proposal.' };
  }
}

export async function createAssessmentRecord(
  record: AssessmentRecord
): Promise<{ ok: boolean; error?: string; recordId?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('createAssessmentRecord: AIRTABLE_API_KEY not set.');
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {
    'Assessment ID': record.assessmentId,
    'Business Name': record.businessName,
    'Contact Name': record.contactName,
    'Email': record.email,
    'Team Size': record.teamSize,
    'Revenue Range': record.revenueRange,
    'Current Systems': record.currentSystems,
    'Systems Count': record.systemsCount,
    'Operational Challenges': record.operationalChallenges,
    'Growth Goals': record.growthGoals,
    'Capacity Constraints': record.capacityConstraints,
    'Workflow Count': record.workflowCount,
    'Automation Count': record.automationCount,
    'Integration Count': record.integrationCount,
    'Dashboard Required': record.dashboardRequired,
    'Portal Required': record.portalRequired,
    'User Count': record.userCount,
    'Business Complexity': record.businessComplexity,
  };

  if (record.linkedProposalId) {
    fields['Linked Proposal'] = [record.linkedProposalId];
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${ASSESSMENTS_TABLE}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('createAssessmentRecord POST failed:', detail);
      return { ok: false, error: 'Failed to create assessment record.' };
    }

    const data = (await res.json()) as { records?: { id: string }[] };
    return { ok: true, recordId: data.records?.[0]?.id };
  } catch (err) {
    console.error('createAssessmentRecord error:', err);
    return { ok: false, error: 'Unexpected error creating assessment.' };
  }
}

export async function validatePortalLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'Not configured.' };
  }

  const safe = email.toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(`LOWER({Email})='${safe}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return { ok: false, error: 'Database error.' };

    const data = (await res.json()) as {
      records?: { fields: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return { ok: false, error: 'Invalid credentials.' };

    const f = rec.fields;
    const storedPassword = (f['Temp Password'] as string) ?? '';
    const portalSlug = (f['Portal Slug'] as string) ?? '';
    const accessStatus = (f['Portal Access Status'] as PortalAccessStatus) ?? 'Pending';

    if (!storedPassword || storedPassword !== password) {
      return { ok: false, error: 'Invalid credentials.' };
    }
    if (accessStatus === 'Suspended') {
      return { ok: false, error: 'Portal access suspended. Please contact support.' };
    }
    if (!portalSlug) {
      return { ok: false, error: 'Portal not yet provisioned. Please contact support.' };
    }

    return { ok: true, slug: portalSlug };
  } catch {
    return { ok: false, error: 'Unexpected error. Please try again.' };
  }
}

// ---------------------------------------------------------------------------
// Proposals dashboard (E5)
// ---------------------------------------------------------------------------

export interface ProposalWithAssessment {
  id: string; // Airtable record ID
  proposalId: string;
  businessName: string;
  contactName: string;
  email: string;
  status: string;
  recommendedProjectType: string;
  projectTypeLabel: string;
  capacityScore: number;
  scoreBand: string;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  rawFee: number;
  recommendedFee: number;
  scopeSummary: string;
  dateApproved?: string;
  stripeSessionId?: string;
  createdTime?: string;
  // Populated from linked Assessment record (absent if no link)
  teamSize?: number;
  revenueRange?: string;
  operationalChallenges?: string[];
  growthGoals?: string;
  capacityConstraints?: string;
  businessComplexity?: string;
}

export async function getProposalsWithAssessments(): Promise<ProposalWithAssessment[]> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('getProposalsWithAssessments: AIRTABLE_API_KEY not set.');
    return [];
  }

  try {
    // Paginate through all proposals
    const proposalRecords: { id: string; createdTime: string; fields: Record<string, unknown> }[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${PROPOSALS_TABLE}?${params}`,
        { headers: authHeaders() }
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error('getProposalsWithAssessments fetch failed:', detail);
        return [];
      }

      const data = (await res.json()) as {
        records: { id: string; createdTime: string; fields: Record<string, unknown> }[];
        offset?: string;
      };
      proposalRecords.push(...data.records);
      offset = data.offset;
    } while (offset);

    // Collect unique linked assessment record IDs
    const assessmentCache = new Map<string, Record<string, unknown>>();
    const assessmentIds = new Set<string>();

    for (const record of proposalRecords) {
      const linked = record.fields['Linked Assessment'];
      if (Array.isArray(linked) && linked.length > 0) {
        assessmentIds.add(linked[0] as string);
      }
    }

    // Fetch each linked assessment by record ID
    for (const assessmentId of assessmentIds) {
      try {
        const res = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${ASSESSMENTS_TABLE}/${assessmentId}`,
          { headers: authHeaders() }
        );
        if (res.ok) {
          const data = (await res.json()) as { fields: Record<string, unknown> };
          assessmentCache.set(assessmentId, data.fields);
        }
      } catch (err) {
        console.error(`Failed to fetch assessment ${assessmentId}:`, err);
      }
    }

    // Merge proposal + assessment data into typed records
    return proposalRecords.map((record) => {
      const f = record.fields;
      const linked = record.fields['Linked Assessment'];
      const assessmentId =
        Array.isArray(linked) && linked.length > 0 ? (linked[0] as string) : undefined;
      const af = assessmentId ? assessmentCache.get(assessmentId) : undefined;

      // Operational Challenges may be multipleSelects (array) or multilineText (string)
      const rawChallenges = af?.['Operational Challenges'];
      const operationalChallenges = Array.isArray(rawChallenges)
        ? (rawChallenges as string[])
        : typeof rawChallenges === 'string' && rawChallenges
        ? rawChallenges
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      return {
        id: record.id,
        proposalId: (f['Proposal ID'] as string) ?? '',
        businessName: (f['Business Name'] as string) ?? '',
        contactName: (f['Contact Name'] as string) ?? '',
        email: (f['Email'] as string) ?? '',
        status: (f['Status'] as string) ?? 'Pending Review',
        recommendedProjectType: (f['Recommended Project Type'] as string) ?? '',
        projectTypeLabel: (f['Project Type Label'] as string) ?? '',
        capacityScore: (f['Capacity Score'] as number) ?? 0,
        scoreBand: (f['Score Band'] as string) ?? '',
        primaryConstraint: (f['Primary Constraint'] as string) ?? '',
        weeklyTimeRecovery: (f['Weekly Time Recovery'] as number) ?? 0,
        opportunityLow: (f['Opportunity Low'] as number) ?? 0,
        opportunityHigh: (f['Opportunity High'] as number) ?? 0,
        rawFee: (f['Raw Fee'] as number) ?? 0,
        recommendedFee: (f['Recommended Fee'] as number) ?? 0,
        scopeSummary: (f['Scope Summary'] as string) ?? '',
        dateApproved: (f['Date Approved'] as string) || undefined,
        createdTime: record.createdTime || undefined,
        teamSize: af ? ((af['Team Size'] as number) ?? undefined) : undefined,
        revenueRange: af ? ((af['Revenue Range'] as string) || undefined) : undefined,
        operationalChallenges: af ? operationalChallenges : undefined,
        growthGoals: af ? ((af['Growth Goals'] as string) || undefined) : undefined,
        capacityConstraints: af
          ? ((af['Capacity Constraints'] as string) || undefined)
          : undefined,
        businessComplexity: af
          ? ((af['Business Complexity'] as string) || undefined)
          : undefined,
      };
    });
  } catch (err) {
    console.error('getProposalsWithAssessments error:', err);
    return [];
  }
}

export async function updateProposal(
  recordId: string,
  patch: {
    status?: string;
    paymentStatus?: string;
    recommendedFee?: number;
    scopeSummary?: string;
    dateApproved?: string;
    stripeSessionId?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {};
  if (patch.status !== undefined) fields['Status'] = patch.status;
  if (patch.paymentStatus !== undefined) fields['Payment Status'] = patch.paymentStatus;
  if (patch.recommendedFee !== undefined) fields['Recommended Fee'] = patch.recommendedFee;
  if (patch.scopeSummary !== undefined) fields['Scope Summary'] = patch.scopeSummary;
  if (patch.dateApproved !== undefined) fields['Date Approved'] = patch.dateApproved;
  if (patch.stripeSessionId !== undefined) fields['Stripe Session ID'] = patch.stripeSessionId;

  if (Object.keys(fields).length === 0) {
    return { ok: false, error: 'No fields to update.' };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${PROPOSALS_TABLE}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('updateProposal PATCH failed:', detail);
      return { ok: false, error: 'Failed to update proposal.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('updateProposal error:', err);
    return { ok: false, error: 'Unexpected error updating proposal.' };
  }
}

// ---------------------------------------------------------------------------
// Single-proposal lookups (E6/E7)
// ---------------------------------------------------------------------------

// Private helper: convert a raw Proposals record + its linked Assessment into
// a ProposalWithAssessment. Used by both getProposalByRecordId and
// getProposalByProposalId.
async function buildProposalRecord(
  record: { id: string; createdTime?: string; fields: Record<string, unknown> }
): Promise<ProposalWithAssessment> {
  const f = record.fields;
  const linked = f['Linked Assessment'];
  const assessmentId =
    Array.isArray(linked) && linked.length > 0 ? (linked[0] as string) : undefined;

  let af: Record<string, unknown> | undefined;
  if (assessmentId && process.env.AIRTABLE_API_KEY) {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${ASSESSMENTS_TABLE}/${assessmentId}`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = (await res.json()) as { fields: Record<string, unknown> };
        af = data.fields;
      }
    } catch (err) {
      console.error(`buildProposalRecord: failed to fetch assessment ${assessmentId}:`, err);
    }
  }

  const rawChallenges = af?.['Operational Challenges'];
  const operationalChallenges = Array.isArray(rawChallenges)
    ? (rawChallenges as string[])
    : typeof rawChallenges === 'string' && rawChallenges
    ? rawChallenges.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: record.id,
    proposalId: (f['Proposal ID'] as string) ?? '',
    businessName: (f['Business Name'] as string) ?? '',
    contactName: (f['Contact Name'] as string) ?? '',
    email: (f['Email'] as string) ?? '',
    status: (f['Status'] as string) ?? 'Pending Review',
    recommendedProjectType: (f['Recommended Project Type'] as string) ?? '',
    projectTypeLabel: (f['Project Type Label'] as string) ?? '',
    capacityScore: (f['Capacity Score'] as number) ?? 0,
    scoreBand: (f['Score Band'] as string) ?? '',
    primaryConstraint: (f['Primary Constraint'] as string) ?? '',
    weeklyTimeRecovery: (f['Weekly Time Recovery'] as number) ?? 0,
    opportunityLow: (f['Opportunity Low'] as number) ?? 0,
    opportunityHigh: (f['Opportunity High'] as number) ?? 0,
    rawFee: (f['Raw Fee'] as number) ?? 0,
    recommendedFee: (f['Recommended Fee'] as number) ?? 0,
    scopeSummary: (f['Scope Summary'] as string) ?? '',
    dateApproved: (f['Date Approved'] as string) || undefined,
    stripeSessionId: (f['Stripe Session ID'] as string) || undefined,
    createdTime: record.createdTime || undefined,
    teamSize: af ? ((af['Team Size'] as number) ?? undefined) : undefined,
    revenueRange: af ? ((af['Revenue Range'] as string) || undefined) : undefined,
    operationalChallenges: af ? operationalChallenges : undefined,
    growthGoals: af ? ((af['Growth Goals'] as string) || undefined) : undefined,
    capacityConstraints: af
      ? ((af['Capacity Constraints'] as string) || undefined)
      : undefined,
    businessComplexity: af
      ? ((af['Business Complexity'] as string) || undefined)
      : undefined,
  };
}

export async function getProposalByRecordId(
  recordId: string
): Promise<ProposalWithAssessment | null> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('getProposalByRecordId: AIRTABLE_API_KEY not set.');
    return null;
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${PROPOSALS_TABLE}/${recordId}`,
      { headers: authHeaders() }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('getProposalByRecordId fetch failed:', detail);
      return null;
    }

    const data = (await res.json()) as { id: string; createdTime?: string; fields: Record<string, unknown> };
    return buildProposalRecord({ id: data.id, createdTime: data.createdTime, fields: data.fields });
  } catch (err) {
    console.error('getProposalByRecordId error:', err);
    return null;
  }
}

export async function getProposalByProposalId(
  proposalId: string
): Promise<ProposalWithAssessment | null> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('getProposalByProposalId: AIRTABLE_API_KEY not set.');
    return null;
  }

  try {
    const safe = proposalId.replace(/'/g, "\\'");
    const formula = encodeURIComponent(`{Proposal ID}='${safe}'`);
    const url = `https://api.airtable.com/v0/${BASE_ID}/${PROPOSALS_TABLE}?filterByFormula=${formula}&maxRecords=1`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const detail = await res.text();
      console.error('getProposalByProposalId fetch failed:', detail);
      return null;
    }

    const data = (await res.json()) as {
      records?: { id: string; createdTime?: string; fields: Record<string, unknown> }[];
    };

    const record = data.records?.[0];
    if (!record) return null;

    return buildProposalRecord(record);
  } catch (err) {
    console.error('getProposalByProposalId error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dashboard helpers (E11)
// ---------------------------------------------------------------------------

export interface AssessmentSummary {
  id: string;
  createdTime: string;
  businessName: string;
}

export async function getAllAssessments(): Promise<AssessmentSummary[]> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('getAllAssessments: AIRTABLE_API_KEY not set.');
    return [];
  }

  try {
    const records: AssessmentSummary[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${ASSESSMENTS_TABLE}?${params}`,
        { headers: authHeaders() }
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error('getAllAssessments fetch failed:', detail);
        return records;
      }

      const data = (await res.json()) as {
        records: { id: string; createdTime: string; fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        records.push({
          id: r.id,
          createdTime: r.createdTime,
          businessName: (r.fields['Business Name'] as string) ?? '',
        });
      }

      offset = data.offset;
    } while (offset);

    return records;
  } catch (err) {
    console.error('getAllAssessments error:', err);
    return [];
  }
}

export interface ClientRecordSummary {
  id: string;
  clientName: string;
  onboardingStatus: string;
  portalAccessStatus: string;
  amountPaid: number;
  packagePurchased: string;
}

export async function getAllClientRecords(): Promise<ClientRecordSummary[]> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('getAllClientRecords: AIRTABLE_API_KEY not set.');
    return [];
  }

  try {
    const records: ClientRecordSummary[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?${params}`,
        { headers: authHeaders() }
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error('getAllClientRecords fetch failed:', detail);
        return records;
      }

      const data = (await res.json()) as {
        records: { id: string; fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        records.push({
          id: r.id,
          clientName: (r.fields['Client Name'] as string) ?? '',
          onboardingStatus: (r.fields['Onboarding Status'] as string) ?? 'Not Started',
          portalAccessStatus: (r.fields['Portal Access Status'] as string) ?? 'Pending',
          amountPaid: (r.fields['Amount Paid'] as number) ?? 0,
          packagePurchased: (r.fields['Package Purchased'] as string) ?? '',
        });
      }

      offset = data.offset;
    } while (offset);

    return records;
  } catch (err) {
    console.error('getAllClientRecords error:', err);
    return [];
  }
}
