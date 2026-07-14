import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { ensureAirtableLaunchTables, verifyPaymentsBaseId } from '@/lib/airtable-meta-setup';
import { checkAirtableLaunchSchema } from '@/lib/airtable-schema-check';
import { getWebsitePortalReadiness } from '@/lib/website-portal-readiness';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Admin-only: ensure Airtable launch tables (incl. Creative Studio Experience)
 * so Website + Portal Starter can persist sites durably.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const base = await verifyPaymentsBaseId();
  const setup = await ensureAirtableLaunchTables();
  const schema = await checkAirtableLaunchSchema();
  const readiness = await getWebsitePortalReadiness();

  return NextResponse.json({
    ok: setup.ok && schema.creativeStudio.ok,
    base,
    setup: {
      ok: setup.ok,
      errors: setup.errors,
      creativeStudio: setup.creativeStudio,
    },
    schema: {
      creativeStudio: schema.creativeStudio,
    },
    readiness,
  });
}
