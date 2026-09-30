import { createHash } from 'node:crypto';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { amandaApplicationRoute } from './application-routing';
import type { PortalFormSubmission } from '@/lib/portal-forms/types';

export type AmandaApplicationCommunication = {
  id: string; submissionId: string; personId?: string; email: string;
  subject: string; message: string; status: 'pending' | 'sent' | 'failed'; sentAt?: string;
};

export async function acknowledgeAmandaApplication(submission: PortalFormSubmission) {
  const id = `amanda-application-email-${createHash('sha256').update(submission.id).digest('hex').slice(0, 24)}`;
  const prior = await loadStudioRecord<AmandaApplicationCommunication>('experience', id);
  if (prior?.status === 'sent') return prior;
  const route = amandaApplicationRoute(submission.payload?.formId, submission.payload?.program);
  const record: AmandaApplicationCommunication = {
    id, submissionId: submission.id,
    personId: typeof submission.payload?.personId === 'string' ? submission.payload.personId : undefined,
    email: submission.email, subject: route.confirmation, message: route.reviewStep, status: 'pending',
  };
  const save = (payload: AmandaApplicationCommunication) => saveStudioRecord({
    recordType: 'experience', id, organizationId: syntheticOrgId('amanda-catherine'),
    title: 'Amanda application acknowledgment', payload,
  });
  const pending = await save(record);
  if (!pending.ok || !pending.persistedToAirtable) throw new Error('Application communication could not be recorded durably.');
  // Copy is controlled by application-routing; no applicant HTML is interpolated.
  const delivery = await sendAuthEmail({ to: record.email, subject: record.subject,
    title: record.subject, bodyHtml: `<p>${record.message}</p><p>Reference: ${submission.id}</p>`,
    text: `${record.subject}\n${record.message}\nReference: ${submission.id}`,
    brandLabel: 'Amanda Catherine', brandColor: '#641f31',
  });
  const next: AmandaApplicationCommunication = { ...record, status: delivery.ok ? 'sent' : 'failed',
    ...(delivery.ok ? { sentAt: new Date().toISOString() } : {}) };
  const saved = await save(next);
  if (!saved.ok) throw new Error('Application acknowledgment delivery could not be recorded.');
  return next;
}

export async function listAmandaApplicationCommunications() {
  const { listStudioRecords } = await import('@/lib/creative-studio/persistence');
  const records = await listStudioRecords<AmandaApplicationCommunication>('experience', syntheticOrgId('amanda-catherine'));
  return records.filter((record) => record.id?.startsWith('amanda-application-email-'));
}

export async function sendAmandaApplicationReply(submission: PortalFormSubmission, input: { messageId: string; subject: string; message: string }) {
  const id = `amanda-application-email-${createHash('sha256').update(`${submission.id}:${input.messageId}`).digest('hex').slice(0, 24)}`;
  const prior = await loadStudioRecord<AmandaApplicationCommunication>('experience', id);
  if (prior?.status === 'sent') return prior;
  const record: AmandaApplicationCommunication = {
    id, submissionId: submission.id, personId: typeof submission.payload?.personId === 'string' ? submission.payload.personId : undefined,
    email: submission.email, subject: input.subject, message: input.message, status: 'pending',
  };
  const save = (payload: AmandaApplicationCommunication) => saveStudioRecord({ recordType: 'experience', id,
    organizationId: syntheticOrgId('amanda-catherine'), title: 'Amanda application follow-up', payload });
  const pending = await save(record);
  if (!pending.ok || !pending.persistedToAirtable) throw new Error('Communication storage is unavailable.');
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const delivery = await sendAuthEmail({ to: record.email, subject: record.subject, title: record.subject,
    bodyHtml: `<p style="white-space:pre-wrap">${escape(record.message)}</p>`, text: record.message,
    brandLabel: 'Amanda Catherine', brandColor: '#641f31' });
  const next: AmandaApplicationCommunication = { ...record, status: delivery.ok ? 'sent' : 'failed', ...(delivery.ok ? { sentAt: new Date().toISOString() } : {}) };
  if (!(await save(next)).ok) throw new Error('Delivery status could not be recorded.');
  return next;
}
