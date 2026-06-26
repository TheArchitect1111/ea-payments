'use strict';

// config/tenant-env.ts
function requiredEnvForTenant(tenant) {
  const reqs = [];
  if (tenant.airtable.baseId) {
    reqs.push({ key: "AIRTABLE_PAT", purpose: "Airtable data access", required: true });
  }
  reqs.push(
    { key: "RESEND_API_KEY", purpose: "Transactional + welcome email", required: true },
    { key: "RESEND_FROM_EMAIL", purpose: "Default from-address (overridable per tenant)", required: true },
    { key: "ADMIN_EMAIL", purpose: "Admin alerts (new users, messages)", required: true }
  );
  const provider = tenant.auth?.provider ?? "hmac";
  if (provider === "hmac") {
    reqs.push({
      key: tenant.auth?.secretEnvKey ?? "PORTAL_SESSION_SECRET",
      purpose: "HMAC session signing secret (fail-closed in production)",
      required: true
    });
  } else if (provider === "clerk") {
    reqs.push(
      { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", purpose: "Clerk auth (public)", required: true },
      { key: "CLERK_SECRET_KEY", purpose: "Clerk auth (server)", required: true }
    );
  }
  reqs.push(
    { key: "NEXT_PUBLIC_SENTRY_DSN", purpose: "Runtime error monitoring", required: false },
    { key: "UPTIME_MONITORING_URL", purpose: "External uptime monitor reference", required: false },
    { key: "BACKUP_DESTINATION_URI", purpose: "Documented encrypted backup destination", required: false }
  );
  return reqs;
}
function checkTenantEnv(tenant) {
  const reqs = requiredEnvForTenant(tenant);
  const present = [];
  const missingRequired = [];
  const missingRecommended = [];
  for (const req of reqs) {
    const value = process.env[req.key]?.trim();
    if (value) {
      present.push(req.key);
    } else if (req.required) {
      missingRequired.push(req);
    } else {
      missingRecommended.push(req);
    }
  }
  return { ok: missingRequired.length === 0, missingRequired, missingRecommended, present };
}
function validateTenant(tenant) {
  const errors = [];
  const warnings = [];
  if (!tenant.id?.trim()) errors.push("tenant.id is required");
  if (!tenant.brand?.name?.trim()) errors.push("tenant.brand.name is required");
  if (!tenant.brand?.logo?.trim()) warnings.push("tenant.brand.logo is empty");
  if (!tenant.brand?.colors?.primary?.trim()) errors.push("tenant.brand.colors.primary is required");
  if (!tenant.brand?.fromEmail?.trim()) errors.push("tenant.brand.fromEmail is required");
  if (!tenant.brand?.supportEmail?.trim()) warnings.push("tenant.brand.supportEmail is empty");
  if (!tenant.urls?.canonical?.trim()) {
    errors.push("tenant.urls.canonical is required");
  } else if (!/^https:\/\//.test(tenant.urls.canonical)) {
    warnings.push("tenant.urls.canonical should be an https:// production URL");
  } else if (/vercel\.app/.test(tenant.urls.canonical)) {
    warnings.push("tenant.urls.canonical points at a vercel.app preview domain, not a custom canonical domain");
  }
  if (!tenant.airtable?.baseId?.trim()) {
    warnings.push("tenant.airtable.baseId is empty \u2014 data + provisioning will not work");
  }
  if (!tenant.airtable?.tables || Object.keys(tenant.airtable.tables).length === 0) {
    warnings.push("tenant.airtable.tables is empty \u2014 provisioning has no target table");
  }
  if (!tenant.modules || tenant.modules.length === 0) {
    warnings.push("tenant.modules is empty \u2014 no portal modules enabled");
  }
  const provider = tenant.auth?.provider;
  if (provider && provider !== "hmac" && provider !== "clerk") {
    errors.push(`tenant.auth.provider must be "hmac" or "clerk" (got "${provider}")`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

exports.checkTenantEnv = checkTenantEnv;
exports.requiredEnvForTenant = requiredEnvForTenant;
exports.validateTenant = validateTenant;
//# sourceMappingURL=tenant-env.cjs.map
//# sourceMappingURL=tenant-env.cjs.map