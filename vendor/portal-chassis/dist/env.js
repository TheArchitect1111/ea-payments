// lib/env.ts
function isProductionDeploy() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}
function isDemoMode() {
  return process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
}
function allowSampleData() {
  return !isProductionDeploy() || isDemoMode();
}
function requireEnv(name) {
  const value = process.env[name]?.trim();
  return value || null;
}
function adminEmail(fallback = "") {
  return process.env.ADMIN_EMAIL?.trim() || fallback;
}

export { adminEmail, allowSampleData, isDemoMode, isProductionDeploy, requireEnv };
//# sourceMappingURL=env.js.map
//# sourceMappingURL=env.js.map