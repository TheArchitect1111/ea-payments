import crypto from 'node:crypto';
import { getCaptureApiKey } from '@/lib/capture-api-key';

export function verifyCaptureApiKey(provided: string | null | undefined): boolean {
  const expected = getCaptureApiKey();
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const CAPTURE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-EA-Capture-Key',
};
