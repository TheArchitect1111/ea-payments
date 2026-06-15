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
