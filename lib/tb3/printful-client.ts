import 'server-only';

export const TB3_PRINTFUL_STORE_ID = 18945233;

export class PrintfulError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'PrintfulError';
  }
}

export async function tb3Printful<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    throw new PrintfulError(400, 'Invalid Printful API path.');
  }
  const key = process.env.PRINTFUL_API_KEY?.trim();
  if (!key) throw new PrintfulError(503, 'Merchandise connection unavailable.');

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('X-PF-Store-Id', String(TB3_PRINTFUL_STORE_ID));
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`https://api.printful.com${path}`, {
    ...init,
    headers,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });

  const payload = await response.json().catch(() => null) as
    { code?: number; result?: T } | null;

  if (!response.ok || !payload || payload.code !== 200 ||
      !Object.prototype.hasOwnProperty.call(payload, 'result')) {
    throw new PrintfulError(
      response.status >= 400 ? response.status : 502,
      'Printful request failed. No successful change was confirmed.',
    );
  }

  return payload.result as T;
}
