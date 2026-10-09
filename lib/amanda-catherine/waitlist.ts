import { sendGmailEmail } from '@/lib/email/gmail';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { airtableConfigured, airtableUpsertByField, airtableUpdate } from '@/lib/data/airtable-client';
export type AmandaWaitlistData = { student_name: string; student_email: string; student_phone: string; course_name: string; course_slug: string; student_message?: string; course_url: string };
// Adapted from the supplied Amanda Waitlist Email Templates PDF; no invented admin URL.
export async function notifyAmandaWaitlist(data: AmandaWaitlistData) {
  const text = `New waitlist interest: ${data.course_name}\nName: ${data.student_name}\nEmail: ${data.student_email}\nPhone: ${data.student_phone}\nMessage: ${data.student_message || '(none)'}\nSource: ${data.course_url}\nStatus: WAITLIST ONLY. No payment or course entitlement.`;
  if (process.env.AMANDA_GMAIL_CLIENT_ID && process.env.AMANDA_GMAIL_CLIENT_SECRET && process.env.AMANDA_GMAIL_REFRESH_TOKEN) {
    await sendGmailEmail({ to: 'Amanda@aesthetikine.com', subject: `New Waitlist: ${data.course_name}`, text });
    return 'gmail';
  }
  const fallback = await sendAuthEmail({
    to: 'Amanda@aesthetikine.com', subject: `New Waitlist: ${data.course_name}`,
    title: 'New course waitlist request', bodyHtml: `<pre style="white-space:pre-wrap">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`,
    text, brandLabel: 'Amanda Catherine · AesthetiKine',
  });
  if (!fallback.ok) throw new Error(fallback.error || 'Waitlist email delivery failed');
  return 'resend';
}
export async function saveAmandaWaitlist(data: AmandaWaitlistData) {
  if (!airtableConfigured()) throw new Error('Waitlist storage is not configured');
  // Stable key prevents duplicates for repeat submissions with the same course/email.
  const key = `${data.course_slug}:${data.student_email.toLowerCase()}`;
  const record = await airtableUpsertByField('amanda_waitlist', 'submission_key', key, {
    ...data, portal_slug: 'amanda-catherine', registration_type: data.registration_type, submitted_at: new Date().toISOString(),
    submission_key: key, notification_status: 'pending', notification_updated_at: new Date().toISOString(),
  });
  if (!record) throw new Error('Waitlist could not be saved');
  return record.id;
}
export async function updateAmandaWaitlistNotification(id: string, status: string, provider: string) {
  const saved = await airtableUpdate('amanda_waitlist', id, {
    notification_status: status, notification_provider: provider, notification_updated_at: new Date().toISOString(),
  });
  if (!saved) throw new Error('Waitlist notification outcome could not be recorded');
}
