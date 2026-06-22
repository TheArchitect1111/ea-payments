export function verifyCaptureApiKey(provided: string | null | undefined): boolean {
  const expected = process.env.EA_CAPTURE_API_KEY;
  if (!expected || !provided) return false;
  return provided === expected;
}

export const CAPTURE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-EA-Capture-Key',
};
