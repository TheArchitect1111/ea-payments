export function evaluateLinkAudit({ links = [], brokenInternal = [], unresolvedFragments = [], probeLimitExceeded = false } = {}) {
  const malformed = links.filter((link) => !link.href || link.href === '#' || !link.hasAccessibleName);
  if (!links.length) return { status: 'failed', reason: 'No links were found on the public page', details: { links: 0 } };
  if (malformed.length || brokenInternal.length || unresolvedFragments.length) {
    return {
      status: 'failed',
      reason: 'One or more links are missing a usable destination or accessible name, broken, or point to a missing page anchor',
      details: { links: links.length, malformed, brokenInternal, unresolvedFragments },
    };
  }
  if (probeLimitExceeded) return { status: 'unverified', reason: 'The safe same-origin link count exceeded the configured probe limit', details: { links: links.length, probeLimitExceeded: true } };
  return { status: 'passed', reason: '', details: { links: links.length, internalLinksChecked: links.filter((link) => link.sameOrigin && link.probed).length } };
}

export function evaluateFormAudit(forms = []) {
  if (!forms.length) return { status: 'failed', reason: 'No public form was found on the configured website routes', details: { forms: 0 } };
  const invalid = forms.flatMap((form, index) => {
    const issues = [];
    if (!form.hasSubmitControl) issues.push('form has no submit control');
    if (!form.fields.length) issues.push('form has no named fields');
    for (const field of form.fields) {
      if (!field.name) issues.push(`field ${field.type} has no name`);
      if (!field.hasAccessibleName) issues.push(`field ${field.name || field.type} has no associated label`);
    }
    return issues.map((issue) => `form ${index + 1}: ${issue}`);
  });
  if (invalid.length) return { status: 'failed', reason: invalid.join('; '), details: { forms: forms.length, issues: invalid } };
  return {
    status: 'unverified',
    reason: 'Form structure and labels passed inspection, but no safe test submission/receipt was configured; backend delivery is unverified',
    details: { forms: forms.length, submissionPerformed: false },
  };
}

export function evaluateAccessibilityAudit(violations = []) {
  const meaningful = violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact || 'unknown',
    description: violation.help || violation.description || 'Accessibility violation',
    nodes: Number(violation.nodes?.length || 0),
  }));
  return meaningful.length
    ? { status: 'failed', reason: `Automated accessibility scan found ${meaningful.length} violation(s)`, details: { violations: meaningful } }
    : { status: 'passed', reason: '', details: { violations: [], scope: 'axe-core WCAG 2.0 A/AA and WCAG 2.1 AA automated rules' } };
}

export function evaluateAnonymousPortalDenial({ responseStatus, requestedUrl, finalUrl, expectedDeniedPath, expectedQuery = {} } = {}) {
  if (!requestedUrl || !finalUrl || !expectedDeniedPath) {
    return { status: 'unverified', reason: 'A portal route and configured anonymous-denial destination are required', details: {} };
  }
  let requested;
  let final;
  try { requested = new URL(requestedUrl); final = new URL(finalUrl); } catch {
    return { status: 'unverified', reason: 'Portal probe returned an invalid URL', details: {} };
  }
  const denied = responseStatus === 401 || responseStatus === 403
    || (final.origin === requested.origin
      && final.pathname.replace(/\/+$/, '') === expectedDeniedPath.replace(/\/+$/, '')
      && Object.entries(expectedQuery).every(([key, value]) => final.searchParams.get(key) === value));
  return denied
    ? {
      status: 'passed',
      reason: '',
      details: {
        responseStatus,
        requestedPath: requested.pathname,
        deniedPath: final.pathname,
        denialMode: responseStatus === 401 || responseStatus === 403 ? 'http-denial' : 'configured-redirect',
        scope: 'anonymous request only; authenticated roles, tenant isolation, and authorization matrix are not proven',
      },
    }
    : {
      status: 'failed',
      reason: 'Anonymous portal request did not reach the configured denial destination or return HTTP 401/403',
      details: { responseStatus, requestedPath: requested.pathname, finalPath: final.pathname, expectedDeniedPath, expectedQuery },
    };
}

export function evaluateSeoAudit(seo, { environment = 'preview' } = {}) {
  const issues = [];
  if (!seo?.title || seo.title.trim().length < 10) issues.push('page title is missing or shorter than 10 characters');
  if (!seo?.description || seo.description.trim().length < 50) issues.push('meta description is missing or shorter than 50 characters');
  if (!seo?.canonical || !seo.canonicalValid) issues.push('canonical URL is missing or invalid');
  if (seo?.h1Count !== 1) issues.push(`expected one primary H1; found ${seo?.h1Count ?? 0}`);
  if (environment === 'production' && seo?.noindex) issues.push('production page is marked noindex');
  return issues.length
    ? { status: 'failed', reason: issues.join('; '), details: { ...seo, issues } }
    : { status: 'passed', reason: '', details: { ...seo, issues: [], scope: 'title, description, canonical, primary heading, and production indexability' } };
}

export function evaluatePerformanceAudit(samples = [], { dclMs = 5000, lcpMs = 4000, cls = 0.1 } = {}) {
  if (!samples.length || samples.some((sample) => !Number.isFinite(sample.dclMs) || !Number.isFinite(sample.lcpMs) || !Number.isFinite(sample.cls))) {
    return { status: 'unverified', reason: 'Required desktop/mobile navigation and Core Web Vitals measurements were unavailable', details: { samples } };
  }
  const failures = samples.flatMap((sample) => [
    ...(sample.dclMs > dclMs ? [`${sample.route} ${sample.viewport}: DOMContentLoaded ${Math.round(sample.dclMs)}ms exceeds ${dclMs}ms`] : []),
    ...(sample.lcpMs > lcpMs ? [`${sample.route} ${sample.viewport}: LCP ${Math.round(sample.lcpMs)}ms exceeds ${lcpMs}ms`] : []),
    ...(sample.cls > cls ? [`${sample.route} ${sample.viewport}: CLS ${sample.cls.toFixed(3)} exceeds ${cls}`] : []),
  ]);
  return failures.length
    ? { status: 'failed', reason: failures.join('; '), details: { samples, thresholds: { dclMs, lcpMs, cls } } }
    : { status: 'passed', reason: '', details: { samples, thresholds: { dclMs, lcpMs, cls }, note: 'Single-run lab measurements; production field monitoring remains a separate operations requirement' } };
}

export function auditEvidenceRecord({ checkId, result, sourceCommit, environment, timestamp, evidenceRef, deploymentId = null }) {
  return {
    checkId,
    status: result.status,
    reason: result.reason,
    sourceCommit,
    environment,
    timestamp,
    evidenceRef,
    evidenceType: 'live-browser-audit',
    ...(deploymentId ? { deploymentId } : {}),
    auditDetails: result.details,
  };
}

