import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TB3_SANDBOX_TEST_COOKIE = "__Host-tb3-sandbox-test";
export const TB3_SANDBOX_TEST_TOKEN_ENV = "TB3_PAYPAL_SANDBOX_TEST_TOKEN_SHA256";
const MAX_TOKEN_AGE_SECONDS = 2 * 60 * 60;
const MAX_SESSION_AGE_SECONDS = 15 * 60;

function verifierBytes(raw: string | undefined) {
  if (!raw || !/^[a-f0-9]{64}$/i.test(raw)) return null;
  return Buffer.from(raw, "hex");
}

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Accept a high-entropy, expiring credential only when its SHA-256 verifier is configured. */
export function verifyTb3SandboxTestToken(token: unknown, verifier = process.env[TB3_SANDBOX_TEST_TOKEN_ENV], now = Date.now()) {
  const expected = verifierBytes(verifier);
  if (!expected || typeof token !== "string" || token.length > 200) return null;
  const match = /^tb3sbx\.([0-9]{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const expiresAt = Number(match[1]);
  const nowSeconds = Math.floor(now / 1000);
  if (expiresAt <= nowSeconds || expiresAt > nowSeconds + MAX_TOKEN_AGE_SECONDS) return null;
  const actual = createHash("sha256").update(token, "utf8").digest();
  return safeEqual(actual, expected) ? { verifier: expected, expiresAt } : null;
}

export function issueTb3SandboxTestCookie(token: unknown, verifier: string | undefined, now = Date.now()) {
  const verified = verifyTb3SandboxTestToken(token, verifier, now);
  if (!verified) return null;
  const nowSeconds = Math.floor(now / 1000);
  const expiresAt = Math.min(verified.expiresAt, nowSeconds + MAX_SESSION_AGE_SECONDS);
  const payload = `${nowSeconds}.${expiresAt}.${randomBytes(18).toString("base64url")}`;
  const signature = createHmac("sha256", verified.verifier).update(payload).digest("base64url");
  return { value: `${Buffer.from(payload).toString("base64url")}.${signature}`, maxAge: expiresAt - nowSeconds };
}

export function hasTb3SandboxTestSession(request: Request, verifier = process.env[TB3_SANDBOX_TEST_TOKEN_ENV], now = Date.now()) {
  const key = verifierBytes(verifier);
  if (!key) return false;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const value = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${TB3_SANDBOX_TEST_COOKIE}=`))?.slice(TB3_SANDBOX_TEST_COOKIE.length + 1);
  if (!value) return false;
  const [encoded, suppliedSignature, ...extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra.length) return false;
  let payload: string;
  try { payload = Buffer.from(encoded, "base64url").toString("utf8"); } catch { return false; }
  const expectedSignature = createHmac("sha256", key).update(payload).digest();
  let receivedSignature: Buffer;
  try { receivedSignature = Buffer.from(suppliedSignature, "base64url"); } catch { return false; }
  if (!safeEqual(expectedSignature, receivedSignature)) return false;
  const parts = payload.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1]) || !/^[A-Za-z0-9_-]{24}$/.test(parts[2])) return false;
  const [issuedAt, expiresAt] = parts.slice(0, 2).map(Number);
  const nowSeconds = Math.floor(now / 1000);
  return issuedAt <= nowSeconds && nowSeconds - issuedAt <= MAX_SESSION_AGE_SECONDS && expiresAt > nowSeconds && expiresAt <= issuedAt + MAX_SESSION_AGE_SECONDS;
}

export function sandboxTestCookieHeader(value: string, maxAge: number) {
  return `${TB3_SANDBOX_TEST_COOKIE}=${value}; Path=/; Max-Age=${Math.max(0, Math.min(maxAge, MAX_SESSION_AGE_SECONDS))}; HttpOnly; Secure; SameSite=Strict`;
}

export function expiredSandboxTestCookieHeader() {
  return `${TB3_SANDBOX_TEST_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
