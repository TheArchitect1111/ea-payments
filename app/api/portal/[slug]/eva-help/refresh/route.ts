import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { refreshPortalKnowledge } from '@/src/bricks/eva-portal-help/watcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Explicit owner/admin only, same portal session, and preview only. */
export async function POST(request: NextRequest, {params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ok:false,error:'Knowledge refresh is preview-only'}, {status:403});
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ok:false,error:'Origin not permitted'}, {status:403});
  }
  const token = (await cookies()).get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ok:false,error:'Portal sign-in required'}, {status:401});
  if (session.slug !== slug || !['admin','owner'].includes(session.role||'')) {
    return NextResponse.json({ok:false,error:'Portal owner or admin required'}, {status:403});
  }
  const mode = request.nextUrl.searchParams.get('mode') || 'live';
  if (mode !== 'live' && mode !== 'manifest') {
    return NextResponse.json({ok:false,error:'Unsupported refresh mode'}, {status:400});
  }
  try {
    const result = await refreshPortalKnowledge(slug, {mode});
    return NextResponse.json(result,{status:200,headers:{'Cache-Control':'no-store'}});
  } catch(err) {
    console.error('eva.help.refresh', { portalId: slug, reason: err instanceof Error?err.message:'Unknown error' });
    return NextResponse.json({ok:false,portalId:slug,error:'Knowledge refresh unavailable'}, {status:503});
  }
}
