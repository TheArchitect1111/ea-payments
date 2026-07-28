/**
 * Compose 8 complete Google Play campaign screenshots.
 * Layout matches the Creative Director sample (logo + tagline + headline + photo + footer).
 *
 * Run: node marketing/play-store/compose-play-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 1240;
const H = 2208;
const OUT = path.join(__dirname, 'play-screenshots');
const DESKTOP = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Desktop',
  'Simplifi Play Assets',
  'play-screenshots',
);

function loadSharp() {
  const require = createRequire(import.meta.url);
  for (const c of ['sharp', path.resolve(__dirname, '../../node_modules/sharp'), path.resolve(__dirname, '../../../cpr-site/node_modules/sharp')]) {
    try {
      return require(c);
    } catch {
      /* continue */
    }
  }
  return null;
}

function plateDataUri(p) {
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

const plates = {
  meet: path.join(__dirname, '01-introducing-orbie.png'),
  capture: path.join(__dirname, '02-capture-anything.png'),
  remembers: path.join(__dirname, '05-daily-clarity.png'),
  understands: path.join(__dirname, '03-orbie-understands.png'),
  focusSample: path.join(__dirname, 'reference-sample-focus.png'),
  // fallback if sample missing
  focusPlate: path.join(__dirname, '04-focus-on-what-matters.png'),
  think: path.join(__dirname, '06-ask-orbie.png'),
  smart: path.join(__dirname, '07-smartchitecture.png'),
  finale: path.join(__dirname, '08-one-intelligent-workspace.png'),
};

const screens = [
  {
    id: '01-meet-orbie',
    plate: 'meet',
    headlineHtml: `Meet <span class="orb-word">Orbie</span>.`,
    support: 'Your AI assistant for every opportunity that matters.',
    footer: 'Orbie quietly helps you recognize what matters.',
    photoPos: 'center 35%',
    extra: '',
  },
  {
    id: '02-capture-anything',
    plate: 'capture',
    headlineHtml: `Capture anything.`,
    support: "Ideas don't wait. Now neither do you.",
    footer: 'Stay present. Orbie captures the rest.',
    photoPos: 'center 40%',
    extra: `
      <div class="gestures">
        <div class="gcard">
          <div class="gicon">●</div>
          <div><b>Tap</b><span>Capture instantly</span></div>
        </div>
        <div class="gcard">
          <div class="gicon">●●</div>
          <div><b>Double Tap</b><span>Organize intelligently</span></div>
        </div>
        <div class="gcard">
          <div class="gicon">━</div>
          <div><b>Long Press</b><span>Ask Orbie for deeper insight</span></div>
        </div>
      </div>`,
  },
  {
    id: '03-orbie-remembers',
    plate: 'remembers',
    headlineHtml: `<span class="orb-word">Orbie</span> remembers.`,
    support: 'Never lose another great idea.',
    footer: 'Conversations, names, notes, and links — quietly kept.',
    photoPos: 'center 30%',
    extra: `
      <div class="chips">
        <span>Voice notes</span><span>Names</span><span>Photos</span><span>Links</span><span>Ideas</span>
      </div>`,
  },
  {
    id: '04-orbie-understands',
    plate: 'understands',
    headlineHtml: `<span class="orb-word">Orbie</span> understands.`,
    support: 'See the connections others miss.',
    footer: 'Ideas connect. Relationships emerge. Clarity follows.',
    photoPos: 'center 30%',
    extra: '',
  },
  {
    id: '05-focus-on-what-matters',
    plate: 'focusSample',
    fallbackPlate: 'focusPlate',
    useSampleAsFinal: true,
    headlineHtml: `<span class="if">If</span> <span class="i">I</span> could focus on what matters most...`,
    support: 'Orbie prioritizes for you—so you can spend your energy where it counts.',
    footer: 'Orbie cuts through the noise to show you what truly matters.',
    photoPos: 'center 45%',
    extra: `
      <div class="priority">
        <div class="pcard hot">
          <div class="pleft"><span class="pdot gold">◎</span><div><b>High Value Opportunity</b><em>Partnership Proposal · Est. $125,000</em></div></div>
          <span class="star">★</span>
        </div>
        <div class="pcard">
          <div class="pleft"><span class="pdot blue">◷</span><div><b>Important Follow Up</b><em>Client Check-In · Due Today</em></div></div>
          <span class="star blue">★</span>
        </div>
        <div class="pcard">
          <div class="pleft"><span class="pdot gold">▣</span><div><b>Growth Opportunity</b><em>Market Expansion · Est. $75,000</em></div></div>
          <span class="star gold">★</span>
        </div>
        <div class="pcard fade">
          <div class="pleft"><span class="pdot gray">◷</span><div><b>Nice to Know</b><em>Industry Newsletter</em></div></div>
          <span class="star gray">★</span>
        </div>
      </div>`,
  },
  {
    id: '06-think-with-orbie',
    plate: 'think',
    headlineHtml: `Think with <span class="orb-word">Orbie</span>.`,
    support: 'Your AI thinking partner.',
    footer: 'Trust. Collaboration. Confidence — without the interface noise.',
    photoPos: 'center 35%',
    extra: '',
  },
  {
    id: '07-smartchitecture',
    plate: 'smart',
    headlineHtml: `Powered by <span class="smart">Smartchitecture™</span>`,
    support: 'Everything connected. Nothing forgotten.',
    footer: 'Ideas, people, projects, and goals — one living ecosystem.',
    photoPos: 'center 45%',
    extra: '',
  },
  {
    id: '08-never-lose-an-opportunity',
    plate: 'finale',
    headlineHtml: `Never lose an opportunity again.`,
    support: 'One intelligent workspace for every part of your life.',
    footer: 'I want Orbie with me every day.',
    photoPos: 'center 40%',
    extra: '',
  },
];

function logoHtml() {
  return `<div class="logo" aria-label="Simplifi Orb">
    <span class="simpl">Simpl</span><span class="if">if</span><span class="ii">i</span>
    <span class="orb">Orb</span>
  </div>`;
}

function pageCss() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    html,body{margin:0;padding:0;width:${W}px;height:${H}px;overflow:hidden;background:#FAFBFC;
      font-family:Inter,"SF Pro Display","Segoe UI",system-ui,sans-serif;color:#071D49;}
    .frame{width:${W}px;height:${H}px;position:relative;display:flex;flex-direction:column;
      background:linear-gradient(180deg,#FFFFFF 0%,#FAFBFC 55%,#F4F6F8 100%);}
    .top{padding:72px 72px 0;text-align:center;flex:0 0 auto;z-index:2;}
    .logo{font-size:54px;font-weight:800;letter-spacing:-1.2px;line-height:1;}
    .logo .simpl{color:#071D49}
    .logo .if{color:#D6A72B}
    .logo .ii{color:#2E7BFF}
    .logo .orb{
      background:linear-gradient(110deg,#2E7BFF 0%,#6B4EFF 55%,#8B5CF6 100%);
      -webkit-background-clip:text;background-clip:text;color:transparent;
      margin-left:10px;
    }
    .tag{margin-top:18px;font-size:26px;font-weight:500;color:#5A6578;letter-spacing:0.1px;}
    .headline{margin:44px auto 0;max-width:980px;font-size:68px;font-weight:800;letter-spacing:-1.6px;
      line-height:1.12;color:#071D49;}
    .headline .if{color:#D6A72B}
    .headline .i{color:#2E7BFF}
    .headline .orb-word{color:#6B4EFF}
    .headline .smart{color:#071D49}
    .support{margin:22px auto 0;max-width:860px;font-size:30px;font-weight:500;line-height:1.4;color:#3D4A5F;}
    .support .orb-word{color:#6B4EFF;font-weight:700}
    .photo-wrap{position:relative;margin:36px 48px 0;flex:1 1 auto;min-height:0;
      border-radius:36px;overflow:hidden;
      box-shadow:0 28px 80px rgba(7,29,73,0.10);}
    .photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:VARPOS;}
    .photo-fade{position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,rgba(255,255,255,0) 12%,rgba(255,255,255,0) 70%,rgba(250,251,252,0.55) 100%);}
    .overlay-ui{position:absolute;left:48px;right:48px;bottom:48px;z-index:3;}
    .gestures{display:flex;flex-direction:column;gap:14px;}
    .gcard{display:flex;align-items:center;gap:18px;background:rgba(255,255,255,0.94);
      border:1px solid rgba(7,29,73,0.08);border-radius:22px;padding:20px 24px;
      box-shadow:0 12px 36px rgba(7,29,73,0.10);backdrop-filter:blur(10px);}
    .gicon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#2E7BFF,#6B4EFF);
      color:#fff;display:grid;place-items:center;font-size:18px;font-weight:800;flex-shrink:0;}
    .gcard b{display:block;font-size:26px;color:#071D49}
    .gcard span{display:block;font-size:22px;color:#5A6578;margin-top:2px}
    .chips{display:flex;flex-wrap:wrap;gap:12px;}
    .chips span{background:rgba(255,255,255,0.94);border:1px solid rgba(7,29,73,0.08);
      border-radius:999px;padding:14px 22px;font-size:22px;font-weight:600;color:#071D49;
      box-shadow:0 8px 24px rgba(7,29,73,0.08);}
    .priority{display:flex;flex-direction:column;gap:12px;}
    .pcard{display:flex;align-items:center;justify-content:space-between;gap:16px;
      background:rgba(255,255,255,0.95);border:1.5px solid rgba(7,29,73,0.08);
      border-radius:20px;padding:18px 22px;box-shadow:0 10px 30px rgba(7,29,73,0.10);}
    .pcard.hot{border-color:#D6A72B;box-shadow:0 10px 30px rgba(214,167,43,0.22);}
    .pcard.fade{opacity:0.55}
    .pleft{display:flex;align-items:center;gap:14px;min-width:0;}
    .pdot{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:20px;flex-shrink:0;}
    .pdot.gold{background:rgba(214,167,43,0.18);color:#D6A72B}
    .pdot.blue{background:rgba(46,123,255,0.15);color:#2E7BFF}
    .pdot.gray{background:#EEF2F7;color:#94A3B8}
    .pcard b{display:block;font-size:24px;color:#071D49;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .pcard em{display:block;font-style:normal;font-size:20px;color:#5A6578;margin-top:2px;}
    .star{font-size:26px;color:#6B4EFF}
    .star.blue{color:#2E7BFF}.star.gold{color:#D6A72B}.star.gray{color:#94A3B8}
    .bottom{padding:28px 72px 56px;text-align:center;z-index:2;flex:0 0 auto;}
    .footer{display:inline-flex;align-items:center;gap:12px;font-size:26px;font-weight:600;color:#3D4A5F;}
    .footer .badge{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6B4EFF,#2E7BFF);
      color:#fff;display:grid;place-items:center;font-size:14px;}
    .footer .orb-word{color:#6B4EFF;font-weight:800}
  `;
}

function buildHtml(screen, platePath) {
  const css = pageCss().replace('VARPOS', screen.photoPos);
  const src = plateDataUri(platePath);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="frame">
    <div class="top">
      ${logoHtml()}
      <div class="tag">Your AI assistant for opportunities that matter.</div>
      <div class="headline">${screen.headlineHtml}</div>
      <div class="support">${screen.support.replace(/Orbie/g, '<span class="orb-word">Orbie</span>')}</div>
    </div>
    <div class="photo-wrap">
      <img class="photo" src="${src}" alt="" />
      <div class="photo-fade"></div>
      ${screen.extra ? `<div class="overlay-ui">${screen.extra}</div>` : ''}
    </div>
    <div class="bottom">
      <div class="footer"><span class="badge">★</span><span>${screen.footer.replace(/Orbie/g, '<span class="orb-word">Orbie</span>')}</span></div>
    </div>
  </div>
  </body></html>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(DESKTOP, { recursive: true });
  const sharp = loadSharp();

  // Ensure sample reference exists
  const sampleCandidates = [
    plates.focusSample,
    path.join(
      process.env.USERPROFILE || '',
      '.cursor',
      'projects',
      'c-Users-brick-ea-launch-audit-ea-payments',
      'assets',
      'c__Users_brick_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_Jul_21__2026__09_43_51_PM-ed0f574c-4e74-4dc5-a444-405be3a47bcd.png',
    ),
  ];
  for (const c of sampleCandidates) {
    if (fs.existsSync(c) && c !== plates.focusSample) {
      fs.copyFileSync(c, plates.focusSample);
      break;
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const screen of screens) {
    const outName = `${screen.id}.png`;
    const outPath = path.join(OUT, outName);

    // Screenshot 05: prefer the ChatGPT sample as the finished art if present
    if (screen.useSampleAsFinal && fs.existsSync(plates.focusSample)) {
      if (sharp) {
        await sharp(plates.focusSample).resize(W, H, { fit: 'cover', position: 'centre' }).png().toFile(outPath);
      } else {
        fs.copyFileSync(plates.focusSample, outPath);
      }
      fs.copyFileSync(outPath, path.join(DESKTOP, outName));
      console.log('wrote sample-based', outName);
      continue;
    }

    let platePath = plates[screen.plate];
    if (!fs.existsSync(platePath) && screen.fallbackPlate) platePath = plates[screen.fallbackPlate];
    if (!fs.existsSync(platePath)) {
      console.error('Missing plate for', screen.id, platePath);
      continue;
    }

    await page.setViewportSize({ width: W, height: H });
    await page.setContent(buildHtml(screen, platePath), { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: outPath, type: 'png' });

    if (sharp) {
      const m = await sharp(outPath).metadata();
      if (m.width !== W || m.height !== H) {
        await sharp(outPath).resize(W, H, { fit: 'fill' }).png().toFile(outPath + '.tmp');
        fs.renameSync(outPath + '.tmp', outPath);
      }
    }
    fs.copyFileSync(outPath, path.join(DESKTOP, outName));
    console.log('wrote', outName);
  }

  await browser.close();
  console.log('OUT', OUT);
  console.log('DESKTOP', DESKTOP);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
