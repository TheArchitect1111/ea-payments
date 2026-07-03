import { buildPlatformOpsReport } from '@/lib/platform-ops';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Aggregated operational health — extends launch command center without duplicating it. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const probeRoutes = searchParams.get('probeRoutes') === '1';

  const report = await buildPlatformOpsReport({ probeRoutes, verifyBackup: true });
  return Response.json(report, { status: report.ok ? 200 : 503 });
}
