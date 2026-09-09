import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    environment: process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || null,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
