import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { updateConnectTenant } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function cleanList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.map(clean).filter(Boolean) as string[];
    return items.length ? items : undefined;
  }
  if (typeof value === 'string') {
    const items = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  return undefined;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    const body = await request.json();
    const result = await updateConnectTenant({
      orgSlug: slug,
      name: clean(body.name),
      offerHeadline: clean(body.offerHeadline),
      resourceTitle: clean(body.resourceTitle),
      guideTitle: clean(body.guideTitle),
      guideIntro: clean(body.guideIntro),
      journeyTitle: clean(body.journeyTitle),
      journeyIntro: clean(body.journeyIntro),
      notificationEmails: cleanList(body.notificationEmails),
      leadTypes: cleanList(body.leadTypes),
      teams: cleanList(body.teams),
    });

    return NextResponse.json({
      ok: true,
      persisted: result.persisted,
      warning: result.warning,
      tenant: result.org,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update Connect tenant.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
