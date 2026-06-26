'use strict';

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

exports.generateTempPassword = generateTempPassword;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
//# sourceMappingURL=passwords.cjs.map
//# sourceMappingURL=passwords.cjs.map