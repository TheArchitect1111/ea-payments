const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const TABLE = 'Client Records';

const DEMO = {
  slug: 'demo-client',
  email: (process.env.DEMO_CLIENT_EMAIL ?? 'demo@efficiencyarchitects.online').toLowerCase(),
  password: process.env.DEMO_CLIENT_PASSWORD ?? 'DemoPulse2026!',
  clientName: 'Demo Client',
  organization: 'Efficiency Architects Demo',
};

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function getDemoCredentials() {
  return { ...DEMO };
}

export function isDemoCredentialAttempt(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO.email &&
    password === DEMO.password
  );
}

export async function ensureDemoClient(): Promise<{ ok: boolean; error?: string }> {
  const { localDemoFallbackEnabled } = await import('@/lib/demo-local-fallback');
  if (localDemoFallbackEnabled()) {
    return { ok: true };
  }

  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const safe = DEMO.slug.replace(/'/g, "\\'");
  const formula = encodeURIComponent(`{Portal Slug}='${safe}'`);
  const lookupUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const lookup = await fetch(lookupUrl, { headers: authHeaders(), cache: 'no-store' });
    if (!lookup.ok) return { ok: false, error: 'Could not reach client database.' };

    const data = (await lookup.json()) as {
      records?: { id: string }[];
    };

    const fields = {
      'Client Name': DEMO.clientName,
      Email: DEMO.email,
      Organization: DEMO.organization,
      'Package Purchased': 'Simplifi',
      'Amount Paid': 149,
      'Payment Date': new Date().toISOString().slice(0, 10),
      'Stripe Transaction ID': 'demo_auto_provision',
      'Portal Access Status': 'Active',
      'Onboarding Status': 'In Progress',
      'Portal Username': DEMO.email,
      'Portal Slug': DEMO.slug,
      'Temp Password': DEMO.password,
      'Password Changed': false,
      'Payment Received At': new Date().toISOString(),
    };

    const existing = data.records?.[0];
    if (existing) {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${existing.id}`,
        { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ fields, typecast: true }) },
      );
      if (!res.ok) return { ok: false, error: 'Could not refresh demo client.' };
      return { ok: true };
    }

    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!res.ok) return { ok: false, error: 'Could not create demo client.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Unexpected error provisioning demo client.' };
  }
}
