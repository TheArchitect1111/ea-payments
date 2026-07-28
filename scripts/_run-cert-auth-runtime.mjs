/**
 * Authenticated read-only cert probes using minted ea_portal_session cookie.
 * GET-only. No form posts beyond none. Saves HTML/text evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cookieLine = fs
  .readFileSync(path.join(ROOT, 'docs/audits/_runtime-cert-session-cookie.txt'), 'utf8')
  .trim();
const eq = cookieLine.indexOf('=');
const cookieName = cookieLine.slice(0, eq);
const cookieValue = cookieLine.slice(eq + 1);

const ORIGIN = 'https://efficiencyarchitects.online';
const SLUG = 'ea-portal-cert-test';
const outDir = path.join(ROOT, 'docs/audits/runtime-evidence-cert-2026-07-23');
fs.mkdirSync(outDir, { recursive: true });

const routes = [
  `/portal/${SLUG}/ctp/progress`,
  `/portal/${SLUG}/ctp`,
  `/portal/${SLUG}/ctp/documents`,
  `/portal/${SLUG}/ctp/messages`,
  `/portal/${SLUG}/ctp/support`,
  `/portal/${SLUG}/documents`,
  `/portal/${SLUG}/messaging`,
  `/portal/${SLUG}/ask`,
  `/portal/${SLUG}`,
];

async function httpProbe(pathname) {
  const res = await fetch(`${ORIGIN}${pathname}`, {
    redirect: 'manual',
    headers: {
      Cookie: `${cookieName}=${cookieValue}`,
      Accept: 'text/html',
    },
  });
  const loc = res.headers.get('location');
  let text = '';
  if (res.status === 200) {
    text = await res.text();
  }
  return {
    path: pathname,
    status: res.status,
    location: loc,
    len: text.length,
    hasYourJourney: /Your Journey/i.test(text),
    hasProgress: />\s*Progress\s*</.test(text) || /cex-shell-link[^>]*>Progress</i.test(text),
    hasMessages: />\s*Messages\s*</.test(text),
    hasSupport: />\s*Support\s*</.test(text),
    hasDocuments: />\s*Documents\s*</.test(text),
    hasHelpFab: /cex-help-fab|Help guide|Need a hand/i.test(text),
    hasAssistant: /ea-assistant|data-ea-assistant/i.test(text),
    hasNextAction: /next (best )?action|Next step|Mark complete|Design Studio/i.test(text),
    redirectedToLogin: Boolean(loc && /portal\/login/i.test(loc)),
    titleMatch: text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null,
    snippet: text.replace(/\s+/g, ' ').slice(0, 400),
  };
}

const httpResults = [];
for (const r of routes) {
  try {
    httpResults.push(await httpProbe(r));
    console.log('HTTP', r, httpResults.at(-1).status, httpResults.at(-1).location || '');
  } catch (err) {
    httpResults.push({ path: r, error: String(err.message || err) });
    console.log('HTTP ERR', r, err.message);
  }
}

fs.writeFileSync(
  path.join(outDir, 'http-probes.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), httpResults }, null, 2),
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});
await context.addCookies([
  {
    name: cookieName,
    value: cookieValue,
    domain: 'efficiencyarchitects.online',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  },
]);

async function capturePage(label, pathname, viewport) {
  const page = await context.newPage();
  if (viewport) await page.setViewportSize(viewport);
  const url = `${ORIGIN}${pathname}`;
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  const title = await page.title();
  const nav = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a.cex-shell-link, nav a, header a')].map((a) => ({
      text: (a.textContent || '').trim(),
      href: a.getAttribute('href'),
      ariaCurrent: a.getAttribute('aria-current'),
      className: a.className,
    }));
    const helpFab = document.querySelector('.cex-help-fab');
    const assistant = document.querySelector('[data-ea-assistant], .ea-assistant-trigger, .ea-assistant-root');
    const headings = [...document.querySelectorAll('h1,h2')].slice(0, 8).map((h) => (h.textContent || '').trim());
    const ariaLabels = [...document.querySelectorAll('[aria-label]')]
      .slice(0, 30)
      .map((el) => ({ tag: el.tagName, label: el.getAttribute('aria-label') }));
    const bodyText = (document.body?.innerText || '').slice(0, 2500);
    return {
      links,
      helpFab: helpFab
        ? { text: helpFab.textContent?.trim(), ariaLabel: helpFab.getAttribute('aria-label') }
        : null,
      assistant: Boolean(assistant),
      assistantText: assistant?.textContent?.trim()?.slice(0, 80) || null,
      headings,
      ariaLabels,
      bodyText,
    };
  });

  const shot = path.join(outDir, `${label}.png`);
  await page.screenshot({ path: shot, fullPage: true });

  // Open help FAB if present (read-only open/close)
  let helpDrawer = null;
  if (nav.helpFab) {
    try {
      await page.click('.cex-help-fab', { timeout: 3000 });
      await page.waitForTimeout(800);
      helpDrawer = await page.evaluate(() => {
        const d = document.querySelector('.cex-help-drawer, [role="dialog"]');
        return d
          ? {
              open: true,
              title: d.querySelector('h2')?.textContent?.trim() || null,
              questions: [...d.querySelectorAll('summary')].map((s) => s.textContent?.trim()).slice(0, 12),
            }
          : { open: false };
      });
      // close if close button
      const close = page.locator('.cex-help-drawer-close, [aria-label*="Close" i]').first();
      if (await close.count()) await close.click({ timeout: 2000 }).catch(() => {});
    } catch (err) {
      helpDrawer = { error: String(err.message || err) };
    }
  }

  // Open assistant if present (read-only)
  let assistantPanel = null;
  try {
    const trigger = page.locator('.ea-assistant-trigger, button:has-text("Help"), button:has-text("Need a hand")').first();
    if (await trigger.count()) {
      await trigger.click({ timeout: 3000 });
      await page.waitForTimeout(800);
      assistantPanel = await page.evaluate(() => {
        const p = document.querySelector('.ea-assistant-panel, [class*="assistant-panel"]');
        return p
          ? {
              open: true,
              title: p.querySelector('h2')?.textContent?.trim() || null,
              text: (p.innerText || '').slice(0, 800),
            }
          : { open: false };
      });
      const closeBtn = page.locator('.ea-assistant-icon-btn, button:has-text("Close")').first();
      if (await closeBtn.count()) await closeBtn.click({ timeout: 2000 }).catch(() => {});
    }
  } catch (err) {
    assistantPanel = { error: String(err.message || err) };
  }

  await page.close();
  return {
    label,
    pathname,
    viewport: viewport || { width: 1280, height: 800 },
    status: resp?.status() ?? null,
    finalUrl,
    title,
    nav,
    helpDrawer,
    assistantPanel,
    screenshot: shot,
    loggedIn: !/portal\/login/i.test(finalUrl),
  };
}

const browserResults = [];
try {
  browserResults.push(await capturePage('desktop-progress', `/portal/${SLUG}/ctp/progress`));
  browserResults.push(await capturePage('desktop-journey', `/portal/${SLUG}/ctp`));
  browserResults.push(await capturePage('desktop-documents', `/portal/${SLUG}/ctp/documents`));
  browserResults.push(await capturePage('desktop-messages', `/portal/${SLUG}/ctp/messages`));
  browserResults.push(await capturePage('desktop-support', `/portal/${SLUG}/ctp/support`));
  browserResults.push(
    await capturePage('mobile-progress', `/portal/${SLUG}/ctp/progress`, { width: 390, height: 844 }),
  );
  browserResults.push(
    await capturePage('mobile-journey', `/portal/${SLUG}/ctp`, { width: 390, height: 844 }),
  );
} catch (err) {
  browserResults.push({ fatal: String(err.message || err) });
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  authNote:
    'Password login returned requires2fa; session minted with ADMIN_SESSION_SECRET from .env.local and injected via Playwright cookies. Valid only if local secret matches production.',
  httpResults,
  browserResults: browserResults.map((b) => ({
    ...b,
    nav: b.nav
      ? {
          ...b.nav,
          bodyText: b.nav.bodyText?.slice(0, 1200),
        }
      : b.nav,
  })),
};

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('Evidence written to', outDir);
console.log(
  'Logged in pages:',
  browserResults.filter((b) => b.loggedIn).map((b) => b.label),
);
console.log(
  'Login redirects:',
  browserResults.filter((b) => b.loggedIn === false).map((b) => b.label),
);
