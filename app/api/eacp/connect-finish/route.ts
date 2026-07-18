import { NextRequest, NextResponse } from 'next/server';
import {
  EACP_CHATGPT_ACTION_KEY_ENV,
  readBearerToken,
  verifyEACPChatGPTActionKey,
} from '@/lib/eacp-chatgpt-auth';
import { buildConnectLaunchReadiness } from '@/lib/connect-launch-readiness';
import { runConnectProductionMatrix } from '@/lib/connect-matrix-run';
import { logConnectNurtureRun } from '@/lib/connect-nurture-log';
import { ensureConnectForPortal, ensureDemoConnectTenant } from '@/lib/connect-provision';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import {
  ensureConnectTenantStorage,
  remediateConnectExampleRelationships,
} from '@/lib/connect-store';
import { getDemoCredentials } from '@/lib/demo-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 180;

/**
 * Founder ops: run Connect finish line with the same ChatGPT Action bearer.
 * Ensures Connect tenant, clears @example.com nurture traps, reseeds matrix, returns readiness.
 */
export async function POST(request: NextRequest) {
  const bearer = readBearerToken(request.headers.get('authorization'));
  if (!verifyEACPChatGPTActionKey(bearer)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Missing or invalid bearer token. Set ${EACP_CHATGPT_ACTION_KEY_ENV}.`,
      },
      { status: 401 },
    );
  }

  let orgSlug = 'demo-client';
  let count = 20;
  try {
    const body = (await request.json()) as { orgSlug?: string; count?: number };
    if (body.orgSlug?.trim()) orgSlug = body.orgSlug.trim();
    if (Number.isFinite(body.count)) count = Math.max(1, Math.min(50, Number(body.count)));
  } catch {
    // defaults
  }

  try {
    let storageSetup: { ok: boolean; error?: string } | Awaited<ReturnType<typeof ensureConnectTenantStorage>> | null =
      null;
    try {
      storageSetup = await ensureConnectTenantStorage();
    } catch (error) {
      storageSetup = {
        ok: false,
        error: error instanceof Error ? error.message : 'Connect storage setup failed.',
      };
    }

    const tenant =
      orgSlug === 'demo-client'
        ? await ensureDemoConnectTenant()
        : await ensureConnectForPortal({
            portalSlug: orgSlug,
            organizationName: orgSlug,
            ownerEmail: getDemoCredentials().email,
            industry: 'business',
            sendWelcomeEmail: false,
          });

    // Seeded demo-client exists in-memory even when Airtable tenant write fails.
    if (!tenant.ok && orgSlug !== 'demo-client') {
      return NextResponse.json(
        {
          ok: false,
          error: tenant.error || `Connect tenant could not be ensured for "${orgSlug}".`,
          tenant,
          storageSetup,
        },
        { status: 500 },
      );
    }

    const exampleRemediation = await remediateConnectExampleRelationships();

    const nurture = await processDueConnectSequences();
    await logConnectNurtureRun(nurture, 'admin-run', {
      tenantId: orgSlug,
      note: 'Connect finish line via EACP ops bearer',
    });

    const matrixRun = await runConnectProductionMatrix({
      orgSlug,
      count,
      reseed: true,
      tag: 'matrix-run',
    });

    const readiness = await buildConnectLaunchReadiness(orgSlug);

    return NextResponse.json({
      ok: readiness.ready,
      tenant,
      storageSetup,
      exampleRemediation,
      nurture,
      matrixRun,
      ...readiness,
    });
  } catch (error) {
    console.error('[eacp/connect-finish] failed', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Connect finish line failed.',
      },
      { status: 500 },
    );
  }
}
