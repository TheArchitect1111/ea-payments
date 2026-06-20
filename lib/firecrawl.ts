export interface ScrapedPage {
  url: string;
  title: string;
  description?: string;
  markdown: string;
  metadata?: Record<string, string>;
  source: 'firecrawl' | 'fallback';
}

export async function scrapeUrl(url: string): Promise<ScrapedPage> {
  const normalized = url.trim();
  if (!normalized.startsWith('http')) {
    throw new Error('URL must start with http:// or https://');
  }

  const firecrawl = await scrapeWithFirecrawl(normalized);
  if (firecrawl) return firecrawl;

  return scrapeWithFallback(normalized);
}

async function scrapeWithFirecrawl(url: string): Promise<ScrapedPage | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      console.error('Firecrawl scrape failed:', await res.text());
      return null;
    }

    const data = (await res.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        metadata?: Record<string, string>;
      };
    };

    if (!data.success || !data.data) return null;

    const meta = data.data.metadata ?? {};
    return {
      url,
      title: meta.title || meta.ogTitle || new URL(url).hostname,
      description: meta.description || meta.ogDescription,
      markdown: (data.data.markdown ?? '').slice(0, 12000),
      metadata: meta,
      source: 'firecrawl',
    };
  } catch (err) {
    console.error('Firecrawl error:', err);
    return null;
  }
}

async function scrapeWithFallback(url: string): Promise<ScrapedPage> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'EA-Capture-Engine/2.0 (+https://efficiencyarchitects.online)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Could not fetch page (${res.status}).`);
  }

  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch =
    html.match(/name=["']description["']\s+content=["']([^"']+)["']/i) ??
    html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);

  return {
    url,
    title: titleMatch?.[1]?.trim() || new URL(url).hostname,
    description: descMatch?.[1]?.trim(),
    markdown: text,
    source: 'fallback',
  };
}
