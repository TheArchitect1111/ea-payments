/**
 * HMAC-signed portal sessions (Edge + Node compatible).
 * Extracted from CPR portal-auth — use for athlete/parent/custom role portals.
 */
type HmacSessionConfig = {
    /** Env var name, e.g. PORTAL_SECRET or SESSION_SECRET */
    secretEnvKey: string;
    /** Dev-only fallback when secret env is unset */
    devSecret?: string;
};
type SessionCookieOptions = {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
};
declare function newSessionExpiry(ttlMs?: number): number;
declare function signHmacSession<T extends {
    exp: number;
}>(session: T, config: HmacSessionConfig): Promise<string | null>;
declare function verifyHmacSession<T extends {
    exp: number;
}>(token: string, config: HmacSessionConfig): Promise<T | null>;
declare function makeSessionCookie(name: string, value: string, ttlMs?: number): SessionCookieOptions;

export { type HmacSessionConfig, type SessionCookieOptions, makeSessionCookie, newSessionExpiry, signHmacSession, verifyHmacSession };
