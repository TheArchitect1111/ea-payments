import { NextRequest, NextResponse } from 'next/server';
import { transitionEACPLaunchLifecycle, type EACPLifecycleAction } from '@/lib/eacp-launch';
import { EACPPersistenceConfigurationError, EACPStoreConflictError } from '@/lib/eacp-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ACTIONS = new Set<EACPLifecycleAction>(['start-build', 'fail-build', 'complete-build', 'deploy', 'archive']);

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: PageProps) {
  const { id } = await params;
  const body = await request.json().catch(() => null) as {
    action?: EACPLifecycleAction;
    actor?: string;
    detail?: string;
  } | null;

  if (!body?.action || !ACTIONS.has(body.action)) {
    return NextResponse.json({ error: 'Choose a valid lifecycle action.' }, { status: 400 });
  }

  try {
    const launch = await transitionEACPLaunchLifecycle(
      id,
      body.action,
      body.actor?.trim() || 'EA Operator',
      body.detail?.trim() || '',
    );

    if (!launch) {
      return NextResponse.json({ error: 'Launch not found.' }, { status: 404 });
    }

    return NextResponse.json({ launch });
  } catch (error) {
    if (error instanceof EACPStoreConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof EACPPersistenceConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
