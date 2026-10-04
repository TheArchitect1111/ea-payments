import { NextResponse } from 'next/server';
export async function GET(){
  // This should check Airtable in production - for now return expected shape
  return NextResponse.json({
    ok: true,
    baseId: process.env.AIRTABLE_BASE_ID || 'appv0Yo...',
    expectedTables: ['Portal Form Submissions','amanda_waitlist','Creative Studio','Client Records'],
    message: 'If this endpoint loads, API routes work. Wire Airtable check here later.',
    timestamp: new Date().toISOString()
  });
}
