/**
 * Crawl4AI adoption gate — measure existing EA research stack first.
 * Decision: DEFER unless this benchmark shows material failure.
 *
 * Run: npx --yes tsx scripts/ece-crawl4ai-benchmark.ts
 */
import { scrapeUrl } from '../lib/firecrawl';

const SUBJECT_URLS: Array<{ subject: string; urls: string[] }> = [
  {
    subject: 'Robert Brickey',
    urls: [
      'https://efficiencyarchitects.online',
      'https://en.wikipedia.org/wiki/Duke_Blue_Devils_men%27s_basketball',
    ],
  },
  {
    subject: 'Brickey Botanicals',
    urls: ['https://efficiencyarchitects.online'],
  },
  {
    subject: 'Ascension Circle',
    urls: ['https://efficiencyarchitects.online'],
  },
];

type Row = {
  subject: string;
  url: string;
  ok: boolean;
  chars: number;
  title: string;
  source: string;
  error?: string;
};

async function main() {
  const rows: Row[] = [];
  for (const subject of SUBJECT_URLS) {
    for (const url of subject.urls) {
      try {
        const page = await scrapeUrl(url);
        rows.push({
          subject: subject.subject,
          url,
          ok: page.markdown.length >= 200,
          chars: page.markdown.length,
          title: page.title,
          source: page.source,
        });
      } catch (err) {
        rows.push({
          subject: subject.subject,
          url,
          ok: false,
          chars: 0,
          title: '',
          source: 'error',
          error: err instanceof Error ? err.message : 'error',
        });
      }
    }
  }

  const failures = rows.filter((r) => !r.ok);
  const decision =
    failures.length === 0
      ? 'DEFER_CRAWL4AI'
      : failures.length / rows.length > 0.5
        ? 'RECONSIDER_CRAWL4AI'
        : 'DEFER_CRAWL4AI_WITH_GAPS';

  console.log(
    JSON.stringify(
      {
        decision,
        rationale:
          decision === 'DEFER_CRAWL4AI'
            ? 'Existing Firecrawl/HTML scrape extracted usable text for sampled URLs; Crawl4AI deferred (Python/Playwright ops burden).'
            : 'Some scrapes failed — investigate Firecrawl/native path before adopting Crawl4AI sidecar.',
        crawl4aiRepo: 'https://github.com/unclecode/crawl4ai',
        license: 'Apache-2.0 with attribution obligation',
        rows,
      },
      null,
      2,
    ),
  );
}

void main();
