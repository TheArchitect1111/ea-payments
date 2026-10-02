// Existing Amanda Jane destination and Gmail account, approved by locked v2.1.
export const AMANDA_SUPPORT_GMAIL_ADDRESS = 'amandacatherinec@gmail.com';
export const AMANDA_DEFAULT_JANE_BOOKING_URL = 'https://aesthetikine.janeapp.com/';
export function amandaJaneBookingUrl(configuredUrl?: string) {
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl.trim());
      if (url.protocol === 'https:' && url.hostname.endsWith('.janeapp.com') && !url.username && !url.password) return url.href;
    } catch { /* Retain the existing approved Jane destination. */ }
  }
  return AMANDA_DEFAULT_JANE_BOOKING_URL;
}
