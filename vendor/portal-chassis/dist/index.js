import { SignIn, SignUp, useUser, UserButton } from '@clerk/nextjs';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { createRouteMatcher, clerkMiddleware, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

// auth/ClerkShell.tsx
function ClerkShell({ brandColor, logoSrc, portalName, tagline, mode }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
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
    /* @__PURE__ */ jsxs("div", { className: "cs-root", children: [
      /* @__PURE__ */ jsxs("div", { className: "cs-left", style: { backgroundColor: brandColor }, children: [
        /* @__PURE__ */ jsx("img", { src: logoSrc, alt: `${portalName} logo`, className: "cs-logo" }),
        /* @__PURE__ */ jsx("h1", { className: "cs-portal-name", children: portalName }),
        /* @__PURE__ */ jsx("p", { className: "cs-tagline", children: tagline })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "cs-right", children: mode === "sign-in" ? /* @__PURE__ */ jsx(SignIn, {}) : /* @__PURE__ */ jsx(SignUp, {}) })
    ] })
  ] });
}
function createPortalMiddleware(cfg) {
  const isPublic = createRouteMatcher(cfg.publicRoutes.map((r) => `${r}(.*)?`));
  const isAdmin = createRouteMatcher(cfg.adminPrefixes.map((r) => `${r}(.*)`));
  const middleware = clerkMiddleware(async (auth2, request) => {
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
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  const role = user?.publicMetadata?.role;
  const userLevel = ROLE_LEVEL[role ?? ""] ?? 0;
  const requiredLevel = ROLE_LEVEL[requiredRole] ?? 0;
  if (userLevel < requiredLevel) return /* @__PURE__ */ jsx(Fragment, { children: fallback });
  return /* @__PURE__ */ jsx(Fragment, { children });
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
  const { userId, sessionClaims } = await auth();
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
      if (isPublic) return NextResponse.next();
      if (req.cookies.get(cfg.adminCookieName)?.value) return NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = adminLogin;
      url.searchParams.set("next", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
    for (const route of cfg.roleRoutes) {
      if (!pathname.startsWith(route.pathPrefix)) continue;
      const cookieVal = req.cookies.get(cfg.cookieName)?.value ?? "";
      const session = cookieVal ? await verifyHmacSession(cookieVal, cfg.session) : null;
      if (!session) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = cfg.loginPath;
        return NextResponse.redirect(loginUrl);
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
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }
    return NextResponse.next();
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
  const pathname = usePathname();
  const { user } = useUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  const role = user?.publicMetadata?.role;
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const visibleNav = [...navItems, ...isAdmin ? adminNavItems : []];
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
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
    /* @__PURE__ */ jsxs("div", { className: "pl-root", children: [
      /* @__PURE__ */ jsxs("aside", { className: "pl-sidebar", style: { "--brand": brandColor }, children: [
        /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-header", children: [
          /* @__PURE__ */ jsx("img", { src: logoSrc, alt: `${portalName} logo`, className: "pl-sidebar-logo" }),
          /* @__PURE__ */ jsx("span", { className: "pl-sidebar-name", children: portalName })
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "pl-nav", children: [
          navItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href)),
          isAdmin && adminNavItems.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "pl-nav-section-label", children: "Admin" }),
            adminNavItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-footer", children: [
          /* @__PURE__ */ jsx(UserButton, { afterSignOutUrl: "/login" }),
          /* @__PURE__ */ jsx("span", { className: "pl-user-name", children: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "" })
        ] })
      ] }),
      mobileNavStyle === "sheet" && sheetOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "pl-sheet-overlay", onClick: () => setSheetOpen(false) }),
        /* @__PURE__ */ jsxs("div", { className: "pl-sheet", children: [
          /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-header", children: [
            /* @__PURE__ */ jsx("img", { src: logoSrc, alt: "", className: "pl-sidebar-logo" }),
            /* @__PURE__ */ jsx("span", { className: "pl-sidebar-name", children: portalName })
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "pl-nav", onClick: () => setSheetOpen(false), children: [
            navItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href)),
            isAdmin && adminNavItems.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pl-nav-section-label", children: "Admin" }),
              adminNavItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-footer", children: [
            /* @__PURE__ */ jsx(UserButton, { afterSignOutUrl: "/login" }),
            /* @__PURE__ */ jsx("span", { className: "pl-user-name", children: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pl-main", children: [
        /* @__PURE__ */ jsxs("header", { className: "pl-mobile-header", children: [
          /* @__PURE__ */ jsxs("div", { className: "pl-mobile-header-brand", children: [
            /* @__PURE__ */ jsx("img", { src: logoSrc, alt: "", className: "pl-mobile-logo" }),
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, fontSize: "0.9rem" }, children: portalName })
          ] }),
          mobileNavStyle === "sheet" && /* @__PURE__ */ jsxs("button", { className: "pl-hamburger", onClick: () => setSheetOpen(true), "aria-label": "Open menu", children: [
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", {})
          ] }),
          /* @__PURE__ */ jsx(UserButton, { afterSignOutUrl: "/login" })
        ] }),
        /* @__PURE__ */ jsx("main", { className: `pl-content${mobileNavStyle === "bottom" ? " pl-content-bottom-pad" : ""}`, children })
      ] }),
      mobileNavStyle === "bottom" && /* @__PURE__ */ jsx("nav", { className: "pl-bottom-nav pl-bottom-nav-show", children: /* @__PURE__ */ jsx("div", { className: "pl-bottom-nav-inner", children: visibleNav.slice(0, 5).map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: item.href,
            className: `pl-bottom-link${isActive(item.href) ? " active" : ""}`,
            style: isActive(item.href) ? { color: brandColor } : void 0,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "pl-nav-icon" }),
              /* @__PURE__ */ jsx("span", { children: item.label })
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
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href: item.href,
      className: `pl-nav-link${active ? " active" : ""}`,
      style: active ? { backgroundColor: `${brandColor}22`, color: brandColor } : void 0,
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "pl-nav-icon" }),
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "header",
      {
        style: {
          background: "var(--portal-header-bg, #0C0C0A)",
          color: "var(--portal-header-text, #fff)",
          borderBottom: "3px solid var(--portal-accent, #C8102E)"
        },
        children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "16px 20px" }, children: [
          /* @__PURE__ */ jsxs(
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
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: logoSrc,
                      alt: "",
                      style: { width: 48, height: 48, objectFit: "contain" }
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, letterSpacing: "0.04em", fontSize: 14 }, children: nameLine1 }),
                    nameLine2 ? /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, letterSpacing: "0.04em", fontSize: 14, color: "var(--portal-accent, #C8102E)" }, children: nameLine2 }) : null
                  ] })
                ] }),
                showLogout ? /* @__PURE__ */ jsx(
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
          /* @__PURE__ */ jsx(
            "nav",
            {
              "aria-label": "Portal sections",
              style: {
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16
              },
              children: tabs.map((tab) => /* @__PURE__ */ jsx(
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
    showLogout ? /* @__PURE__ */ jsx(
      "script",
      {
        dangerouslySetInnerHTML: {
          __html: `document.querySelector('[data-portal-logout]')?.addEventListener('click',function(){fetch('${logoutApiPath}',{method:'DELETE'}).finally(function(){window.location.href='${loginPath}';});});`
        }
      }
    ) : null
  ] });
}

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

export { ClerkShell, HeaderPortalShell, PortalLayout, RoleGuard, adminEmail, airtableCreate, airtableDelete, airtableGet, airtableGetOne, airtableUpdate, allowSampleData, createHmacPortalMiddleware, createPortalMiddleware, isDemoMode, isProductionDeploy, makeSessionCookie, newSessionExpiry, notifyAdmin, requireEnv, sendEmail, signHmacSession, triggerMakeWebhook, verifyHmacSession, withRoleProtection };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map