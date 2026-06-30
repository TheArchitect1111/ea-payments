import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  adminAuthJsonError,
  EA_ADMIN_COOKIE,
  requireAdminAction,
  requireAdminSession,
} from '@/lib/admin-session-guard';
import { listEntitlementsForOrg, setModuleEnabled } from '@/lib/entitlements';
import type { ModuleId } from '@/lib/modules/registry';
import { MODULE_IDS } from '@/lib/modules/registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const auth = requireAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgId = req.nextUrl.searchParams.get('organizationId')?.trim();
  if (!orgId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }

  const entitlements = await listEntitlementsForOrg(orgId);
  return NextResponse.json({ organizationId: orgId, entitlements });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const auth = requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: {
    organizationId?: string;
    moduleId?: string;
    enabled?: boolean;
    source?: 'manual' | 'package' | 'subscription' | 'trial';
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim();
  const moduleId = body.moduleId?.trim() as ModuleId | undefined;

  if (!organizationId || !moduleId) {
    return NextResponse.json({ error: 'organizationId and moduleId are required.' }, { status: 400 });
  }

  if (!(MODULE_IDS as readonly string[]).includes(moduleId)) {
    return NextResponse.json({ error: 'Unknown moduleId.' }, { status: 400 });
  }

  const entitlement = await setModuleEnabled(
    organizationId,
    moduleId,
    body.enabled !== false,
    body.source ?? 'manual',
  );

  if (!entitlement) {
    return NextResponse.json(
      { error: 'Could not update entitlement. Check Airtable Entitlements table.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, entitlement });
}
