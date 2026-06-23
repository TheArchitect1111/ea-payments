import { NextRequest, NextResponse } from 'next/server';
import { ensureAirtableLaunchTables, verifyPaymentsBaseId } from '@/lib/airtable-meta-setup';
import { checkAirtableLaunchSchema } from '@/lib/airtable-schema-check';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const expected = [
    process.env.LAUNCH_SETUP_KEY?.trim(),
    process.env.LAUNCH_SETUP_TEMP_KEY?.trim(),
  ].filter(Boolean);
  if (expected.length === 0) return false;
  const provided = req.headers.get('x-launch-setup-key')?.trim();
  return Boolean(provided && expected.includes(provided));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const baseCheck = await verifyPaymentsBaseId();
  const setup = await ensureAirtableLaunchTables();
  const schema = await checkAirtableLaunchSchema();

  return NextResponse.json({
    ok: setup.ok && schema.capture.ok && schema.pulse.ok && schema.assessment.ok && schema.proposal.ok,
    base: baseCheck,
    setup,
    schema,
  });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const baseCheck = await verifyPaymentsBaseId();
  const schema = await checkAirtableLaunchSchema();

  return NextResponse.json({
    ok: baseCheck.captureTableFound && schema.capture.ok && schema.assessment.ok && schema.proposal.ok,
    base: baseCheck,
    schema,
  });
}
