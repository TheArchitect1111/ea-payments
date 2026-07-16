/**
 * Orb OS Preview — feature flag for conversational Simplifi shell.
 * Classic Brief UI remains default until explicitly enabled.
 */

export const ORB_OS_PREVIEW_COOKIE = 'ea-orb-os-preview';
export const ORB_OS_PREVIEW_STORAGE_KEY = 'ea-orb-os-preview';

export function envOrbOsPreviewEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ORB_OS_PREVIEW?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** Server: cookie + optional query override. */
export function isOrbOsPreviewEnabled(input: {
  cookieValue?: string | null;
  queryOrb?: string | null;
}): boolean {
  const q = input.queryOrb?.trim().toLowerCase();
  if (q === '0' || q === 'false' || q === 'off') return false;
  if (q === '1' || q === 'true' || q === 'on') return true;
  if (input.cookieValue === '1') return true;
  return envOrbOsPreviewEnabled();
}

/** Client preference helpers. */
export function readOrbOsPreviewPreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(ORB_OS_PREVIEW_STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    // ignore
  }
  return null;
}

export function writeOrbOsPreviewPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORB_OS_PREVIEW_STORAGE_KEY, enabled ? '1' : '0');
    document.cookie = `${ORB_OS_PREVIEW_COOKIE}=${enabled ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    // ignore
  }
}
