import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
function handler(req: NextRequest) {
  const url = req.nextUrl;
  const courseId = url.searchParams.get('product') || 'wood-therapy-training';
  const courseKey = url.searchParams.get('key') || courseId;
  const email = url.searchParams.get('email') || 'brickmail1@gmail.com';
  const origin = url.origin;
  // ALWAYS land on the premium workflow, $1 paid
  const successUrl = `${origin}/amanda-catherine/enroll/${courseId}?test=1&success=true&paid=1&email=${encodeURIComponent(email)}&amount=100&currency=CAD&workflow=premium&key=${encodeURIComponent(courseKey)}`;
  return NextResponse.redirect(successUrl, 303);
}
export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
