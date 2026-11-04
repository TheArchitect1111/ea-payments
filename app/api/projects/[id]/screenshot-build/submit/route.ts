import { NextRequest } from 'next/server';
import { loadScreenshotDraft } from '@/lib/factory-screenshot-runtime';
import { submitScreenshotForm } from '@/lib/factory-screenshot-submit';
import { guardBrick, requireSameOrigin } from '@/lib/bricks/access';
import { checkRateLimit } from '@/lib/ai/rate-limit';

export const runtime = 'nodejs';
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const { id } = await params;
    const draft = await loadScreenshotDraft(id);
    if (!draft?.tenant || draft.projectId !== id) return Response.json({ error: 'Private draft unavailable' }, { status: 404 });
    const form = await request.formData();
    const raw: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value !== 'string' || Object.hasOwn(raw, key)) throw new Error('Invalid form value');
      raw[key] = value;
    }
    const page = draft.pages.find(p => p.id === raw.pageId);
    const kind = page?.forms[raw.componentId];
    if (!kind) return Response.json({ error: 'Form is not wired' }, { status: 409 });
    const access = await guardBrick(request, draft.tenant.portalSlug, kind);
    if (!access.ok) return access.response;
    const limit = checkRateLimit(`screenshot-form:${access.tenant.organizationId}:${access.session.email}`, 30, 3600000);
    if (!limit.ok) return Response.json({ error: 'Try again later' }, { status: 429 });
    const result = await submitScreenshotForm(draft, access.tenant, raw, { email: access.session.email! });
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(null, { status: 303, headers: { location: result.portalPath, 'cache-control': 'private, no-store' } });
    }
    return Response.json({ ok: true, ...result, message: 'Submission saved. No email or payment was triggered.' },
      { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    console.error('[screenshot-form] rejected', error instanceof Error ? error.message : 'Submission failed');
    return Response.json({ ok: false, error: 'Submission could not be saved. Check your session and form values, then retry.' }, { status: 400 });
  }
}
