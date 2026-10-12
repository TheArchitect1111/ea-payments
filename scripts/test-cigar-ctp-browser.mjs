import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

/** Browser-only preview verification; never submits contact details or files. */
const BASE = process.env.CIGAR_BROWSER_BASE ?? 'http://127.0.0.1:3200';
const screenshotDir = path.join(process.cwd(), 'cigar-ctp-browser-screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });
const questions = JSON.parse(fs.readFileSync('lib/cigar-ctp/questions.json', 'utf8')).questions;
const copySource = fs.readFileSync('lib/cigar-ctp/visual-copy.ts', 'utf8');
const copy = {};
for (const match of copySource.matchAll(/^  ([CBLDF]\d{2}): \{ title: '([^']+)', reason: '([^']+)' \},?$/gm)) {
  copy[match[1]] = { title: match[2], reason: match[3] };
}
assert.equal(Object.keys(copy).length, 30, 'Every assessment question requires an individual visual headline and rationale');
const browser = await chromium.launch({ headless: true });
const visited = new Set();
const layouts = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const roleChoice = { brand: 'brand', lounge: 'lounge', distributor: 'distributor' };
try {
  for (const [layout, viewport] of Object.entries(layouts)) {
    for (const role of Object.keys(roleChoice)) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      await page.goto(BASE + '/discover/cigar', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await expect(page.getByText('PREVIEW ONLY')).toBeVisible();
      await expect(page.locator('aside')).toContainText('CLARITY · CAPACITY · CONFIDENCE');
      await expect(page.locator('aside h2')).toHaveText('A clearer picture at every step.');
      await expect(page.getByRole('heading', { name: 'A clearer view of your business starts here.' })).toBeVisible();
      assert.equal(await page.locator('aside').getByText('Photography matched to the current assessment topic').count(), 0, 'Removed image filler must stay removed');
      if (role === 'lounge') await page.screenshot({ path: path.join(screenshotDir, layout + '-intro.png'), fullPage: true, animations: 'disabled' });

      await page.getByRole('button', { name: /Discover My Opportunities/ }).click();
      const pathQuestions = questions.filter(q => q.path === 'all' || q.path === role);
      assert.equal(pathQuestions.length, 16, 'Each role should have 16 visible questions');
      let lastTitle = 'A clearer picture at every step.';
      for (const [index, question] of pathQuestions.entries()) {
        const rationale = page.getByTestId('cigar-question-why');
        const title = page.locator('aside h2');
        const current = copy[question.id];
        await expect(page.getByRole('heading', { name: question.question, exact: true })).toBeVisible();
        await expect(rationale).toHaveText(current.reason);
        await expect(title).toHaveText(current.title);
        await expect.poll(async () => page.locator('aside img').evaluate(image => image.complete && image.naturalWidth > 0), {
          timeout: 10000,
          message: 'Photo must finish loading for ' + question.id + ' on ' + layout,
        }).toBe(true);
        await expect(page.locator('aside')).toContainText('CLARITY · CAPACITY · CONFIDENCE');
        assert.notEqual(current.title, lastTitle, 'The image title must change when the question changes: ' + question.id);
        lastTitle = current.title;
        assert.equal(await page.locator('aside').getByText('Photography matched to the current assessment topic').count(), 0);
        const visual = await page.locator('aside').evaluate(node => {
          const label = Array.from(node.querySelectorAll('p')).find(p => p.textContent?.includes('CLARITY · CAPACITY · CONFIDENCE'));
          const title = node.querySelector('h2');
          const image = node.querySelector('img');
          if (!label || !title || !image) throw new Error('Missing photographic heading elements');
          const lr = label.getBoundingClientRect(), tr = title.getBoundingClientRect(), ir = image.getBoundingClientRect();
          return { labelTop: lr.top, labelBottom: lr.bottom, titleTop: tr.top, titleBottom: tr.bottom, imageTop: ir.top, imageBottom: ir.bottom, labelShadow: getComputedStyle(label).textShadow, titleShadow: getComputedStyle(title).textShadow, source: image.currentSrc };
        });
        assert.ok(visual.labelTop >= visual.imageTop - 2 && visual.titleBottom <= visual.imageBottom + 3, 'Image overlays must stay inside photograph: ' + question.id);
        assert.ok(visual.labelBottom < visual.titleTop, 'Motto and question title must not overlap: ' + question.id);
        assert.ok(visual.labelShadow !== 'none' && visual.titleShadow !== 'none', 'Overlays need contrast-preserving shadows: ' + question.id);
        if (layout === 'mobile') {
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert.ok(overflow <= 2, 'Mobile must not overflow horizontally: ' + question.id + ', overflow=' + overflow);
        }
        if (question.id === 'L04' || question.id === 'B03' || question.id === 'D03') {
          await page.screenshot({ path: path.join(screenshotDir, layout + '-' + question.id + '.png'), fullPage: true, animations: 'disabled' });
        }
        visited.add(question.id);
        if (index === pathQuestions.length - 1) break;
        await page.locator('input[name="' + question.id + '"][value="' + (question.id === 'C01' ? roleChoice[role] : question.options[0].id) + '"]').check();
        await page.getByRole('button', { name: /^Continue/ }).click();
      }
      await page.getByRole('button', { name: /Back/ }).click();
      const previous = pathQuestions[pathQuestions.length - 2];
      await expect(page.getByTestId('cigar-question-why')).toHaveText(copy[previous.id].reason);
      await expect(page.locator('aside h2')).toHaveText(copy[previous.id].title);
      await page.close();
      console.log('PASS: ' + layout + ', ' + role + ', ' + pathQuestions.length + ' questions, titles, explanations, contrast, mobile overflow, back navigation');
    }
  }
  assert.equal(visited.size, 30, 'All 30 unique question screens must be visited in both viewports');
  console.log('BROWSER PASS: 30 question variants, three role paths, two viewport sizes, photo text contrast, dynamic changes, preview protection, navigation');
} finally {
  await browser.close();
}
