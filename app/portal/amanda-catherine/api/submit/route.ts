import type { NextRequest } from 'next/server';
import { GET as getSubmit, POST as postSubmit } from '@/app/api/amanda-catherine/submit/route';

export async function GET() {
  return getSubmit();
}

export async function POST(request: NextRequest) {
  return postSubmit(request);
}
