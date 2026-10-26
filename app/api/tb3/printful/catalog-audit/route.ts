import type {NextRequest} from 'next/server';
import {authorize,handled,json} from '@/lib/tb3/server';
import {auditTb3PrintfulCatalog} from '@/lib/tb3/printful-catalog-audit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:NextRequest) {
  return handled(async()=>{
    await authorize(req,true);
    return json(await auditTb3PrintfulCatalog());
  });
}
