// TB3 only: verified film release assets. Build/browser gates run separately.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

function certifyTB3() {
  const read = (p) => fs.readFileSync(p, 'utf8');
  const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
  const publicPage = read('app/tarris/page.tsx');
  const hq = read('app/tarris/future/page.tsx');
  const agreement = read('app/tarris/future/agreement/page.tsx');
  const sign = read('app/tarris/future/sign/page.tsx');
  assert.equal(hash(sign), 'f1ac77bd9a1534309e0dd73e01713c40d3ab441b693ee515f8572eca69be1e9b', 'Signing/payment source changed');
  const originalAgreement = agreement.replace('import Link from "next/link";\n\n', '').replace(/^.*<Link href="\/tarris\/future\/sign".*\n/m, '');
  assert.equal(hash(originalAgreement), 'a4f8db9059a69f61803321fa0452892f4e5458061aba04b79f59708ac3b11cc6', 'Actual agreement content changed');
  const source = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const link = (s, target) => assert.ok(source(s).includes(`<Link href="${target}"`), `Missing functional link to ${target}`);
  link(publicPage, '/tarris/future');
  link(hq, '/tarris/future/agreement');
  link(agreement, '/tarris/future/sign');
  link(sign, '/tarris/future/agreement');
  for (const marker of ['TB3 HQ', 'MORE THAN A GAME', 'PLAN. PREPARE. PERFORM. BUILD.', 'DISCIPLINE', 'DETERMINATION', 'DEVELOPMENT', 'DESTINY', 'ACADEMICS', 'TRAINING', 'NIL & BRAND', 'OPPORTUNITIES', 'MEDIA LIBRARY', 'COMMUNITY', 'FEATURED VIDEO', 'MY FOCUS', 'UPCOMING']) assert.ok(hq.includes(marker), `HQ missing ${marker}`);
  const filmSource = read('app/tarris/tb3-film.tsx');
  for (const marker of ['TB3 MEDIA', 'TB3 FILM', '18 PTS 8 REB 3 AST', 'ALABAMA - 111-93', 'UPDATE HUB', 'v2.4 FILM VAULT LIVE']) {
    assert.ok(publicPage.includes(marker) || hq.includes(marker), `TB3 release missing ${marker}`);
  }
  const officialAssets = new Set();
  for (const content of [publicPage, hq]) {
    for (const match of content.matchAll(/OFFICIAL_[A-Za-z0-9_.-]+\.png/g)) officialAssets.add(match[0]);
  }
  assert.ok(officialAssets.size >= 15, 'TB3 official image set incomplete');
  for (const filename of officialAssets) assert.ok(fs.existsSync(path.join('public/images/tb3-official', filename)), `Missing TB3 official image ${filename}`);
  const merchAssets = new Set();
  for (const match of publicPage.matchAll(/(?:image|redImage): "([A-Za-z0-9_.-]+\.(?:jpg|png|webp))"/g)) merchAssets.add(match[1]);
  assert.ok(merchAssets.size >= 9, 'TB3 merch image set incomplete');
  for (const filename of merchAssets) assert.ok(fs.existsSync(path.join('public/merch', filename)), `Missing TB3 merch image ${filename}`);
  const videos = [...filmSource.matchAll(/filename: "(TB3-FILM-[A-Za-z0-9_-]+\.mp4)"/g)].map((match) => match[1]);
  assert.equal(videos.length, 4, 'TB3 release must contain four playable MP4s and one scoreboard photograph');
  const videoHashes = videos.map((filename) => {
    const videoPath = path.join('public/videos/tb3-film', filename);
    assert.ok(fs.existsSync(videoPath), `Missing TB3 video ${filename}`);
    return crypto.createHash('sha256').update(fs.readFileSync(videoPath)).digest('hex');
  });
  assert.equal(new Set(videoHashes).size, 4, 'TB3 video files must have four distinct hashes');
  const posters = [...filmSource.matchAll(/poster: "(\/videos\/tb3-film\/[^"]+)"/g)].map((match) => match[1].slice('/videos/tb3-film/'.length));
  for (const filename of new Set([...posters, 'TB3-FILM-005-SCOREBOARD-PROOF.jpg', 'TB3-FILM-005-poster.webp'])) {
    assert.ok(fs.existsSync(path.join('public/videos/tb3-film', filename)), `Missing TB3 film poster ${filename}`);
  }
  assert.ok(filmSource.includes('TB3-FILM-005-SCOREBOARD-PROOF.jpg'), 'Scoreboard proof photo missing');
  for (const marker of ['#F7F5F2', '#A51C30', 'TB3 FILM', 'TB3 STORE', 'MORE THAN A GAME']) {
    assert.ok(publicPage.includes(marker), `Public page missing ${marker}`);
  }
  const config = JSON.parse(read('vercel.json'));
  assert.ok(Array.isArray(config.crons) && config.crons.length > 0, 'Existing crons missing');
  const built = JSON.parse(read('.next/routes-manifest.json'));
  for (const host of ['tb3.online', 'www.tb3.online']) {
    assert.ok(built.rewrites.beforeFiles.some(r => r.source === '/' && r.destination === '/tarris' && r.has?.some(h => h.type === 'host' && h.value === host)), `Missing effective light homepage rewrite for ${host}`);
    assert.ok(!built.rewrites.beforeFiles.some(r => r.source === '/' && r.destination === '/tarris/future' && r.has?.some(h => h.type === 'host' && h.value === host)), `Conflicting effective HQ homepage rule for ${host}`);
  }
  assert.ok(built.rewrites.beforeFiles.some(r => r.source === '/hq/:path*' && r.destination === '/tarris/future/:path*'), 'Missing effective HQ rewrite');
  assert.ok(config.rewrites.some(r => r.source === '/hq/:path*' && r.destination === '/tarris/future/:path*'), 'Missing HQ rewrite');
  assert.ok(!fs.existsSync('app/tarris/future/page.js'), 'Duplicate portal page.js');
  return { status: 'PASS', profile: 'tb3-film-release', videos, videoHashes, posters, officialImages: [...officialAssets], merchImages: [...merchAssets], signingPreserved: true, agreementPreserved: true };
}

module.exports = { certifyTB3 };
if (require.main === module) {
  try {
    certifyTB3();
    console.log('✅ CERTIFICATION PASS - TB3 film release assets accepted');
    console.log('Routes: OK | Agreement: preserved | Signing: preserved | Four distinct film videos and scoreboard proof assets verified');
    console.log('Production promotion also requires build and desktop/mobile browser gates.');
  } catch (error) {
    console.error(`CERTIFICATION FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
