import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { CAPTURE_CORS_HEADERS, verifyCaptureApiKey } from '@/lib/capture-auth';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { loadSimplifiWorkspace } from '@/lib/simplifi-store';

export const dynamic = 'force-dynamic';

const EXTENSION_CORS_HEADERS = {
  ...CAPTURE_CORS_HEADERS,
  'Access-Control-Allow-Headers': 'Content-Type, X-EA-Capture-Key, X-EA-Portal-Slug',
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...EXTENSION_CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

function absolutize(href: string | undefined, base: string) {
  if (!href) return undefined;
  if (/^https?:\/\//i.test(href)) return href;
  return `${base}${href.startsWith('/') ? href : `/${href}`}`;
}

function firstNameFrom(name = '') {
  return name.trim().split(/\s+/)[0] ?? '';
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: EXTENSION_CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const apiKey = request.headers.get('x-ea-capture-key');
  const headerSlug = request.headers.get('x-ea-portal-slug');
  const querySlug = request.nextUrl.searchParams.get('portalSlug');
  const requestedSlug = headerSlug || querySlug || '';
  const hasExtensionAccess = verifyCaptureApiKey(apiKey);
  const portalSlug = session?.slug || (hasExtensionAccess ? requestedSlug : '');

  if (!portalSlug) {
    return json(
      { ok: false, error: 'Connect Simplifi before opening the companion brief.' },
      { status: 401 },
    );
  }

  if (!session && !hasExtensionAccess) {
    return json({ ok: false, error: 'Extension access is not configured.' }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? EA_PLATFORM_URL;
  const client = await getClientByPortalSlug(portalSlug);
  const firstName = firstNameFrom(client?.clientName);
  const workspace = await loadSimplifiWorkspace(portalSlug, base, firstName, 40);
  const briefItems = workspace.brief.items.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    href: absolutize(item.href, base),
    kind: item.kind,
  }));
  const actionItems = [
    ...workspace.actionCenter.needsAttention,
    ...workspace.actionCenter.recommended,
    ...workspace.actionCenter.watchlist,
  ].map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    href: absolutize(item.href, base),
    priority: item.priority,
    section: item.section,
  }));
  const topObject = workspace.activeObjects[0];

  return json({
    ok: true,
    portalSlug,
    workspaceUrl: `${base}/simplifi/workspace`,
    greeting: workspace.brief.greeting,
    recommendedNext: workspace.brief.recommendedNext
      ? {
          ...workspace.brief.recommendedNext,
          href: absolutize(workspace.brief.recommendedNext.href, base),
        }
      : null,
    cards: [...briefItems, ...actionItems].slice(0, 6),
    counts: {
      active: workspace.activeObjects.length,
      needsAttention: workspace.actionCenter.needsAttention.length,
      recommended: workspace.actionCenter.recommended.length,
      watchlist: workspace.actionCenter.watchlist.length,
    },
    topOpportunity: topObject
      ? {
          id: topObject.id,
          title: topObject.title,
          nextAction: topObject.nextAction,
          href: absolutize(topObject.considerUrl ?? topObject.shareUrl, base),
          priorityLevel: topObject.priorityLevel,
        }
      : null,
  });
}
