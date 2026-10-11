import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { guardBrick, requireSameOrigin } from '@/lib/bricks/access';
import { saveCalendarEvent } from '@/lib/calendar/storage';
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const access = await guardBrick(req, slug, 'calendar', 'staff');
  if (!access.ok) return access.response;
  try {
    requireSameOrigin(req);
    return Response.json({ ok: true, event: await saveCalendarEvent(access.tenant, await req.json()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Calendar unavailable';
    return Response.json({ error: message }, { status: error instanceof z.ZodError ? 400 : message.includes('origin') ? 403 : 503 });
  }
}
