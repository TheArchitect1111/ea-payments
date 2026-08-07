/**
 * Fail CI/local build when a traced Next.js server function approaches Vercel's
 * 250MB uncompressed limit (capability-marketplace historically hit ~530MB).
 *
 * Run after `next build`:
 *   node scripts/check-server-function-trace-size.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WARN_MB = 80;
const FAIL_MB = 200;
const TARGETS = ['admin/capability-marketplace', 'admin/master'];

function resolveNft(route) {
  const candidates = [
    path.join(ROOT, '.next/server/app', route, 'page.js.nft.json'),
    path.join(ROOT, '.next/server/app', route, 'route.js.nft.json'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function traceSizeBytes(nftPath) {
  const data = JSON.parse(fs.readFileSync(nftPath, 'utf8'));
  const base = path.dirname(nftPath);
  let total = 0;
  const largest = [];
  for (const rel of data.files || []) {
    const abs = path.isAbsolute(rel) ? rel : path.normalize(path.join(base, rel));
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    const size = fs.statSync(abs).size;
    total += size;
    largest.push({ abs, size });
  }
  largest.sort((a, b) => b.size - a.size);
  return { total, largest: largest.slice(0, 15) };
}

function mb(n) {
  return Number((n / (1024 * 1024)).toFixed(1));
}

let failed = false;
const report = [];

for (const route of TARGETS) {
  const nft = resolveNft(route);
  if (!nft) {
    report.push({ route, status: 'missing-nft', mb: null });
    continue;
  }
  const { total, largest } = traceSizeBytes(nft);
  const sizeMb = total / (1024 * 1024);
  let status = 'ok';
  if (sizeMb >= FAIL_MB) {
    status = 'fail';
    failed = true;
  } else if (sizeMb >= WARN_MB) {
    status = 'warn';
  }
  report.push({
    route,
    status,
    mb: mb(total),
    nft: path.relative(ROOT, nft),
    top: largest.map((row) => ({
      mb: mb(row.size),
      file: path.relative(ROOT, row.abs),
    })),
  });
}

console.log(JSON.stringify({ warnMb: WARN_MB, failMb: FAIL_MB, report }, null, 2));

if (failed) {
  console.error(
    `Server function trace exceeds ${FAIL_MB}MB (Vercel limit 250MB). Shrink imports / tracing excludes.`,
  );
  process.exit(1);
}
