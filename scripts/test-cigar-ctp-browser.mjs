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
const editorialSource = fs.readFileSync('lib/cigar-ctp/editorial-images.ts', 'utf8');
const imageMap = JSON.parse(editorialSource.split('export const CIGAR_EDITORIAL_IMAGES = ')[1].split(' as const;')[0]);
assert.equal(Object.keys(imageMap).length, 35, '35 distinct mapped stage images');
assert.equal(new Set(Object.values(imageMap).map(image => new URL(image.src).pathname)).size, 35, 'No reused Pexels source files');
const saved = new Set();
const checkPhoto = async (page, key, layout) => {
  const actual = await page.locator('aside img').evaluate(img => ({
    loaded: img.complete && img.naturalWidth > 0,
    source: img.currentSrc,
    fitting: getComputedStyle(img).objectFit,
    placement: getComputedStyle(img).objectPosition
  }));
  await expect.poll(async () => page.locator('aside img').evaluate(img => img.complete && img.naturalWidth > 0), {
    timeout: 12000, message: 'Image did not load for ' + key
  }).toBe(true);
  const expectedPath = new URL(imageMap[key].src).pathname;
  const displayedPath = new URL(await page.locator('aside img').getAttribute('src'), BASE).pathname;
  assert.equal(displayedPath, expectedPath, 'Must use distinct mapped photo rather than error fallback: ' + key);
  const current = await page.locator('aside img').evaluate(img => ({
    fitting: getComputedStyle(img).objectFit,
    position: getComputedStyle(img).objectPosition,
    frontLayer: Number(getComputedStyle(img).zIndex),
    headingLayer: Number(getComputedStyle(img.parentElement.querySelector('h2').parentElement).zIndex),
    mottoLayer: Number(getComputedStyle(Array.from(img.parentElement.querySelectorAll('p')).find(el => el.textContent?.includes('CLARITY · CAPACITY · CONFIDENCE')).parentElement).zIndex)
  }));
  assert.equal(current.fitting, 'contain', 'Full photograph must be visible without cropping: ' + key);
  assert.equal(current.position, '50% 50%', 'Photo must remain centered: ' + key);
  assert.ok(actual.headingLayer > actual.frontLayer && actual.mottoLayer > actual.frontLayer, 'Text must be painted above every foreground image: ' + key + ', layers=' + JSON.stringify({front:actual.frontLayer,heading:actual.headingLayer,motto:actual.mottoLayer}));
  const shotKey = layout + '-' + key;
  if (!saved.has(shotKey)) {
    await page.locator('aside').screenshot({
      path: path.join(screenshotDir, shotKey + '.png'), animations: 'disabled'
    });
    saved.add(shotKey);
  }
};

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
      await checkPhoto(page, 'intro', layout);

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
        await checkPhoto(page, question.id, layout);
        visited.add(question.id);
        if (index === pathQuestions.length - 1) break;
        await page.locator('input[name="' + question.id + '"][value="' + (question.id === 'C01' ? roleChoice[role] : question.options[0].id) + '"]').check();
        await page.getByRole('button', { name: /^Continue/ }).click();
      }
      await page.getByRole('button', { name: /Back/ }).click();
      const previous = pathQuestions[pathQuestions.length - 2];
      await expect(page.getByTestId('cigar-question-why')).toHaveText(copy[previous.id].reason);
      await expect(page.locator('aside h2')).toHaveText(copy[previous.id].title);
      await page.getByRole('button', { name: /^Continue/ }).click();
      if (role === 'brand') {
        const finalQuestion = pathQuestions[pathQuestions.length - 1];
        await page.locator('input[name="' + finalQuestion.id + '"][value="' + finalQuestion.options[0].id + '"]').check();
        await page.getByRole('button', { name: /^Continue/ }).click();
        await expect(page.getByRole('heading', { name: 'Have a report you would like us to review?' })).toBeVisible();
        await checkPhoto(page, 'upload', layout);
        await page.getByRole('button', { name: /^Continue/ }).click();
        await expect(page.getByRole('heading', { name: 'Where should your personalized report go?' })).toBeVisible();
        await checkPhoto(page, 'contact', layout);
        await page.getByLabel('Business name').fill('QA Company');
        await page.getByLabel('Your name').fill('QA Reviewer');
        await page.getByLabel('Email address').fill('qa@visual.example');
        await page.getByRole('checkbox', { name: /authorize Efficiency Architects/ }).check();
        await page.getByRole('button', { name: /Review responses/ }).click();
        await expect(page.getByRole('heading', { name: "Here's what we've heard." })).toBeVisible();
        await checkPhoto(page, 'review', layout);
        await page.route('**/api/cigar-ctp/preview/submit', async route => {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, qaSubmissionId: 'LOCAL-CROPPING-TEST' }) });
        });
        await page.getByRole('button', { name: /Submit Assessment/ }).click();
        await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
        await checkPhoto(page, 'submitted', layout);
      }
      await page.close();
      console.log('PASS: ' + layout + ', ' + role + ', ' + pathQuestions.length + ' questions, titles, explanations, contrast, mobile overflow, back navigation');
    }
  }
  assert.equal(visited.size, 30, 'All 30 unique question screens must be visited in both viewports');
  assert.equal(saved.size, 70, 'Save all 35 images in both viewport sizes, including the final local-only confirmation');
  console.log('BROWSER PASS: 35 unique loaded photographs, 70 mobile/desktop photographic snapshots, 30 question variants, three role paths, centered uncropped images, dynamic titles, preview protection, navigation');
} finally {
  await browser.close();
}
