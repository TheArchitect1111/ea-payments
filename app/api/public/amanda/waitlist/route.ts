import { NextRequest, NextResponse } from 'next/server';
import { findAmandaWaitlistInterest } from '@/lib/amanda-catherine/waitlist-interests';
import { saveAmandaWaitlist, notifyAmandaWaitlist } from '@/lib/amanda-catherine/waitlist';
import { checkRateLimit } from '@/lib/ai/rate-limit';
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
  try { await notifyAmandaWaitlist(data); } catch { return NextResponse.json({ error: 'Your request was saved, but Amanda could not be notified. Please contact Amanda before submitting again.' }, { status: 503 }); }
  return NextResponse.json({ ok: true });
}
