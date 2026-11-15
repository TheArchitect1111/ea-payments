export type PayPalConfig = {
  mode: "live" | "sandbox";
  clientId: string;
  secret: string;
  merchantId: string;
  webhookId: string;
  origin: string;
};
export function paypalConfig(): PayPalConfig | null {
  if (process.env.TB3_PAYPAL_ENABLED !== "true") return null;
  const mode = process.env.TB3_PAYPAL_ENV;
  if (
    (mode !== "live" && mode !== "sandbox") ||
    (mode === "live" && process.env.VERCEL_ENV !== "production") ||
    (mode === "sandbox" && process.env.VERCEL_ENV === "production")
  )
    return null;
  const clientId = process.env.TB3_PAYPAL_CLIENT_ID?.trim(),
    secret = process.env.TB3_PAYPAL_CLIENT_SECRET?.trim();
  const merchantId = process.env.TB3_PAYPAL_MERCHANT_ID?.trim(),
    webhookId = process.env.TB3_PAYPAL_WEBHOOK_ID?.trim();
  const origin = process.env.TB3_PAYPAL_ORIGIN?.trim();
  if (!clientId || !secret || !merchantId || !webhookId || !origin) return null;
  try {
    const u = new URL(origin);
    if (
      u.origin !== origin ||
      u.username ||
      u.password ||
      (mode === "live"
        ? u.protocol !== "https:"
        : !["https:", "http:"].includes(u.protocol))
    )
      return null;
  } catch {
    return null;
  }
  if (!/^[A-Za-z0-9]{6,64}$/.test(merchantId)) return null;
  return { mode, clientId, secret, merchantId, webhookId, origin };
}
