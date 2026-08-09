import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { certificateEligible, getAmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] || character);
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
  const progress = await getAmandaCourseProgress(tenant.portalSlug, auth.session.email, courseId);
  if (!certificateEligible(progress) || !progress.certificateIssuedAt) {
    return NextResponse.json({ error: 'Certificate requirements are not complete.' }, { status: 403 });
  }
  const recipient = escapeXml(auth.session.email);
  const title = escapeXml(course.certificateTitle);
  const date = escapeXml(new Date(progress.certificateIssuedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000"><rect width="1400" height="1000" fill="#f8f4ec"/><rect x="45" y="45" width="1310" height="910" fill="none" stroke="#aa7a3e" stroke-width="4"/><text x="700" y="190" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="#aa7a3e">AMANDA CATHERINE</text><text x="700" y="310" text-anchor="middle" font-family="Georgia,serif" font-size="72" fill="#1d2430">Certificate of Completion</text><text x="700" y="430" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#4b5563">Presented to</text><text x="700" y="510" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="#1d2430">${recipient}</text><text x="700" y="610" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" fill="#4b5563">for successfully completing</text><text x="700" y="680" text-anchor="middle" font-family="Georgia,serif" font-size="38" fill="#1d2430">${title}</text><text x="700" y="790" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#4b5563">Issued ${date}</text><text x="700" y="875" text-anchor="middle" font-family="Georgia,serif" font-size="27" fill="#aa7a3e">AesthetiKine Studio Lab · Empower Art Collective</text></svg>`;
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${course.id}-certificate.svg"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
