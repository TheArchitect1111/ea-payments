export type AmandaKitTrackingInput = { carrier: string; trackingNumber: string; trackingUrl: string };

export function validateAmandaKitTrackingInput(value: unknown): AmandaKitTrackingInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const carrier = String(input.carrier || '').trim();
  const trackingNumber = String(input.trackingNumber || '').trim();
  const trackingUrl = String(input.trackingUrl || '').trim();
  if (!carrier || carrier.length > 80 || !trackingNumber || trackingNumber.length > 120 || !trackingUrl || trackingUrl.length > 2000) return null;
  try {
    const url = new URL(trackingUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
  } catch { return null; }
  return { carrier, trackingNumber, trackingUrl };
}
