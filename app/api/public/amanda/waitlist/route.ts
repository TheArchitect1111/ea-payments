import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import { saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { checkRateLimit } from '@/lib/ai/rate-limit';
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Open the waitlist from Amanda’s website.' }, { status: 403 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`amanda-waitlist:${ip}`, 6, 60000).ok) return NextResponse.json({ error: 'Please wait one minute.' }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const course = AMANDA_COURSES.find(course => course.id === body.courseId);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(body.name || '').trim().slice(0, 120);
  if (!course || amandaCourseReady(course.id) || !/^\S+@\S+\.\S+$/.test(email) || name.length < 2) return NextResponse.json({ error: 'A waitlist course, name and valid email are required.' }, { status: 400 });
  const id = `amanda-waitlist-${createHash('sha256').update(`${course.id}:${email}`).digest('hex').slice(0, 24)}`;
  const saved = await saveStudioRecord({ recordType: 'experience', id, organizationId: syntheticOrgId('amanda-catherine'), title: `Amanda waitlist: ${course.title}`, payload: { id, portalSlug: 'amanda-catherine', courseId: course.id, name, email, createdAt: new Date().toISOString() } });
  if (!saved.ok || (process.env.VERCEL_ENV === 'production' && !saved.persistedToAirtable)) return NextResponse.json({ error: 'The waitlist could not be saved. Please contact Amanda.' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
