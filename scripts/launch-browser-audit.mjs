#!/usr/bin/env node
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  auditEvidenceRecord,
  evaluateAccessibilityAudit,
  evaluateAnonymousPortalDenial,
  evaluateFormAudit,
  evaluateLinkAudit,
  evaluatePerformanceAudit,
  evaluateSeoAudit,
} from '../lib/launch-certification/website-audit.mjs';

const root = process.cwd();
const require = createRequire(import.meta.url);
const arg = (name, fallback = '') => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const clientsRegistry = JSON.parse(readFileSync(resolve(root, 'config/launch-certification/clients.json'), 'utf8'));
const requested = arg('client', 'all');
const clients = requested === 'all' ? clientsRegistry.clients : clientsRegistry.clients.filter((client) => client.id === requested);
if (!clients.length) throw new Error(`Unknown launch audit client: ${requested}`);

const environment = (arg('environment', process.env.EA_CERTIFICATION_ENVIRONMENT || 'preview')).toLowerCase();
const baseUrlOverride = arg('base-url', process.env.EA_CERTIFICATION_BASE_URL || '').trim();
const sourceCommit = arg('source-commit', process.env.EA_SOURCE_COMMIT || process.env.GITHUB_SHA || '').trim();
const outputPath = resolve(root, arg('output', 'artifacts/launch-certification/website-evidence.json'));
const reportPath = resolve(root, arg('report', 'artifacts/launch-certification/website-audit.json'));
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
const headers = environment === 'preview' && bypassSecret ? {
  'x-vercel-protection-bypass': bypassSecret,
  'x-vercel-set-bypass-cookie': 'true',
} : {};
const limits = { dclMs: 5000, lcpMs: 4000, cls: 0.1 };

if (!/^[a-f0-9]{40}$/i.test(sourceCommit)) throw new Error('A full source commit is required for website evidence');

function clientBase(client) {
  return baseUrlOverride || (environment === 'production' ? client.deployment.publicBaseUrl : '');
}

function evidenceRef(checkId) {
  return `${reportPath}#${encodeURIComponent(checkId)}`;
}

function failedRecord(checkId, status, reason, timestamp) {
  return auditEvidenceRecord({ checkId, result: { status, reason, details: {} }, sourceCommit, environment, timestamp, evidenceRef: evidenceRef(checkId) });
}

function isSensitiveLink(url) {
  return /^\/api(?:\/|$)/i.test(url.pathname)
    || /(?:^|\/)(?:logout|log-out|signout|sign-out|unsubscribe|cancel|delete|remove|checkout|payment|purchase|order|oauth|callback)(?:\/|$)/i.test(url.pathname)
    || /(?:token|session|signature|secret|key)=/i.test(url.search);
}

function normalizedPath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function finiteMetric(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : NaN;
}

async function inspectRoute(browser, client, route, base, expectedBuild, timestamp) {
  const target = new URL(route.path, `${base.replace(/\/$/, '')}/`).toString();
  const results = { route: route.path, target, viewportResults: [], linkResult: null, formResult: null, seoResult: null };
  const visitedLinks = [];
  const unresolvedFragments = [];
  const brokenInternal = [];
  let probeLimitExceeded = false;

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000, isMobile: false },
    { name: 'mobile', width: 390, height: 844, isMobile: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, extraHTTPHeaders: headers });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        window.__eaWebVitals = { lcp: 0, cls: 0 };
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const latest = entries.at(-1);
            if (latest) window.__eaWebVitals.lcp = latest.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          let cls = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) if (!entry.hadRecentInput) cls += entry.value;
            window.__eaWebVitals.cls = cls;
          }).observe({ type: 'layout-shift', buffered: true });
        } catch {}
      });
      const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1800);
      const pageUrl = page.url();
      const pageOrigin = new URL(pageUrl).origin;
      const responseStatus = response?.status() || 0;
      const documentIdentityValid = responseStatus >= 200 && responseStatus < 300
        && pageOrigin === new URL(target).origin
        && normalizedPath(new URL(pageUrl).pathname) === normalizedPath(new URL(target).pathname);
      const facts = await page.evaluate(() => {
        const visible = (el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const links = [...document.querySelectorAll('a')].filter(visible).map((anchor) => {
          const href = (anchor.getAttribute('href') || '').trim();
          const imageAlt = [...anchor.querySelectorAll('img[alt]')].map((img) => img.getAttribute('alt')).filter(Boolean).join(' ').trim();
          const hasAccessibleName = Boolean((anchor.getAttribute('aria-label') || '').trim() || (anchor.getAttribute('title') || '').trim() || (anchor.innerText || '').trim() || imageAlt);
          return { href, hasAccessibleName };
        });
        const forms = [...document.querySelectorAll('form')].filter(visible).map((form) => ({
          hasSubmitControl: Boolean(form.querySelector('button[type="submit"],button:not([type]),input[type="submit"]')),
          fields: [...form.querySelectorAll('input,select,textarea')]
            .filter((field) => !['button', 'submit', 'reset', 'hidden', 'image'].includes((field.getAttribute('type') || '').toLowerCase()))
            .map((field) => ({
              name: (field.getAttribute('name') || '').trim(),
              type: (field.getAttribute('type') || field.tagName.toLowerCase()).toLowerCase(),
              hasAccessibleName: Boolean(field.labels?.length || (field.getAttribute('aria-label') || '').trim() || (field.getAttribute('aria-labelledby') || '').trim()),
              required: field.required === true,
              currentlyValid: field.checkValidity(),
            })),
        }));
        const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
        let canonicalValid = false;
        try { canonicalValid = Boolean(canonical && new URL(canonical, location.href).protocol === 'https:'); } catch {}
        const robots = `${document.querySelector('meta[name="robots"]')?.content || ''} ${document.querySelector('meta[name="googlebot"]')?.content || ''}`.toLowerCase();
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          links,
          forms,
          seo: {
            title: document.title || '',
            description: document.querySelector('meta[name="description"]')?.content || '',
            canonical,
            canonicalValid,
            h1Count: document.querySelectorAll('h1').length,
            noindex: /(?:^|[ ,])noindex(?:$|[ ,])/i.test(robots),
          },
          dclMs: navigation?.domContentLoadedEventEnd ?? NaN,
          lcpMs: window.__eaWebVitals?.lcp ?? NaN,
          cls: window.__eaWebVitals?.cls ?? NaN,
          status: 0,
          finalPath: location.pathname,
          title: document.title || '',
        };
      }).catch(() => null);

      // Playwright serializes page functions; attach HTTP metadata after the DOM snapshot.
      if (!facts) throw new Error('Browser could not collect page facts');
      facts.status = response?.status() || 0;
      facts.finalPath = new URL(pageUrl).pathname;
      const currentUrl = new URL(pageUrl);
      if (viewport.name === 'desktop') {
        const probeQueue = [];
        for (const link of facts.links) {
          if (!link.href) { visitedLinks.push({ ...link, sameOrigin: false, probed: false }); continue; }
          let parsed;
          try { parsed = new URL(link.href, pageUrl); } catch { visitedLinks.push({ ...link, sameOrigin: false, probed: false }); continue; }
          const sameOrigin = parsed.origin === pageOrigin;
          const row = { ...link, href: parsed.toString(), sameOrigin, probed: false };
          if (sameOrigin && parsed.hash && parsed.pathname === currentUrl.pathname && parsed.search === currentUrl.search && !parsed.hash.startsWith('#!')) {
            const fragmentId = decodeURIComponent(parsed.hash.slice(1));
            const exists = await page.evaluate((id) => Boolean(document.getElementById(id)), fragmentId).catch(() => false);
            if (!exists) unresolvedFragments.push(parsed.toString());
          }
          if (sameOrigin && /^https?:$/.test(parsed.protocol) && !parsed.hash && !isSensitiveLink(parsed)) {
            probeQueue.push(row);
          }
          visitedLinks.push(row);
        }
        probeLimitExceeded = probeQueue.length > 200;
        const boundedQueue = probeQueue.slice(0, 200);
        for (let offset = 0; offset < boundedQueue.length; offset += 8) {
          await Promise.all(boundedQueue.slice(offset, offset + 8).map(async (row) => {
            row.probed = true;
            try {
              const probe = await context.request.get(row.href, { headers, timeout: 12000, maxRedirects: 5, failOnStatusCode: false });
              row.status = probe.status();
              if (probe.status() < 200 || probe.status() >= 400) brokenInternal.push({ href: row.href, status: probe.status() });
            } catch (error) {
              row.status = 0;
              row.error = error instanceof Error ? error.message : String(error);
              brokenInternal.push({ href: row.href, status: 0, error: row.error });
            }
          }));
        }
      }
      // The homepage and navigation routes are checked without submitting forms or invoking commerce actions.
      if (viewport.name === 'desktop') {
        results.linkResult = documentIdentityValid
          ? evaluateLinkAudit({ links: visitedLinks, brokenInternal, unresolvedFragments, probeLimitExceeded })
          : { status: 'failed', reason: `Configured public route did not return an in-origin success response (HTTP ${responseStatus})`, details: { route: route.path } };
        results.formResult = documentIdentityValid
          ? evaluateFormAudit(facts.forms)
          : { status: 'failed', reason: `Configured public route did not return an in-origin success response (HTTP ${responseStatus})`, details: { route: route.path } };
        results.seoResult = documentIdentityValid
          ? evaluateSeoAudit(facts.seo, { environment })
          : { status: 'failed', reason: `Configured public route did not return an in-origin success response (HTTP ${responseStatus})`, details: { route: route.path } };
      }

      await page.addScriptTag({ path: require.resolve('axe-core') });
      const axe = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      }));
      const accessibilityResult = documentIdentityValid
        ? evaluateAccessibilityAudit(axe.violations || [])
        : { status: 'failed', reason: `Configured public route did not return an in-origin success response (HTTP ${responseStatus})`, details: { violations: [] } };
      if (accessibilityResult.status !== 'passed') accessibilityResult.details.viewport = viewport.name;
      results.viewportResults.push({
        viewport: viewport.name,
        status: responseStatus,
        finalPath: facts.finalPath,
        title: facts.title,
        accessibility: accessibilityResult,
        performance: {
          route: route.path,
          viewport: viewport.name,
          dclMs: documentIdentityValid ? finiteMetric(facts.dclMs) : NaN,
          lcpMs: documentIdentityValid ? finiteMetric(facts.lcpMs) : NaN,
          cls: documentIdentityValid ? finiteMetric(facts.cls) : NaN,
        },
      });
    } catch (error) {
      results.viewportResults.push({
        viewport: viewport.name,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
        accessibility: { status: 'unverified', reason: 'Page could not be audited' },
        performance: { route: route.path, viewport: viewport.name, dclMs: NaN, lcpMs: NaN, cls: NaN },
      });
    } finally {
      await context.close();
    }
  }
  results.linkResult ??= { status: 'unverified', reason: 'Desktop public route could not be audited', details: {} };
  results.formResult ??= { status: 'unverified', reason: 'Desktop public route could not be audited', details: {} };
  results.seoResult ??= { status: 'unverified', reason: 'Desktop public route could not be audited', details: {} };
  results.linkResult.details = { ...results.linkResult.details, links: visitedLinks, brokenInternal, unresolvedFragments, route: route.path };
  results.formResult.details = { ...results.formResult.details, route: route.path };
  results.seoResult.details = { ...results.seoResult.details, route: route.path };
  results.timestamp = timestamp;
  results.buildIdentity = expectedBuild;
  return results;
}

async function inspectAnonymousPortal(browser, client, base, timestamp) {
  const probe = client.unauthenticatedAccessProbe;
  if (!probe?.route || !probe?.deniedPath) {
    return { status: 'unverified', reason: 'Client manifest has no anonymous portal access probe', details: {} };
  }
  const target = new URL(probe.route, `${base.replace(/\/$/, '')}/`).toString();
  const context = await browser.newContext({ extraHTTPHeaders: headers });
  try {
    const page = await context.newPage();
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const result = evaluateAnonymousPortalDenial({
      responseStatus: response?.status() || 0,
      requestedUrl: target,
      finalUrl: page.url(),
      expectedDeniedPath: probe.deniedPath,
      expectedQuery: probe.query || {},
    });
    return { ...result, details: { ...result.details, evidenceType: 'unauthenticated-denial', timestamp, target, finalUrl: page.url() } };
  } catch (error) {
    return { status: 'unverified', reason: `Anonymous portal probe could not be completed: ${error instanceof Error ? error.message : String(error)}`, details: { target, timestamp } };
  } finally {
    await context.close();
  }
}

async function run() {
  const reportTimestamp = new Date().toISOString();
  const records = [];
  const clientReports = [];
  const browser = await chromium.launch({ headless: true });
  try {
    for (const client of clients) {
      const base = clientBase(client);
      const websiteRoutes = client.deployment.routes.filter((route) => route.capability === 'website');
      if (!base) {
        for (const checkId of ['website:links-navigation', 'website:forms', 'website:accessibility', 'website:seo', 'website:performance']) {
          records.push(failedRecord(checkId, 'unverified', `No ${environment} base URL was supplied`, reportTimestamp));
        }
        if (client.installedCapabilities.includes('security')) records.push(failedRecord('security:authorization-boundaries', 'unverified', 'No deployment URL was supplied for the anonymous portal probe', reportTimestamp));
        continue;
      }
      let baseUrl;
      try {
        baseUrl = new URL(base);
        if (baseUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname)) throw new Error('Certification browser evidence requires a non-local HTTPS deployment');
      } catch (error) {
        for (const checkId of ['website:links-navigation', 'website:forms', 'website:accessibility', 'website:seo', 'website:performance']) {
          records.push(failedRecord(checkId, 'unverified', error instanceof Error ? error.message : 'Invalid deployment URL', reportTimestamp));
        }
        if (client.installedCapabilities.includes('security')) records.push(failedRecord('security:authorization-boundaries', 'unverified', error instanceof Error ? error.message : 'Invalid deployment URL', reportTimestamp));
        continue;
      }

      let build = null;
      try {
        const response = await fetch(new URL('/api/ops/build-info', baseUrl), { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (response.ok) build = await response.json();
      } catch {}
      const identityValid = build?.commitSha === sourceCommit && build?.environment === environment && typeof build?.deploymentId === 'string' && build.deploymentId.length > 0;
      const auditResults = [];
      for (const route of websiteRoutes) auditResults.push(await inspectRoute(browser, client, route, baseUrl.toString(), { commitSha: build?.commitSha || null, environment: build?.environment || null, deploymentId: build?.deploymentId || null }, reportTimestamp));
      const portalProbe = client.installedCapabilities.includes('portal')
        ? await inspectAnonymousPortal(browser, client, baseUrl.toString(), reportTimestamp)
        : null;
      clientReports.push({ clientId: client.id, displayName: client.displayName, baseUrl: baseUrl.origin, sourceCommit, environment, buildInfo: build, identityValid, routes: auditResults, portalAnonymousAccess: portalProbe });

      const routeResults = auditResults;
      const noAuditErrors = identityValid;
      const statusOrUnverified = (result) => !noAuditErrors
        ? { ...result, status: 'unverified', reason: 'The deployed build did not verify the requested source commit and environment' }
        : result;
      const combine = (key) => {
        const values = routeResults.map((route) => route[key]);
        if (!values.length) return { status: 'unverified', reason: 'No configured website route was available', details: {} };
        const failed = values.filter((value) => value.status === 'failed');
        const unverified = values.filter((value) => value.status === 'unverified');
        const passed = values.filter((value) => value.status === 'passed');
        if (failed.length) return { status: 'failed', reason: failed.map((value) => value.reason).join('; '), details: { routes: values.map((value) => value.details) } };
        if (unverified.length || passed.length !== values.length) return { status: 'unverified', reason: unverified.map((value) => value.reason).join('; ') || 'One or more route checks were incomplete', details: { routes: values.map((value) => value.details) } };
        return { status: 'passed', reason: '', details: { routes: values.map((value) => value.details) } };
      };
      const allAccessibility = routeResults.flatMap((route) => route.viewportResults.map((view) => view.accessibility));
      const allPerformance = routeResults.flatMap((route) => route.viewportResults.map((view) => view.performance));
      const checks = {
        'website:links-navigation': combine('linkResult'),
        'website:forms': combine('formResult'),
        'website:seo': combine('seoResult'),
        'website:accessibility': identityValid
          ? allAccessibility.some((item) => item.status === 'failed')
            ? { status: 'failed', reason: 'Automated accessibility scan found violations', details: { routes: routeResults.map((route) => ({ route: route.route, viewports: route.viewportResults.map((view) => ({ viewport: view.viewport, accessibility: view.accessibility })) })) } }
            : allAccessibility.length && allAccessibility.every((item) => item.status === 'passed')
              ? { status: 'passed', reason: '', details: { scope: 'axe-core automated WCAG 2.0 A/AA and WCAG 2.1 AA rules', routes: routeResults.length, viewports: allAccessibility.length } }
              : { status: 'unverified', reason: 'Accessibility could not be measured on every desktop/mobile route', details: {} }
          : { status: 'unverified', reason: 'The deployed build did not verify the requested source commit and environment', details: {} },
        'website:performance': identityValid
          ? evaluatePerformanceAudit(allPerformance, limits)
          : { status: 'unverified', reason: 'The deployed build did not verify the requested source commit and environment', details: { samples: allPerformance, thresholds: limits } },
      };
      for (const [checkId, result] of Object.entries(checks)) {
        records.push(auditEvidenceRecord({ checkId, result: statusOrUnverified(result), sourceCommit: identityValid ? build.commitSha : sourceCommit, environment, timestamp: reportTimestamp, evidenceRef: evidenceRef(checkId), deploymentId: identityValid ? build.deploymentId : null }));
      }
      if (client.installedCapabilities.includes('security')) {
        const result = identityValid ? portalProbe || { status: 'unverified', reason: 'No anonymous portal access probe was run', details: {} } : { status: 'unverified', reason: 'The deployed build did not verify the requested source commit and environment', details: {} };
        records.push(auditEvidenceRecord({ checkId: 'security:authorization-boundaries', result, sourceCommit: identityValid ? build.commitSha : sourceCommit, environment, timestamp: reportTimestamp, evidenceRef: evidenceRef('security:authorization-boundaries'), deploymentId: identityValid ? build.deploymentId : null }));
      }
    }
  } finally {
    await browser.close();
  }
  mkdirSync(resolve(outputPath, '..'), { recursive: true });
  mkdirSync(resolve(reportPath, '..'), { recursive: true });
  const report = { schemaVersion: 1, sourceCommit, environment, generatedAt: reportTimestamp, clients: clientReports, evidence: records };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`);
  console.log(JSON.stringify({ sourceCommit, environment, evidence: records.map(({ checkId, status, reason }) => ({ checkId, status, reason })), outputPath, reportPath }, null, 2));
  if (records.some((record) => record.status === 'failed')) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await run();
