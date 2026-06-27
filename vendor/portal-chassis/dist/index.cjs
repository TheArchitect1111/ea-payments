'use strict';

var nextjs = require('@clerk/nextjs');
var jsxRuntime = require('react/jsx-runtime');
var server = require('@clerk/nextjs/server');
var server$1 = require('next/server');
var navigation = require('next/navigation');
var Link = require('next/link');
var react = require('react');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Link__default = /*#__PURE__*/_interopDefault(Link);

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
function ClerkShell({ brandColor, logoSrc, portalName, tagline, mode }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("style", { children: `
        .cs-root {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
        }
        .cs-left {
          flex: 0 0 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12, 48px) var(--space-8, 32px);
          gap: var(--space-6, 24px);
        }
        .cs-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .cs-portal-name {
          margin: 0;
          color: #ffffff;
          font-family: var(--font-display, 'Inter', sans-serif);
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
        }
        .cs-tagline {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 1rem;
          text-align: center;
          max-width: 320px;
          line-height: 1.5;
        }
        .cs-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg, #ffffff);
          padding: var(--space-12, 48px) var(--space-6, 24px);
        }
        @media (max-width: 768px) {
          .cs-left { display: none; }
          .cs-right { flex: 1; width: 100%; }
        }
      ` }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "cs-root", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "cs-left", style: { backgroundColor: brandColor }, children: [
        /* @__PURE__ */ jsxRuntime.jsx("img", { src: logoSrc, alt: `${portalName} logo`, className: "cs-logo" }),
        /* @__PURE__ */ jsxRuntime.jsx("h1", { className: "cs-portal-name", children: portalName }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "cs-tagline", children: tagline })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "cs-right", children: mode === "sign-in" ? /* @__PURE__ */ jsxRuntime.jsx(nextjs.SignIn, {}) : /* @__PURE__ */ jsxRuntime.jsx(nextjs.SignUp, {}) })
    ] })
  ] });
}
function createPortalMiddleware(cfg) {
  const isPublic = server.createRouteMatcher(cfg.publicRoutes.map((r) => `${r}(.*)?`));
  const isAdmin = server.createRouteMatcher(cfg.adminPrefixes.map((r) => `${r}(.*)`));
  const middleware = server.clerkMiddleware(async (auth2, request) => {
    if (isPublic(request)) return;
    await auth2.protect();
    if (isAdmin(request)) {
      const { sessionClaims } = await auth2();
      const role = sessionClaims?.publicMetadata?.role;
      if (role !== "Officer" && role !== "Admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  });
  const config = {
    matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"]
  };
  return { middleware, config };
}
var ROLE_LEVEL = {
  Member: 1,
  Officer: 2,
  Admin: 3
};
function RoleGuard({ requiredRole, fallback = null, children }) {
  const { user, isLoaded } = nextjs.useUser();
  if (!isLoaded) return null;
  const role = user?.publicMetadata?.role;
  const userLevel = ROLE_LEVEL[role ?? ""] ?? 0;
  const requiredLevel = ROLE_LEVEL[requiredRole] ?? 0;
  if (userLevel < requiredLevel) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: fallback });
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children });
}
var ROLE_LEVEL2 = {
  Member: 1,
  Officer: 2,
  Admin: 3
};
function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function withRoleProtection(_request, requiredRole) {
  const { userId, sessionClaims } = await server.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);
  const role = sessionClaims?.publicMetadata?.role;
  const userLevel = ROLE_LEVEL2[role ?? ""] ?? 0;
  const requiredLevel = ROLE_LEVEL2[requiredRole] ?? 0;
  if (userLevel < requiredLevel) return json({ error: "Forbidden" }, 403);
  return null;
}

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

// auth/hmac-session.ts
var DEFAULT_TTL_MS = 24 * 60 * 60 * 1e3;
function b64url(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function fromB64url(s) {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function resolveSecret(config) {
  const secret = process.env[config.secretEnvKey]?.trim();
  if (secret) return secret;
  if (isProductionDeploy()) return null;
  return config.devSecret || "ea-portal-dev-secret-change-in-prod";
}
async function getKey(config) {
  const secret = resolveSecret(config);
  if (!secret) return null;
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function newSessionExpiry(ttlMs = DEFAULT_TTL_MS) {
  return Date.now() + ttlMs;
}
async function signHmacSession(session, config) {
  const payload = JSON.stringify(session);
  const payloadB64 = b64url(new TextEncoder().encode(payload));
  const key = await getKey(config);
  if (!key) return null;
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${b64url(sig)}`;
}
async function verifyHmacSession(token, config) {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const key = await getKey(config);
    if (!key) return null;
    const sigBytes = fromB64url(sigB64);
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(fromB64url(payloadB64)));
    if (session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}
function makeSessionCookie(name, value, ttlMs = DEFAULT_TTL_MS) {
  return {
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlMs / 1e3
  };
}
function createHmacPortalMiddleware(cfg) {
  const adminPrefix = cfg.adminPathPrefix ?? "/admin";
  const adminLogin = cfg.adminLoginPath ?? `${adminPrefix}/login`;
  const adminPublic = new Set(cfg.adminPublicPaths ?? [
    `${adminPrefix}/login`,
    `${adminPrefix}/forgot-password`,
    `${adminPrefix}/reset-password`
  ]);
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    if (cfg.adminCookieName && (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`))) {
      const isPublic = [...adminPublic].some((p) => pathname === p || pathname.startsWith(`${p}/`));
      if (isPublic) return server$1.NextResponse.next();
      if (req.cookies.get(cfg.adminCookieName)?.value) return server$1.NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = adminLogin;
      url.searchParams.set("next", pathname + req.nextUrl.search);
      return server$1.NextResponse.redirect(url);
    }
    for (const route of cfg.roleRoutes) {
      if (!pathname.startsWith(route.pathPrefix)) continue;
      const cookieVal = req.cookies.get(cfg.cookieName)?.value ?? "";
      const session = cookieVal ? await verifyHmacSession(cookieVal, cfg.session) : null;
      if (!session) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = cfg.loginPath;
        return server$1.NextResponse.redirect(loginUrl);
      }
      const parts = pathname.split("/");
      const prefixParts = route.pathPrefix.split("/").filter(Boolean);
      const urlRole = parts[prefixParts.length] ?? "";
      const urlSlug = parts[prefixParts.length + 1] ?? "";
      const roleField = route.roleField ?? "type";
      const sessionRole = roleField === "type" ? String(session.type ?? "") : roleField === "slug" ? String(session.slug ?? "") : "";
      const sessionSlug = String(session.slug ?? "");
      if (sessionRole !== route.roleValue || sessionRole !== urlRole || sessionSlug !== urlSlug) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = cfg.loginPath;
        return server$1.NextResponse.redirect(loginUrl);
      }
      return server$1.NextResponse.next();
    }
    return server$1.NextResponse.next();
  }
  const matchers = [
    ...cfg.adminCookieName ? [adminPrefix, `${adminPrefix}/:path*`] : [],
    ...cfg.roleRoutes.map((r) => `${r.pathPrefix}:path*`)
  ];
  return {
    middleware,
    config: { matcher: matchers }
  };
}
var ADMIN_ROLES = ["Officer", "Admin"];
function PortalLayout({
  portalName,
  logoSrc,
  brandColor,
  accentColor,
  navItems,
  adminNavItems = [],
  mobileNavStyle = "bottom",
  children
}) {
  const pathname = navigation.usePathname();
  const { user } = nextjs.useUser();
  const [sheetOpen, setSheetOpen] = react.useState(false);
  const role = user?.publicMetadata?.role;
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const visibleNav = [...navItems, ...isAdmin ? adminNavItems : []];
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("style", { children: `
        .pl-root {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
          background-color: var(--color-bg, #0f0f12);
          color: var(--color-text, #f5f5f5);
          font-family: var(--font-body, 'Inter', sans-serif);
        }

        /* \u2500\u2500 Sidebar (desktop) \u2500\u2500 */
        .pl-sidebar {
          width: 240px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--color-surface, #1a1a22);
          border-right: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .pl-sidebar-header {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          padding: var(--space-6, 24px) var(--space-4, 16px) var(--space-4, 16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .pl-sidebar-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: var(--radius-sm, 4px);
        }
        .pl-sidebar-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--color-text, #f5f5f5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pl-nav {
          flex: 1;
          padding: var(--space-4, 16px) var(--space-2, 8px);
          display: flex;
          flex-direction: column;
          gap: var(--space-1, 4px);
        }
        .pl-nav-section-label {
          padding: var(--space-3, 12px) var(--space-3, 12px) var(--space-1, 4px);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-text-muted, #888);
        }
        .pl-nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          padding: var(--space-2, 8px) var(--space-3, 12px);
          border-radius: var(--radius-md, 8px);
          text-decoration: none;
          font-size: 0.9rem;
          color: var(--color-text-muted, #888);
          transition: background 0.15s, color 0.15s;
        }
        .pl-nav-link:hover {
          background-color: rgba(255,255,255,0.06);
          color: var(--color-text, #f5f5f5);
        }
        .pl-nav-link.active {
          color: var(--color-text, #f5f5f5);
          font-weight: 600;
        }
        .pl-nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .pl-sidebar-footer {
          padding: var(--space-4, 16px);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
        }
        .pl-user-name {
          font-size: 0.85rem;
          color: var(--color-text, #f5f5f5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* \u2500\u2500 Main content \u2500\u2500 */
        .pl-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pl-content {
          flex: 1;
          padding: var(--space-8, 32px);
          overflow-y: auto;
        }

        /* \u2500\u2500 Mobile: hamburger header \u2500\u2500 */
        .pl-mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4, 16px);
          background-color: var(--color-surface, #1a1a22);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .pl-mobile-header-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
        }
        .pl-mobile-logo {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }
        .pl-hamburger {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-2, 8px);
          color: var(--color-text, #f5f5f5);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pl-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: currentColor;
          border-radius: 2px;
        }

        /* \u2500\u2500 Sheet drawer (mobile) \u2500\u2500 */
        .pl-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 50;
        }
        .pl-sheet {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background-color: var(--color-surface, #1a1a22);
          z-index: 51;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        /* \u2500\u2500 Bottom nav (mobile) \u2500\u2500 */
        .pl-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-surface, #1a1a22);
          border-top: 1px solid rgba(255,255,255,0.06);
          z-index: 40;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .pl-bottom-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 56px;
        }
        .pl-bottom-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          font-size: 0.65rem;
          color: var(--color-text-muted, #888);
          padding: var(--space-1, 4px) var(--space-2, 8px);
          flex: 1;
        }
        .pl-bottom-link.active {
          color: var(--color-text, #f5f5f5);
        }
        .pl-bottom-link svg, .pl-bottom-link .pl-nav-icon {
          width: 22px;
          height: 22px;
        }

        @media (max-width: 768px) {
          .pl-sidebar { display: none; }
          .pl-mobile-header { display: flex; }
          .pl-content { padding: var(--space-4, 16px); }
          .pl-bottom-nav-show { display: block; }
          .pl-content-bottom-pad { padding-bottom: 72px; }
        }
        @media (min-width: 769px) {
          .pl-sheet-overlay, .pl-sheet { display: none !important; }
          .pl-bottom-nav { display: none !important; }
        }
      ` }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-root", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("aside", { className: "pl-sidebar", style: { "--brand": brandColor }, children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-sidebar-header", children: [
          /* @__PURE__ */ jsxRuntime.jsx("img", { src: logoSrc, alt: `${portalName} logo`, className: "pl-sidebar-logo" }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "pl-sidebar-name", children: portalName })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("nav", { className: "pl-nav", children: [
          navItems.map((item) => /* @__PURE__ */ jsxRuntime.jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href)),
          isAdmin && adminNavItems.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pl-nav-section-label", children: "Admin" }),
            adminNavItems.map((item) => /* @__PURE__ */ jsxRuntime.jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-sidebar-footer", children: [
          /* @__PURE__ */ jsxRuntime.jsx(nextjs.UserButton, { afterSignOutUrl: "/login" }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "pl-user-name", children: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "" })
        ] })
      ] }),
      mobileNavStyle === "sheet" && sheetOpen && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pl-sheet-overlay", onClick: () => setSheetOpen(false) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-sheet", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-sidebar-header", children: [
            /* @__PURE__ */ jsxRuntime.jsx("img", { src: logoSrc, alt: "", className: "pl-sidebar-logo" }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "pl-sidebar-name", children: portalName })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("nav", { className: "pl-nav", onClick: () => setSheetOpen(false), children: [
            navItems.map((item) => /* @__PURE__ */ jsxRuntime.jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href)),
            isAdmin && adminNavItems.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
              /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pl-nav-section-label", children: "Admin" }),
              adminNavItems.map((item) => /* @__PURE__ */ jsxRuntime.jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-sidebar-footer", children: [
            /* @__PURE__ */ jsxRuntime.jsx(nextjs.UserButton, { afterSignOutUrl: "/login" }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "pl-user-name", children: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-main", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("header", { className: "pl-mobile-header", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "pl-mobile-header-brand", children: [
            /* @__PURE__ */ jsxRuntime.jsx("img", { src: logoSrc, alt: "", className: "pl-mobile-logo" }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontWeight: 700, fontSize: "0.9rem" }, children: portalName })
          ] }),
          mobileNavStyle === "sheet" && /* @__PURE__ */ jsxRuntime.jsxs("button", { className: "pl-hamburger", onClick: () => setSheetOpen(true), "aria-label": "Open menu", children: [
            /* @__PURE__ */ jsxRuntime.jsx("span", {}),
            /* @__PURE__ */ jsxRuntime.jsx("span", {}),
            /* @__PURE__ */ jsxRuntime.jsx("span", {})
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx(nextjs.UserButton, { afterSignOutUrl: "/login" })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("main", { className: `pl-content${mobileNavStyle === "bottom" ? " pl-content-bottom-pad" : ""}`, children })
      ] }),
      mobileNavStyle === "bottom" && /* @__PURE__ */ jsxRuntime.jsx("nav", { className: "pl-bottom-nav pl-bottom-nav-show", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pl-bottom-nav-inner", children: visibleNav.slice(0, 5).map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxRuntime.jsxs(
          Link__default.default,
          {
            href: item.href,
            className: `pl-bottom-link${isActive(item.href) ? " active" : ""}`,
            style: isActive(item.href) ? { color: brandColor } : void 0,
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(Icon, { className: "pl-nav-icon" }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: item.label })
            ]
          },
          item.href
        );
      }) }) })
    ] })
  ] });
}
function NavLink({
  item,
  active,
  brandColor
}) {
  const Icon = item.icon;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    Link__default.default,
    {
      href: item.href,
      className: `pl-nav-link${active ? " active" : ""}`,
      style: active ? { backgroundColor: `${brandColor}22`, color: brandColor } : void 0,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(Icon, { className: "pl-nav-icon" }),
        item.label
      ]
    }
  );
}
function HeaderPortalShell({
  logoSrc,
  nameLine1,
  nameLine2,
  tabs,
  activeTabId,
  logoutApiPath = "/api/portal/login",
  loginPath = "/portal/login",
  showLogout = true
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "header",
      {
        style: {
          background: "var(--portal-header-bg, #0C0C0A)",
          color: "var(--portal-header-text, #fff)",
          borderBottom: "3px solid var(--portal-accent, #C8102E)"
        },
        children: /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "16px 20px" }, children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap"
              },
              children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "img",
                    {
                      src: logoSrc,
                      alt: "",
                      style: { width: 48, height: 48, objectFit: "contain" }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontWeight: 800, letterSpacing: "0.04em", fontSize: 14 }, children: nameLine1 }),
                    nameLine2 ? /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontWeight: 800, letterSpacing: "0.04em", fontSize: 14, color: "var(--portal-accent, #C8102E)" }, children: nameLine2 }) : null
                  ] })
                ] }),
                showLogout ? /* @__PURE__ */ jsxRuntime.jsx(
                  "button",
                  {
                    type: "button",
                    "data-portal-logout": "1",
                    style: {
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.35)",
                      color: "inherit",
                      padding: "8px 14px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13
                    },
                    children: "Log Out"
                  }
                ) : null
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "nav",
            {
              "aria-label": "Portal sections",
              style: {
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16
              },
              children: tabs.map((tab) => /* @__PURE__ */ jsxRuntime.jsx(
                "a",
                {
                  href: tab.href,
                  style: {
                    padding: "8px 14px",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: tab.id === activeTabId ? 700 : 500,
                    color: tab.id === activeTabId ? "#fff" : "rgba(255,255,255,0.75)",
                    background: tab.id === activeTabId ? "var(--portal-accent, #C8102E)" : "rgba(255,255,255,0.08)"
                  },
                  children: tab.label
                },
                tab.id
              ))
            }
          )
        ] })
      }
    ),
    showLogout ? /* @__PURE__ */ jsxRuntime.jsx(
      "script",
      {
        dangerouslySetInnerHTML: {
          __html: `document.querySelector('[data-portal-logout]')?.addEventListener('click',function(){fetch('${logoutApiPath}',{method:'DELETE'}).finally(function(){window.location.href='${loginPath}';});});`
        }
      }
    ) : null
  ] });
}
function BriefExperience({ brief, moduleName }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief", "aria-label": moduleName ? `${moduleName} brief` : "Brief", children: [
    /* @__PURE__ */ jsxRuntime.jsx("style", { children: briefStyles }),
    /* @__PURE__ */ jsxRuntime.jsxs("header", { className: "ea-brief-header", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: brief.greeting }),
      /* @__PURE__ */ jsxRuntime.jsx("h1", { children: "What needs attention right now" })
    ] }),
    brief.topPriority ? /* @__PURE__ */ jsxRuntime.jsx(UniversalBriefCard, { card: brief.topPriority, emphasis: "primary" }) : null,
    /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief-section", "aria-label": "Recommended actions", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Recommended Actions" }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-brief-stack", children: brief.recommendedActions.map((card) => /* @__PURE__ */ jsxRuntime.jsx(UniversalBriefCard, { card }, card.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief-section", "aria-label": "Today activity", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Today's Activity" }),
      /* @__PURE__ */ jsxRuntime.jsx(ActivityTimeline, { cards: brief.todaysActivity.length > 0 ? brief.todaysActivity : brief.recentEvents })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(QuickActions, { actions: brief.quickActions })
  ] });
}
function UniversalBriefCard({ card, emphasis = "default" }) {
  const body = /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "ea-card-kicker", children: card.module }),
      /* @__PURE__ */ jsxRuntime.jsx("h3", { children: card.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "ea-card-summary", children: card.summary })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ea-card-footer", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { children: card.metric }),
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: card.actionLabel })
    ] })
  ] });
  if (card.actionUrl) {
    return /* @__PURE__ */ jsxRuntime.jsx("a", { className: `ea-brief-card ea-brief-card-${emphasis}`, href: card.actionUrl, children: body });
  }
  return /* @__PURE__ */ jsxRuntime.jsx("article", { className: `ea-brief-card ea-brief-card-${emphasis}`, children: body });
}
function ActivityTimeline({ cards }) {
  return /* @__PURE__ */ jsxRuntime.jsx("ol", { className: "ea-timeline", children: cards.map((card) => /* @__PURE__ */ jsxRuntime.jsxs("li", { children: [
    /* @__PURE__ */ jsxRuntime.jsx("span", { "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: card.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: card.summary })
    ] })
  ] }, card.id)) });
}
function QuickActions({ actions }) {
  if (actions.length === 0) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief-section", "aria-label": "Quick actions", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Quick Actions" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-quick-actions", children: actions.map((action) => /* @__PURE__ */ jsxRuntime.jsx("a", { href: action.href, children: action.label }, `${action.label}-${action.href}`)) })
  ] });
}
var briefStyles = `
  .ea-brief {
    width: min(100%, 760px);
    margin: 0 auto;
    display: grid;
    gap: 20px;
    color: var(--color-text, #141414);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .ea-brief-header {
    display: grid;
    gap: 4px;
  }
  .ea-brief-header p {
    margin: 0;
    color: var(--color-text-muted, #667085);
    font-size: 15px;
  }
  .ea-brief-header h1 {
    margin: 0;
    font-size: clamp(28px, 5vw, 40px);
    line-height: 1.05;
    letter-spacing: 0;
  }
  .ea-brief-section {
    display: grid;
    gap: 10px;
  }
  .ea-brief-section h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-muted, #667085);
  }
  .ea-brief-stack {
    display: grid;
    gap: 10px;
  }
  .ea-brief-card {
    display: grid;
    gap: 18px;
    padding: 18px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  }
  .ea-brief-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-accent, #1f6feb);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.09);
  }
  .ea-brief-card-primary {
    border-color: var(--color-accent, #1f6feb);
  }
  .ea-card-kicker {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-accent, #1f6feb);
  }
  .ea-brief-card h3 {
    margin: 0;
    font-size: 19px;
    line-height: 1.2;
    letter-spacing: 0;
  }
  .ea-card-summary {
    margin: 8px 0 0;
    color: var(--color-text-muted, #667085);
    line-height: 1.5;
  }
  .ea-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }
  .ea-card-footer span {
    color: var(--color-text-muted, #667085);
  }
  .ea-card-footer strong {
    color: var(--color-accent, #1f6feb);
  }
  .ea-timeline {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ea-timeline li {
    display: grid;
    grid-template-columns: 12px 1fr;
    gap: 10px;
  }
  .ea-timeline li > span {
    width: 8px;
    height: 8px;
    margin-top: 7px;
    border-radius: 50%;
    background: var(--color-accent, #1f6feb);
  }
  .ea-timeline strong {
    font-size: 14px;
  }
  .ea-timeline p {
    margin: 2px 0 0;
    color: var(--color-text-muted, #667085);
    font-size: 14px;
    line-height: 1.45;
  }
  .ea-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ea-quick-actions a {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    padding: 0 14px;
    border-radius: var(--radius-md, 8px);
    background: var(--color-accent, #1f6feb);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
  }
`;
function MissionControlExperience({
  mission,
  onIntentSubmit,
  mode = "executive"
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-mission", "aria-label": "Mission Control", children: [
    /* @__PURE__ */ jsxRuntime.jsx("style", { children: missionStyles }),
    /* @__PURE__ */ jsxRuntime.jsxs("header", { className: "ea-mission-header", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: mission.greeting }),
      /* @__PURE__ */ jsxRuntime.jsx("h1", { children: "Mission Control" }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "ea-mission-sub", children: "What would you like to accomplish?" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      IntentCommandBar,
      {
        examples: mission.intentExamples,
        onSubmit: onIntentSubmit
      }
    ),
    mission.momentum.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(MomentumStrip, { stats: mission.momentum }) : null,
    mission.topPriority ? /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-mission-zone", "aria-label": "Today's focus", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Today's Focus" }),
      /* @__PURE__ */ jsxRuntime.jsx(UniversalBriefCard, { card: mission.topPriority, emphasis: "primary" }),
      mission.recommendedActions.length > 1 ? /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-mission-stack", children: mission.recommendedActions.slice(1).map((card) => /* @__PURE__ */ jsxRuntime.jsx(UniversalBriefCard, { card }, card.id)) }) : null
    ] }) : null,
    mission.continueWorking.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(ContinueWorkingSection, { items: mission.continueWorking }) : null,
    mission.activeAgents.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(AgentPanel, { agents: mission.activeAgents }) : null,
    /* @__PURE__ */ jsxRuntime.jsx(ActionCardsSection, { cards: mission.actionCards, mode }),
    mission.todaysActivity.length > 0 || mission.recentEvents.length > 0 ? /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-mission-zone", "aria-label": "Recent activity", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "What is already happening" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        ActivityTimeline,
        {
          cards: mission.todaysActivity.length > 0 ? mission.todaysActivity : mission.recentEvents
        }
      )
    ] }) : null
  ] });
}
function IntentCommandBar({
  examples,
  onSubmit
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "form",
    {
      className: "ea-intent-bar",
      onSubmit: (e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("intent")?.value?.trim();
        if (input && onSubmit) onSubmit(input);
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            name: "intent",
            type: "text",
            placeholder: examples[0] ?? "What would you like to accomplish?",
            "aria-label": "What would you like to accomplish?",
            autoComplete: "off"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("button", { type: "submit", children: "Go" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-intent-examples", "aria-hidden": "true", children: examples.slice(0, 4).map((ex) => /* @__PURE__ */ jsxRuntime.jsx("span", { children: ex }, ex)) })
      ]
    }
  );
}
function MomentumStrip({ stats }) {
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-momentum", "aria-label": "Today's momentum", children: stats.map((s) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ea-momentum-item", children: [
    /* @__PURE__ */ jsxRuntime.jsx("strong", { children: s.value }),
    /* @__PURE__ */ jsxRuntime.jsx("span", { children: s.label })
  ] }, s.label)) });
}
function ContinueWorkingSection({
  items
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-mission-zone", "aria-label": "Continue working", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Continue Working" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-continue-grid", children: items.map((item) => /* @__PURE__ */ jsxRuntime.jsxs("a", { className: "ea-continue-card", href: item.href, children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ea-continue-module", children: item.module }),
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: item.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: item.summary })
    ] }, item.id)) })
  ] });
}
function AgentPanel({ agents }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-mission-zone", "aria-label": "My agents", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "My Agents" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-agent-grid", children: agents.map((agent) => /* @__PURE__ */ jsxRuntime.jsx(AgentRunCard, { agent }, agent.id)) })
  ] });
}
function AgentRunCard({ agent }) {
  const body = /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ea-agent-head", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { children: agent.agentKind }),
      /* @__PURE__ */ jsxRuntime.jsx(StatusPill, { status: agent.status })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("strong", { children: agent.task }),
    /* @__PURE__ */ jsxRuntime.jsx("p", { children: agent.summary }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-agent-progress", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntime.jsx("span", { style: { width: `${agent.progress}%` } }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ea-agent-meta", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
        agent.progress,
        "%"
      ] }),
      agent.reviewRequired ? /* @__PURE__ */ jsxRuntime.jsx("em", { children: "Review required" }) : null,
      agent.estimatedCompletion ? /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
        "ETA ",
        new Date(agent.estimatedCompletion).toLocaleTimeString()
      ] }) : null
    ] })
  ] });
  if (agent.actionUrl) {
    return /* @__PURE__ */ jsxRuntime.jsx("a", { className: "ea-agent-card", href: agent.actionUrl, children: body });
  }
  return /* @__PURE__ */ jsxRuntime.jsx("article", { className: "ea-agent-card", children: body });
}
function StatusPill({ status }) {
  return /* @__PURE__ */ jsxRuntime.jsx("span", { className: `ea-status ea-status-${status}`, children: status.replace("_", " ") });
}
function ActionCardsSection({
  cards,
  mode
}) {
  if (cards.length === 0) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-mission-zone", "aria-label": "Quick actions", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h2", { children: mode === "builder" ? "Build" : "Quick Actions" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-action-grid", children: cards.map((card) => /* @__PURE__ */ jsxRuntime.jsx("a", { className: "ea-action-card", href: card.href, title: card.intent, children: card.label }, card.id)) })
  ] });
}
var missionStyles = `
  .ea-mission {
    width: min(100%, 920px);
    margin: 0 auto;
    display: grid;
    gap: 28px;
    color: var(--color-text, #141414);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .ea-mission-header {
    display: grid;
    gap: 4px;
  }
  .ea-mission-header p {
    margin: 0;
    color: var(--color-text-muted, #667085);
    font-size: 15px;
  }
  .ea-mission-header h1 {
    margin: 0;
    font-size: clamp(32px, 5vw, 44px);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  .ea-mission-sub {
    margin-top: 4px !important;
    font-size: 17px !important;
    color: var(--color-text, #141414) !important;
  }
  .ea-mission-zone {
    display: grid;
    gap: 12px;
  }
  .ea-mission-zone h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted, #667085);
  }
  .ea-mission-stack {
    display: grid;
    gap: 10px;
  }
  .ea-intent-bar {
    display: grid;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 10px);
    background: var(--color-surface, #fff);
  }
  .ea-intent-bar input {
    width: 100%;
    min-height: 48px;
    padding: 0 16px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    font-size: 16px;
    background: var(--color-bg, #fafafa);
    color: inherit;
  }
  .ea-intent-bar input:focus {
    outline: 2px solid var(--color-accent, #1f6feb);
    outline-offset: 1px;
  }
  .ea-intent-bar button {
    justify-self: start;
    min-height: 40px;
    padding: 0 20px;
    border: 0;
    border-radius: var(--radius-md, 8px);
    background: var(--color-accent, #1f6feb);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }
  .ea-intent-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ea-intent-examples span {
    font-size: 12px;
    color: var(--color-text-muted, #667085);
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--color-bg, #f4f4f5);
  }
  .ea-momentum {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 14px 16px;
    border-radius: var(--radius-md, 8px);
    background: var(--color-bg, #f8f9fb);
  }
  .ea-momentum-item {
    display: grid;
    gap: 2px;
  }
  .ea-momentum-item strong {
    font-size: 22px;
    line-height: 1;
    color: var(--color-accent, #1f6feb);
  }
  .ea-momentum-item span {
    font-size: 12px;
    color: var(--color-text-muted, #667085);
  }
  .ea-continue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }
  .ea-continue-card {
    display: grid;
    gap: 6px;
    padding: 14px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
    transition: border-color 160ms ease;
  }
  .ea-continue-card:hover {
    border-color: var(--color-accent, #1f6feb);
  }
  .ea-continue-module {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-accent, #1f6feb);
  }
  .ea-continue-card strong {
    font-size: 15px;
  }
  .ea-continue-card p {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted, #667085);
    line-height: 1.4;
  }
  .ea-agent-grid {
    display: grid;
    gap: 10px;
  }
  .ea-agent-card {
    display: grid;
    gap: 8px;
    padding: 14px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
  }
  .ea-agent-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ea-agent-head span:first-child {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-text-muted, #667085);
  }
  .ea-agent-card strong {
    font-size: 15px;
  }
  .ea-agent-card p {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted, #667085);
  }
  .ea-agent-progress {
    height: 4px;
    border-radius: 999px;
    background: var(--color-bg, #eceff3);
    overflow: hidden;
  }
  .ea-agent-progress span {
    display: block;
    height: 100%;
    background: var(--color-accent, #1f6feb);
    border-radius: 999px;
  }
  .ea-agent-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: var(--color-text-muted, #667085);
  }
  .ea-agent-meta em {
    font-style: normal;
    font-weight: 700;
    color: var(--color-accent, #1f6feb);
  }
  .ea-status {
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-bg, #f4f4f5);
  }
  .ea-status-review_required,
  .ea-status-running {
    background: rgba(31, 111, 235, 0.12);
    color: var(--color-accent, #1f6feb);
  }
  .ea-action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .ea-action-card {
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    transition: border-color 160ms ease, background 160ms ease;
  }
  .ea-action-card:hover {
    border-color: var(--color-accent, #1f6feb);
    background: rgba(31, 111, 235, 0.04);
  }
`;

// lib/airtable-client.ts
var BASE_URL = "https://api.airtable.com/v0";
function headers() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT is not set");
  return { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" };
}
async function airtableGet(baseId, tableId, params) {
  const url = new URL(`${BASE_URL}/${baseId}/${tableId}`);
  if (params?.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);
  if (params?.maxRecords) url.searchParams.set("maxRecords", String(params.maxRecords));
  params?.fields?.forEach((f) => url.searchParams.append("fields[]", f));
  params?.sort?.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction);
  });
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`airtableGet ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.records;
}
async function airtableGetOne(baseId, tableId, recordId) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, { headers: headers() });
  if (!res.ok) throw new Error(`airtableGetOne ${res.status}: ${await res.text()}`);
  return res.json();
}
async function airtableCreate(baseId, tableId, fields) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`airtableCreate ${res.status}: ${await res.text()}`);
  return res.json();
}
async function airtableUpdate(baseId, tableId, recordId, fields) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`airtableUpdate ${res.status}: ${await res.text()}`);
  return res.json();
}
async function airtableDelete(baseId, tableId, recordId) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, {
    method: "DELETE",
    headers: headers()
  });
  if (!res.ok) throw new Error(`airtableDelete ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { deleted: data.deleted };
}

// lib/make-client.ts
async function triggerMakeWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { success: res.ok };
}

// lib/resend-client.ts
async function sendEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const from = payload.from ?? process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...payload, from })
  });
  if (!res.ok) throw new Error(`sendEmail ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { id: data.id };
}

// lib/admin-notify.ts
async function notifyAdmin(input) {
  const to = input.to || adminEmail();
  if (!to) {
    console.error("notifyAdmin: no ADMIN_EMAIL or to address");
    return false;
  }
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px;margin:0 0 16px;color:#0C0C0A">${input.title}</h1>
      ${input.bodyHtml}
    </div>
  `;
  try {
    await sendEmail({
      to,
      subject: input.subject,
      html,
      from: input.from
    });
    return true;
  } catch (err) {
    console.error("notifyAdmin failed:", err);
    return false;
  }
}

// lib/passwords.ts
var ITERATIONS = 1e5;
var KEY_BYTES = 32;
var SALT_BYTES = 16;
var encoder = new TextEncoder();
function toB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromB64(s) {
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function derive(plain, salt, iterations) {
  const baseKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}
async function hashPassword(plain) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(plain, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}
async function verifyPassword(plain, stored) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = fromB64(parts[2]);
  const expected = fromB64(parts[3]);
  const actual = await derive(plain, salt, iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
function generateTempPassword(length = 16) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// lib/provisioning.ts
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
function mapField(tenant, logical) {
  return tenant.airtable.fieldMap?.[logical] ?? logical;
}
function resolveTable(tenant, table) {
  if (!table) {
    const first = Object.values(tenant.airtable.tables)[0];
    if (!first) throw new Error(`provisionPortalUser: tenant "${tenant.id}" has no airtable.tables`);
    return first;
  }
  return tenant.airtable.tables[table] ?? table;
}
function welcomeEmailHtml(args) {
  const creds = args.tempPassword ? `<p style="margin:0 0 8px"><strong>Email:</strong> ${args.email}</p>
       <p style="margin:0 0 16px"><strong>Temporary password:</strong>
         <code style="background:#f2f2f0;padding:2px 6px;border-radius:4px">${args.tempPassword}</code></p>
       <p style="margin:0 0 16px;color:#555">Please change this password after your first sign-in.</p>` : `<p style="margin:0 0 16px"><strong>Email:</strong> ${args.email}</p>`;
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px;margin:0 0 16px">Welcome to ${args.brandName}, ${args.name}</h1>
      <p style="margin:0 0 16px">Your portal account is ready. Sign in to get started.</p>
      ${creds}
      <p style="margin:0 0 24px">
        <a href="${args.loginUrl}"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">
          Open your portal
        </a>
      </p>
      <p style="margin:0;color:#777;font-size:13px">
        Need help? Contact <a href="mailto:${args.supportEmail}">${args.supportEmail}</a>.
      </p>
    </div>
  `;
}
async function provisionPortalUser(input) {
  const {
    tenant,
    email,
    name,
    role = "member",
    sendWelcomeEmail = true,
    notifyAdminOnCreate = true,
    failIfExists = true,
    loginPath = "/portal/login"
  } = input;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("provisionPortalUser: a valid email is required");
  }
  if (!name.trim()) throw new Error("provisionPortalUser: name is required");
  const baseId = tenant.airtable.baseId;
  if (!baseId) throw new Error(`provisionPortalUser: tenant "${tenant.id}" has no airtable.baseId`);
  const tableId = resolveTable(tenant, input.table);
  const emailField = mapField(tenant, "Email");
  if (failIfExists) {
    const escaped = normalizedEmail.replace(/'/g, "\\'");
    const existing = await airtableGet(baseId, tableId, {
      filterByFormula: `LOWER({${emailField}}) = '${escaped}'`,
      maxRecords: 1
    });
    if (existing.length > 0) {
      throw new Error(`provisionPortalUser: a user with email ${normalizedEmail} already exists`);
    }
  }
  const slug = input.slug ? slugify(input.slug) : slugify(name) || slugify(normalizedEmail);
  const generated = !input.password;
  const password = input.password ?? generateTempPassword();
  const passwordHash = await hashPassword(password);
  const record = await airtableCreate(baseId, tableId, {
    [mapField(tenant, "Name")]: name.trim(),
    [emailField]: normalizedEmail,
    [mapField(tenant, "Role")]: role,
    [mapField(tenant, "Slug")]: slug,
    [mapField(tenant, "PasswordHash")]: passwordHash,
    [mapField(tenant, "Status")]: "active",
    [mapField(tenant, "CreatedAt")]: (/* @__PURE__ */ new Date()).toISOString(),
    ...input.fields
  });
  const canonical = tenant.urls.canonical.replace(/\/+$/, "");
  const loginUrl = `${canonical}${loginPath.startsWith("/") ? loginPath : `/${loginPath}`}`;
  let welcomeEmailSent = false;
  if (sendWelcomeEmail) {
    try {
      await sendEmail({
        to: normalizedEmail,
        from: tenant.brand.fromEmail,
        subject: `Welcome to ${tenant.brand.name}`,
        html: welcomeEmailHtml({
          brandName: tenant.brand.name,
          name: name.trim(),
          email: normalizedEmail,
          loginUrl,
          tempPassword: generated ? password : void 0,
          supportEmail: tenant.brand.supportEmail
        })
      });
      welcomeEmailSent = true;
    } catch (err) {
      console.error("provisionPortalUser: welcome email failed:", err);
    }
  }
  let adminNotified = false;
  if (notifyAdminOnCreate) {
    adminNotified = await notifyAdmin({
      subject: `[${tenant.brand.name}] New portal user: ${name}`,
      title: "Portal user provisioned",
      bodyHtml: `
        <p><strong>${name}</strong> (${normalizedEmail}) was provisioned as <strong>${role}</strong>.</p>
        <p>Record: ${record.id} \xB7 Slug: ${slug}</p>
      `,
      from: tenant.brand.fromEmail
    });
  }
  let webhookFired = false;
  if (input.welcomeWebhookEnvKey) {
    const url = process.env[input.welcomeWebhookEnvKey]?.trim();
    if (url) {
      const { success } = await triggerMakeWebhook(url, {
        event: "portal_user_provisioned",
        tenant: tenant.id,
        recordId: record.id,
        email: normalizedEmail,
        name: name.trim(),
        role,
        slug
      });
      webhookFired = success;
    }
  }
  return {
    recordId: record.id,
    email: normalizedEmail,
    name: name.trim(),
    role,
    slug,
    loginUrl,
    tempPassword: generated ? password : void 0,
    welcomeEmailSent,
    adminNotified,
    webhookFired
  };
}

// lib/activity-events.ts
var ACTIVITY_EVENTS_TABLE = "ActivityEvents";
function normalizeActivityEvent(input, id = "") {
  return {
    id,
    organizationId: input.organizationId,
    module: input.module,
    eventType: input.eventType,
    title: input.title,
    summary: input.summary,
    priority: clampScore(input.priority ?? 0),
    metric: input.metric,
    actionLabel: input.actionLabel,
    actionUrl: input.actionUrl,
    personId: input.personId,
    createdAt: input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    metadata: input.metadata ?? {}
  };
}
async function publishActivityEvent(baseId, tableId = ACTIVITY_EVENTS_TABLE, input) {
  const event = normalizeActivityEvent(input);
  const record = await airtableCreate(baseId, tableId, toAirtableFields(event));
  return fromAirtableRecord(record);
}
async function listActivityEvents(baseId, tableId = ACTIVITY_EVENTS_TABLE, options = {}) {
  const filters = [
    options.organizationId ? `{organizationId} = '${escapeFormulaValue(options.organizationId)}'` : "",
    options.module ? `{module} = '${escapeFormulaValue(options.module)}'` : ""
  ].filter(Boolean);
  const records = await airtableGet(baseId, tableId, {
    filterByFormula: filters.length === 1 ? filters[0] : filters.length > 1 ? `AND(${filters.join(", ")})` : void 0,
    maxRecords: options.maxRecords ?? 100,
    sort: [{ field: "createdAt", direction: "desc" }]
  });
  return records.map(fromAirtableRecord);
}
function fromAirtableRecord(record) {
  const fields = record.fields;
  return normalizeActivityEvent(
    {
      organizationId: readString(fields.organizationId),
      module: readString(fields.module),
      eventType: readString(fields.eventType),
      title: readString(fields.title),
      summary: readString(fields.summary),
      priority: readNumber(fields.priority),
      metric: readOptionalString(fields.metric),
      actionLabel: readOptionalString(fields.actionLabel),
      actionUrl: readOptionalString(fields.actionUrl),
      personId: readOptionalString(fields.personId),
      createdAt: readOptionalString(fields.createdAt) ?? record.createdTime,
      metadata: readMetadata(fields.metadata)
    },
    record.id
  );
}
function toAirtableFields(event) {
  return {
    organizationId: event.organizationId,
    module: event.module,
    eventType: event.eventType,
    priority: event.priority,
    title: event.title,
    summary: event.summary,
    metric: event.metric,
    actionLabel: event.actionLabel,
    actionUrl: event.actionUrl,
    personId: event.personId,
    createdAt: event.createdAt,
    metadata: JSON.stringify(event.metadata)
  };
}
function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
function escapeFormulaValue(value) {
  return value.replace(/'/g, "\\'");
}
function readString(value) {
  return typeof value === "string" ? value : "";
}
function readOptionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function readNumber(value) {
  return typeof value === "number" ? value : void 0;
}
function readMetadata(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// lib/brief-engine.ts
var EVENT_IMPORTANCE = {
  "parent connected": 20,
  "guide downloaded": 40,
  "guide opened": 40,
  "portal opened": 45,
  "opportunity captured": 55,
  "application started": 75,
  "course completed": 80,
  "newsletter sent": 80,
  "volunteer overdue": 90,
  "application approved": 95,
  "application completed": 95,
  "missed follow-up": 100
};
function buildBriefResponse(events, request, quickActions = []) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  const cards = selectBriefCards(events, request, 5);
  const todaysActivity = events.filter((event) => isSameDay(new Date(event.createdAt), now)).map((event) => toBriefCard(event, request, now)).slice(0, 5);
  const recentEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((event) => toBriefCard(event, request, now));
  return {
    greeting: buildGreeting(request.userName, now),
    topPriority: cards[0],
    todaysActivity,
    recommendedActions: cards.filter((card) => card.actionLabel).slice(0, 3),
    recentEvents,
    quickActions,
    cards
  };
}
function selectBriefCards(events, request, limit = 5) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  return events.filter((event) => event.organizationId === request.organizationId).filter((event) => !request.module || event.module === request.module).map((event) => toBriefCard(event, request, now)).sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}
function scoreActivityEvent(event, request = { organizationId: event.organizationId }) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  const eventAgeHours = Math.max(0, (now.getTime() - new Date(event.createdAt).getTime()) / 36e5);
  const recency = Math.max(0, 25 - eventAgeHours);
  const eventImportance = EVENT_IMPORTANCE[event.eventType.toLowerCase()] ?? 0;
  const dueDateBoost = getDueDateBoost(event.metadata, now);
  const riskBoost = readScore(event.metadata.risk);
  const engagementBoost = readScore(event.metadata.engagement);
  const aiImportance = readScore(event.metadata.aiImportance);
  return clampScore2(event.priority * 0.35 + eventImportance * 0.25 + recency + dueDateBoost + riskBoost * 0.1 + engagementBoost * 0.1 + aiImportance * 0.2);
}
function toBriefCard(event, request, now = /* @__PURE__ */ new Date()) {
  const fallbackMetric = event.priority > 0 ? `Priority ${event.priority}` : event.eventType;
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    metric: event.metric ?? fallbackMetric,
    actionLabel: event.actionLabel ?? "Review",
    actionUrl: event.actionUrl,
    module: event.module,
    eventType: event.eventType,
    priority: event.priority,
    score: scoreActivityEvent(event, { ...request, time: now }),
    personId: event.personId,
    createdAt: event.createdAt,
    metadata: event.metadata
  };
}
function buildGreeting(userName, now) {
  const hour = now.getHours();
  const dayPart = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  return userName ? `${dayPart}, ${userName}` : dayPart;
}
function getDueDateBoost(metadata, now) {
  const dueDate = typeof metadata.dueDate === "string" ? new Date(metadata.dueDate) : void 0;
  if (!dueDate || Number.isNaN(dueDate.getTime())) return 0;
  const daysUntilDue = (dueDate.getTime() - now.getTime()) / 864e5;
  if (daysUntilDue < 0) return 25;
  if (daysUntilDue <= 1) return 20;
  if (daysUntilDue <= 3) return 12;
  return 0;
}
function readScore(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}
function clampScore2(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// lib/platform-events.ts
var PULSE_TYPE_IMPORTANCE = {
  "assessment.submitted": 70,
  "payment.received": 85,
  "portal.login": 40,
  "apply.submitted": 75,
  "capture.completed": 55,
  "launch.verification.completed": 90,
  "missed follow-up": 100
};
function fromPulseAirtableRecord(record) {
  const fields = record.fields;
  const row = {
    id: record.id,
    organizationId: readStr(fields.organizationId) || readStr(fields.Organization) || "ea",
    clientSlug: readStr(fields.clientSlug) || readStr(fields.ClientSlug),
    eventType: readStr(fields.eventType) || readStr(fields.Type) || readStr(fields.type),
    title: readStr(fields.title) || readStr(fields.Title),
    summary: readStr(fields.summary) || readStr(fields.Summary) || readStr(fields.description),
    priority: readNum(fields.priority) ?? readNum(fields.Priority),
    module: readStr(fields.module) || readStr(fields.Module),
    metric: readStr(fields.metric),
    actionLabel: readStr(fields.actionLabel),
    actionUrl: readStr(fields.actionUrl),
    personId: readStr(fields.personId) || readStr(fields.clientSlug),
    createdAt: readStr(fields.createdAt) || record.createdTime,
    metadata: readMeta(fields.metadata ?? fields.Metadata ?? fields.payload)
  };
  return fromPulseEventRow(row, record.id);
}
function fromPulseEventRow(row, id = "") {
  const eventType = (row.eventType ?? row.type ?? "pulse.event").toLowerCase();
  const module = row.module ?? inferModuleFromPulseType(eventType);
  const priority = row.priority ?? PULSE_TYPE_IMPORTANCE[eventType] ?? 50;
  const base = normalizeActivityEvent(
    {
      organizationId: row.organizationId ?? "ea",
      module,
      eventType,
      title: row.title ?? humanizeEventType(eventType),
      summary: row.summary ?? row.description ?? "",
      priority,
      metric: row.metric,
      actionLabel: row.actionLabel,
      actionUrl: row.actionUrl,
      personId: row.personId ?? row.clientSlug ?? row.clientId,
      createdAt: row.createdAt,
      metadata: {
        ...typeof row.metadata === "object" ? row.metadata : {},
        source: "pulse",
        clientSlug: row.clientSlug
      }
    },
    id
  );
  return enrichPlatformEvent(base, "pulse", inferCategory(base));
}
function fromActivityEvent(event) {
  const source = event.module === "agent" || event.metadata.agentKind ? "agent" : event.metadata.source === "pulse" ? "pulse" : "activity";
  return enrichPlatformEvent(event, source, inferCategory(event));
}
function toActivityEventInput(event) {
  return {
    organizationId: event.organizationId,
    module: event.module,
    eventType: event.eventType,
    title: event.title,
    summary: event.summary,
    priority: event.priority,
    metric: event.metric,
    actionLabel: event.actionLabel,
    actionUrl: event.actionUrl,
    personId: event.personId,
    createdAt: event.createdAt,
    metadata: {
      ...event.metadata,
      source: event.source,
      category: event.category,
      whyRecommended: event.whyRecommended
    }
  };
}
function mergeEventStreams(activity, pulse = []) {
  const seen = /* @__PURE__ */ new Set();
  const merged = [];
  for (const event of [...pulse, ...activity.map(fromActivityEvent)]) {
    const key = event.id || `${event.eventType}:${event.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
  }
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
function enrichPlatformEvent(event, source, category) {
  const why = readStr(event.metadata.whyRecommended) || readStr(event.metadata.recommendationReason) || buildDefaultWhy(event);
  return {
    ...event,
    source,
    category,
    whyRecommended: why || void 0
  };
}
function inferCategory(event) {
  if (event.module === "agent" || event.metadata.agentKind) return "agent";
  if (event.metadata.continueUrl || event.eventType.toLowerCase().includes("continue")) {
    return "continue";
  }
  if (event.metadata.momentum) return "momentum";
  if (event.priority >= 60) return "attention";
  return "activity";
}
function inferModuleFromPulseType(eventType) {
  if (eventType.includes("capture")) return "simplifi";
  if (eventType.includes("apply")) return "portal";
  if (eventType.includes("payment") || eventType.includes("launch")) return "pulse";
  if (eventType.includes("assessment")) return "simplifi";
  return "pulse";
}
function humanizeEventType(eventType) {
  return eventType.split(/[._]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function buildDefaultWhy(event) {
  const due = event.metadata.dueDate;
  if (typeof due === "string") {
    return `Prioritized because the deadline is ${new Date(due).toLocaleDateString()}.`;
  }
  if (event.priority >= 80) {
    return "Prioritized because this is high-impact work that needs a decision soon.";
  }
  return void 0;
}
function readStr(value) {
  return typeof value === "string" ? value : "";
}
function readNum(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function readMeta(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// lib/agent-events.ts
var EA_AGENT_REGISTRY = [
  { kind: "research", label: "Research Agent", description: "Finds opportunities and context" },
  { kind: "proposal", label: "Proposal Agent", description: "Drafts client proposals" },
  { kind: "qa", label: "QA Agent", description: "Tests deployments and flows" },
  { kind: "training", label: "Training Agent", description: "Builds courses and guides" },
  { kind: "content", label: "Content Agent", description: "Prepares newsletters and posts" },
  { kind: "launch", label: "Launch Agent", description: "Runs launch verification" },
  { kind: "deployment", label: "Deployment Agent", description: "Coordinates releases" }
];
async function publishAgentRun(baseId, tableId = ACTIVITY_EVENTS_TABLE, input) {
  const status = input.status ?? "running";
  const progress = clamp(input.progress ?? (status === "completed" ? 100 : 10), 0, 100);
  const label = EA_AGENT_REGISTRY.find((a) => a.kind === input.agentKind)?.label ?? input.agentKind;
  const record = await publishActivityEvent(baseId, tableId, {
    organizationId: input.organizationId,
    module: "agent",
    eventType: `agent.${status}`,
    title: `${label}: ${input.task}`,
    summary: statusSummary(status, input.task, progress),
    priority: status === "review_required" ? 95 : status === "running" ? 70 : 50,
    metric: `${progress}%`,
    actionLabel: status === "review_required" ? "Review" : "Open",
    actionUrl: input.actionUrl,
    personId: input.clientSlug,
    metadata: {
      agentKind: input.agentKind,
      agentStatus: status,
      task: input.task,
      progress,
      estimatedCompletion: input.estimatedCompletion,
      reviewRequired: input.reviewRequired ?? status === "review_required",
      clientSlug: input.clientSlug,
      projectId: input.projectId,
      category: "agent",
      source: "agent",
      ...input.metadata
    }
  });
  return toAgentRun(record);
}
async function listAgentRuns(baseId, tableId = ACTIVITY_EVENTS_TABLE, organizationId, maxRecords = 20) {
  const events = await listActivityEvents(baseId, tableId, {
    organizationId,
    module: "agent",
    maxRecords
  });
  return events.map(toAgentRun);
}
function toAgentRun(event) {
  const platform = fromActivityEvent(event);
  const meta = event.metadata;
  return {
    ...platform,
    source: "agent",
    category: "agent",
    agentKind: readStr2(meta.agentKind) || "research",
    status: readStr2(meta.agentStatus) || "running",
    task: readStr2(meta.task) || event.title,
    progress: clamp(readNum2(meta.progress) ?? 0, 0, 100),
    estimatedCompletion: readStr2(meta.estimatedCompletion) || void 0,
    reviewRequired: Boolean(meta.reviewRequired) || meta.agentStatus === "review_required"
  };
}
function isActiveAgent(run) {
  return run.status === "running" || run.status === "queued" || run.status === "review_required";
}
function statusSummary(status, task, progress) {
  switch (status) {
    case "review_required":
      return `${task} \u2014 ready for your review`;
    case "completed":
      return `${task} \u2014 completed`;
    case "failed":
      return `${task} \u2014 needs attention`;
    case "paused":
      return `${task} \u2014 paused at ${progress}%`;
    case "queued":
      return `${task} \u2014 queued`;
    default:
      return `${task} \u2014 ${progress}% complete`;
  }
}
function readStr2(value) {
  return typeof value === "string" ? value : "";
}
function readNum2(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// lib/mission-control.ts
var DEFAULT_ACTION_CARDS = [
  { id: "new-client", label: "New Client", href: "/admin/clients/new", intent: "start new client", module: "clients" },
  { id: "proposal", label: "Create Proposal", href: "/admin/proposals/new", intent: "create proposal", module: "simplifi" },
  { id: "blueprint", label: "Generate Blueprint", href: "/admin/blueprints/new", intent: "generate blueprint", module: "simplifi" },
  { id: "portal", label: "Build Portal", href: "/admin/build/portal", intent: "build portal", module: "build" },
  { id: "landing", label: "Build Landing Page", href: "/admin/build/landing", intent: "build landing page", module: "build" },
  { id: "training", label: "Create Training", href: "/admin/training/new", intent: "create training", module: "training" },
  { id: "content", label: "Publish Content", href: "/amplifi", intent: "publish content", module: "amplifi" },
  { id: "launch", label: "Launch Project", href: "/launch", intent: "launch project", module: "pulse" }
];
var DEFAULT_INTENT_EXAMPLES = [
  "Create proposal for Bob",
  "Build volunteer portal",
  "Continue yesterday's work",
  "Review opportunities",
  "Generate Blueprint",
  "Launch client project"
];
function buildMissionControlResponse(events, request, options = {}) {
  const brief = buildBriefResponse(events, request, options.quickActions);
  const actionCards = filterActionCardsByRole(
    options.actionCards ?? DEFAULT_ACTION_CARDS,
    request.role
  );
  const agentRuns = options.agentRuns ?? extractAgentRuns(events);
  const activeAgents = agentRuns.filter(isActiveAgent);
  const continueWorking = extractContinueWorking(events, request);
  const momentum = computeMomentum(events, request);
  const todaysFocus = brief.cards.map(enrichCardWithWhy);
  return {
    ...brief,
    intentExamples: options.intentExamples ?? DEFAULT_INTENT_EXAMPLES,
    todaysFocus,
    topPriority: todaysFocus[0] ?? brief.topPriority,
    recommendedActions: todaysFocus.filter((c) => c.actionLabel).slice(0, 3),
    continueWorking,
    actionCards,
    agentRuns,
    activeAgents,
    momentum
  };
}
function buildMissionControlFromStreams(activity, pulse, request, options = {}) {
  return buildMissionControlResponse(mergeEventStreams(activity, pulse), request, options);
}
function extractContinueWorking(events, request) {
  return events.filter((e) => e.organizationId === request.organizationId).filter(
    (e) => e.category === "continue" || Boolean(e.metadata.continueUrl) || e.eventType.toLowerCase().includes("paused") || e.eventType.toLowerCase().includes("in_progress")
  ).map((e) => ({
    id: e.id,
    title: readStr3(e.metadata.continueTitle) || e.title,
    summary: e.summary,
    href: readStr3(e.metadata.continueUrl) || e.actionUrl || "#",
    module: e.module,
    lastActiveAt: e.createdAt
  })).sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()).slice(0, 6);
}
function extractAgentRuns(events) {
  return events.filter((e) => e.module === "agent" || e.metadata.agentKind).map((e) => toAgentRun(e)).slice(0, 10);
}
function computeMomentum(events, request) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  const today = events.filter(
    (e) => e.organizationId === request.organizationId && isSameDay2(new Date(e.createdAt), now)
  );
  const advanced = today.filter(
    (e) => e.eventType.includes("completed") || e.eventType.includes("advanced") || e.metadata.momentum === "advanced"
  ).length;
  const proposals = today.filter((e) => e.eventType.includes("proposal")).length;
  const opportunities = today.filter((e) => e.eventType.includes("opportunity") || e.eventType.includes("capture")).length;
  const onboarded = today.filter((e) => e.eventType.includes("onboard")).length;
  const stats = [];
  if (advanced > 0) stats.push({ label: "Projects advanced", value: advanced });
  if (proposals > 0) stats.push({ label: "Proposals completed", value: proposals });
  if (opportunities > 0) stats.push({ label: "Opportunities discovered", value: opportunities });
  if (onboarded > 0) stats.push({ label: "Clients onboarded", value: onboarded });
  return stats;
}
function enrichCardWithWhy(card) {
  const why = readStr3(card.metadata.whyRecommended) || readStr3(card.metadata.recommendationReason);
  if (!why) return card;
  return {
    ...card,
    summary: card.summary.includes(why) ? card.summary : `${card.summary} ${why}`.trim()
  };
}
function filterActionCardsByRole(cards, role) {
  if (role === "builder") return cards;
  const builderOnly = /* @__PURE__ */ new Set(["portal", "landing"]);
  return cards.filter((c) => !builderOnly.has(c.id));
}
function isSameDay2(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function readStr3(value) {
  return typeof value === "string" ? value : "";
}

// lib/intent-router.ts
var DEFAULT_ORCHESTRATOR = [
  {
    pattern: /create proposal|draft proposal|proposal for|write proposal/i,
    intent: "create-proposal",
    why: "Proposal workflows use the research agent to gather context before you edit in Proposals."
  },
  {
    pattern: /research|find opportunit|discover opportunit|speaking opportunit/i,
    intent: "research",
    why: "Research intents route to the EA agent orchestrator for structured findings."
  },
  {
    pattern: /generate blueprint|new blueprint|build blueprint/i,
    intent: "generate-blueprint",
    why: "Blueprint generation starts in the Blueprint Library with captured context."
  }
];
var DEFAULT_DIRECT_NAV = [
  {
    pattern: /build portal|volunteer portal|client portal|launch portal/i,
    href: "/admin/ea-factory/new-experience",
    label: "New Experience",
    why: "Portal builds start in the New Experience wizard."
  },
  {
    pattern: /build landing|landing page|skin factory/i,
    href: "/admin/ea-factory/skin-factory",
    label: "Skin Factory",
    why: "Landing page skins are authored as briefs in Skin Factory."
  },
  {
    pattern: /continue|resume|pick up where/i,
    href: "/admin/master",
    label: "Mission Control",
    why: "Continue Working lives on your Mission Control home."
  },
  {
    pattern: /launch project|launch client|go live/i,
    href: "/launch",
    label: "Launch Command",
    why: "Launch verification runs through the Launch Command Center."
  },
  {
    pattern: /new client|start client|onboard client/i,
    href: "/admin/delivery",
    label: "Client Delivery",
    why: "New clients are tracked on the delivery board."
  },
  {
    pattern: /simplifi workspace|daily brief/i,
    href: "/simplifi/workspace",
    label: "Simplifi Workspace",
    why: "Opportunity decisions and daily brief live in Simplifi."
  },
  {
    pattern: /master control|mission control|dashboard|revenue/i,
    href: "/admin/master",
    label: "Mission Control",
    why: "Your ranked attention feed and continue-working queue."
  },
  {
    pattern: /resource radar|analyze url|radar/i,
    href: "/admin/resource-radar",
    label: "Resource Radar",
    why: "URL and resource analysis for opportunity discovery."
  },
  {
    pattern: /blueprint/i,
    href: "/admin/blueprints",
    label: "Blueprint Library",
    why: "Implementation blueprints and build intelligence."
  },
  {
    pattern: /knowledge graph|organizational memory|platform memory/i,
    href: "/admin/knowledge-graph",
    label: "Knowledge Graph",
    why: "Organizational memory \u2014 org, product, capture topology."
  },
  {
    pattern: /digital twin|twin/i,
    href: "/admin/digital-twin",
    label: "Digital Twin",
    why: "Platform and org visibility profiles."
  },
  {
    pattern: /proposal/i,
    href: "/admin/proposals",
    label: "Proposals",
    why: "Proposal drafts and delivery pipeline."
  }
];
function routeIntent(input, config = {}) {
  const query = input.trim();
  const lower = query.toLowerCase();
  const directNav = config.directNav ?? DEFAULT_DIRECT_NAV;
  const orchestrator = config.orchestrator ?? DEFAULT_ORCHESTRATOR;
  if (!query) {
    return {
      type: "explain",
      message: 'Tell me what you want to accomplish \u2014 for example, "Create proposal for Bob" or "Build landing page".',
      confidence: 0
    };
  }
  if (/^help|what can you/i.test(lower)) {
    return {
      type: "explain",
      message: 'I can navigate Mission Control, run audits, search organizational memory, start tours, and launch workflows. Try "Create proposal for Bob" or "Show knowledge graph".',
      confidence: 95
    };
  }
  for (const nav of directNav) {
    if (nav.pattern.test(lower)) {
      return {
        type: "navigate",
        href: nav.href,
        message: `Opening ${nav.label}.`,
        whyRecommended: nav.why,
        confidence: 90
      };
    }
  }
  for (const orch of orchestrator) {
    if (orch.pattern.test(lower)) {
      return {
        type: "orchestrate",
        orchestratorIntent: orch.intent,
        query,
        message: `Running ${orch.intent.replace(/-/g, " ")} workflow.`,
        whyRecommended: orch.why,
        confidence: 88
      };
    }
  }
  const voice = matchVoicePatterns(query, lower);
  if (voice) {
    return voice;
  }
  return {
    type: "orchestrate",
    orchestratorIntent: "general",
    query,
    message: `Searching agents and organizational memory for "${query}".`,
    whyRecommended: "No exact navigation match \u2014 delegating to the EA orchestrator.",
    confidence: 55
  };
}
function matchVoicePatterns(query, lower) {
  if (/tour|guide me|onboarding/i.test(lower)) {
    return {
      type: "tour",
      message: "Starting Mission Control guided tour.",
      confidence: 90
    };
  }
  const urlMatch = query.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    if (/audit|simplifi|clarity|website/i.test(lower)) {
      return {
        type: "audit",
        href: `/admin/simplifi-audit?url=${encodeURIComponent(urlMatch[0])}`,
        query: urlMatch[0],
        message: `Running Simplifi audit on ${urlMatch[0]}`,
        confidence: 92
      };
    }
    return {
      type: "analyze",
      href: "/admin/resource-radar",
      query: urlMatch[0],
      message: `Analyzing ${urlMatch[0]} in Resource Radar.`,
      confidence: 88
    };
  }
  if (/capture|opportunity|save signal/i.test(lower)) {
    return {
      type: "capture",
      message: "Opening Quick Capture.",
      confidence: 85
    };
  }
  if (/search graph|find in graph|who uses|aligned with/i.test(lower)) {
    const term = lower.replace(/search graph|find in graph|who uses|aligned with/gi, "").trim();
    const href = term ? `/admin/knowledge-graph?q=${encodeURIComponent(term)}` : "/admin/knowledge-graph";
    return {
      type: "navigate",
      href,
      query: term || query,
      message: term ? `Searching Knowledge Graph for "${term}".` : "Opening Knowledge Graph.",
      whyRecommended: "Organizational memory search.",
      confidence: 82
    };
  }
  if (/simplifi audit|website audit|playwright/i.test(lower)) {
    return {
      type: "audit",
      href: "/admin/simplifi-audit",
      message: "Opening Simplifi Audit.",
      confidence: 86
    };
  }
  return null;
}

// lib/opportunity-graph.ts
var OPPORTUNITY_EVENT_MARKERS = [
  "capture",
  "opportunity",
  "ctp",
  "proposal",
  "assessment",
  "apply"
];
function buildOpportunityGraph(input) {
  const nodes = [];
  const edges = [];
  const nodeIds = /* @__PURE__ */ new Set();
  function addNode(node) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }
  function addEdge(edge) {
    edges.push(edge);
  }
  for (const seed of input.seedNodes ?? []) {
    addNode({ ...seed, organizationId: seed.organizationId ?? input.organizationId });
  }
  for (const seed of input.seedEdges ?? []) {
    addEdge(seed);
  }
  const orgId = `org-${slugify2(input.organizationId)}`;
  addNode({
    id: orgId,
    label: input.organizationId,
    type: "organization",
    organizationId: input.organizationId
  });
  for (const intent of input.intents ?? []) {
    const intentNodeId = `intent-${intent.id}`;
    addNode({
      id: intentNodeId,
      label: truncate(intent.text, 80),
      type: "intent",
      summary: intent.orchestratorIntent ? `Routed to ${intent.orchestratorIntent}` : `Routed as ${intent.routeType}`,
      href: intent.href,
      organizationId: intent.organizationId,
      score: intent.confidence,
      createdAt: intent.createdAt,
      metadata: {
        routeType: intent.routeType,
        orchestratorIntent: intent.orchestratorIntent,
        rawText: intent.text
      }
    });
    addEdge({
      id: `edge-${intentNodeId}-${orgId}`,
      source: intentNodeId,
      target: orgId,
      relationship: "triggered_by",
      label: "intent for org"
    });
    if (intent.orchestratorIntent) {
      const workflowId = `workflow-${slugify2(intent.orchestratorIntent)}`;
      addNode({
        id: workflowId,
        label: humanize(intent.orchestratorIntent),
        type: "action",
        organizationId: intent.organizationId
      });
      addEdge({
        id: `edge-${intentNodeId}-${workflowId}`,
        source: intentNodeId,
        target: workflowId,
        relationship: "suggests",
        weight: intent.confidence
      });
    }
  }
  for (const event of input.events ?? []) {
    if (event.organizationId !== input.organizationId) continue;
    const isOpportunity = OPPORTUNITY_EVENT_MARKERS.some(
      (m) => event.eventType.toLowerCase().includes(m)
    );
    const nodeType = event.eventType.includes("ctp") ? "ctp_submission" : isOpportunity ? event.eventType.includes("capture") ? "capture" : "opportunity" : "action";
    const eventNodeId = `event-${event.id || slugify2(`${event.eventType}-${event.createdAt}`)}`;
    addNode({
      id: eventNodeId,
      label: event.title,
      type: nodeType,
      summary: event.summary,
      href: event.actionUrl,
      organizationId: event.organizationId,
      score: event.priority,
      createdAt: event.createdAt,
      metadata: event.metadata
    });
    addEdge({
      id: `edge-${eventNodeId}-${orgId}`,
      source: eventNodeId,
      target: orgId,
      relationship: "relates_to"
    });
    if (event.personId) {
      const personId = `org-${slugify2(event.personId)}`;
      addNode({
        id: personId,
        label: event.personId,
        type: "organization",
        organizationId: event.organizationId
      });
      addEdge({
        id: `edge-${eventNodeId}-${personId}`,
        source: eventNodeId,
        target: personId,
        relationship: "refers_to"
      });
    }
    const linkedIntent = readStr4(event.metadata.intentId);
    if (linkedIntent) {
      const intentNodeId = `intent-${linkedIntent}`;
      if (nodeIds.has(intentNodeId)) {
        addEdge({
          id: `edge-${intentNodeId}-${eventNodeId}`,
          source: intentNodeId,
          target: eventNodeId,
          relationship: "follows",
          label: "intent led to event"
        });
      }
    }
  }
  const opportunityCount = nodes.filter(
    (n) => ["opportunity", "capture", "ctp_submission"].includes(n.type)
  ).length;
  const intentCount = nodes.filter((n) => n.type === "intent").length;
  return {
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      opportunityCount,
      intentCount
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function searchOpportunityGraph(graph, query) {
  const q = query.trim().toLowerCase();
  if (!q) return graph;
  const matchedNodeIds = new Set(
    graph.nodes.filter((n) => {
      const hay = [n.label, n.type, n.summary ?? "", JSON.stringify(n.metadata ?? {})].join(" ").toLowerCase();
      return hay.includes(q);
    }).map((n) => n.id)
  );
  for (const edge of graph.edges) {
    if (matchedNodeIds.has(edge.source)) matchedNodeIds.add(edge.target);
    if (matchedNodeIds.has(edge.target)) matchedNodeIds.add(edge.source);
  }
  const nodes = graph.nodes.filter((n) => matchedNodeIds.has(n.id));
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter(
    (e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
  );
  return {
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      opportunityCount: nodes.filter(
        (n) => ["opportunity", "capture", "ctp_submission"].includes(n.type)
      ).length,
      intentCount: nodes.filter((n) => n.type === "intent").length
    },
    generatedAt: graph.generatedAt
  };
}
function linkIntentToOpportunity(graph, intentNodeId, opportunityNodeId, label = "intent surfaced opportunity") {
  const edge = {
    id: `edge-${intentNodeId}-${opportunityNodeId}-suggests`,
    source: intentNodeId,
    target: opportunityNodeId,
    relationship: "suggests",
    label
  };
  return {
    ...graph,
    edges: [...graph.edges, edge],
    stats: {
      ...graph.stats,
      edgeCount: graph.stats.edgeCount + 1
    }
  };
}
function intentToActivityEventInput(intent) {
  return {
    organizationId: intent.organizationId,
    module: "pulse",
    eventType: "intent.resolved",
    title: truncate(intent.text, 120),
    summary: intent.orchestratorIntent ? `Intent routed to ${intent.orchestratorIntent}` : `Intent routed as ${intent.routeType}`,
    priority: Math.round(intent.confidence ?? 50),
    actionUrl: intent.href,
    createdAt: intent.createdAt,
    metadata: {
      category: "agent",
      intentId: intent.id,
      routeType: intent.routeType,
      orchestratorIntent: intent.orchestratorIntent,
      rawText: intent.text,
      graphNodeType: "intent"
    }
  };
}
function slugify2(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "unknown";
}
function truncate(value, max) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}\u2026`;
}
function humanize(value) {
  return value.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function readStr4(value) {
  return typeof value === "string" ? value : "";
}

exports.ACTIVITY_EVENTS_TABLE = ACTIVITY_EVENTS_TABLE;
exports.ActivityTimeline = ActivityTimeline;
exports.BriefExperience = BriefExperience;
exports.ClerkShell = ClerkShell;
exports.DEFAULT_ACTION_CARDS = DEFAULT_ACTION_CARDS;
exports.DEFAULT_INTENT_EXAMPLES = DEFAULT_INTENT_EXAMPLES;
exports.EA_AGENT_REGISTRY = EA_AGENT_REGISTRY;
exports.HeaderPortalShell = HeaderPortalShell;
exports.MissionControlExperience = MissionControlExperience;
exports.PortalLayout = PortalLayout;
exports.QuickActions = QuickActions;
exports.RoleGuard = RoleGuard;
exports.UniversalBriefCard = UniversalBriefCard;
exports.adminEmail = adminEmail;
exports.airtableCreate = airtableCreate;
exports.airtableDelete = airtableDelete;
exports.airtableGet = airtableGet;
exports.airtableGetOne = airtableGetOne;
exports.airtableUpdate = airtableUpdate;
exports.allowSampleData = allowSampleData;
exports.buildBriefResponse = buildBriefResponse;
exports.buildMissionControlFromStreams = buildMissionControlFromStreams;
exports.buildMissionControlResponse = buildMissionControlResponse;
exports.buildOpportunityGraph = buildOpportunityGraph;
exports.checkTenantEnv = checkTenantEnv;
exports.createHmacPortalMiddleware = createHmacPortalMiddleware;
exports.createPortalMiddleware = createPortalMiddleware;
exports.fromActivityEvent = fromActivityEvent;
exports.fromAirtableRecord = fromAirtableRecord;
exports.fromPulseAirtableRecord = fromPulseAirtableRecord;
exports.fromPulseEventRow = fromPulseEventRow;
exports.generateTempPassword = generateTempPassword;
exports.hashPassword = hashPassword;
exports.intentToActivityEventInput = intentToActivityEventInput;
exports.isActiveAgent = isActiveAgent;
exports.isDemoMode = isDemoMode;
exports.isProductionDeploy = isProductionDeploy;
exports.linkIntentToOpportunity = linkIntentToOpportunity;
exports.listActivityEvents = listActivityEvents;
exports.listAgentRuns = listAgentRuns;
exports.makeSessionCookie = makeSessionCookie;
exports.mergeEventStreams = mergeEventStreams;
exports.newSessionExpiry = newSessionExpiry;
exports.normalizeActivityEvent = normalizeActivityEvent;
exports.notifyAdmin = notifyAdmin;
exports.provisionPortalUser = provisionPortalUser;
exports.publishActivityEvent = publishActivityEvent;
exports.publishAgentRun = publishAgentRun;
exports.requireEnv = requireEnv;
exports.requiredEnvForTenant = requiredEnvForTenant;
exports.routeIntent = routeIntent;
exports.scoreActivityEvent = scoreActivityEvent;
exports.searchOpportunityGraph = searchOpportunityGraph;
exports.selectBriefCards = selectBriefCards;
exports.sendEmail = sendEmail;
exports.signHmacSession = signHmacSession;
exports.toActivityEventInput = toActivityEventInput;
exports.toAgentRun = toAgentRun;
exports.toBriefCard = toBriefCard;
exports.triggerMakeWebhook = triggerMakeWebhook;
exports.validateTenant = validateTenant;
exports.verifyHmacSession = verifyHmacSession;
exports.verifyPassword = verifyPassword;
exports.withRoleProtection = withRoleProtection;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map