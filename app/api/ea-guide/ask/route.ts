import { NextRequest, NextResponse } from 'next/server';
import { answerGuideQuestion } from '@/lib/ea-guide-knowledge';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';
import { resolveSessionFromRequest } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { question?: string; pathname?: string };
  const session = await resolveSessionFromRequest(request, { realm: 'portal' });
  if (!session) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }
  const context = resolveGuidePageContext(
    body.pathname ?? '/',
    session.email ?? session.sub,
  );
  context.organizationId = session.orgId ?? session.slug;

  const result = answerGuideQuestion(body.question ?? '', context);
  return NextResponse.json({ ...result, context });
}
