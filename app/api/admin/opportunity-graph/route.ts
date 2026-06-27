import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { buildEAOpportunityGraph } from '@/lib/opportunity-graph-data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;

  const graph = await buildEAOpportunityGraph(q);
  return Response.json({ ok: true, graph });
}
