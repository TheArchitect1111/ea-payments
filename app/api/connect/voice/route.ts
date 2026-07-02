import { NextRequest, NextResponse } from 'next/server';
import { applyVoiceNoteToRelationship, summarizeVoiceNote } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const note = typeof body.note === 'string' ? body.note : '';
    const relationshipId = typeof body.relationshipId === 'string' ? body.relationshipId.trim() : '';
    if (!note.trim()) {
      return NextResponse.json({ error: 'Voice note text is required.' }, { status: 400 });
    }

    const summary = summarizeVoiceNote(note);
    const relationship = relationshipId
      ? await applyVoiceNoteToRelationship({ relationshipId, note })
      : null;

    return NextResponse.json({
      ...summary,
      relationship,
      memorySource: relationship?.aiProfile.memorySource ?? 'rules',
      message: relationship
        ? 'Voice note attached and relationship memory refreshed.'
        : 'Voice note summarized. Pass relationshipId to attach to a profile.',
    });
  } catch (error) {
    console.error('[connect] voice note failed', error);
    return NextResponse.json({ error: 'Unable to process voice note.' }, { status: 500 });
  }
}
