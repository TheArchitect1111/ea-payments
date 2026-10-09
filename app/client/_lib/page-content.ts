import { createHash } from 'node:crypto';
import { get } from '@vercel/blob';

export type PageContent = { title: string; hero: string; content: string; links: string };

export async function getPageContent(path: string): Promise<PageContent | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const digest = createHash('sha256').update(path).digest('hex').slice(0, 24);
  const pathname = 'data/hq-page-edits/' + digest + '.json';
  try {
    const file = await get(pathname, { access: 'private', useCache: false });
    if (!file || file.statusCode !== 200) return null;
    const value = JSON.parse(await new Response(file.stream).text()) as Record<string, unknown>;
    return {
      title: typeof value.title === 'string' ? value.title : '',
      hero: typeof value.hero === 'string' ? value.hero : '',
      content: typeof value.content === 'string' ? value.content : '',
      links: typeof value.links === 'string' ? value.links : '',
    };
  } catch { return null; }
}
