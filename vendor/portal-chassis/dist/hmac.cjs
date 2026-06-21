'use strict';

// lib/env.ts
function isProductionDeploy() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
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

exports.makeSessionCookie = makeSessionCookie;
exports.newSessionExpiry = newSessionExpiry;
exports.signHmacSession = signHmacSession;
exports.verifyHmacSession = verifyHmacSession;
//# sourceMappingURL=hmac.cjs.map
//# sourceMappingURL=hmac.cjs.map