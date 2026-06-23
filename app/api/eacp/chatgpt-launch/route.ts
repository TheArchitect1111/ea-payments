import { NextRequest, NextResponse } from 'next/server';
import {
  createEACPLaunch,
  friendlyLaunchCorrection,
  parseEACPCommand,
  validateEACPLaunchInput,
  type EACPLaunchInput,
} from '@/lib/eacp-launch';
import { EACPPersistenceConfigurationError, EACPStoreConflictError } from '@/lib/eacp-store';
import {
  EACP_CHATGPT_ACTION_KEY_ENV,
  readBearerToken,
  verifyEACPChatGPTActionKey,
} from '@/lib/eacp-chatgpt-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ChatGPTLaunchRequest = Partial<EACPLaunchInput> & {
  command?: string;
};

function unauthorized(message = 'Unauthorized EACP ChatGPT action request.') {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const bearer = readBearerToken(request.headers.get('authorization'));
  if (!verifyEACPChatGPTActionKey(bearer)) {
    return unauthorized(`Missing or invalid bearer token. Set ${EACP_CHATGPT_ACTION_KEY_ENV} in Vercel and in the ChatGPT Action.`);
  }

  let body: ChatGPTLaunchRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
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
        ok: false,
        error: 'Missing required EACP launch fields.',
        missing,
        correction: friendlyLaunchCorrection(missing),
      },
      { status: 400 },
    );
  }

  try {
    const launch = await createEACPLaunch(input as EACPLaunchInput);
    return NextResponse.json({
      ok: true,
      message: 'EACP launch package ready.',
      launchId: launch.id,
      status: launch.status,
      client: launch.client,
      goal: launch.goal,
      deliverable: launch.deliverable,
      reviewPackageUrl: launch.links.reviewPackage,
      projectBriefUrl: launch.links.projectBrief,
      skinBriefUrl: launch.links.skinBrief,
      approvalUrl: launch.links.approval,
      codexBuilderUrl: launch.links.codexBuilder,
      guide: {
        message: 'Project package ready.',
        actions: launch.links,
      },
    });
  } catch (error) {
    if (error instanceof EACPStoreConflictError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof EACPPersistenceConfigurationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    throw error;
  }
}
