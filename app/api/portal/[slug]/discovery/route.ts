import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { guardBrick, requireSameOrigin } from '@/lib/bricks/access';
import { handleDiscoverySubmit } from '@/lib/discovery/storage';
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const access = await guardBrick(req, slug, 'discovery');
  if (!access.ok) return access.response;
  try {
    requireSameOrigin(req);
    const row = await handleDiscoverySubmit(access.tenant, access.session.email!, await req.json());
    return Response.json({ ok: true, id: row.id, analysis: row.analysis, confirmationSent: row.confirmationSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Assessment unavailable';
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : message.includes('origin') ? 403 : 503 });
  }
}
