import type { PayPalConfig } from "./paypal-config";
import type { PayPalObject } from "./paypal-types";

export class PayPalError extends Error {
  constructor(
    public status: number,
    public issue = "PROVIDER_UNAVAILABLE",
  ) {
    super("PayPal request failed");
  }
}
export function paypalTransport(
  config: PayPalConfig,
  fetcher: typeof fetch = fetch,
) {
  const base =
    config.mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  let token = "",
    expires = 0;
  async function access() {
    if (token && Date.now() < expires) return token;
    const r = await fetcher(base + "/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(config.clientId + ":" + config.secret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json().catch(() => null);
    if (
      !r.ok ||
      typeof data?.access_token !== "string" ||
      data.token_type?.toLowerCase() !== "bearer"
    )
      throw new PayPalError(503);
    token = data.access_token;
    expires =
      Date.now() +
      Math.max(0, Math.min(Number(data.expires_in) || 0, 3600) - 60) * 1000;
    return token;
  }
  return async function request(
    path: string,
    method: "GET" | "POST" = "GET",
    body?: unknown,
    requestId?: string,
  ): Promise<PayPalObject> {
    if (!/^\/v[12]\/[a-zA-Z0-9/_-]+$/.test(path))
      throw new PayPalError(400, "INVALID_PATH");
    const r = await fetcher(base + path, {
      method,
      headers: {
        Authorization: "Bearer " + (await access()),
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data || typeof data !== "object") {
      const issue = data?.details?.find(
        (x: PayPalObject) => x.issue === "INSTRUMENT_DECLINED",
      )?.issue;
      throw new PayPalError(
        r.status >= 500 ? 503 : r.status,
        issue || "PROVIDER_UNAVAILABLE",
      );
    }
    return data;
  };
}

export async function verifyPayPalWebhook(
  headers: Headers,
  event: unknown,
  config: PayPalConfig,
  request: ReturnType<typeof paypalTransport>,
) {
  const names = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];
  const values = names.map((name) => headers.get(name));
  if (values.some((v) => !v || v.length > 4096)) return false;
  try {
    const u = new URL(values[1]!);
    const hosts =
      config.mode === "live"
        ? ["api.paypal.com", "api-m.paypal.com"]
        : ["api.sandbox.paypal.com", "api-m.sandbox.paypal.com"];
    if (
      u.protocol !== "https:" ||
      !hosts.includes(u.hostname) ||
      u.username ||
      u.password ||
      u.port ||
      !u.pathname.startsWith("/v1/notifications/certs/")
    )
      return false;
  } catch {
    return false;
  }
  const result = await request(
    "/v1/notifications/verify-webhook-signature",
    "POST",
    {
      auth_algo: values[0],
      cert_url: values[1],
      transmission_id: values[2],
      transmission_sig: values[3],
      transmission_time: values[4],
      webhook_id: config.webhookId,
      webhook_event: event,
    },
  );
  return result.verification_status === "SUCCESS";
}
