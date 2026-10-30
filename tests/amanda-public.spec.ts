import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const base = process.env.AMANDA_VERIFY_URL || 'https://amandacatherine.ca';
test.describe('Amanda public production checks (no credentials and no payments)', () => {
  test('homepage removes retired content and Clinical Fat Loss keeps its checkout destination', async ({ page }) => {
    await page.goto(base + (process.env.AMANDA_HOME_PATH||'/'), { waitUntil: 'domcontentloaded' });
    if (process.env.AMANDA_VERIFY_DEPLOYED === 'true') await expect(page.getByRole('heading', { name: /A note from Amanda/i })).toHaveCount(0);
    await expect(page.getByText(/BODY SCULPT(?:™)? NATIONAL TRAINING TOUR|Non-Surgical Tummy Sculpt & Tighten/i)).toHaveCount(0);
    if(process.env.AMANDA_VERIFY_DEPLOYED==='true'||process.env.AMANDA_VERIFY_URL) for(const label of ['Hub','Foundry','Calendar','Eva']) await expect(page.getByRole('link',{name:label,exact:true}).first()).toBeVisible();
    if (process.env.AMANDA_VERIFY_DEPLOYED === 'true') await expect(page.locator('.ac-course-grid').getByRole('heading', { name: /Firm Foundation|The Entrepreneurial Artist/i })).toHaveCount(0);

    await expect(page.getByText(/Non-Surgical Tummy Sculpt & Tighten|Non-Surgical Tummy Tuck/i)).toHaveCount(0);
    await expect(page.getByText(/BODY SCULPT(?:™)? NATIONAL TRAINING TOUR/i)).toHaveCount(0);
    const classesGrid = page.locator('#classes-grid');
    await expect(classesGrid).toBeVisible();
    const clinicalCard = classesGrid.locator('article').filter({has:page.getByRole('heading',{name:'Clinical Fat Loss',exact:true})});
    const registration = clinicalCard.getByRole('link', { name: process.env.AMANDA_VERIFY_DEPLOYED === 'true' ? 'Register' : /^(Register|Buy Now)$/ });
    await expect(registration).toBeVisible();
    await expect(registration).toHaveAttribute('href', /^https:\/\/checkout\.square\.site\//);
    await expect(clinicalCard.getByRole('link', { name: 'Join Waitlist', exact:true })).toHaveCount(0);

  });

  test('RIMAN uses kit visual and a single Canadian destination in site and owner source', async ({ page }) => {
    await page.goto(base + (process.env.AMANDA_HOME_PATH||'/'), { waitUntil: 'domcontentloaded' });
    const kit = page.getByRole('img', { name: /RIMAN Incellderm ICD Expert Experience Kit/i });
    await expect(kit).toBeVisible();
    await expect(kit).toHaveAttribute('src', /ICDExpertExperienceKit/);
    const publicCta = page.getByRole('link', { name: /Shop RIMAN Canada/i });
    if (process.env.AMANDA_VERIFY_DEPLOYED === 'true') await expect(publicCta).toHaveAttribute('href', 'https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA');
    else await expect(publicCta).toHaveAttribute('href', 'https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA');
    const owner = readFileSync('app/portal/amanda-catherine/owner/[section]/page.tsx', 'utf8');
    expect(owner).toContain("riman: 'https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA'");
  });

  test('Amanda-branded returning learner login renders', async ({ page }) => {
    await page.goto(base + '/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('AesthetiKine Academy').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Amanda Catherine Courses & Learning/i })).toBeVisible();
  });

  test('Clinical Fat Loss waitlist persists and confirms without a Gmail configuration error', async ({ request }) => {
    test.skip(process.env.AMANDA_VERIFY_DEPLOYED !== 'true', 'Write-once QA is enabled only for EA-gated production promotion.');
    const email = `amanda-qa-${process.env.GITHUB_RUN_ID || Date.now()}@example.invalid`;
    const response = await request.post(base + '/api/public/amanda/waitlist', {
      headers: { Origin: base, 'Content-Type': 'application/json' },
      data: { courseId: 'clinical-fat-loss-injectables', name: 'Amanda Automated QA', email,
        phone: '', message: 'Automated acceptance: no enrollment, no charge.' },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.warning || '').toBe('');
  });

  test('expired test learners see upgrade CTA without a login loop', async ({ page }) => {
    test.skip(process.env.AMANDA_VERIFY_DEPLOYED !== 'true', 'Run only after EA-GATED production promotion; PR preview is protected and not yet the live site.');
    await page.goto(base + '/portal/amanda-catherine/expired?courseId=aesthetikine-reset-training', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Your \$1 test access has expired/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Upgrade to full course access/i })).toBeVisible();
    expect(page.url()).not.toContain('/portal/login');
  });
});

test('Amanda homepage and Classes have complete click identities and working pathways',async({page})=>{
 test.skip(!process.env.AMANDA_VERIFY_URL&&process.env.AMANDA_VERIFY_DEPLOYED!=='true','New feature checks require its exact preview or promoted production.');
 const evidence:any[]=[];
 for(const [path,min] of [[process.env.AMANDA_HOME_PATH||'/',49]] as const){
  await page.goto(base+path,{waitUntil:'networkidle'});
  const links=page.locator('a');expect(await links.count()).toBeGreaterThanOrEqual(min);
  const identities=await page.locator('a,button').evaluateAll(nodes=>nodes.map(n=>({name:n.getAttribute('data-cta-name'),key:n.getAttribute('data-cta-key'),href:n.getAttribute('href'),disabled:n.hasAttribute('disabled')})));
  expect(identities.filter(x=>!x.name||!x.key)).toEqual([]);
  expect(identities.filter(x=>x.disabled)).toEqual([]);
  expect(identities.every(x=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.key!))).toBe(true);
  evidence.push({path,links:await links.count(),tagged:identities.length,missing:0,disabled:0});
 }
 for(const section of ['restore','learn','create']){
  await page.goto(base+'/amanda/'+section,{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:section,exact:true})).toBeVisible();
 }
 await test.info().attach('Amanda CTA coverage',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
});
