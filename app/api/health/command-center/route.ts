import { buildLaunchCommandCenterReport } from '@/lib/launch-command-center';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const report = await buildLaunchCommandCenterReport();
  return Response.json(report);
}
