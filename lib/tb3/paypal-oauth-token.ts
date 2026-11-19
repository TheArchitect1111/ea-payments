import type { Tb3PayPalOAuthConfig } from "./paypal-oauth-config";

export async function requestTb3PayPalOAuthToken(config: Tb3PayPalOAuthConfig, fetcher: typeof fetch = fetch) {
  return fetcher("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(config.clientId + ":" + config.secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
}
