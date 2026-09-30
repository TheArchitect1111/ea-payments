import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { findMembership } from '@/lib/memberships';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import { sendAmandaApplicationReply } from '@/lib/amanda-catherine/application-communication';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal', slug: 'amanda-catherine' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!auth.session.email || !roleAtLeast(normalizeRole(auth.session.role), 'staff')) return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  const organization = await findOrganizationByPortalSlug('amanda-catherine');
  const membership = organization && !organization.id.startsWith('org_') ? await findMembership(auth.session.email, organization.id) : null;
  if (!membership || membership.status !== 'active' || !roleAtLeast(membership.role, 'staff')) return NextResponse.json({ error: 'Active Amanda staff membership required.' }, { status: 403 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const messageId = String(body.messageId || '');
  if (!subject || subject.length > 180 || /[\r\n]/.test(subject) || !message || message.length > 5000 || !/^[a-f0-9-]{36}$/i.test(messageId)) return NextResponse.json({ error: 'A subject and message within the allowed length are required.' }, { status: 400 });
  const submission = (await listPortalFormSubmissions('amanda-catherine', { kind: 'application' })).find((item) => item.id === body.submissionId);
  if (!submission) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  try {
    const communication = await sendAmandaApplicationReply(submission, { messageId, subject, message });
    if (communication.status !== 'sent') return NextResponse.json({ error: 'Email could not be sent. The failed attempt is recorded; please retry.' }, { status: 502 });
    return NextResponse.json({ ok: true, communication });
  } catch { return NextResponse.json({ error: 'Application follow-up is temporarily unavailable.' }, { status: 503 }); }
}
