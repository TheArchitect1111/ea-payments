import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { CommsConfigSchema, VerifiedContactSchema, type CommsConfig, type VerifiedContact } from './config.schema';
import { TEMPLATE_REQUIREMENTS, isCommsTemplateId, type CommsTemplateId } from './templates';

export type CommsAuditStatus = 'needs_approval' | 'sending' | 'sent' | 'failed';
export type CommsAuditRow = {
  id?: string;
  to: string;
  templateId: CommsTemplateId;
  timestamp: string;
  status: CommsAuditStatus;
  data: Record<string, unknown>;
  reason?: string;
  providerMessageId?: string;
};
export interface CommsAuditTable {
  insert(row: CommsAuditRow): Promise<string>;
  update(id: string, changes: Pick<CommsAuditRow, 'status'> & Partial<Pick<CommsAuditRow, 'reason' | 'providerMessageId'>>): Promise<void>;
  list(): Promise<CommsAuditRow[]>;
}

export async function loadCommsConfig(portalRoot: string): Promise<CommsConfig> {
  const path = join(resolve(portalRoot), 'config', 'comms.templates.json');
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  return CommsConfigSchema.parse(value);
}

// The server supplies a portal-scoped audit table. No process-local "audit" is considered durable.
export function createAirtableCommsAuditTable(portalId: string, fetchImpl: typeof fetch = fetch): CommsAuditTable {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(portalId)) throw new Error('Invalid portal identity');
  const credentials = () => {
    const token = process.env.AIRTABLE_API_KEY?.trim();
    const base = (process.env.AIRTABLE_COMMS_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID)?.trim();
    const table = process.env.AIRTABLE_COMMS_AUDIT_TABLE?.trim();
    if (!token || !base || !table) throw new Error('Durable communications audit table is not configured');
    return { token, url: 'https://api.airtable.com/v0/' + encodeURIComponent(base) + '/' + encodeURIComponent(table) };
  };
  const headers = (token: string) => ({ Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' });
  const fieldsFor = (row: CommsAuditRow) => ({
    'Portal ID': portalId,
    To: row.to,
    'Template ID': row.templateId,
    Timestamp: row.timestamp,
    Status: row.status,
    Data: JSON.stringify(row.data),
    Reason: row.reason || '',
    'Provider Message ID': row.providerMessageId || '',
  });
  return {
    async insert(row) {
      const { token, url } = credentials();
      const response = await fetchImpl(url, { method: 'POST', headers: headers(token), body: JSON.stringify({ fields: fieldsFor(row) }) });
      if (!response.ok) throw new Error('Comms audit insert failed: HTTP ' + response.status);
      const body: unknown = await response.json();
      if (!body || typeof body !== 'object' || !('id' in body) || typeof body.id !== 'string' || !body.id) throw new Error('Comms audit insert returned no record ID');
      return body.id;
    },
    async update(id, changes) {
      const { token, url } = credentials();
      const fields: Record<string, string> = { Status: changes.status };
      if (changes.reason !== undefined) fields.Reason = changes.reason;
      if (changes.providerMessageId !== undefined) fields['Provider Message ID'] = changes.providerMessageId;
      const response = await fetchImpl(url + '/' + encodeURIComponent(id), {
        method: 'PATCH', headers: headers(token), body: JSON.stringify({ fields }),
      });
      if (!response.ok) throw new Error('Comms audit update failed: HTTP ' + response.status);
    },
    async list() {
      const { token, url } = credentials();
      const formula = "{Portal ID}='" + portalId.replace(/'/g, "\\'") + "'";
      let offset: string | undefined;
      const result: CommsAuditRow[] = [];
      do {
        const params = new URLSearchParams({ filterByFormula: formula, pageSize: '100' });
        if (offset) params.set('offset', offset);
        const response = await fetchImpl(url + '?' + params.toString(), { headers: headers(token), cache: 'no-store' });
        if (!response.ok) throw new Error('Comms audit read failed: HTTP ' + response.status);
        const payload = await response.json() as { records?: {id:string;fields:Record<string,unknown>}[]; offset?: string };
        for (const record of payload.records || []) {
          const f = record.fields;
          const templateId = String(f['Template ID'] || '');
          if (!isCommsTemplateId(templateId)) continue;
          let data: Record<string,unknown> = {};
          try {
            const parsed: unknown = JSON.parse(String(f.Data || '{}'));
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed as Record<string,unknown>;
          } catch { /* An audit row remains visible even if historic draft JSON is malformed. */ }
          result.push({
            id: record.id, to: String(f.To || ''), templateId,
            timestamp: String(f.Timestamp || ''), status: String(f.Status || 'failed') as CommsAuditStatus,
            data, reason: String(f.Reason || ''), providerMessageId: String(f['Provider Message ID'] || ''),
          });
        }
        offset = payload.offset;
      } while (offset);
      return result;
    },
  };
}

function valuePresent(value: unknown, key: string): boolean {
  if (key === 'approved') return value === true;
  return (typeof value === 'string' && value.trim().length > 0)
    || (typeof value === 'number' && Number.isFinite(value));
}
function interpolationFields(value: string): string[] {
  return Array.from(value.matchAll(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g), match => match[1]);
}
function htmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function render(value: string, data: Record<string, unknown>, escapeHtml: boolean): string {
  return value.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (_raw, name: string) => {
    const input = String(data[name]);
    return escapeHtml ? htmlEscape(input) : input.replace(/[\r\n]/g, ' ');
  });
}
export type CommsSendResult =
  | { status: 'sent'; auditId: string; providerMessageId: string }
  | { status: 'needs_approval'; auditId: string; missingFields: string[] };

export type SendDependencies = {
  portalRoot: string;
  auditTable: CommsAuditTable;
  fetchImpl?: typeof fetch;
};
export function createCommsSender(deps: SendDependencies) {
  const send = async (templateId: string, to: VerifiedContact, data: Record<string, unknown>): Promise<CommsSendResult> => {
    if (!isCommsTemplateId(templateId)) throw new Error('Unapproved communications template ID');
    const contact = VerifiedContactSchema.parse(to);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Template data must be supplied by caller');
    const config = await loadCommsConfig(deps.portalRoot);
    const template = config.templates[templateId];
    const needed: readonly string[] = TEMPLATE_REQUIREMENTS[templateId];
    const fields = new Set([...needed, ...interpolationFields(template.subject), ...interpolationFields(template.html)]);
    const missingFields = [...fields].filter(field => !valuePresent(data[field], field));
    const row: CommsAuditRow = {
      to: contact.email.toLowerCase(), templateId, timestamp: new Date().toISOString(),
      status: missingFields.length ? 'needs_approval' : 'sending', data: { ...data },
      ...(missingFields.length ? {reason: 'Missing required fields: ' + missingFields.join(', ')} : {}),
    };
    // Persist the draft or the sending-intent before any external email is attempted.
    const auditId = await deps.auditTable.insert(row);
    if (missingFields.length) return { status: 'needs_approval', auditId, missingFields };
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      await deps.auditTable.update(auditId, { status: 'failed', reason: 'RESEND_API_KEY missing' });
      throw new Error('Communications provider not configured');
    }
    try {
      const response = await (deps.fetchImpl || fetch)('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: config.fromAddress, reply_to: config.replyTo, to: [row.to],
          subject: render(template.subject, data, false), html: render(template.html, data, true),
        }),
      });
      if (!response.ok) throw new Error('Communications provider rejected request: HTTP ' + response.status);
      const responseData: unknown = await response.json();
      if (!responseData || typeof responseData !== 'object' || !('id' in responseData) || typeof responseData.id !== 'string' || !responseData.id)
        throw new Error('Communications provider returned no message ID');
      await deps.auditTable.update(auditId, { status: 'sent', providerMessageId: responseData.id });
      return { status: 'sent', auditId, providerMessageId: responseData.id };
    } catch (error) {
      await deps.auditTable.update(auditId, { status: 'failed', reason: error instanceof Error ? error.message : 'Provider error' });
      throw error;
    }
  };
  return { sendTemplate: send, getAuditLog: () => deps.auditTable.list() };
}
