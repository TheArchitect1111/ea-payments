import { copy, get, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TARGETS = [
  {
    key: 'reset-training-manual',
    pathname: 'AesthetiKine 1-Day Nervous System Reset Manual.pdf',
    terms: ['aesthetikine', 'reset', 'manual'],
    alternates: ['nervous', 'system', 'training'],
  },
  {
    key: 'body-sculpt-certification-overview',
    pathname: 'AesthetiKine_Body_Sculpt_Certification_Overview.pdf',
    terms: ['aesthetikine', 'body', 'sculpt'],
    alternates: ['certification', 'overview'],
  },
] as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function exists(pathname: string) {
  try {
    const result = await get(pathname, { access: 'private' });
    return Boolean(result && result.statusCode === 200);
  } catch {
    return false;
  }
}

export async function GET() {
  const allBlobs: Array<{ pathname: string; url: string }> = [];
  let cursor: string | undefined;

  do {
    const page = await list({ cursor, limit: 1000 });
    allBlobs.push(...page.blobs.map((blob) => ({ pathname: blob.pathname, url: blob.url })));
    cursor = page.cursor;
  } while (cursor);

  const results: Record<string, { alreadyPresent: boolean; candidateFound: boolean; repaired: boolean }> = {};

  for (const target of TARGETS) {
    const alreadyPresent = await exists(target.pathname);
    if (alreadyPresent) {
      results[target.key] = { alreadyPresent: true, candidateFound: true, repaired: true };
      continue;
    }

    const targetNorm = normalize(target.pathname);
    const ranked = allBlobs
      .map((blob) => {
        const norm = normalize(blob.pathname);
        let score = 0;
        if (norm === targetNorm) score += 100;
        for (const term of target.terms) if (norm.includes(term)) score += 10;
        for (const term of target.alternates) if (norm.includes(term)) score += 4;
        if (norm.endsWith('pdf')) score += 2;
        return { blob, score };
      })
      .filter(({ score }) => score >= 22)
      .sort((a, b) => b.score - a.score);

    const candidate = ranked[0]?.blob;
    if (!candidate) {
      results[target.key] = { alreadyPresent: false, candidateFound: false, repaired: false };
      continue;
    }

    try {
      await copy(candidate.url, target.pathname, {
        access: 'private',
        allowOverwrite: false,
        contentType: 'application/pdf',
      });
      results[target.key] = {
        alreadyPresent: false,
        candidateFound: true,
        repaired: await exists(target.pathname),
      };
    } catch {
      results[target.key] = { alreadyPresent: false, candidateFound: true, repaired: false };
    }
  }

  const ok = Object.values(results).every((result) => result.repaired);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 404 });
}
