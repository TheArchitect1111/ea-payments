const PARTNER_BASE_ID = process.env.AIRTABLE_PARTNER_NETWORK_BASE_ID ?? 'appnyHBarTuXIG9Ke';
const PARTNERS_TABLE = process.env.AIRTABLE_PARTNERS_TABLE_ID ?? 'Partners';
const OPPORTUNITIES_TABLE = process.env.AIRTABLE_PARTNER_OPPORTUNITIES_TABLE_ID ?? 'Opportunities';

export interface PartnerProfile {
  slug: string;
  name: string;
  tier: string;
  commissionRate: number | null;
  overrideRate: number | null;
}

export interface PartnerOpportunity {
  id: string;
  companyName: string;
  industry: string;
  stage: string;
  projectValue: number | null;
  commissionAmount: number | null;
  commissionStatus: string;
  dateSubmitted: string;
}

export interface PartnerDashboardData {
  partner: PartnerProfile;
  opportunities: PartnerOpportunity[];
}

export interface AuthenticatedPartner {
  partnerId: string;
  profile: PartnerProfile;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function airtableFetch(path: string) {
  const res = await fetch(`https://api.airtable.com/v0/${PARTNER_BASE_ID}/${path}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}`);
  return res.json() as Promise<{ records?: { id: string; fields: Record<string, unknown> }[]; offset?: string }>;
}

export async function authenticatePartner(
  slug: string,
  password: string,
): Promise<{ ok: boolean; auth?: AuthenticatedPartner; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'Not configured.' };
  }

  const safeSlug = slug.trim().replace(/"/g, '');
  if (!safeSlug || !/^[a-z0-9_-]+$/i.test(safeSlug)) {
    return { ok: false, error: 'Invalid credentials.' };
  }

  try {
    const params = new URLSearchParams({
      filterByFormula: `{Profile Slug}="${safeSlug}"`,
      maxRecords: '1',
    });
    const data = await airtableFetch(`${encodeURIComponent(PARTNERS_TABLE)}?${params}`);
    const partnerRecord = data.records?.[0];
    if (!partnerRecord) return { ok: false, error: 'Invalid credentials.' };

    const pf = partnerRecord.fields;
    const storedPw = String(pf['Portal Password'] ?? '').trim();
    if (!storedPw || storedPw !== password.trim()) {
      return { ok: false, error: 'Invalid credentials.' };
    }

    const partnerId = partnerRecord.id;
    const profile: PartnerProfile = {
      slug: safeSlug,
      name: String(pf['Partner Name'] ?? pf['Name'] ?? ''),
      tier: String(pf['Tier'] ?? ''),
      commissionRate: pf['Commission Rate'] != null ? Number(pf['Commission Rate']) : null,
      overrideRate: pf['Override Rate'] != null ? Number(pf['Override Rate']) : null,
    };

    return {
      ok: true,
      auth: { partnerId, profile },
    };
  } catch {
    return { ok: false, error: 'Service unavailable.' };
  }
}

export async function getPartnerOpportunities(partnerId: string): Promise<PartnerOpportunity[]> {
  if (!process.env.AIRTABLE_API_KEY) return [];

  try {
    const partnerOpps: { id: string; fields: Record<string, unknown> }[] = [];
    let offset: string | undefined;

    do {
      const oppParams = new URLSearchParams({ pageSize: '100' });
      if (offset) oppParams.set('offset', offset);
      const oppData = await airtableFetch(`${encodeURIComponent(OPPORTUNITIES_TABLE)}?${oppParams}`);
      for (const rec of oppData.records ?? []) {
        const linked = rec.fields['Referring Partner'];
        if (Array.isArray(linked) && linked.includes(partnerId)) {
          partnerOpps.push(rec);
        }
      }
      offset = oppData.offset;
    } while (offset);

    return partnerOpps
      .map((rec) => {
        const f = rec.fields;
        return {
          id: rec.id,
          companyName: String(f['Company Name'] ?? f['Opportunity Name'] ?? ''),
          industry: String(f['Industry'] ?? ''),
          stage: String(f['Pipeline Stage'] ?? f['Status'] ?? ''),
          projectValue: f['Project Value'] != null ? Number(f['Project Value']) : null,
          commissionAmount: f['Commission Amount'] != null ? Number(f['Commission Amount']) : null,
          commissionStatus: String(f['Commission Status'] ?? f['Status'] ?? ''),
          dateSubmitted: String(f['Date Submitted'] ?? f['Date Created'] ?? ''),
        };
      })
      .sort((a, b) => (b.dateSubmitted || '').localeCompare(a.dateSubmitted || ''));
  } catch {
    return [];
  }
}

export async function getPartnerDashboard(partnerId: string, profile: PartnerProfile): Promise<PartnerDashboardData> {
  const opportunities = await getPartnerOpportunities(partnerId);
  return { partner: profile, opportunities };
}

export function summarizePartnerDashboard(data: PartnerDashboardData) {
  const active = data.opportunities.filter(
    (o) => !/lost|cancel/i.test(o.stage) && !/paid|won|complet/i.test(o.stage),
  );
  const won = data.opportunities.filter((o) => /won|complet|paid/i.test(o.stage));
  const totalCommission = data.opportunities.reduce((s, o) => s + (o.commissionAmount ?? 0), 0);
  const pendingCommission = data.opportunities
    .filter((o) => !/paid/i.test(o.commissionStatus))
    .reduce((s, o) => s + (o.commissionAmount ?? 0), 0);

  return {
    totalOpportunities: data.opportunities.length,
    activeCount: active.length,
    wonCount: won.length,
    totalCommission,
    pendingCommission,
  };
}
