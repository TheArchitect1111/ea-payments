export type Tb3PayPalOAuthConfig = {
  mode: "live";
  clientId: string;
  secret: string;
};

export function tb3PayPalOAuthConfig(): Tb3PayPalOAuthConfig | null {
  if (process.env.TB3_PAYPAL_ENABLED !== "true" || process.env.TB3_PAYPAL_ENV !== "live") return null;
  const clientId = process.env.TB3_PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.TB3_PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) return null;
  return { mode: "live", clientId, secret };
}
