// TB3 only: approved placeholder release. Build/browser gates run separately.
const fs = require('node:fs');
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
  const allowed = ['YOUR_HQ_HEADER.jpg', 'YOUR_BRAND_SMILE.jpg', 'YOUR_COMMUNITY.jpg', 'YOUR_ENTERPRISE_SUIT.jpg'];
  const placeholders = [];
  for (const [name, content] of [['public', publicPage], ['hq', hq]]) {
    assert.ok(content.includes('NO IMAGES BUNDLED') && content.includes('Replace:'), `${name}: placeholder approval markers missing`);
    assert.ok(!/<(?:img|Image)\b|backgroundImage\s*[:=]|url\(/.test(source(content)), `${name}: real image rendering requires separate asset certification`);
    for (const match of content.matchAll(/\/images\/tarris\/([A-Za-z0-9_.-]+)/g)) {
      assert.ok(allowed.includes(match[1]), `Unapproved placeholder ${match[1]}`);
      placeholders.push(match[1]);
    }
  }
  for (const filename of allowed) assert.ok(placeholders.includes(filename), `Missing approved placeholder ${filename}`);
  for (const marker of ['#F7F5F2', '#A51C30', 'SLOT_TB3_MASK', 'SLOT_HERO_HOODIE', 'TB3 STORE', 'MORE THAN A GAME']) {
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
  return { status: 'PASS', profile: 'tb3-approved-placeholders', placeholders, signingPreserved: true, agreementPreserved: true };
}

module.exports = { certifyTB3 };
if (require.main === module) {
  try {
    certifyTB3();
    console.log('✅ CERTIFICATION PASS - Approved placeholder release accepted');
    console.log('Routes: OK | Agreement: preserved | Signing: preserved/moved | Layout markers: OK | Images: approved placeholders');
    console.log('Production promotion also requires build and desktop/mobile browser gates.');
  } catch (error) {
    console.error(`CERTIFICATION FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
