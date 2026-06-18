import { NextRequest, NextResponse } from 'next/server';
import { enhanceContentRequest } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { content?: string };
  const content = (body.content ?? '').trim();
  if (!content) {
    return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
  }

  const enhanced = await enhanceContentRequest(content);
  return NextResponse.json({ enhanced });
}
