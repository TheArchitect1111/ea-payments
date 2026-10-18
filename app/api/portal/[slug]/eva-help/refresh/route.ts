import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { refreshPortalKnowledge } from '@/src/bricks/eva-portal-help/watcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Explicit owner/admin only, same tenant session, in supported deployment environments. */
export async function POST(request: NextRequest, {params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if (!['production','preview'].includes(process.env.VERCEL_ENV||'')) {
    return NextResponse.json({ok:false,error:'Knowledge refresh unavailable in this environment'}, {status:403});
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

/** Vercel Cron uses GET and a bearer CRON_SECRET. Unlike POST, no user cookie
 * is accepted for this path. The concrete slug is fixed by each cron entry. */
export async function GET(request: NextRequest, {params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if(process.env.VERCEL_ENV !== 'production')
    return NextResponse.json({ok:false,error:'Scheduled refresh runs in production only'},{status:403});
  const secret=process.env.CRON_SECRET;
  if(!secret) return NextResponse.json({ok:false,error:'Cron secret unavailable'},{status:503});
  const actual=Buffer.from(request.headers.get('authorization') || '');
  const expected=Buffer.from('Bearer '+secret);
  if(actual.length!==expected.length || !timingSafeEqual(actual,expected))
    return NextResponse.json({ok:false,error:'Cron authentication required'},{status:401});
  try {
    const result=await refreshPortalKnowledge(slug,{mode:'live'});
    return NextResponse.json(result,{status:200,headers:{'Cache-Control':'no-store'}});
  }catch(error) {
    console.error('eva.help.cron-refresh',{portalId:slug,reason:error instanceof Error?error.message:'Unknown error'});
    return NextResponse.json({ok:false,portalId:slug,error:'Knowledge refresh unavailable'},{status:503});
  }
}
