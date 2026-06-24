import { NextRequest, NextResponse } from 'next/server';
import { summarizeVoiceNote } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const note = typeof body.note === 'string' ? body.note : '';
    if (!note.trim()) {
      return NextResponse.json({ error: 'Voice note text is required.' }, { status: 400 });
    }

    return NextResponse.json({
      ...summarizeVoiceNote(note),
      message: 'Voice note attached to relationship memory.',
    });
  } catch (error) {
    console.error('[connect] voice note failed', error);
    return NextResponse.json({ error: 'Unable to process voice note.' }, { status: 500 });
  }
}
