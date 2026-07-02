import { NextResponse } from 'next/server';
import { answerGuideQuestion } from '@/lib/ea-guide-knowledge';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    question?: string;
    pathname?: string;
    userId?: string;
    organizationId?: string;
  };

  const pathname = body.pathname ?? '/';
  const context = resolveGuidePageContext(pathname, body.userId);
  if (body.organizationId) context.organizationId = body.organizationId;

  const result = answerGuideQuestion(body.question ?? '', context);
  return NextResponse.json({ ...result, context });
}
