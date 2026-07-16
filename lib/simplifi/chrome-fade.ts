/**
 * Chrome Fade — opt-in compact Simplifi navigation.
 * Default remains full Brief / Capture / Inbox / Settings chrome.
 * When enabled, primary middle links hide; Orb + language cover those surfaces.
 * Does NOT change Brief as home or enable chat-first Orb.
 */

export const CHROME_FADE_COOKIE = 'ea-simplifi-chrome-fade';
export const CHROME_FADE_STORAGE_KEY = 'ea-simplifi-chrome-fade';
export const CHROME_FADE_CHANGE_EVENT = 'simplifi-chrome-fade-change';

export function envChromeFadeEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_SIMPLIFI_CHROME_FADE?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** Server: cookie + optional query override. */
export function isChromeFadeEnabled(input: {
  cookieValue?: string | null;
  queryFade?: string | null;
}): boolean {
  const q = input.queryFade?.trim().toLowerCase();
  if (q === '0' || q === 'false' || q === 'off') return false;
  if (q === '1' || q === 'true' || q === 'on') return true;
  if (input.cookieValue === '1') return true;
  return envChromeFadeEnabled();
}

/** Client preference helpers. */
export function readChromeFadePreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(CHROME_FADE_STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    // ignore
  }
  return null;
}

export function writeChromeFadePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHROME_FADE_STORAGE_KEY, enabled ? '1' : '0');
    document.cookie = `${CHROME_FADE_COOKIE}=${enabled ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.dispatchEvent(
      new CustomEvent(CHROME_FADE_CHANGE_EVENT, { detail: { enabled } }),
    );
  } catch {
    // ignore
  }
}

/** Resolve fade mode in the browser (localStorage → cookie → env). */
export function resolveChromeFadeClient(): boolean {
  if (typeof window === 'undefined') return envChromeFadeEnabled();
  const stored = readChromeFadePreference();
  if (stored !== null) return stored;
  try {
    const match = document.cookie.match(new RegExp(`${CHROME_FADE_COOKIE}=([^;]+)`));
    if (match?.[1] === '1') return true;
    if (match?.[1] === '0') return false;
  } catch {
    // ignore
  }
  return envChromeFadeEnabled();
}
