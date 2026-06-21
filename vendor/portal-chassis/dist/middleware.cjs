'use strict';

var server = require('next/server');

// auth/hmac-middleware-factory.ts

// lib/env.ts
function isProductionDeploy() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
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

// auth/hmac-middleware-factory.ts
function createSlugPortalMiddleware(cfg) {
  const portalPrefix = cfg.portalPrefix ?? "/portal/";
  const publicPaths = cfg.publicPaths ?? [cfg.loginPath, "/api/portal/login"];
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return server.NextResponse.next();
    }
    const slugMatch = pathname.match(/^\/portal\/([^/]+)/);
    if (!slugMatch) return server.NextResponse.next();
    const slug = slugMatch[1];
    if (slug === "login") return server.NextResponse.next();
    const cookieVal = req.cookies.get(cfg.cookieName)?.value ?? "";
    const session = cookieVal ? await verifyHmacSession(cookieVal, cfg.session) : null;
    if (!session) {
      return server.NextResponse.redirect(new URL(cfg.loginPath, req.url));
    }
    if (session.slug !== slug) {
      return server.NextResponse.redirect(new URL(`${portalPrefix}${session.slug}`, req.url));
    }
    return server.NextResponse.next();
  }
  return {
    middleware,
    config: { matcher: ["/portal/:slug", "/portal/:slug/:path*"] }
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
      if (isPublic) return server.NextResponse.next();
      if (req.cookies.get(cfg.adminCookieName)?.value) return server.NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = adminLogin;
      url.searchParams.set("next", pathname + req.nextUrl.search);
      return server.NextResponse.redirect(url);
    }
    for (const route of cfg.roleRoutes) {
      if (!pathname.startsWith(route.pathPrefix)) continue;
      const cookieVal = req.cookies.get(cfg.cookieName)?.value ?? "";
      const session = cookieVal ? await verifyHmacSession(cookieVal, cfg.session) : null;
      if (!session) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = cfg.loginPath;
        return server.NextResponse.redirect(loginUrl);
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
        return server.NextResponse.redirect(loginUrl);
      }
      return server.NextResponse.next();
    }
    return server.NextResponse.next();
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

exports.createHmacPortalMiddleware = createHmacPortalMiddleware;
exports.createSlugPortalMiddleware = createSlugPortalMiddleware;
//# sourceMappingURL=middleware.cjs.map
//# sourceMappingURL=middleware.cjs.map