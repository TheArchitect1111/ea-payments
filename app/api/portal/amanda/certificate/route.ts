import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { certificateEligible, getAmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import { audienceCanAccessCourse } from '@/lib/amanda-catherine/course-content';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] || character);
}

function titleCaseEmail(email: string) {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function wrapTitle(value: string, maxCharacters = 54) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

async function approvedCertificateArtwork() {
  const image = await readFile(path.join(process.cwd(), 'public', 'amanda-catherine', 'aesthetikine-certificate-premium.svg'));
  return image.toString('base64');
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const courseId = req.nextUrl.searchParams.get('courseId') || '';
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email || !course) {
    return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 });
  }
  const audience = await resolveAmandaAudience({ portalSlug: tenant.portalSlug, email: auth.session.email, role: auth.session.role });
  if (!audienceCanAccessCourse(audience, courseId)) {
    return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 });
  }

  const progress = await getAmandaCourseProgress(tenant.portalSlug, auth.session.email, courseId);
  if (!certificateEligible(progress) || !progress.certificateIssuedAt) {
    return NextResponse.json({ error: 'Certificate requirements are not complete.' }, { status: 403 });
  }

  const submissions = await listPortalFormSubmissions(tenant.portalSlug, {
    email: auth.session.email,
  });
  const matchingSubmission =
    submissions.find((item) => item.status === 'accepted' && item.name?.trim()) ||
    submissions.find((item) => item.name?.trim());
  const recipient = escapeXml(matchingSubmission?.name?.trim() || titleCaseEmail(auth.session.email));
  const titleLines = wrapTitle(course.certificateTitle).map(escapeXml);
  const date = escapeXml(
    new Date(progress.certificateIssuedAt).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  );
  const background = await approvedCertificateArtwork();
  const titleTspans = titleLines
    .map((line, index) => `<tspan x="768" dy="${index === 0 ? 0 : 40}">${line}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
    <image href="data:image/svg+xml;base64,${background}" width="1536" height="1024"/>
    <rect x="220" y="448" width="1096" height="303" rx="4" fill="#f8f3e9"/>
    <text x="768" y="478" text-anchor="middle" font-family="Georgia,serif" font-size="31" fill="#222222">${recipient}</text>
    <line x1="282" y1="490" x2="1254" y2="490" stroke="#50483f" stroke-width="1"/>
    <text x="768" y="531" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#292724">has successfully completed</text>
    <text x="768" y="581" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="600" fill="#292724">${titleTspans}</text>
    <text x="768" y="676" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#4b463f">All required lessons, assessments, and practical requirements successfully completed.</text>
    <text x="660" y="780" text-anchor="start" font-family="Georgia,serif" font-size="20" fill="#292724">${date}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${course.id}-certificate.svg"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
