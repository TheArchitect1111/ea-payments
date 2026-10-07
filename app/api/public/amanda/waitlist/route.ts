import { NextRequest, NextResponse } from 'next/server';
import { findAmandaWaitlistInterest } from '@/lib/amanda-catherine/waitlist-interests';
import { saveAmandaWaitlist, notifyAmandaWaitlist } from '@/lib/amanda-catherine/waitlist';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { registry, create } from '@/lib/amanda-catherine/registry';
import { sendAmandaWarmLetter } from '@/lib/email/amanda-warm-letter';
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Open the waitlist from Amanda’s website.' }, { status: 403 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`amanda-waitlist:${ip}`, 6, 60000).ok) return NextResponse.json({ error: 'Please wait one minute.' }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const course = findAmandaWaitlistInterest(String(body.courseId || ''));
  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(body.name || '').trim().slice(0, 120);
  if (!course || !/^\S+@\S+\.\S+$/.test(email) || name.length < 2) return NextResponse.json({ error: 'A waitlist course, name and valid email are required.' }, { status: 400 });
  const data = { student_name: name, student_email: email, student_phone: String(body.phone || '').trim().slice(0, 40), student_message: String(body.message || '').trim().slice(0, 2000), course_name: course.title, course_slug: course.id, course_url: `${req.nextUrl.origin}/amanda-catherine/courses/${encodeURIComponent(course.id)}#waitlist` };
  try { await saveAmandaWaitlist(data); } catch { return NextResponse.json({ error: 'The waitlist could not be saved. Please try again.' }, { status: 503 }); }
  try {
    const current = await registry();
    const courseRecord = current.courses.find(item => item.key === course.id);
    const timestamp = new Date().toISOString();
    const payload = { event: 'waitlist_application', cta_name: 'Premium Waitlist Application', page: '/portal/amanda-catherine/waitlist', timestamp, portal_slug: 'amanda-catherine', source: 'amandacatherine.ca', course_name: course.title, course_key: course.id, price: courseRecord?.price ?? null, square_url_if_enroll: courseRecord?.square_checkout_url ?? null };
    await create('Business Interested', {
      Title: 'Premium Waitlist Application — ' + course.title + ' — ' + timestamp,
      'CTA Name': 'Premium Waitlist Application',
      'Source Page': '/portal/amanda-catherine/waitlist',
      Timestamp: timestamp,
      Portal: 'amanda-catherine',
      'Portal Slug': 'amanda-catherine',
      Event: 'waitlist_application',
      'Course Name': course.title,
      'Course Key': course.id,
      Price: courseRecord?.price ?? undefined,
      'Square URL': courseRecord?.square_checkout_url || undefined,
      'Payload JSON': JSON.stringify(payload)
    });
  } catch {
    return NextResponse.json({ error: 'Your waitlist was saved, but the Business Interested record could not be written. Please try again shortly.' }, { status: 503 });
  }
  console.log('[AMANDA_WORKFLOW] db_saved', { email, course: course.title, ctaType: 'waitlist', route: '/api/public/amanda/waitlist' });
  try {
    const sent = await sendAmandaWarmLetter({ to: email, name, course: course.title, ctaType: 'waitlist' });
    console.log('[AMANDA_WORKFLOW] email_queued', { email, course: course.title, id: sent.id });
  } catch (error) {
    console.error('[AMANDA_WORKFLOW] email_failed', { email, course: course.title, ctaType: 'waitlist', error: error instanceof Error ? error.message : String(error) });
  }
  try {
    await notifyAmandaWaitlist(data);
  } catch (error) {
    console.error('[AMANDA_WORKFLOW] admin_notification_failed', { email, course: course.title, error: error instanceof Error ? error.message : String(error) });
  }
  return NextResponse.json({ ok: true });
}
