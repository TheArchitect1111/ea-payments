import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getCaptures } from '@/lib/capture-records';
import { getProposalsWithAssessments, getPartnerRecords } from '@/lib/airtable';
import { getOpportunities } from '@/lib/partner-network';
import { buildKnowledgeGraph, searchGraph } from '@/lib/knowledge-graph';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  const [captures, proposals, partners, opportunities] = await Promise.all([
    getCaptures(50),
    getProposalsWithAssessments(),
    getPartnerRecords(),
    getOpportunities(),
  ]);

  const graph = buildKnowledgeGraph({ captures, proposals, partners, opportunities });
  const search = q ? searchGraph(graph, q) : null;

  return Response.json({
    ok: true,
    graph,
    search,
  });
}
