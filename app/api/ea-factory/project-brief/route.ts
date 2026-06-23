import { NextRequest, NextResponse } from 'next/server';
import { generateEAFactoryProjectBrief, type EAFactoryProjectInput } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: Partial<EAFactoryProjectInput>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const missing = requiredFields(body);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required EA Factory project fields.',
        missing,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    brief: generateEAFactoryProjectBrief({
      clientName: body.clientName!,
      organization: body.organization,
      website: body.website,
      industry: body.industry!,
      mission: body.mission!,
      goals: body.goals!,
      desiredOutcome: body.desiredOutcome!,
      projectType: body.projectType,
      selectedProtocolIds: body.selectedProtocolIds!,
    }),
  });
}

function requiredFields(body: Partial<EAFactoryProjectInput>) {
  const missing: string[] = [];

  if (!body.clientName?.trim()) missing.push('clientName');
  if (!body.industry?.trim()) missing.push('industry');
  if (!body.mission?.trim()) missing.push('mission');
  if (!Array.isArray(body.goals) || body.goals.length === 0) missing.push('goals');
  if (!body.desiredOutcome?.trim()) missing.push('desiredOutcome');
  if (!Array.isArray(body.selectedProtocolIds) || body.selectedProtocolIds.length === 0) {
    missing.push('selectedProtocolIds');
  }

  return missing;
}
