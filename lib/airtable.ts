import {
  lifecycleFieldsFromAirtable,
  lifecycleFieldsToAirtable,
  lifecycleForDiscoveryScheduled,
  lifecycleForPaidClient,
  lifecycleForProspect,
  type ClientLifecycleFields,
} from '@/lib/client-lifecycle';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const TABLE = 'Client Records';

export type AirtablePackage =
  | 'Capacity Assessment'
  | 'Capacity Blueprint'
  | 'Implementation Package'
  | 'Simplifi'
  | 'Launch Verification';

export type PortalAccessStatus = 'Pending' | 'Active' | 'Suspended';
export type OnboardingStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Docs Sent'
  | 'Docs Signed'
  | 'Complete'
  | 'Launch Verification';

export interface ClientRecord {
  clientName: string;
  organization?: string;
  email: string;
  phone?: string;
  packagePurchased: AirtablePackage;
  /** Canonical commerce offer id (e.g. website_portal_starter) when Package Purchased is coarse. */
  commerceOfferId?: string;
  amountPaid: number;
  paymentDate: string;
  stripeTransactionId: string;
  portalAccessStatus?: PortalAccessStatus;
  onboardingStatus?: OnboardingStatus;
  paymentReceivedAt?: string;
  docsSentAt?: string;
  docsSignedAt?: string;
  lifecycle?: ClientLifecycleFields;
}

export interface PortalClientRecord {
  id: string;
  clientName: string;
  email: string;
  organization?: string;
  packagePurchased: AirtablePackage;
  /** Canonical commerce offer id when present on the Client Records row. */
  commerceOfferId?: string;
  amountPaid: number;
  paymentDate: string;
  portalAccessStatus: PortalAccessStatus;
  portalSlug: string;
  passwordChanged: boolean;
  passwordHash?: string;
  tempPassword?: string;
  onboardingStatus?: OnboardingStatus;
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
  if (record.commerceOfferId?.trim()) raw['Commerce Offer Id'] = record.commerceOfferId.trim();
  if (record.paymentReceivedAt) raw['Payment Received At'] = record.paymentReceivedAt;
  if (record.docsSentAt) raw['Docs Sent At'] = record.docsSentAt;
  if (record.docsSignedAt) raw['Docs Signed At'] = record.docsSignedAt;
  Object.assign(raw, lifecycleFieldsToAirtable(record.lifecycle ?? {}));

  async function writeFields(
    fields: Record<string, string | number | boolean>,
    existingId: string | null,
  ): Promise<{ ok: boolean; recordId?: string; detail?: string }> {
    if (existingId) {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${existingId}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ fields, typecast: true }),
        },
      );
      if (!res.ok) {
        return { ok: false, detail: await res.text() };
      }
      return { ok: true, recordId: existingId };
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      },
    );
    if (!res.ok) {
      return { ok: false, detail: await res.text() };
    }
    const data = (await res.json()) as { records?: { id: string }[] };
    return { ok: true, recordId: data.records?.[0]?.id };
  }

  try {
    const existingId = await findRecordByEmail(record.email);
    let result = await writeFields(raw, existingId);

    // Optional column: retry without Commerce Offer Id if the base lacks the field.
    if (
      !result.ok &&
      raw['Commerce Offer Id'] &&
      /UNKNOWN_FIELD_NAME|Unknown field|Commerce Offer Id/i.test(result.detail || '')
    ) {
      const { 'Commerce Offer Id': _omit, ...withoutOffer } = raw;
      console.warn(
        'Airtable Client Records missing Commerce Offer Id — retrying without it. Add the single-line text field for offer-accurate entitlements.',
      );
      result = await writeFields(withoutOffer, existingId);
    }

    if (!result.ok) {
      console.error('Airtable write failed:', result.detail);
      return {
        ok: false,
        error: existingId ? 'Failed to update client record.' : 'Failed to create client record.',
      };
    }

    return { ok: true, recordId: result.recordId };
  } catch (err) {
    console.error('Airtable error:', err);
    return { ok: false, error: 'Unexpected error writing to Airtable.' };
  }
}

export async function updateClientLifecycleByEmail(
  email: string,
  lifecycle: ClientLifecycleFields,
): Promise<{ ok: boolean; recordId?: string; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const existingId = await findRecordByEmail(email);
  if (!existingId) {
    return { ok: false, error: 'No client record for email.' };
  }

  const fields = lifecycleFieldsToAirtable(lifecycle);
  if (Object.keys(fields).length === 0) {
    return { ok: true, recordId: existingId };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${existingId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error('updateClientLifecycleByEmail PATCH failed:', detail);
      return { ok: false, error: 'Failed to update lifecycle fields.' };
    }
    return { ok: true, recordId: existingId };
  } catch (err) {
    console.error('updateClientLifecycleByEmail error:', err);
    return { ok: false, error: 'Unexpected error updating lifecycle.' };
  }
}

export async function updateClientLifecycleByPortalSlug(
  portalSlug: string,
  lifecycle: ClientLifecycleFields,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getClientByPortalSlug(portalSlug);
  if (!client?.email) {
    return { ok: false, error: 'No client for portal slug.' };
  }
  const result = await updateClientLifecycleByEmail(client.email, lifecycle);
  return { ok: result.ok, error: result.error };
}

/** Link assessment lead to Client Records without overwriting paying clients. */
export async function upsertProspectFromAssessment(input: {
  contactName: string;
  businessName: string;
  email: string;
  assessmentId: string;
}): Promise<{ ok: boolean; recordId?: string }> {
  const existing = await getClientByEmail(input.email);
  if (existing && existing.amountPaid > 0) {
    return { ok: true, recordId: existing.id };
  }

  const today = new Date().toISOString().slice(0, 10);
  return createOrUpdateClientRecord({
    clientName: input.contactName,
    organization: input.businessName,
    email: input.email,
    packagePurchased: 'Capacity Assessment',
    amountPaid: 0,
    paymentDate: today,
    stripeTransactionId: `prospect-${input.assessmentId}`,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
    lifecycle: lifecycleForProspect(),
  });
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
  const { localDemoPortalClient } = await import('@/lib/demo-local-fallback');
  const localDemo = localDemoPortalClient(slug);
  if (localDemo) return localDemo;

  const {
    getSeededDemoWebsiteClient,
    getDemoWebsitePortalClientRecord,
    isDemoWebsitePortalSlug,
  } = await import('@/lib/demo-website-portal-identity');
  const seededWebsite = getSeededDemoWebsiteClient(slug);
  if (seededWebsite) return seededWebsite;
  // Durable fixture identity for Website + Portal demo (CTP bind still required).
  if (isDemoWebsitePortalSlug(slug) && process.env.NODE_ENV === 'development') {
    return getDemoWebsitePortalClientRecord();
  }

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
    return mapPortalClientRecord(rec.id, f, slug);
  } catch {
    return null;
  }
}

function mapPortalClientRecord(
  id: string,
  f: Record<string, unknown>,
  portalSlug: string,
): PortalClientRecord {
  const commerceOfferId = String(f['Commerce Offer Id'] ?? '').trim() || undefined;
  return {
    id,
    clientName: (f['Client Name'] as string) ?? '',
    email: (f['Email'] as string) ?? '',
    organization: (f['Organization'] as string) || undefined,
    packagePurchased: (f['Package Purchased'] as AirtablePackage) ?? 'Capacity Assessment',
    commerceOfferId,
    amountPaid: (f['Amount Paid'] as number) ?? 0,
    paymentDate: (f['Payment Date'] as string) ?? '',
    portalAccessStatus: (f['Portal Access Status'] as PortalAccessStatus) ?? 'Pending',
    portalSlug,
    passwordChanged: Boolean(f['Password Changed']),
    passwordHash: (f['Password Hash'] as string) || undefined,
    tempPassword: (f['Temp Password'] as string) || undefined,
    onboardingStatus: (f['Onboarding Status'] as OnboardingStatus) || undefined,
  };
}

export async function getClientByRecordId(recordId: string): Promise<PortalClientRecord | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`,
      { headers: authHeaders(), cache: 'no-store' },
    );
    if (!res.ok) return null;

    const rec = (await res.json()) as { id: string; fields: Record<string, unknown> };
    const f = rec.fields;
    const slug = (f['Portal Slug'] as string) ?? '';
    return mapPortalClientRecord(rec.id, f, slug);
  } catch {
    return null;
  }
}

export async function getClientByEmail(email: string): Promise<PortalClientRecord | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;

  const safe = email.toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(`LOWER({Email})='${safe}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return null;

    const f = rec.fields;
    return mapPortalClientRecord(rec.id, f, (f['Portal Slug'] as string) ?? '');
  } catch {
    return null;
  }
}

export async function updateClientPassword(
  recordId: string,
  passwordHash: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          fields: {
            'Password Hash': passwordHash,
            'Password Changed': true,
            'Temp Password': '',
          },
          typecast: true,
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('updateClientPassword PATCH failed:', detail);
      return { ok: false, error: 'Failed to update password.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('updateClientPassword error:', err);
    return { ok: false, error: 'Unexpected error updating password.' };
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

export async function findPortalClientByEmail(
  email: string,
): Promise<{ ok: boolean; slug?: string; recordId?: string; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'Not configured.' };
  }

  const safe = email.trim().toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `OR(LOWER({Email})='${safe}', LOWER({Portal Username})='${safe}')`,
  );
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return { ok: false, error: 'Database error.' };

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return { ok: false, error: 'No portal account matches that email.' };

    const f = rec.fields;
    const portalSlug = (f['Portal Slug'] as string) ?? '';
    const accessStatus = (f['Portal Access Status'] as PortalAccessStatus) ?? 'Pending';

    if (accessStatus === 'Suspended') {
      return { ok: false, error: 'Portal access suspended. Please contact support.' };
    }
    if (!portalSlug) {
      return { ok: false, error: 'Portal not yet provisioned. Please contact support.' };
    }

    return { ok: true, slug: portalSlug, recordId: rec.id };
  } catch {
    return { ok: false, error: 'Unexpected error. Please try again.' };
  }
}

export async function validatePortalLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; slug?: string; recordId?: string; error?: string; passwordChanged?: boolean }> {
  const { validateLocalDemoLogin } = await import('@/lib/demo-local-fallback');
  const localLogin = validateLocalDemoLogin(email, password);
  if (localLogin) return localLogin;

  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'Not configured.' };
  }

  const safe = email.toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `OR(LOWER({Email})='${safe}', LOWER({Portal Username})='${safe}')`,
  );
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return { ok: false, error: 'Database error.' };

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return { ok: false, error: 'Invalid credentials.' };

    const f = rec.fields;
    const storedPassword = (f['Temp Password'] as string) ?? '';
    const storedHash = (f['Password Hash'] as string) ?? '';
    const passwordChanged = Boolean(f['Password Changed']);
    const portalSlug = (f['Portal Slug'] as string) ?? '';
    const accessStatus = (f['Portal Access Status'] as PortalAccessStatus) ?? 'Pending';

    if (passwordChanged) {
      const crypto = await import('node:crypto');
      let matches = false;
      if (storedHash.startsWith('scrypt$')) {
        const [, salt, expected] = storedHash.split('$');
        if (salt && expected) {
          const attempted = crypto.scryptSync(password, salt, 64).toString('hex');
          matches = expected === attempted;
        }
      } else {
        const attemptedHash = crypto.createHash('sha256').update(password).digest('hex');
        matches = storedHash === attemptedHash;
      }
      if (!storedHash || !matches) {
        return { ok: false, error: 'Invalid credentials.' };
      }
    } else if (!storedPassword || storedPassword !== password) {
      return { ok: false, error: 'Invalid credentials.' };
    }
    if (accessStatus === 'Suspended') {
      return { ok: false, error: 'Portal access suspended. Please contact support.' };
    }
    if (!portalSlug) {
      return { ok: false, error: 'Portal not yet provisioned. Please contact support.' };
    }

    return { ok: true, slug: portalSlug, recordId: rec.id, passwordChanged };
  } catch {
    return { ok: false, error: 'Unexpected error. Please try again.' };
  }
}

export async function updateClientEngagementScore(
  recordId: string,
  score: number,
): Promise<void> {
  if (!process.env.AIRTABLE_API_KEY) return;

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields: { 'Engagement Score': clamped }, typecast: true }),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      if (detail.includes('UNKNOWN_FIELD_NAME')) return;
      console.error('updateClientEngagementScore failed:', detail);
    }
  } catch (err) {
    console.error('updateClientEngagementScore error:', err);
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
  paymentStatus?: string;
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
        paymentStatus: (f['Payment Status'] as string) || undefined,
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
// Content Command Center
// ---------------------------------------------------------------------------

const CONTENT_REQUESTS_TABLE =
  process.env.AIRTABLE_CONTENT_REQUESTS_TABLE_ID ?? 'Content Requests';
const ENHANCEMENT_REQUESTS_TABLE =
  process.env.AIRTABLE_ENHANCEMENT_REQUESTS_TABLE_ID ?? 'Enhancement Requests';

export interface ContentRequestRecord {
  id: string;
  requestId: string;
  clientRecordId?: string;
  organizationName: string;
  requestType: string;
  pageLocation?: string;
  title: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  videoLink?: string;
  documentUrl?: string;
  priority: string;
  requestedPublishDate?: string;
  additionalNotes?: string;
  status: string;
  aiAnalysis?: string;
  aiRoutingSuggestion?: string;
  versionNumber?: number;
  dateSubmitted?: string;
  datePublished?: string;
  publishedContent?: string;
  submittedBy?: string;
}

export interface EnhancementRequestRecord {
  id: string;
  enhancementId: string;
  clientRecordId?: string;
  organizationName: string;
  enhancementType: string;
  description: string;
  businessGoal: string;
  aiLevelAssessment?: string;
  aiEstimatedFeeRange?: string;
  status: string;
  dateSubmitted?: string;
  notes?: string;
}

function firstLinkedId(value: unknown): string | undefined {
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
}

function mapContentRequest(record: {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}): ContentRequestRecord {
  const f = record.fields;
  return {
    id: record.id,
    requestId: String(f['Request ID'] ?? record.id),
    clientRecordId: firstLinkedId(f['Client Record']),
    organizationName: (f['Organization Name'] as string) ?? '',
    requestType: (f['Request Type'] as string) ?? '',
    pageLocation: (f['Page Location'] as string) || undefined,
    title: (f['Title'] as string) ?? '',
    description: (f['Description'] as string) || undefined,
    content: (f['Content'] as string) || undefined,
    imageUrl: (f['Image URL'] as string) || undefined,
    videoLink: (f['Video Link'] as string) || undefined,
    documentUrl: (f['Document URL'] as string) || undefined,
    priority: (f['Priority'] as string) ?? 'Normal',
    requestedPublishDate: (f['Requested Publish Date'] as string) || undefined,
    additionalNotes: (f['Additional Notes'] as string) || undefined,
    status: (f['Status'] as string) ?? 'Pending Review',
    aiAnalysis: (f['AI Analysis'] as string) || undefined,
    aiRoutingSuggestion: (f['AI Routing Suggestion'] as string) || undefined,
    versionNumber: (f['Version Number'] as number) || undefined,
    dateSubmitted: (f['Date Submitted'] as string) || record.createdTime,
    datePublished: (f['Date Published'] as string) || undefined,
    publishedContent: (f['Published Content'] as string) || (f['Content'] as string) || undefined,
    submittedBy: (f['Submitted By'] as string) || undefined,
  };
}

function mapEnhancementRequest(record: {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}): EnhancementRequestRecord {
  const f = record.fields;
  return {
    id: record.id,
    enhancementId: String(f['Enhancement ID'] ?? record.id),
    clientRecordId: firstLinkedId(f['Client Record']),
    organizationName: (f['Organization Name'] as string) ?? '',
    enhancementType: (f['Enhancement Type'] as string) ?? '',
    description: (f['Description'] as string) ?? '',
    businessGoal: (f['Business Goal'] as string) ?? '',
    aiLevelAssessment: (f['AI Level Assessment'] as string) || undefined,
    aiEstimatedFeeRange: (f['AI Estimated Fee Range'] as string) || undefined,
    status: (f['Status'] as string) ?? 'Submitted',
    dateSubmitted: (f['Date Submitted'] as string) || record.createdTime,
    notes: (f['Notes'] as string) || undefined,
  };
}

async function listTableRecords<T>(
  table: string,
  mapper: (record: { id: string; createdTime?: string; fields: Record<string, unknown> }) => T,
  filterByFormula?: string
): Promise<T[]> {
  if (!process.env.AIRTABLE_API_KEY) return [];

  const records: T[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);
    if (filterByFormula) params.set('filterByFormula', filterByFormula);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?${params}`,
      { headers: authHeaders(), cache: 'no-store' }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error(`listTableRecords ${table} failed:`, detail);
      return records;
    }

    const data = (await res.json()) as {
      records: { id: string; createdTime?: string; fields: Record<string, unknown> }[];
      offset?: string;
    };

    records.push(...data.records.map(mapper));
    offset = data.offset;
  } while (offset);

  return records;
}

export async function getContentRequestsForClient(
  clientRecordId: string
): Promise<ContentRequestRecord[]> {
  const requests = await listTableRecords(CONTENT_REQUESTS_TABLE, mapContentRequest);
  return requests.filter((request) => request.clientRecordId === clientRecordId);
}

export async function getAllContentRequests(): Promise<ContentRequestRecord[]> {
  return listTableRecords(CONTENT_REQUESTS_TABLE, mapContentRequest);
}

export async function createContentRequest(record: {
  clientRecordId: string;
  organizationName: string;
  requestType: string;
  pageLocation?: string;
  title: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  videoLink?: string;
  documentUrl?: string;
  priority?: string;
  requestedPublishDate?: string;
  additionalNotes?: string;
  status?: string;
  aiAnalysis?: string;
  submittedBy?: string;
}): Promise<{ ok: boolean; error?: string; recordId?: string; requestId?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {
    'Client Record': [record.clientRecordId],
    'Organization Name': record.organizationName,
    'Request Type': record.requestType,
    'Title': record.title,
    'Priority': record.priority ?? 'Normal',
    'Status': record.status ?? 'Pending Review',
    'Version Number': 1,
  };

  if (record.pageLocation) fields['Page Location'] = record.pageLocation;
  if (record.description) fields['Description'] = record.description;
  if (record.content) fields['Content'] = record.content;
  if (record.imageUrl) fields['Image URL'] = record.imageUrl;
  if (record.videoLink) fields['Video Link'] = record.videoLink;
  if (record.documentUrl) fields['Document URL'] = record.documentUrl;
  if (record.requestedPublishDate) fields['Requested Publish Date'] = record.requestedPublishDate;
  if (record.additionalNotes) fields['Additional Notes'] = record.additionalNotes;
  if (record.aiAnalysis) fields['AI Analysis'] = record.aiAnalysis;
  if (record.submittedBy) fields['Submitted By'] = record.submittedBy;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CONTENT_REQUESTS_TABLE)}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('createContentRequest POST failed:', detail);
      return { ok: false, error: 'Failed to create content request.' };
    }

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const created = data.records?.[0];
    return {
      ok: true,
      recordId: created?.id,
      requestId: created ? String(created.fields['Request ID'] ?? created.id) : undefined,
    };
  } catch (err) {
    console.error('createContentRequest error:', err);
    return { ok: false, error: 'Unexpected error creating content request.' };
  }
}

export async function updateContentRequest(
  recordId: string,
  patch: { status?: string; datePublished?: string; publishedContent?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {};
  if (patch.status) fields['Status'] = patch.status;
  if (patch.datePublished) fields['Date Published'] = patch.datePublished;
  if (patch.publishedContent) fields['Published Content'] = patch.publishedContent;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CONTENT_REQUESTS_TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('updateContentRequest PATCH failed:', detail);
      return { ok: false, error: 'Failed to update content request.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('updateContentRequest error:', err);
    return { ok: false, error: 'Unexpected error updating content request.' };
  }
}

export async function getAllEnhancementRequests(): Promise<EnhancementRequestRecord[]> {
  return listTableRecords(ENHANCEMENT_REQUESTS_TABLE, mapEnhancementRequest);
}

export async function createEnhancementRequest(record: {
  clientRecordId: string;
  organizationName: string;
  enhancementType: string;
  description: string;
  businessGoal: string;
  aiLevelAssessment?: string;
  aiEstimatedFeeRange?: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string; recordId?: string; enhancementId?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {
    'Client Record': [record.clientRecordId],
    'Organization Name': record.organizationName,
    'Enhancement Type': record.enhancementType,
    'Description': record.description,
    'Business Goal': record.businessGoal,
    'Status': 'Submitted',
  };

  if (record.aiLevelAssessment) fields['AI Level Assessment'] = record.aiLevelAssessment;
  if (record.aiEstimatedFeeRange) fields['AI Estimated Fee Range'] = record.aiEstimatedFeeRange;
  if (record.notes) fields['Notes'] = record.notes;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(ENHANCEMENT_REQUESTS_TABLE)}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('createEnhancementRequest POST failed:', detail);
      return { ok: false, error: 'Failed to create enhancement request.' };
    }

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const created = data.records?.[0];
    return {
      ok: true,
      recordId: created?.id,
      enhancementId: created ? String(created.fields['Enhancement ID'] ?? created.id) : undefined,
    };
  } catch (err) {
    console.error('createEnhancementRequest error:', err);
    return { ok: false, error: 'Unexpected error creating enhancement request.' };
  }
}

export async function updateEnhancementRequest(
  recordId: string,
  patch: { status?: string; notes?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, unknown> = {};
  if (patch.status) fields['Status'] = patch.status;
  if (patch.notes !== undefined) fields['Notes'] = patch.notes;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(ENHANCEMENT_REQUESTS_TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('updateEnhancementRequest PATCH failed:', detail);
      return { ok: false, error: 'Failed to update enhancement request.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('updateEnhancementRequest error:', err);
    return { ok: false, error: 'Unexpected error updating enhancement request.' };
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
    paymentStatus: (f['Payment Status'] as string) || undefined,
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

export async function getLatestProposalByEmail(
  email: string,
): Promise<ProposalWithAssessment | null> {
  if (!process.env.AIRTABLE_API_KEY) {
    console.warn('getLatestProposalByEmail: AIRTABLE_API_KEY not set.');
    return null;
  }

  const safe = email.toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(`LOWER({Email})='${safe}'`);
  const url =
    `https://api.airtable.com/v0/${BASE_ID}/${PROPOSALS_TABLE}` +
    `?filterByFormula=${formula}&pageSize=10`;

  try {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) {
      const detail = await res.text();
      console.error('getLatestProposalByEmail fetch failed:', detail);
      return null;
    }

    const data = (await res.json()) as {
      records?: { id: string; createdTime?: string; fields: Record<string, unknown> }[];
    };

    const records = data.records ?? [];
    if (records.length === 0) return null;

    records.sort((a, b) => {
      const ta = a.createdTime ? Date.parse(a.createdTime) : 0;
      const tb = b.createdTime ? Date.parse(b.createdTime) : 0;
      return tb - ta;
    });

    return buildProposalRecord(records[0]);
  } catch (err) {
    console.error('getLatestProposalByEmail error:', err);
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
  organization?: string;
  email?: string;
  onboardingStatus: string;
  portalAccessStatus: string;
  amountPaid: number;
  packagePurchased: string;
  createdTime?: string;
  paymentReceivedAt?: string;
  paymentDate?: string;
  portalSlug?: string;
  lifecycleStage?: string;
  discoveryStatus?: string;
  buildStatus?: string;
  launchStatus?: string;
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
        records: { id: string; createdTime: string; fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        const lifecycle = lifecycleFieldsFromAirtable(r.fields);
        records.push({
          id: r.id,
          clientName: (r.fields['Client Name'] as string) ?? '',
          organization: (r.fields['Organization'] as string) || undefined,
          email: (r.fields['Email'] as string) || undefined,
          onboardingStatus: (r.fields['Onboarding Status'] as string) ?? 'Not Started',
          portalAccessStatus: (r.fields['Portal Access Status'] as string) ?? 'Pending',
          amountPaid: (r.fields['Amount Paid'] as number) ?? 0,
          packagePurchased: (r.fields['Package Purchased'] as string) ?? '',
          createdTime: r.createdTime || undefined,
          paymentReceivedAt: (r.fields['Payment Received At'] as string) || undefined,
          paymentDate: (r.fields['Payment Date'] as string) || undefined,
          portalSlug: (r.fields['PortalSlug'] as string) || (r.fields['Portal Slug'] as string) || undefined,
          lifecycleStage: lifecycle.lifecycleStage,
          discoveryStatus: lifecycle.discoveryStatus,
          buildStatus: lifecycle.buildStatus,
          launchStatus: lifecycle.launchStatus,
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

// ---------------------------------------------------------------------------
// Master portal helpers (cross-platform read-only summaries)
// ---------------------------------------------------------------------------

const PARTNER_NETWORK_BASE_ID =
  process.env.AIRTABLE_PARTNER_NETWORK_BASE_ID ?? 'appnyHBarTuXIG9Ke';
const PARTNERS_TABLE = 'Partners';

export interface PartnerRecord {
  partnerName: string;
  referralCount: number;
  commissionOwed: number;
  commissionPaid: number;
  status: string;
}

const SAMPLE_PARTNER_RECORDS: PartnerRecord[] = [
  { partnerName: 'Sample Partner A', referralCount: 4, commissionOwed: 1200, commissionPaid: 800, status: 'Active' },
  { partnerName: 'Sample Partner B', referralCount: 2, commissionOwed: 600, commissionPaid: 0, status: 'Active' },
];

export async function getPartnerRecords(): Promise<PartnerRecord[]> {
  if (!process.env.AIRTABLE_API_KEY) return SAMPLE_PARTNER_RECORDS;

  try {
    const records: PartnerRecord[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${PARTNER_NETWORK_BASE_ID}/${encodeURIComponent(PARTNERS_TABLE)}?${params}`,
        { headers: authHeaders(), cache: 'no-store' }
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error('getPartnerRecords fetch failed:', detail);
        return SAMPLE_PARTNER_RECORDS;
      }

      const data = (await res.json()) as {
        records: { fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        records.push({
          partnerName: (r.fields['Name'] as string) ?? '',
          referralCount: (r.fields['Referral Count'] as number) ?? 0,
          commissionOwed: (r.fields['Commission Owed'] as number) ?? 0,
          commissionPaid: (r.fields['Commission Paid'] as number) ?? 0,
          status: (r.fields['Status'] as string) ?? '',
        });
      }

      offset = data.offset;
    } while (offset);

    return records;
  } catch (err) {
    console.error('getPartnerRecords error:', err);
    return SAMPLE_PARTNER_RECORDS;
  }
}

const CPR_BASE_ID = process.env.AIRTABLE_CPR_BASE_ID;
const CPR_ATHLETES_TABLE = 'Athletes';

export interface CPRAthleteRecord {
  athleteName: string;
  status: string;
  dateSubmitted: string;
}

const SAMPLE_CPR_ATHLETES: CPRAthleteRecord[] = [
  { athleteName: 'Sample Athlete 1', status: 'Active', dateSubmitted: '2026-05-01' },
  { athleteName: 'Sample Athlete 2', status: 'Pending', dateSubmitted: '2026-05-20' },
];

export async function getCPRAthletes(): Promise<CPRAthleteRecord[]> {
  if (!process.env.AIRTABLE_API_KEY || !CPR_BASE_ID) return SAMPLE_CPR_ATHLETES;

  try {
    const records: CPRAthleteRecord[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${CPR_BASE_ID}/${encodeURIComponent(CPR_ATHLETES_TABLE)}?${params}`,
        { headers: authHeaders(), cache: 'no-store' }
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error('getCPRAthletes fetch failed:', detail);
        return SAMPLE_CPR_ATHLETES;
      }

      const data = (await res.json()) as {
        records: { fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        records.push({
          athleteName: (r.fields['Athlete Name'] as string) ?? '',
          status: (r.fields['Status'] as string) ?? '',
          dateSubmitted: (r.fields['Date Submitted'] as string) ?? '',
        });
      }

      offset = data.offset;
    } while (offset);

    return records;
  } catch (err) {
    console.error('getCPRAthletes error:', err);
    return SAMPLE_CPR_ATHLETES;
  }
}

const BROTHERHUB_BASE_ID = process.env.AIRTABLE_BROTHERHUB_BASE_ID;
const BROTHERHUB_CHAPTERS_TABLE = 'Chapters';

export interface BrotherHubChapterRecord {
  chapterName: string;
  memberCount: number;
  status: string;
}

const SAMPLE_BROTHERHUB_CHAPTERS: BrotherHubChapterRecord[] = [
  { chapterName: 'Sample Chapter Alpha', memberCount: 18, status: 'Active' },
  { chapterName: 'Sample Chapter Beta', memberCount: 9, status: 'Active' },
];

export async function getBrotherHubChapters(): Promise<BrotherHubChapterRecord[]> {
  if (!process.env.AIRTABLE_API_KEY || !BROTHERHUB_BASE_ID) return SAMPLE_BROTHERHUB_CHAPTERS;

  try {
    const records: BrotherHubChapterRecord[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${BROTHERHUB_BASE_ID}/${encodeURIComponent(BROTHERHUB_CHAPTERS_TABLE)}?${params}`,
        { headers: authHeaders(), cache: 'no-store' }
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error('getBrotherHubChapters fetch failed:', detail);
        return SAMPLE_BROTHERHUB_CHAPTERS;
      }

      const data = (await res.json()) as {
        records: { fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        records.push({
          chapterName: (r.fields['Chapter Name'] as string) ?? '',
          memberCount: (r.fields['Member Count'] as number) ?? 0,
          status: (r.fields['Status'] as string) ?? '',
        });
      }

      offset = data.offset;
    } while (offset);

    return records;
  } catch (err) {
    console.error('getBrotherHubChapters error:', err);
    return SAMPLE_BROTHERHUB_CHAPTERS;
  }
}

const SISTERHUB_BASE_ID = process.env.AIRTABLE_SISTERHUB_BASE_ID;
const SISTERHUB_CHAPTERS_TABLE = 'Chapters';

export type SisterHubChapterRecord = BrotherHubChapterRecord;

const SAMPLE_SISTERHUB_CHAPTERS: SisterHubChapterRecord[] = [
  { chapterName: 'Sample Sister Chapter', memberCount: 24, status: 'Active' },
];

export async function getSisterHubChapters(): Promise<SisterHubChapterRecord[]> {
  if (!process.env.AIRTABLE_API_KEY || !SISTERHUB_BASE_ID) return SAMPLE_SISTERHUB_CHAPTERS;

  try {
    const records: SisterHubChapterRecord[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${SISTERHUB_BASE_ID}/${encodeURIComponent(SISTERHUB_CHAPTERS_TABLE)}?${params}`,
        { headers: authHeaders(), cache: 'no-store' }
      );

      if (!res.ok) {
        console.error('getSisterHubChapters fetch failed:', await res.text());
        return SAMPLE_SISTERHUB_CHAPTERS;
      }

      const data = (await res.json()) as {
        records: { fields: Record<string, unknown> }[];
        offset?: string;
      };

      for (const r of data.records) {
        records.push({
          chapterName: (r.fields['Chapter Name'] as string) ?? '',
          memberCount: (r.fields['Member Count'] as number) ?? 0,
          status: (r.fields['Status'] as string) ?? '',
        });
      }

      offset = data.offset;
    } while (offset);

    return records;
  } catch (err) {
    console.error('getSisterHubChapters error:', err);
    return SAMPLE_SISTERHUB_CHAPTERS;
  }
}
