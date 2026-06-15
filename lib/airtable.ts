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
): Promise<{ ok: boolean; error?: string }> {
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
    }

    return { ok: true };
  } catch (err) {
    console.error('Airtable error:', err);
    return { ok: false, error: 'Unexpected error writing to Airtable.' };
  }
}
