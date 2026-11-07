import { Client } from "pg";
import { paypalConfig } from "@/lib/tb3/paypal-config";
import { paypalDatabaseUrl } from "@/lib/tb3/paypal-database-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  // Prevent diagnostics from running on production or outside the dedicated TB3 test branch.
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "work/tb3-paypal-sandbox-preview-20261107" ||
    process.env.TB3_PAYPAL_ENV !== "sandbox"
  ) return Response.json({ available: false }, { status: 404, headers });

  const config = paypalConfig();
  const raw = paypalDatabaseUrl();
  const result: Record<string, unknown> = {
    sandbox: true,
    configuration: config && raw ? "ok" : "incomplete",
    database: "not_tested",
    paypalAuth: "not_tested",
  };

  if (raw) {
    let client: Client | undefined;
    try {
      const url = new URL(raw);
      for (const name of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) url.searchParams.delete(name);
      client = new Client({
        connectionString: url.toString(),
        ssl: {
          rejectUnauthorized: true,
          ...(process.env.EA_MERCHANT_DB_CA_PEM ? { ca: process.env.EA_MERCHANT_DB_CA_PEM } : {}),
        },
        connectionTimeoutMillis: 5000,
        query_timeout: 5000,
        statement_timeout: 5000,
      });
      await client.connect();
      const found = await client.query(
        "SELECT current_user AS role, has_table_privilege(current_user, 'public.tb3_paypal_orders', 'SELECT,INSERT,UPDATE') AS access",
      );
      result.database = found.rows[0]?.role === "ea_merchant_api" && found.rows[0]?.access === true
        ? "ok" : "permission_or_role_mismatch";
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code || "").slice(0, 10) : "";
      result.database = code ? "postgres_error_" + code : "connection_failed";
    } finally {
      if (client) await client.end().catch(() => undefined);
    }
  }

  // Diagnostic-only OAuth check works while the checkout certification gate is closed.
  // Never return a token, credential, account identifier, or provider response body.
  const sandboxClientId = process.env.TB3_PAYPAL_CLIENT_ID?.trim();
  const sandboxSecret = process.env.TB3_PAYPAL_CLIENT_SECRET?.trim();
  if (sandboxClientId && sandboxSecret) {
    try {
      const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(sandboxClientId + ":" + sandboxSecret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      const body = await response.json().catch(() => ({}));
      result.paypalAuth = response.ok && typeof body.access_token === "string"
        ? "ok" : "authentication_failed_" + response.status;
    } catch {
      result.paypalAuth = "provider_unreachable";
    }
  }
  return Response.json(result, { headers });
}
