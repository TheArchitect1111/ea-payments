import crypto from 'node:crypto';

export const EACP_CHATGPT_ACTION_KEY_ENV = 'EACP_CHATGPT_ACTION_KEY';

export function getEACPChatGPTActionKey(): string | null {
  return process.env[EACP_CHATGPT_ACTION_KEY_ENV]?.trim() || null;
}

export function readBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function verifyEACPChatGPTActionKey(provided: string | null | undefined): boolean {
  const expected = getEACPChatGPTActionKey();
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
