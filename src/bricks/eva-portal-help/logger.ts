import 'server-only';
import { put } from '@vercel/blob';
export type UnansweredEvent = { portalId: string; role: string; question: string; reason: string; at: string };
export type UnansweredWriter = (event: UnansweredEvent) => Promise<void>;
function sanitizeQuestion(input: string): string {
  return input.slice(0, 500).replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/\+?\d[\d ()-]{8,}\d/g, '[phone]');
}
export function makeUnansweredEvent(portalId: string, role: string, question: string, reason: string): UnansweredEvent {
  return { portalId, role, question: sanitizeQuestion(question), reason, at: new Date().toISOString() };
}
export const defaultUnansweredWriter: UnansweredWriter = async event => {
  const record = JSON.stringify({ type: 'eva.portal-help.unanswered', ...event });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put('eva-portal-help/unanswered/' + event.portalId + '/' + Date.now() + '-' + crypto.randomUUID() + '.json',
      record, { access: 'private', contentType: 'application/json', addRandomSuffix: false });
    return;
  }
  // Structured JSON logs are the fallback; no claim of durable storage without Blob.
  console.info(record);
};
export async function logUnanswered(portalId: string, role: string, question: string, reason: string, writer: UnansweredWriter = defaultUnansweredWriter): Promise<'blob-or-json'> {
  if (!/^[a-z0-9-]+$/.test(portalId)) throw new Error('Invalid portal id');
  await writer(makeUnansweredEvent(portalId, role, question, reason));
  return 'blob-or-json';
}
export function logStorageMode(): 'private-blob' | 'structured-json-logs' {
  return process.env.BLOB_READ_WRITE_TOKEN ? 'private-blob' : 'structured-json-logs';
}
