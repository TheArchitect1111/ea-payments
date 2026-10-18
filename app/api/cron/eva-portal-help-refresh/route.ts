import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { refreshAllRegisteredPortals } from '@/src/bricks/eva-portal-help/watcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request:NextRequest) {
  // Vercel Cron executes only on production. Deliberately block it until
  // production release is explicitly authorized by the owner.
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ok:false,error:'Preview-only scheduler is not activated'}, {status:403});
  }
  const secret = process.env.CRON_SECRET;
  const presented = request.headers.get('authorization') || '';
  if (!secret) return NextResponse.json({ok:false,error:'Cron secret not configured'}, {status:503});
  const lhs=Buffer.from(presented);
  const rhs=Buffer.from('Bearer '+secret);
  if (lhs.length!==rhs.length || !timingSafeEqual(lhs,rhs)) {
    return NextResponse.json({ok:false,error:'Unauthorized'}, {status:401});
  }
  const result=await refreshAllRegisteredPortals();
  return NextResponse.json(result, {status:result.ok?200:503,headers:{'Cache-Control':'no-store'}});
}
