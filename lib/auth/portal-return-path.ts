/** Same-origin relative return destinations; block ambiguous URL forms. */
export function safePortalReturnPath(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u0020]/.test(raw)) return undefined;
  try {
    const url = new URL(raw, 'https://portal.invalid');
    if (url.origin !== 'https://portal.invalid') return undefined;
    if (url.pathname === '/simplifi/capture' || url.pathname.startsWith('/simplifi/')) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return undefined; }
}
