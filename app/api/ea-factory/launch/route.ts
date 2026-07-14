import { NextRequest, NextResponse } from 'next/server';
import {
  createEACPLaunch,
  friendlyLaunchCorrection,
  listEACPLaunches,
  parseEACPCommand,
  validateEACPLaunchInput,
  type EACPLaunchInput,
} from '@/lib/eacp-launch';
import { EACPPersistenceConfigurationError, EACPStoreConflictError } from '@/lib/eacp-store';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
} from '@/lib/admin-session-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LaunchRequest = Partial<EACPLaunchInput> & {
  command?: string;
};

export async function GET(request: NextRequest) {
  const auth = await requireAdminActionFromRequest(request, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  return NextResponse.json({ launches: await listEACPLaunches() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminActionFromRequest(request, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

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
        correction: friendlyLaunchCorrection(missing),
        expected: { client: '', goal: '', deliverable: '', industry: '', notes: '' },
      },
      { status: 400 },
    );
  }

  let launch;
  try {
    launch = await createEACPLaunch(input as EACPLaunchInput);
  } catch (error) {
    if (error instanceof EACPStoreConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof EACPPersistenceConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }

  return NextResponse.json({
    message: 'EACP launch package ready.',
    launch,
    guide: {
      message: 'Project package ready.',
      actions: launch.links,
    },
  });
}
