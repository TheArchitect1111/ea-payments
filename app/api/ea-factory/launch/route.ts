import { NextRequest, NextResponse } from 'next/server';
import {
  createEACPLaunch,
  listEACPLaunches,
  parseEACPCommand,
  validateEACPLaunchInput,
  type EACPLaunchInput,
} from '@/lib/eacp-launch';

export const dynamic = 'force-dynamic';

type LaunchRequest = Partial<EACPLaunchInput> & {
  command?: string;
};

export async function GET() {
  return NextResponse.json({ launches: listEACPLaunches() });
}

export async function POST(request: NextRequest) {
  let body: LaunchRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const commandInput = body.command ? parseEACPCommand(body.command) : {};
  const input: Partial<EACPLaunchInput> = {
    ...commandInput,
    client: body.client ?? commandInput.client,
    goal: body.goal ?? commandInput.goal,
    deliverable: body.deliverable ?? commandInput.deliverable,
    industry: body.industry ?? commandInput.industry,
    notes: body.notes ?? commandInput.notes,
  };

  const missing = validateEACPLaunchInput(input);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required EACP launch fields.',
        missing,
        expected: { client: '', goal: '', deliverable: '', industry: '', notes: '' },
      },
      { status: 400 },
    );
  }

  const launch = await createEACPLaunch(input as EACPLaunchInput);

  return NextResponse.json({
    message: 'EACP launch package ready.',
    launch,
    guide: {
      message: 'Project package ready.',
      actions: launch.links,
    },
  });
}
