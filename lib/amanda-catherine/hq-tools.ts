import { get } from '@vercel/blob';

export type AmandaHqTools = { waitlistLetter?: string; registerLetter?: string; testPayment?: boolean };

export async function getAmandaHqTools(): Promise<AmandaHqTools> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return {};
  try {
    const blob = await get('data/content/amanda-catherine/hq-tools.json', { access: 'private', useCache: false });
    if (!blob || blob.statusCode !== 200) return {};
    const value = JSON.parse(await new Response(blob.stream).text()) as Record<string, unknown>;
    return {
      waitlistLetter: typeof value.waitlistLetter === 'string' ? value.waitlistLetter : '',
      registerLetter: typeof value.registerLetter === 'string' ? value.registerLetter : '',
      testPayment: value.testPayment === true,
    };
  } catch { return {}; }
}
