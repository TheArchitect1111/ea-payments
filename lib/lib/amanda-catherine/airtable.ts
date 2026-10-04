import { AMANDA_BASE_ID, AMANDA_TABLES, getTableForType, type AmandaSubmissionType } from './storage';

const KEY = process.env.AIRTABLE_API_KEY;

interface AmandaLeadPayload {
  type: AmandaSubmissionType;
  audience: string;
  formId?: string;
  courseId?: string;
  source: string;
  name: string;
  email: string;
  phone?: string;
  amount?: number;
  fields: Record<string, any>;
}

function authHeaders() {
  return { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

// Schema check - fetches table metadata, does not assume fields
export async function getTableFields(tableName: string) {
  if (!KEY || !AMANDA_BASE_ID) return { error: 'Missing Airtable env' };
  // Use list records with maxRecords=1 to infer fields without assuming
  const url = `https://api.airtable.com/v0/${AMANDA_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const txt = await res.text();
    return { error: txt, status: res.status, table: tableName };
  }
  const json = await res.json();
  const sample = json.records?.[0]?.fields || {};
  return { table: tableName, sampleFields: Object.keys(sample), sampleRecord: sample, exists: true };
}

// Smart writer - builds payload only with fields that likely exist, fallback to raw JSON field
export async function createAmandaLead(payload: AmandaLeadPayload) {
  if (!KEY || !AMANDA_BASE_ID) return { error: 'Missing Airtable env', base: AMANDA_BASE_ID };

  const targetTable = getTableForType(payload.type, payload.formId);

  // Base field set - common across tables, will be filtered if table doesn't have them
  // We send full payload and let Airtable ignore unknown? No - Airtable errors on unknown fields.
  // So we attempt with minimal safe set, then retry with raw JSON fallback

  const attempts: any[] = [];

  // Attempt 1: For Portal Form Submissions (applications)
  if (targetTable === AMANDA_TABLES.APPLICATIONS) {
    attempts.push({
      // Generic Portal Form Submissions schema guess - will be validated by schema check endpoint
      // Common fields observed in portal forms: email, name, form type, status, raw payload
      fields: {
        Email: payload.email,
        Name: payload.name,
        Form: payload.formId,
        Audience: payload.audience,
        Source: payload.source,
        Course: payload.courseId,
        Status: 'new',
        SubmittedAt: new Date().toISOString(),
        Payload: JSON.stringify(payload),
      }
    });
    // Fallback minimal
    attempts.push({
      fields: {
        Email: payload.email,
        Payload: JSON.stringify(payload),
      }
    });
  }

  // Attempt 2: Waitlist
  if (targetTable === AMANDA_TABLES.WAITLIST) {
    attempts.push({
      fields: {
        email: payload.email,
        name: payload.name,
        course: payload.courseId,
        audience: payload.audience,
        source: payload.source,
        status: 'new',
        created_at: new Date().toISOString(),
        raw: JSON.stringify(payload),
      }
    });
    attempts.push({
      fields: {
        email: payload.email,
        raw: JSON.stringify(payload),
      }
    });
  }

  // Attempt 3: Creative Studio (payments + course assignments)
  if (targetTable === AMANDA_TABLES.CREATIVE_STUDIO) {
    attempts.push({
      fields: {
        clientName: payload.name,
        email: payload.email,
        packagePurchased: payload.courseId || payload.formId,
        amountPaid: payload.amount || 0,
        paymentDate: new Date().toISOString(),
        stripeTransactionId: `amanda-${payload.formId || payload.courseId}-${Date.now()}`,
        portalAccessStatus: 'Pending',
        onboardingStatus: 'Not Started',
        audience: payload.audience,
        source: payload.source,
        rawPayload: JSON.stringify(payload),
      }
    });
    // Minimal compatible with existing Client Records schema
    attempts.push({
      fields: {
        clientName: payload.name || payload.email,
        email: payload.email,
        organization: `${payload.audience} | ${payload.formId || payload.courseId} | ${payload.source}`,
        packagePurchased: 'Capacity Assessment',
        amountPaid: payload.amount || 0,
        paymentDate: new Date().toISOString(),
        stripeTransactionId: `amanda-${payload.formId || payload.courseId}-${Date.now()}`,
        portalAccessStatus: 'Pending',
        onboardingStatus: 'Not Started',
      }
    });
  }

  // Attempt 4: Client Records (preserve existing integration)
  if (targetTable === AMANDA_TABLES.CLIENT_RECORDS) {
    attempts.push({
      fields: {
        clientName: payload.name || payload.email,
        email: payload.email,
        organization: `${payload.audience} | ${payload.formId || payload.courseId} | ${payload.source}`,
        packagePurchased: 'Capacity Assessment' as any,
        amountPaid: payload.amount || 0,
        paymentDate: new Date().toISOString(),
        stripeTransactionId: `amanda-${payload.formId || payload.courseId}-${Date.now()}`,
        portalAccessStatus: 'Pending',
        onboardingStatus: 'Not Started',
      }
    });
  }

  // Try attempts sequentially until one succeeds
  let lastError: any = null;
  for (const attempt of attempts) {
    const url = `https://api.airtable.com/v0/${AMANDA_BASE_ID}/${encodeURIComponent(targetTable)}`;
    const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(attempt) });
    const json = await res.json();
    if (res.ok) {
      return { success: true, table: targetTable, record: json, attemptedFields: Object.keys(attempt.fields) };
    }
    lastError = json;
    // If error is not about unknown field, don't retry
    const errMsg = JSON.stringify(json).toLowerCase();
    if (!errMsg.includes('unknown field') && !errMsg.includes('invalid field')) {
      break;
    }
  }

  return { error: 'All attempts failed', table: targetTable, lastError, attemptsTried: attempts.map(a => Object.keys(a.fields)) };
}

// For client identity/access preservation - same as existing lib/airtable.ts but scoped to Amanda
export async function ensureClientRecord(payload: AmandaLeadPayload) {
  // Only call for client audience or when portal access needed
  if (!['client','student-trainee','certified-practitioner'].includes(payload.audience)) return null;
  return createAmandaLead({ ...payload, type: 'client-access' });
}
