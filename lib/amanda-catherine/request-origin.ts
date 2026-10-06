import type { NextRequest } from 'next/server';

const PUBLIC_AMANDA_ORIGINS = new Set(['https://amandacatherine.ca', 'https://www.amandacatherine.ca']);

export function isAllowedAmandaOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const parsedOrigin = new URL(origin).origin;
    return parsedOrigin === new URL(request.url).origin || PUBLIC_AMANDA_ORIGINS.has(parsedOrigin);
  } catch {
    return false;
  }
}
