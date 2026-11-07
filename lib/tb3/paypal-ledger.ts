import "server-only";
import { Client } from "pg";
import type { PayPalIntent, PayPalLedger } from "./paypal-types";
import { paypalDatabaseUrl } from "./paypal-database-config";

function connection() {
  const raw = paypalDatabaseUrl();
  if (!raw) throw Error("PayPal durable ledger unavailable");
  const url = new URL(raw);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".supabase.com") ||
    !/^(ea_merchant_api|tb3_paypal_api)(\.[a-z0-9]+)?$/.test(url.username) ||
    url.searchParams.get("sslmode") === "disable"
  )
    throw Error("Restricted TLS ledger required");
  for (const name of ["sslmode", "sslrootcert", "sslcert", "sslkey"])
    url.searchParams.delete(name);
  return url.toString();
}
async function database<T>(fn: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString: connection(),
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.EA_MERCHANT_DB_CA_PEM
        ? { ca: process.env.EA_MERCHANT_DB_CA_PEM }
        : {}),
    },
    connectionTimeoutMillis: 5000,
    query_timeout: 30000,
    statement_timeout: 30000,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
function row(value: unknown): PayPalIntent | null {
  if (!value) return null;
  const v = value as PayPalIntent;
  if (v.tenant !== "tarris" || !/^[a-f0-9]{64}$/.test(v.id))
    throw Error("Ledger identity mismatch");
  return v;
}
export const paypalLedger: PayPalLedger = {
  async lock(id, fn) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw Error("Invalid ledger identity");
    return database(async (client) => {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout='5s'");
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          ["tarris/paypal/" + id],
        );
        const result = await client.query(
          "SELECT payload FROM public.tb3_paypal_orders WHERE tenant_slug=$1 AND id=$2 FOR UPDATE",
          ["tarris", id],
        );
        const value = await fn(row(result.rows[0]?.payload), async (next) => {
          if (next.id !== id || next.tenant !== "tarris")
            throw Error("Ledger tenant mismatch");
          const saved = await client.query(
            `INSERT INTO public.tb3_paypal_orders(id,tenant_slug,payload) VALUES($1,'tarris',$2::jsonb)
      ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=now()
      WHERE tb3_paypal_orders.tenant_slug='tarris' AND tb3_paypal_orders.payload->>'inputHash'=EXCLUDED.payload->>'inputHash'
       AND tb3_paypal_orders.payload->>'merchantId'=EXCLUDED.payload->>'merchantId'
       AND tb3_paypal_orders.payload->>'mode'=EXCLUDED.payload->>'mode'
       AND (tb3_paypal_orders.paypal_id IS NULL OR tb3_paypal_orders.paypal_id=EXCLUDED.payload->>'paypalId')
       AND (tb3_paypal_orders.capture_id IS NULL OR tb3_paypal_orders.capture_id=EXCLUDED.payload->>'captureId') RETURNING id`,
            [id, JSON.stringify(next)],
          );
          if (saved.rowCount !== 1) throw Error("Durable order write rejected");
        });
        await client.query("COMMIT");
        return value;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  },
  async find(orderId, captureId = "") {
    return database(async (client) => {
      const found = await client.query(
        `SELECT payload FROM public.tb3_paypal_orders WHERE tenant_slug='tarris'
    AND (($1<>'' AND paypal_id=$1) OR ($2<>'' AND capture_id=$2)) LIMIT 1`,
        [orderId, captureId],
      );
      return row(found.rows[0]?.payload);
    });
  },
};
