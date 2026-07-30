/**
 * Fail if Next.js NFT traces include Crawl4AI / Chromium / research-worker paths.
 * Run after next build (optional companion to check-server-function-trace-size.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FORBIDDEN = [
  /services[\\/]+uxg-research-worker/i,
  /crawl4ai/i,
  /playwright-core/i,
  /[\\/]chromium[\\/]/i,
  /puppeteer/i,
];

function walkNft(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkNft(full, out);
    else if (ent.name.endsWith('.nft.json')) out.push(full);
  }
  return out;
}

const nfts = walkNft(path.join(ROOT, '.next', 'server'));
const hits = [];

for (const nft of nfts) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(nft, 'utf8'));
  } catch {
    continue;
  }
  for (const rel of data.files || []) {
    const s = String(rel);
    for (const re of FORBIDDEN) {
      if (re.test(s)) {
        hits.push({ nft: path.relative(ROOT, nft), file: s, rule: String(re) });
      }
    }
  }
}

console.log(
  JSON.stringify(
    {
      nftFilesScanned: nfts.length,
      crawlerDependencyHits: hits.length,
      hits: hits.slice(0, 40),
      ok: hits.length === 0,
    },
    null,
    2,
  ),
);

if (hits.length) {
  console.error('Crawler/browser dependencies must not appear in Vercel function traces.');
  process.exit(1);
}
