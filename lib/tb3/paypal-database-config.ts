/** Sandbox must be explicitly provisioned; never fall back to a live ledger. */
export function paypalDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.TB3_PAYPAL_ENV !== "sandbox")
    return env.TB3_PAYPAL_DATABASE_URL || env.EA_MERCHANT_DATABASE_URL;
  const raw = env.TB3_PAYPAL_SANDBOX_DATABASE_URL;
  if (!raw?.trim()) return undefined;
  try {
    const identity = (value: string) => {
      const u = new URL(value);
      return [
        u.hostname,
        u.port,
        u.pathname,
        u.username.includes(".") ? u.username.split(".").at(-1) : "",
      ].join("|");
    };
    const sandbox = identity(raw);
    for (const live of [
      env.TB3_PAYPAL_DATABASE_URL,
      env.EA_MERCHANT_DATABASE_URL,
    ])
      if (live && identity(live) === sandbox) return undefined;
    return raw;
  } catch {
    return undefined;
  }
}
