import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { persistConceptSelection } from '@/lib/factory-concept-previews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST — select one experience concept (no auto-publish).
 * Sets selectedConceptId + selectionStatus (selected | awaiting_certify).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    projectId?: string;
    conceptId?: string;
    selectedConceptId?: string;
    selectionStatus?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  const selectedConceptId = String(body.selectedConceptId || body.conceptId || '').trim();
  if (!projectId || !selectedConceptId) {
    return NextResponse.json(
      { error: 'projectId and selectedConceptId are required.' },
      { status: 400 },
    );
  }

  const statusRaw = String(body.selectionStatus || 'selected').trim().toLowerCase();
  const selectionStatus =
    statusRaw === 'awaiting_certify' || statusRaw === 'selected'
      ? statusRaw
      : 'selected';

  const result = await persistConceptSelection({
    projectId,
    selectedConceptId,
    selectionStatus,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    projectId,
    selectedConceptId: result.selectedConceptId,
    selectionStatus: result.selectionStatus,
    message: 'Concept selected. Publish still requires Experience Director Approved.',
  });
}
