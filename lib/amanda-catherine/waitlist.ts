import { sendGmailEmail } from '@/lib/email/gmail';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { getAmandaConfirmationLetter } from './confirmation-letters';
import { airtableConfigured, airtableUpsertByField, airtableUpdate } from '@/lib/data/airtable-client';

export type AmandaWaitlistData = {
  student_name: string;
  student_email: string;
  student_phone: string;
  course_name: string;
  course_slug: string;
  student_message?: string;
  course_url: string;
  registration_type: 'live' | 'waitlist';
};

function safeEmailHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendAmandaWaitlistConfirmation(data: AmandaWaitlistData) {
  const letter = await getAmandaConfirmationLetter(data.registration_type);
  const firstName = data.student_name.trim().split(/\s+/)[0] || 'there';
  const bodyHtml = letter.body_html
    .replace(/{{first_name}}/g, safeEmailHtml(firstName))
    .replace(/{{class_name}}/g, safeEmailHtml(data.course_name));
  const subject = letter.subject.replace(/{{class_name}}/g, data.course_name);
  const sent = await sendAuthEmail({
    to: data.student_email,
    subject,
    title: subject,
    bodyHtml,
    text: `Hi ${firstName}, thank you for your interest in ${data.course_name}. Amanda’s team will share the next steps with you. Warmly, Amanda Catherine.`,
    brandLabel: 'Amanda Catherine · AesthetiKine',
  });
  if (!sent.ok) throw new Error(sent.error || 'Waitlist confirmation email failed');
  return 'resend';
}

// Adapted from the supplied Amanda Waitlist Email Templates PDF; no invented admin URL.
export async function notifyAmandaWaitlist(data: AmandaWaitlistData) {
  const live = data.registration_type === 'live';
  const text = `${live ? 'New live registration' : 'New waitlist interest'}: ${data.course_name}
Name: ${data.student_name}
Email: ${data.student_email}
Phone: ${data.student_phone}
Message: ${data.student_message || '(none)'}
Source: ${data.course_url}
Status: ${live ? 'LIVE REGISTRATION' : 'WAITLIST ONLY'}. No payment or course entitlement.`;
  if (process.env.AMANDA_GMAIL_CLIENT_ID && process.env.AMANDA_GMAIL_CLIENT_SECRET && process.env.AMANDA_GMAIL_REFRESH_TOKEN) {
    await sendGmailEmail({ to: 'Amanda@aesthetikine.com', subject: `${live ? 'New Live Registration' : 'New Waitlist'}: ${data.course_name}`, text });
    return 'gmail';
  }
  const fallback = await sendAuthEmail({
    to: 'Amanda@aesthetikine.com',
    subject: `${live ? 'New Live Registration' : 'New Waitlist'}: ${data.course_name}`,
    title: live ? 'New live registration' : 'New course waitlist request',
    bodyHtml: `<pre style="white-space:pre-wrap">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    text,
    brandLabel: 'Amanda Catherine · AesthetiKine',
  });
  if (!fallback.ok) throw new Error(fallback.error || 'Waitlist email delivery failed');
  return 'resend';
}

export async function saveAmandaWaitlist(data: AmandaWaitlistData) {
  if (!airtableConfigured()) throw new Error('Waitlist storage is not configured');
  const key = `${data.course_slug}:${data.student_email.toLowerCase()}`;
  const record = await airtableUpsertByField('amanda_waitlist', 'submission_key', key, {
    ...data,
    portal_slug: 'amanda-catherine',
    submitted_at: new Date().toISOString(),
    submission_key: key,
    notification_status: 'pending',
    notification_updated_at: new Date().toISOString(),
  });
  if (!record) throw new Error('Waitlist could not be saved');
  return record.id;
}

export async function updateAmandaWaitlistNotification(id: string, status: string, provider: string) {
  const saved = await airtableUpdate('amanda_waitlist', id, {
    notification_status: status,
    notification_provider: provider,
    notification_updated_at: new Date().toISOString(),
  });
  if (!saved) throw new Error('Waitlist notification outcome could not be recorded');
}
