/**
 * Simplifi Orb — Google Play asset generator
 * Produces exact-dimension PNGs + listing copy under docs/google-play/
 *
 * Run from repo root:
 *   node docs/google-play/generate-assets.mjs
 * Requires: playwright (npx will download chromium if needed)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const NAVY = '#1B2B4D';
const NAVY_DEEP = '#0B1224';
const GOLD = '#C9A844';
const CREAM = '#FAF8F3';
const WHITE = '#FFFFFF';
const MUTED = '#8A93A3';

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

/** Try sharp from several locations; fall back to null. */
function loadSharp() {
  const require = createRequire(import.meta.url);
  const candidates = [
    'sharp',
    path.resolve(__dirname, '../../node_modules/sharp'),
    path.resolve(__dirname, '../../mobile/node_modules/sharp'),
    path.resolve(__dirname, '../../../cpr-site/node_modules/sharp'),
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* continue */
    }
  }
  return null;
}

const phoneChrome = `
  .phone {
    width: 1080px;
    height: 2400px;
    background: ${CREAM};
    font-family: Inter, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
    color: ${NAVY};
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }
  .status {
    height: 88px;
    padding: 28px 48px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28px;
    font-weight: 700;
    color: ${NAVY};
  }
  .nav {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 160px;
    background: ${WHITE};
    border-top: 1px solid #E8EDF5;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding-bottom: 28px;
  }
  .nav .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-size: 22px;
    font-weight: 700;
    color: ${MUTED};
  }
  .nav .item.on { color: ${NAVY}; }
  .nav .dot {
    width: 44px; height: 44px; border-radius: 22px;
    background: #EEF2F7; display: grid; place-items: center;
    font-size: 22px;
  }
  .nav .item.on .dot { background: ${NAVY}; color: ${WHITE}; }
  .content { padding: 0 40px 200px; }
  .pill {
    display: inline-flex; align-items: center; gap: 10px;
    background: ${NAVY}; color: ${WHITE}; font-weight: 700;
    font-size: 26px; padding: 18px 28px; border-radius: 999px;
  }
  .card {
    background: ${WHITE};
    border: 1px solid #E8EDF5;
    border-radius: 28px;
    padding: 32px;
    margin-top: 28px;
    box-shadow: 0 12px 40px rgba(27,43,77,0.06);
  }
  .kicker {
    font-size: 22px; font-weight: 800; letter-spacing: 2px;
    color: ${GOLD}; text-transform: uppercase; margin-bottom: 12px;
  }
  .h1 { font-size: 56px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
  .h2 { font-size: 34px; font-weight: 800; }
  .muted { color: #5F6B7A; font-size: 26px; line-height: 1.45; }
  .row {
    display: flex; gap: 20px; align-items: flex-start;
    padding: 22px 0; border-top: 1px solid #EEF2F7;
  }
  .icon {
    width: 64px; height: 64px; border-radius: 32px;
    display: grid; place-items: center; color: ${WHITE};
    font-size: 28px; flex-shrink: 0;
  }
  .title { font-size: 30px; font-weight: 700; }
  .detail { font-size: 24px; color: #5F6B7A; margin-top: 6px; line-height: 1.35; }
  .input {
    background: ${WHITE}; border: 1.5px solid #D5DCE8; border-radius: 18px;
    padding: 26px 28px; font-size: 28px; color: ${NAVY}; margin-top: 16px;
  }
  .input.placeholder { color: #9AA3B2; }
  .btn-gold {
    background: ${GOLD}; color: ${NAVY}; font-weight: 800; font-size: 28px;
    text-align: center; padding: 28px; border-radius: 18px; margin-top: 24px;
  }
  .btn-navy {
    background: ${NAVY}; color: ${WHITE}; font-weight: 800; font-size: 28px;
    text-align: center; padding: 28px; border-radius: 18px; margin-top: 16px;
  }
  .hero {
    margin: 0 -40px; padding: 36px 40px 48px;
    background: linear-gradient(180deg, #D9E4F4 0%, ${CREAM} 100%);
    position: relative; overflow: hidden;
  }
  .hero::after {
    content: ''; position: absolute; top: -60px; right: -40px;
    width: 280px; height: 280px; border-radius: 50%;
    background: rgba(201,168,68,0.28);
  }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: 4px; position: relative; z-index: 1; }
  .dark {
    background: radial-gradient(120% 80% at 70% 10%, #24365f 0%, ${NAVY_DEEP} 55%, #070b14 100%);
    color: ${WHITE};
  }
  .dark .card {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.10);
    box-shadow: none;
  }
  .dark .muted { color: ${MUTED}; }
  .dark .title { color: ${WHITE}; }
  .dark .detail { color: ${MUTED}; }
  .dark .input {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.14);
    color: ${WHITE};
  }
  .orb {
    width: 96px; height: 96px; border-radius: 50%;
    border: 3px solid ${GOLD};
    box-shadow: 0 0 40px rgba(201,168,68,0.55), inset 0 0 24px rgba(201,168,68,0.25);
    display: grid; place-items: center;
    font-size: 44px; font-weight: 800; color: ${WHITE};
    background: radial-gradient(circle at 35% 30%, #3a527f, ${NAVY});
  }
  .bubble {
    max-width: 82%; padding: 22px 26px; border-radius: 22px;
    font-size: 26px; line-height: 1.4; margin-top: 18px;
  }
  .bubble.ai {
    background: rgba(201,168,68,0.14);
    border: 1px solid rgba(201,168,68,0.35);
    color: #F4E8C0;
  }
  .bubble.user {
    margin-left: auto;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.12);
  }
  .chip {
    display: inline-flex; padding: 10px 18px; border-radius: 999px;
    background: rgba(201,168,68,0.18); color: ${GOLD};
    font-size: 22px; font-weight: 700; margin-right: 10px; margin-top: 10px;
  }
  .caption {
    position: absolute; left: 40px; right: 40px; bottom: 200px;
    text-align: center; font-size: 34px; font-weight: 800;
    color: ${NAVY}; background: rgba(250,248,243,0.92);
    border: 1px solid #E8EDF5; border-radius: 20px; padding: 22px 24px;
  }
  .dark .caption {
    color: ${WHITE};
    background: rgba(11,18,36,0.85);
    border-color: rgba(255,255,255,0.12);
  }
`;

function navHtml(active) {
  const items = [
    ['Home', '⌂', 'home'],
    ['Capture', '+', 'capture'],
    ['Workspace', '◇', 'workspace'],
    ['Settings', '⚙', 'settings'],
  ];
  return `<div class="nav">${items
    .map(
      ([label, icon, key]) =>
        `<div class="item${key === active ? ' on' : ''}"><div class="dot">${icon}</div>${label}</div>`,
    )
    .join('')}</div>`;
}

const screens = {
  'screenshot-01': {
    title: 'Home dashboard',
    html: `<div class="phone">
      <div class="status"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content">
        <div class="hero">
          <div class="brand">SIMPLIFI</div>
          <div style="margin-top:48px;position:relative;z-index:1" class="h1">Good morning</div>
          <div class="muted" style="margin-top:14px;position:relative;z-index:1">Tuesday, July 21</div>
          <div style="margin-top:18px;font-size:28px;font-weight:600;color:#3D4A5F;position:relative;z-index:1">What deserves your attention?</div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="kicker" style="margin:0;color:${NAVY}">TODAY'S BRIEF</div>
            <div style="color:#3B82F6;font-weight:700;font-size:26px">View all</div>
          </div>
          <div class="row">
            <div class="icon" style="background:#C9A844">★</div>
            <div><div class="title">Harbor Logistics — warm intro</div><div class="detail">Follow up today · High priority</div></div>
          </div>
          <div class="row">
            <div class="icon" style="background:#3B82F6">📄</div>
            <div><div class="title">Proposal draft ready</div><div class="detail">River Atelier discovery notes</div></div>
          </div>
          <div class="row">
            <div class="icon" style="background:#0EA5E9">⏱</div>
            <div><div class="title">2 reminders due</div><div class="detail">Coach call · Contract review</div></div>
          </div>
        </div>
        <div class="card">
          <div class="kicker" style="color:${NAVY}">RECENT OPPORTUNITIES</div>
          <div class="row">
            <div class="icon" style="background:#1B2B4D">HL</div>
            <div style="flex:1"><div class="title">Harbor Logistics</div><div class="detail">Active · Next: send Brief</div></div>
            <div style="color:#9CA3AF;font-size:32px">›</div>
          </div>
          <div class="row">
            <div class="icon" style="background:#334155">RA</div>
            <div style="flex:1"><div class="title">River Atelier</div><div class="detail">Proposal · Awaiting reply</div></div>
            <div style="color:#9CA3AF;font-size:32px">›</div>
          </div>
        </div>
      </div>
      ${navHtml('home')}
    </div>`,
  },
  'screenshot-02': {
    title: 'Orb conversation',
    html: `<div class="phone dark">
      <div class="status" style="color:#fff"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px">
          <div class="orb">S</div>
          <div>
            <div style="font-size:36px;font-weight:800">Orb</div>
            <div class="muted" style="font-size:24px">Your AI opportunity assistant</div>
          </div>
        </div>
        <div class="bubble ai">I reviewed today’s captures. Harbor Logistics looks ready for a warm intro — want a 3-bullet Brief?</div>
        <div class="bubble user">Yes — prioritize follow-ups before noon.</div>
        <div class="bubble ai">Done. I ranked 4 items by urgency and drafted talking points for the Harbor call. Open Daily Brief?</div>
        <div style="margin-top:28px">
          <span class="chip">Draft Brief</span>
          <span class="chip">Set reminder</span>
          <span class="chip">Open Workspace</span>
        </div>
        <div class="input placeholder" style="margin-top:40px">Ask Orb anything…</div>
      </div>
      ${navHtml('home')}
    </div>`,
  },
  'screenshot-03': {
    title: 'Capture workflow',
    html: `<div class="phone">
      <div class="status"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div class="h2">Capture</div>
        <div class="muted" style="margin-top:10px">Save a link, photo, or note — Orb analyzes it into an opportunity.</div>
        <div class="card">
          <div class="kicker">URL</div>
          <div class="input">https://harborlogistics.com/partnership</div>
          <div class="kicker" style="margin-top:28px">Prospect name</div>
          <div class="input">Harbor Logistics</div>
          <div class="kicker" style="margin-top:28px">Notes</div>
          <div class="input" style="min-height:140px">Met at conference — interested in Q3 pilot.</div>
          <div class="btn-gold">Analyze with Orb</div>
          <div class="btn-navy">Add photo</div>
        </div>
        <div class="card" style="display:flex;gap:20px;align-items:center">
          <div class="orb" style="width:72px;height:72px;font-size:32px">S</div>
          <div>
            <div class="title">AI analysis ready</div>
            <div class="detail">Opportunity scored High · Follow-up suggested in 2 days</div>
          </div>
        </div>
      </div>
      ${navHtml('capture')}
    </div>`,
  },
  'screenshot-04': {
    title: 'AI prioritization',
    html: `<div class="phone dark">
      <div class="status" style="color:#fff"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div class="kicker">AI PRIORITIZATION</div>
        <div class="h2" style="color:#fff">What to do next</div>
        <div class="muted" style="margin-top:12px">Orb ranks opportunities by urgency, warmth, and unfinished follow-ups.</div>
        <div class="card" style="border-color:rgba(201,168,68,0.45)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="title">1 · Harbor Logistics</div>
            <div style="color:${GOLD};font-weight:800;font-size:24px">HIGH</div>
          </div>
          <div class="detail">Warm intro window closes today · Draft ready</div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between"><div class="title">2 · River Atelier</div><div style="color:#93C5FD;font-weight:800">MED</div></div>
          <div class="detail">Proposal sent · Nudge in 48 hours</div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between"><div class="title">3 · Northline Guide</div><div style="color:#94A3B8;font-weight:800">LOW</div></div>
          <div class="detail">Research stage · Capture more context</div>
        </div>
        <div class="btn-gold">Apply ranking to Brief</div>
      </div>
      ${navHtml('workspace')}
    </div>`,
  },
  'screenshot-05': {
    title: 'Opportunity organization',
    html: `<div class="phone">
      <div class="status"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div class="h2">Workspace</div>
        <div class="muted" style="margin-top:8px">Active opportunities, organized for action.</div>
        <div class="card">
          <div style="display:flex;gap:18px;align-items:center">
            <div class="icon" style="background:${NAVY}">HL</div>
            <div style="flex:1">
              <div class="title">Harbor Logistics</div>
              <div class="detail">Partnership · Active</div>
              <div style="margin-top:12px"><span class="chip" style="background:rgba(27,43,77,0.08);color:${NAVY}">Follow up</span><span class="chip" style="background:rgba(201,168,68,0.18);color:${GOLD}">High</span></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;gap:18px;align-items:center">
            <div class="icon" style="background:#334155">RA</div>
            <div style="flex:1">
              <div class="title">River Atelier</div>
              <div class="detail">Proposal · Waiting</div>
              <div style="margin-top:12px"><span class="chip" style="background:rgba(27,43,77,0.08);color:${NAVY}">Nudge</span></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;gap:18px;align-items:center">
            <div class="icon" style="background:#475569">NG</div>
            <div style="flex:1">
              <div class="title">Northline Guide</div>
              <div class="detail">Research · New capture</div>
            </div>
          </div>
        </div>
      </div>
      ${navHtml('workspace')}
    </div>`,
  },
  'screenshot-06': {
    title: 'Daily Brief',
    html: `<div class="phone">
      <div class="status"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div class="kicker">DAILY BRIEF</div>
        <div class="h2">Your clear morning plan</div>
        <div class="muted" style="margin-top:10px">Orb distilled captures into a focused Brief — no noise.</div>
        <div class="card" style="border-color:rgba(201,168,68,0.45)">
          <div class="kicker">FOCUS</div>
          <div class="title">Send Harbor Logistics warm intro</div>
          <div class="detail" style="margin-top:12px">Why now: meeting freshness is highest in the next 24 hours. Talking points prepared.</div>
          <div class="btn-gold" style="margin-top:20px">Open action</div>
        </div>
        <div class="card">
          <div class="row" style="border:0;padding-top:0">
            <div class="icon" style="background:#3B82F6">1</div>
            <div><div class="title">Review proposal draft</div><div class="detail">River Atelier</div></div>
          </div>
          <div class="row">
            <div class="icon" style="background:#0EA5E9">2</div>
            <div><div class="title">Confirm Thursday coach call</div><div class="detail">Reminder · 2:00 PM</div></div>
          </div>
          <div class="row">
            <div class="icon" style="background:#64748B">3</div>
            <div><div class="title">Archive cold lead</div><div class="detail">No reply in 21 days</div></div>
          </div>
        </div>
      </div>
      ${navHtml('home')}
    </div>`,
  },
  'screenshot-07': {
    title: 'Reminders / Follow-ups',
    html: `<div class="phone">
      <div class="status"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div class="h2">Reminders</div>
        <div class="muted" style="margin-top:8px">Never lose a follow-up again.</div>
        <div class="card">
          <div class="kicker">DUE TODAY</div>
          <div class="row" style="border:0;padding-top:8px">
            <div class="icon" style="background:${GOLD}">!</div>
            <div><div class="title">Harbor Logistics intro</div><div class="detail">Due 11:00 AM · High</div></div>
          </div>
          <div class="row">
            <div class="icon" style="background:#EF4444">!</div>
            <div><div class="title">Contract review ping</div><div class="detail">Overdue · 1 day</div></div>
          </div>
        </div>
        <div class="card">
          <div class="kicker">UPCOMING</div>
          <div class="row" style="border:0;padding-top:8px">
            <div class="icon" style="background:#3B82F6">⏱</div>
            <div><div class="title">River Atelier nudge</div><div class="detail">Wed · Auto-suggested by Orb</div></div>
          </div>
          <div class="row">
            <div class="icon" style="background:#64748B">⏱</div>
            <div><div class="title">Weekly pipeline review</div><div class="detail">Fri · 9:00 AM</div></div>
          </div>
        </div>
        <div class="btn-navy">Add reminder</div>
      </div>
      ${navHtml('home')}
    </div>`,
  },
  'screenshot-08': {
    title: 'Settings',
    html: `<div class="phone">
      <div class="status"><span>9:41</span><span>●●● 5G</span></div>
      <div class="content" style="padding-top:24px">
        <div class="h2">Settings</div>
        <div class="card">
          <div class="kicker">ACCOUNT</div>
          <div class="title">alex@efficiencyarchitects.online</div>
          <div class="detail">Portal: simplifi · Efficiency Architects</div>
        </div>
        <div class="card">
          <div class="kicker">PUSH ALERTS</div>
          <div class="detail">Enabled on this device</div>
          <div class="btn-gold">Manage notifications</div>
        </div>
        <div class="card">
          <div class="kicker">LEGAL & SUPPORT</div>
          <div class="title" style="font-size:28px;text-decoration:underline;margin-top:8px">Privacy Policy</div>
          <div class="title" style="font-size:28px;text-decoration:underline;margin-top:14px">Terms of Service</div>
          <div class="title" style="font-size:28px;text-decoration:underline;margin-top:14px">EULA</div>
          <div class="title" style="font-size:28px;text-decoration:underline;margin-top:14px">AI Disclosure</div>
          <div class="detail" style="margin-top:18px">freedom@efficiencyarchitects.online</div>
        </div>
        <div class="btn-navy" style="background:transparent;border:2px solid ${NAVY};color:${NAVY}">Sign out</div>
      </div>
      ${navHtml('settings')}
    </div>`,
  },
};

function iconHtml() {
  return `<!DOCTYPE html><html><head><style>
    html,body{margin:0;width:512px;height:512px;overflow:hidden;background:transparent}
    .bg{width:512px;height:512px;background:${NAVY};display:grid;place-items:center;position:relative}
    .glow{position:absolute;width:340px;height:340px;border-radius:50%;
      background:radial-gradient(circle,rgba(201,168,68,0.45) 0%,rgba(201,168,68,0) 68%)}
    .ring{width:300px;height:300px;border-radius:50%;border:14px solid ${GOLD};
      box-shadow:0 0 36px rgba(201,168,68,0.55), inset 0 0 28px rgba(201,168,68,0.18);
      display:grid;place-items:center;position:relative;z-index:1;
      background:radial-gradient(circle at 35% 30%, #243860, ${NAVY})}
    .s{font-family:Inter,"Segoe UI",system-ui,sans-serif;font-size:190px;font-weight:800;color:${WHITE};line-height:1;margin-top:-8px}
  </style></head><body><div class="bg"><div class="glow"></div><div class="ring"><div class="s">S</div></div></div></body></html>`;
}

function featureHtml() {
  return `<!DOCTYPE html><html><head><style>
    html,body{margin:0;width:1024px;height:500px;overflow:hidden}
    .bg{width:1024px;height:500px;position:relative;
      background:radial-gradient(90% 120% at 78% 40%, #2a3f6d 0%, ${NAVY} 42%, ${NAVY_DEEP} 100%);
      font-family:Inter,"SF Pro Display","Segoe UI",system-ui,sans-serif;color:${WHITE};
      display:flex;align-items:center;padding:0 72px;box-sizing:border-box;overflow:hidden}
    .copy{position:relative;z-index:2;max-width:480px}
    .name{font-size:64px;font-weight:800;letter-spacing:-1px;line-height:1.05}
    .name span{color:${GOLD}}
    .tag{margin-top:18px;font-size:28px;font-weight:500;color:#D0D7E4;letter-spacing:0.2px}
    .orb-wrap{position:absolute;right:70px;top:50%;transform:translateY(-50%);width:340px;height:340px}
    .orb-glow{position:absolute;inset:-40px;border-radius:50%;
      background:radial-gradient(circle,rgba(201,168,68,0.4),transparent 70%)}
    .orb{position:absolute;inset:20px;border-radius:50%;
      background:radial-gradient(circle at 32% 28%, #4a628f 0%, #1B2B4D 45%, #0a1020 100%);
      box-shadow:0 0 60px rgba(201,168,68,0.35), inset -18px -10px 40px rgba(0,0,0,0.45), inset 16px 12px 30px rgba(255,255,255,0.08)}
    .ring{position:absolute;inset:8px;border-radius:50%;border:3px solid rgba(201,168,68,0.85);
      box-shadow:0 0 24px rgba(201,168,68,0.45)}
    .crescent{position:absolute;right:48px;top:56px;width:180px;height:230px;border-radius:50%;
      border:10px solid transparent;border-right-color:${GOLD};border-top-color:rgba(201,168,68,0.65);
      transform:rotate(-18deg);filter:drop-shadow(0 0 12px rgba(201,168,68,0.7))}
    .mark{position:absolute;inset:0;display:grid;place-items:center;
      font-size:120px;font-weight:800;color:${WHITE};text-shadow:0 0 24px rgba(201,168,68,0.35)}
  </style></head><body>
  <div class="bg">
    <div class="copy">
      <div class="name">Simplifi <span>Orb</span></div>
      <div class="tag">Never lose an opportunity</div>
    </div>
    <div class="orb-wrap">
      <div class="orb-glow"></div>
      <div class="orb"></div>
      <div class="ring"></div>
      <div class="crescent"></div>
      <div class="mark">S</div>
    </div>
  </div>
  </body></html>`;
}

async function renderHtml(page, html, width, height, outPath) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden}
    *{box-sizing:border-box}
    ${phoneChrome}
  </style></head><body>${html}</body></html>`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
}

async function main() {
  ensureDir(OUT);
  const sharp = loadSharp();

  // Prefer chromium from any installed playwright
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.error('Playwright chromium missing. Run: npx playwright install chromium');
    throw e;
  }
  const page = await browser.newPage();

  // Icon
  const iconPath = path.join(OUT, 'app-icon-512.png');
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(iconHtml(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: iconPath, type: 'png' });
  if (sharp) {
    await sharp(iconPath).resize(512, 512).png().toFile(iconPath + '.tmp');
    fs.renameSync(iconPath + '.tmp', iconPath);
  }
  console.log('wrote', iconPath);

  // Feature graphic
  const featPath = path.join(OUT, 'feature-graphic-1024x500.png');
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(featureHtml(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: featPath, type: 'png' });
  if (sharp) {
    await sharp(featPath).resize(1024, 500, { fit: 'fill' }).png().toFile(featPath + '.tmp');
    fs.renameSync(featPath + '.tmp', featPath);
  }
  console.log('wrote', featPath);

  // Screenshots
  for (const [name, screen] of Object.entries(screens)) {
    const out = path.join(OUT, `${name}.png`);
    await renderHtml(page, screen.html, 1080, 2400, out);
    if (sharp) {
      const meta = await sharp(out).metadata();
      if (meta.width !== 1080 || meta.height !== 2400) {
        await sharp(out).resize(1080, 2400, { fit: 'fill' }).png().toFile(out + '.tmp');
        fs.renameSync(out + '.tmp', out);
      }
    }
    console.log('wrote', out, '—', screen.title);
  }

  await browser.close();

  // Verify dimensions
  if (sharp) {
    for (const f of [
      'app-icon-512.png',
      'feature-graphic-1024x500.png',
      ...Object.keys(screens).map((k) => `${k}.png`),
    ]) {
      const m = await sharp(path.join(OUT, f)).metadata();
      console.log('dim', f, m.width, m.height);
    }
  }

  console.log('Done. Assets in', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
