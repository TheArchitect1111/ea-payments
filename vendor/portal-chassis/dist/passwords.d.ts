/**
 * Portal password hashing — PBKDF2 via Web Crypto (Edge + Node 18+ compatible).
 *
 * Stored format: `pbkdf2$<iterations>$<saltB64>$<hashB64>`.
 * Use for portal user credentials created by `provisionPortalUser()`.
 */
/** Hash a plaintext password for storage (e.g. Airtable PasswordHash field). */
declare function hashPassword(plain: string): Promise<string>;
/** Constant-time verify a plaintext password against a stored hash. */
declare function verifyPassword(plain: string, stored: string): Promise<boolean>;
/** Generate a readable temporary password (no ambiguous chars: 0/O, 1/l/I). */
declare function generateTempPassword(length?: number): string;

export { generateTempPassword, hashPassword, verifyPassword };
