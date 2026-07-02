import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { createConnectTenant, listConnectOrgs } from '@/lib/connect-store';

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
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  return undefined;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  return Boolean(session);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  const tenants = await listConnectOrgs();
  return NextResponse.json({ tenants });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = clean(body.slug);
    const name = clean(body.name);
    const offerHeadline = clean(body.offerHeadline);
    const resourceTitle = clean(body.resourceTitle);

    if (!slug || !name || !offerHeadline || !resourceTitle) {
      return NextResponse.json(
        { error: 'Slug, name, offer headline, and resource title are required.' },
        { status: 400 },
      );
    }

    const result = await createConnectTenant({
      slug,
      name,
      offerHeadline,
      resourceTitle,
      accent: clean(body.accent),
      notificationEmails: cleanList(body.notificationEmails),
      leadTypes: cleanList(body.leadTypes),
      teams: cleanList(body.teams),
      guideTitle: clean(body.guideTitle),
      guideIntro: clean(body.guideIntro),
      journeyTitle: clean(body.journeyTitle),
      journeyIntro: clean(body.journeyIntro),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create Connect tenant.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
