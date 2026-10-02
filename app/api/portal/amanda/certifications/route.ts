import { NextRequest, NextResponse } from 'next/server';
import { guardAmandaAdmin } from '@/lib/amanda-catherine/admin-access';
import { listAmandaCourseProgress, certificationEvidenceVersion, approveAmandaCertification, setAmandaTrainingDate } from '@/lib/amanda-catherine/progress-store';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const auth = await guardAmandaAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const rows = await listAmandaCourseProgress('amanda-catherine');
  return NextResponse.json({ ok: true, rows: rows.map(progress => ({ ...progress, evidenceVersion: certificationEvidenceVersion(progress) })) });
}
export async function POST(req: NextRequest) {
  const auth = await guardAmandaAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase(); const courseId = String(body.courseId || '');
  const assigned = await getAmandaAssignedCourseIds('amanda-catherine', email);
  if (!assigned.includes(courseId)) return NextResponse.json({ error: 'This learner has no READY course assignment.' }, { status: 403 });
  try {
    let progress;
    if (body.action === 'training-date') progress = await setAmandaTrainingDate('amanda-catherine', email, courseId, String(body.trainingDate || ''));
    else if (body.action === 'approve') progress = await approveAmandaCertification('amanda-catherine', email, courseId, auth.session.email!, String(body.evidenceVersion || ''), body.quizPassed === true);
    else return NextResponse.json({ error: 'Choose a valid administrator action.' }, { status: 400 });
    return NextResponse.json({ ok: true, progress });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save review.' }, { status: 409 }); }
}
