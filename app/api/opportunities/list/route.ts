import type { NextRequest } from 'next/server';
import { authorize, db, scope, handled, json } from '@/lib/tb3/server';
export async function GET(req: NextRequest) { return handled(async()=>{await authorize(req);return json({ok:true,opportunities:await db(`tb3_opportunities?${scope()}&order=created_at.desc`)});}); }
