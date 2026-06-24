import { NextRequest, NextResponse } from 'next/server';
import {
  createConnectRelationship,
  getConnectOrg,
  listConnectRelationships,
  type CreateRelationshipInput,
} from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function GET(request: NextRequest) {
  const org = request.nextUrl.searchParams.get('org') ?? undefined;
  const relationships = await listConnectRelationships(org);
  return NextResponse.json({ relationships });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgSlug = clean(body.orgSlug) ?? 'demo';
    const name = clean(body.name);
    const email = clean(body.email);

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const input: CreateRelationshipInput = {
      orgSlug,
      name,
      email,
      phone: clean(body.phone),
      organization: clean(body.organization),
      role: clean(body.role),
      source: body.source === 'NFC' || body.source === 'Direct' || body.source === 'Representative' ? body.source : 'QR',
      event: clean(body.event),
      representative: clean(body.representative),
      conversationNotes: clean(body.conversationNotes),
      leadType: clean(body.leadType),
      tags: Array.isArray(body.tags) ? body.tags.map(clean).filter(Boolean) as string[] : [],
    };

    const relationship = await createConnectRelationship(input);
    const org = getConnectOrg(orgSlug);
    const resources = org.sequence
      .filter((step) => step.delayDays === 0)
      .map((step) => org.resources.find((resource) => resource.id === step.resourceId))
      .filter(Boolean);

    return NextResponse.json({
      relationship,
      resources,
      redirectDestination: org.redirectDestination,
      nextSequence: org.sequence,
      message: 'Relationship activated.',
    });
  } catch (error) {
    console.error('[connect] create relationship failed', error);
    return NextResponse.json({ error: 'Unable to activate relationship.' }, { status: 500 });
  }
}
