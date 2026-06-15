const PARTNER_BASE_ID = process.env.AIRTABLE_PARTNER_NETWORK_BASE_ID ?? 'appnyHBarTuXIG9Ke';
const PARTNERS_TABLE = 'Partners';
const OPPORTUNITIES_TABLE = 'Opportunities';

export type OpportunityStatus = 'Lead' | 'Proposal' | 'Won' | 'Paid' | 'Commission Paid';

export interface OpportunityRecord {
  id: string;
  opportunityName: string;
  partnerName: string;
  referralOrganization: string;
  projectValue: number;
  commissionPercentage: number;
  commissionAmount: number;
  status: OpportunityStatus;
  attributionSource: string;
  dateCreated: string;
}

export interface CreateOpportunityInput {
  clientName: string;
  packageName: string;
  referralSource: string;
  organization?: string;
  projectValue: number;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function resolvePartnerName(name: string): Promise<string> {
  if (!process.env.AIRTABLE_API_KEY) return name;
  const safe = name.toLowerCase().replace(/'/g, "\\'");
  const formula = encodeURIComponent(`LOWER({Name})='${safe}'`);
  const url = `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(PARTNERS_TABLE)}?filterByFormula=${formula}&maxRecords=1&fields[]=Name`;
  try {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return name;
    const data = (await res.json()) as { records?: { fields: { Name?: string } }[] };
    return data.records?.[0]?.fields?.Name ?? name;
  } catch {
    return name;
  }
}

export async function createOpportunityRecord(
  input: CreateOpportunityInput
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const commissionPct = parseFloat(process.env.DEFAULT_COMMISSION_PERCENTAGE ?? '0.20');
  const commissionAmount = Math.round(input.projectValue * commissionPct * 100) / 100;
  const today = new Date().toISOString().slice(0, 10);

  const partnerName = await resolvePartnerName(input.referralSource);

  const fields: Record<string, string | number> = {
    'Opportunity Name': `${input.clientName} - ${input.packageName}`,
    'Partner Name': partnerName,
    'Project Value': input.projectValue,
    'Commission Percentage': commissionPct,
    'Commission Amount': commissionAmount,
    'Status': 'Won',
    'Attribution Source': 'Partner Referral',
    'Date Created': today,
  };

  if (input.organization) fields['Referral Organization'] = input.organization;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(OPPORTUNITIES_TABLE)}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('createOpportunityRecord failed:', detail);
      return { ok: false, error: 'Failed to create opportunity record.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('createOpportunityRecord error:', err);
    return { ok: false, error: 'Unexpected error.' };
  }
}

export async function getOpportunities(): Promise<OpportunityRecord[]> {
  if (!process.env.AIRTABLE_API_KEY) return [];

  const formula = encodeURIComponent(`{Attribution Source}='Partner Referral'`);
  const sort = new URLSearchParams({
    'sort[0][field]': 'Date Created',
    'sort[0][direction]': 'desc',
  });
  const url = `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(OPPORTUNITIES_TABLE)}?filterByFormula=${formula}&${sort.toString()}&maxRecords=200`;

  try {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };

    return (data.records ?? []).map((rec) => {
      const f = rec.fields;
      return {
        id: rec.id,
        opportunityName: (f['Opportunity Name'] as string) ?? '',
        partnerName: (f['Partner Name'] as string) ?? '',
        referralOrganization: (f['Referral Organization'] as string) ?? '',
        projectValue: (f['Project Value'] as number) ?? 0,
        commissionPercentage: (f['Commission Percentage'] as number) ?? 0,
        commissionAmount: (f['Commission Amount'] as number) ?? 0,
        status: ((f['Status'] as string) ?? 'Won') as OpportunityStatus,
        attributionSource: (f['Attribution Source'] as string) ?? '',
        dateCreated: (f['Date Created'] as string) ?? '',
      };
    });
  } catch {
    return [];
  }
}

export async function updateOpportunityStatus(
  recordId: string,
  status: OpportunityStatus
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${PARTNER_BASE_ID}/${encodeURIComponent(OPPORTUNITIES_TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields: { Status: status }, typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('updateOpportunityStatus failed:', detail);
      return { ok: false, error: 'Failed to update status.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('updateOpportunityStatus error:', err);
    return { ok: false, error: 'Unexpected error.' };
  }
}
