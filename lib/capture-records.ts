const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const CAPTURES_TABLE = process.env.AIRTABLE_CAPTURES_TABLE ?? 'Capture Records';

export type CaptureType =
  | 'Signal'
  | 'Opportunity'
  | 'Resource'
  | 'Organization'
  | 'Person'
  | 'Note';

export type CaptureStatus = 'Captured' | 'Triaged' | 'Analyzing' | 'Routed' | 'Archived';

export interface CaptureRecord {
  id: string;
  captureId: string;
  title: string;
  description?: string;
  captureType: CaptureType;
  sourceUrl?: string;
  source: string;
  category?: string;
  priority: 'Low' | 'Normal' | 'High';
  status: CaptureStatus;
  tags?: string[];
  dateCaptured: string;
  eaFitScore?: number;
  opportunityScore?: number;
  analysisSummary?: string;
  productAlignment?: string[];
  blueprintTemplate?: string;
  trustConfidence?: number;
  recommendationSummary?: string;
  blueprintSummary?: string;
}

export interface CreateCaptureInput {
  title: string;
  description?: string;
  captureType?: CaptureType;
  sourceUrl?: string;
  source?: string;
  category?: string;
  priority?: 'Low' | 'Normal' | 'High';
  tags?: string[];
  status?: CaptureStatus;
  eaFitScore?: number;
  opportunityScore?: number;
  analysisSummary?: string;
  productAlignment?: string[];
  blueprintTemplate?: string;
  trustConfidence?: number;
  recommendationSummary?: string;
  blueprintSummary?: string;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function mapRecord(rec: { id: string; fields: Record<string, unknown> }): CaptureRecord {
  const f = rec.fields;
  const tagsRaw = f['Tags'];
  const alignmentRaw = f['Product Alignment'];
  return {
    id: rec.id,
    captureId: (f['Capture ID'] as string) ?? rec.id,
    title: (f['Title'] as string) ?? '',
    description: (f['Description'] as string) ?? undefined,
    captureType: ((f['Capture Type'] as string) ?? 'Signal') as CaptureType,
    sourceUrl: (f['Source URL'] as string) ?? undefined,
    source: (f['Source'] as string) ?? 'Mission Control',
    category: (f['Category'] as string) ?? (f['Resource Category'] as string) ?? undefined,
    priority: ((f['Priority'] as string) ?? 'Normal') as CaptureRecord['priority'],
    status: ((f['Status'] as string) ?? 'Captured') as CaptureStatus,
    tags: Array.isArray(tagsRaw) ? (tagsRaw as string[]) : undefined,
    dateCaptured: (f['Date Captured'] as string) ?? '',
    eaFitScore: typeof f['EA Fit Score'] === 'number' ? f['EA Fit Score'] : undefined,
    opportunityScore:
      typeof f['Opportunity Score'] === 'number' ? f['Opportunity Score'] : undefined,
    analysisSummary: (f['Analysis Summary'] as string) ?? undefined,
    productAlignment:
      typeof alignmentRaw === 'string'
        ? alignmentRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
    blueprintTemplate: (f['Blueprint Template'] as string) ?? undefined,
    trustConfidence:
      typeof f['Trust Confidence'] === 'number' ? f['Trust Confidence'] : undefined,
    recommendationSummary: (f['Recommendation Summary'] as string) ?? undefined,
    blueprintSummary: (f['Blueprint Summary'] as string) ?? undefined,
  };
}

export async function getCaptures(limit = 20): Promise<CaptureRecord[]> {
  if (!process.env.AIRTABLE_API_KEY) return [];

  const sort = new URLSearchParams({
    'sort[0][field]': 'Date Captured',
    'sort[0][direction]': 'desc',
  });
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}?${sort.toString()}&maxRecords=${limit}`;

  try {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    return (data.records ?? []).map(mapRecord);
  } catch {
    return [];
  }
}

export async function getResourceCaptures(limit = 50): Promise<CaptureRecord[]> {
  const all = await getCaptures(limit);
  return all.filter(
    (c) =>
      c.captureType === 'Resource' ||
      c.captureType === 'Organization' ||
      c.eaFitScore != null ||
      c.category != null
  );
}

export async function getBlueprintCaptures(limit = 30): Promise<CaptureRecord[]> {
  const all = await getCaptures(limit);
  return all.filter((c) => c.blueprintSummary || c.blueprintTemplate);
}

export async function getCaptureByIdentifier(identifier: string): Promise<CaptureRecord | null> {
  if (!process.env.AIRTABLE_API_KEY) return null;

  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const fetchRecord = async (url: string) => {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as {
      id?: string;
      fields?: Record<string, unknown>;
      records?: { id: string; fields: Record<string, unknown> }[];
    };
  };

  try {
    if (trimmed.startsWith('rec')) {
      const data = await fetchRecord(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}/${trimmed}`
      );
      if (data?.id && data.fields) return mapRecord({ id: data.id, fields: data.fields });
    }

    const safeIdentifier = trimmed.replace(/'/g, "\\'");
    const formula = `OR({Capture ID}='${safeIdentifier}',RECORD_ID()='${safeIdentifier}')`;
    const params = new URLSearchParams({
      filterByFormula: formula,
      maxRecords: '1',
    });
    const data = await fetchRecord(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}?${params.toString()}`
    );
    const rec = data?.records?.[0];
    return rec ? mapRecord(rec) : null;
  } catch {
    return null;
  }
}

export async function createCaptureRecord(
  input: CreateCaptureInput
): Promise<{ ok: boolean; record?: CaptureRecord; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const captureId = `CAP-${Date.now().toString(36).toUpperCase()}`;

  const fields: Record<string, string | number | string[]> = {
    'Capture ID': captureId,
    Title: input.title.trim(),
    'Capture Type': input.captureType ?? 'Signal',
    Source: input.source ?? 'Command Bar',
    Priority: input.priority ?? 'Normal',
    Status: input.status ?? 'Captured',
    'Date Captured': today,
  };

  if (input.description) fields['Description'] = input.description.trim();
  if (input.sourceUrl) fields['Source URL'] = input.sourceUrl.trim();
  if (input.category) {
    fields['Category'] = input.category;
    fields['Resource Category'] = input.category;
  }
  if (input.tags?.length) fields['Tags'] = input.tags;
  if (input.eaFitScore != null) fields['EA Fit Score'] = input.eaFitScore;
  if (input.opportunityScore != null) fields['Opportunity Score'] = input.opportunityScore;
  if (input.analysisSummary) fields['Analysis Summary'] = input.analysisSummary;
  if (input.productAlignment?.length)
    fields['Product Alignment'] = input.productAlignment.join(', ');
  if (input.blueprintTemplate) fields['Blueprint Template'] = input.blueprintTemplate;
  if (input.trustConfidence != null) fields['Trust Confidence'] = input.trustConfidence;
  if (input.recommendationSummary) fields['Recommendation Summary'] = input.recommendationSummary;
  if (input.blueprintSummary) fields['Blueprint Summary'] = input.blueprintSummary;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('createCaptureRecord failed:', detail);
      return {
        ok: false,
        error:
          'Could not save capture. Create a "Capture Records" table in the Payments Airtable base.',
      };
    }

    const data = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return { ok: false, error: 'Empty response from Airtable.' };
    return { ok: true, record: mapRecord(rec) };
  } catch (err) {
    console.error('createCaptureRecord error:', err);
    return { ok: false, error: 'Unexpected error.' };
  }
}

export async function updateCaptureAnalysis(
  recordId: string,
  input: {
    status?: CaptureStatus;
    analysisSummary?: string;
    eaFitScore?: number;
    opportunityScore?: number;
    productAlignment?: string[];
    blueprintTemplate?: string;
    trustConfidence?: number;
    recommendationSummary?: string;
    blueprintSummary?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const fields: Record<string, string | number> = {};
  if (input.status) fields['Status'] = input.status;
  if (input.analysisSummary) fields['Analysis Summary'] = input.analysisSummary;
  if (input.eaFitScore != null) fields['EA Fit Score'] = input.eaFitScore;
  if (input.opportunityScore != null) fields['Opportunity Score'] = input.opportunityScore;
  if (input.productAlignment?.length)
    fields['Product Alignment'] = input.productAlignment.join(', ');
  if (input.blueprintTemplate) fields['Blueprint Template'] = input.blueprintTemplate;
  if (input.trustConfidence != null) fields['Trust Confidence'] = input.trustConfidence;
  if (input.recommendationSummary) fields['Recommendation Summary'] = input.recommendationSummary;
  if (input.blueprintSummary) fields['Blueprint Summary'] = input.blueprintSummary;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      }
    );

    if (!res.ok) {
      return { ok: false, error: 'Failed to update capture analysis.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Unexpected error.' };
  }
}

export async function updateCaptureStatus(
  recordId: string,
  status: CaptureStatus
): Promise<{ ok: boolean; error?: string }> {
  return updateCaptureAnalysis(recordId, { status });
}
