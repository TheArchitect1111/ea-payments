import { sendGmailEmail } from '@/lib/email/gmail';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { airtableConfigured, airtableCreate } from '@/lib/data/airtable-client';
export type AmandaWaitlistData = { student_name: string; student_email: string; student_phone: string; course_name: string; course_slug: string; student_message?: string; course_url: string };
// Adapted from the supplied Amanda Waitlist Email Templates PDF; no invented admin URL.
export async function notifyAmandaWaitlist(data: AmandaWaitlistData) {
  const submittedAt = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });
  await sendGmailEmail({ to: 'Amanda@aesthetikine.com', subject: `New Waitlist: ${data.course_name}`, text: `Hi Amanda,\n\nA new student has joined the waitlist.\n\nName: ${data.student_name}\nEmail: ${data.student_email}\nPhone: ${data.student_phone}\nCourse: ${data.course_name}\nStatus: NOT READY — waitlist only\nMessage: ${data.student_message || '(none)'}\nSubmitted: ${submittedAt}\nSource: ${data.course_url}\n\nNotify this student when READY. No checkout or entitlement has been created.` });
}
export async function saveAmandaWaitlist(data: AmandaWaitlistData) {
  if (!airtableConfigured()) throw new Error('Waitlist storage is not configured');
  const record = await airtableCreate('amanda_waitlist', { ...data, portal_slug: 'amanda-catherine', submitted_at: new Date().toISOString() });
  if (!record) throw new Error('Waitlist could not be saved');
}
