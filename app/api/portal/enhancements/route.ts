import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { createEnhancementRequest, getClientByPortalSlug } from '@/lib/airtable';
import { assessEnhancementRequest } from '@/lib/ai';
import { sendEnhancementRequestConfirmation, sendInternalNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ error: 'Portal record not found.' }, { status: 404 });
  }

  const body = (await req.json()) as {
    enhancementType?: string;
    description?: string;
    businessGoal?: string;
  };

  const enhancementType = (body.enhancementType ?? '').trim();
  const description = (body.description ?? '').trim();
  const businessGoal = (body.businessGoal ?? '').trim();

  if (!enhancementType || !description || !businessGoal) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  const assessment = await assessEnhancementRequest({ enhancementType, description, businessGoal });
  const result = await createEnhancementRequest({
    clientRecordId: client.id,
    organizationName: client.organization || client.clientName,
    enhancementType,
    description,
    businessGoal,
    aiLevelAssessment: assessment.level,
    aiEstimatedFeeRange: assessment.estimatedRange,
    notes: assessment.reasoning,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Request could not be saved.' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  const portalUrl = `${baseUrl}/portal/${client.portalSlug}/updates`;

  await sendEnhancementRequestConfirmation({
    email: client.email,
    clientName: client.clientName,
    portalUrl,
  });
  await sendInternalNotification({
    subject: `New enhancement request from ${client.clientName}`,
    title: 'New Enhancement Request',
    body: `${client.clientName} submitted a ${assessment.level} request.\n\nType: ${enhancementType}\nEstimated range: ${assessment.estimatedRange}\n\n${description}`,
  });

  return NextResponse.json({ ok: true, enhancementId: result.enhancementId, assessment });
}
