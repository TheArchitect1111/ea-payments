import { NextRequest, NextResponse } from 'next/server';
import { saveAmandaWaitlist, notifyAmandaWaitlist, updateAmandaWaitlistNotification } from '@/lib/amanda-catherine/waitlist';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { registry, create } from '@/lib/amanda-catherine/registry';
import { isAllowedAmandaOrigin } from '@/lib/amanda-catherine/request-origin';
import { getAmandaConfirmationLetter } from '@/lib/amanda-catherine/confirmation-letters';
import { enqueueTrackingPortalRetry, pushToTrackingPortal, type TrackingLead } from '@/lib/services/trackingPortal';

export const dynamic = 'force-dynamic';

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
}

export async function POST(req: NextRequest) {
  if (!isAllowedAmandaOrigin(req)) return NextResponse.json({ error: 'Open registration from Amanda’s website.' }, { status: 403 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`amanda-registration:${ip}`, 6, 60000).ok) return NextResponse.json({ error: 'Please wait one minute.' }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId || '').trim();
  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(body.name || '').trim().slice(0, 120);
  const person = splitName(name);
  if (!/^\S+@\S+\.\S+$/.test(email) || person.first_name.length < 1) {
    return NextResponse.json({ error: 'A valid name and email are required.' }, { status: 400 });
  }

  let course;
  try {
    const data = await registry();
    course = data.courses.find(item => item.key === courseId && !item.isTest && item.isActive && item.isVisible);
  } catch {
    return NextResponse.json({ error: 'Classes are temporarily unavailable. Please try again.' }, { status: 503 });
  }
  if (!course) return NextResponse.json({ error: 'This class is not available for registration.' }, { status: 404 });
  const registrationType: 'live' | 'waitlist' = course.status === 'LIVE' ? 'live' : 'waitlist';
  const timestamp = new Date().toISOString();
  const data = {
    student_name: name,
    student_email: email,
    student_phone: String(body.phone || '').trim().slice(0, 40),
    student_message: String(body.message || '').trim().slice(0, 2000),
    course_name: course.title,
    course_slug: course.key,
    course_url: `${req.nextUrl.origin}/courses/${encodeURIComponent(course.key)}`,
    registration_type: registrationType,
  };

  let waitlistRecordId: string;
  try {
    waitlistRecordId = await saveAmandaWaitlist(data);
  } catch (error) {
    console.error('[amanda-registration] HQ save failed', error);
    return NextResponse.json({ error: 'Your details could not be saved. Please try again.' }, { status: 503 });
  }

  const trackingLead: TrackingLead = {
    ...person,
    email,
    phone: data.student_phone,
    class_name: course.title,
    class_id: course.key,
    registration_type: registrationType,
    created_at: timestamp,
    source_page: 'amandacatherine.ca',
  };
  try {
    await pushToTrackingPortal(trackingLead);
  } catch (error) {
    console.error('[amanda-registration] tracking sync deferred', error);
    try { await enqueueTrackingPortalRetry(trackingLead, error); }
    catch (queueError) { console.error('[amanda-registration] retry queue unavailable', queueError); }
  }

  try {
    await create('Business Interested', {
      Title: `${registrationType === 'live' ? 'Live Registration' : 'Waitlist Registration'} — ${course.title} — ${timestamp}`,
      'CTA Name': registrationType === 'live' ? 'Register' : 'Join Waitlist',
      'Source Page': '/amanda-catherine',
      Timestamp: timestamp,
      Portal: 'amanda-catherine',
      'Portal Slug': 'amanda-catherine',
      Event: registrationType === 'live' ? 'live_registration' : 'waitlist_application',
      'Course Name': course.title,
      'Course Key': course.key,
      Price: course.price ?? undefined,
      'Square URL': course.square_checkout_url || undefined,
      'Payload JSON': JSON.stringify({ event: registrationType === 'live' ? 'live_registration' : 'waitlist_application', registration_type: registrationType, portal_slug: 'amanda-catherine', course_name: course.title, course_key: course.key, timestamp }),
    });
  } catch (error) {
    console.error('[amanda-registration] Business Interested write failed; HQ registration remains saved', error);
  }

  try {
    const provider = await notifyAmandaWaitlist(data);
    await updateAmandaWaitlistNotification(waitlistRecordId, 'sent', provider);
  } catch (error) {
    console.error('[amanda-registration] owner notification failed', error instanceof Error ? error.message : 'Unknown delivery error');
    try { await updateAmandaWaitlistNotification(waitlistRecordId, 'failed', 'none'); }
    catch (persistError) { console.error('[amanda-registration] notification status persistence failed', persistError); }
  }

  const letter = await getAmandaConfirmationLetter(registrationType);
  return NextResponse.json({
    ok: true,
    registration_type: registrationType,
    confirmation: { ...letter, first_name: person.first_name },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
