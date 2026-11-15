// Read-only, explicit opt-in CLI. No dotenv loading, migration execution or writes.
import { Client } from "pg";
import { preflightPayPalMigration } from "../lib/tb3/paypal-migration-preflight";
const args = process.argv.slice(2);
const allowed = [
  "TB3_PAYPAL_SANDBOX_DATABASE_URL",
  "TB3_PAYPAL_DATABASE_URL",
  "EA_MERCHANT_DATABASE_URL",
];
async function main() {
  if (
    args.length !== 2 ||
    args[0] !== "--database-env" ||
    !allowed.includes(args[1])
  )
    throw Error("Select an approved database environment variable explicitly");
  const raw = process.env[args[1]];
  if (!raw) throw Error("Selected database configuration unavailable");
  const url = new URL(raw);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".supabase.com") ||
    url.searchParams.get("sslmode") === "disable"
  )
    throw Error("Approved TLS database required");
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"])
    url.searchParams.delete(key);
  const client = new Client({
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.EA_MERCHANT_DB_CA_PEM
        ? { ca: process.env.EA_MERCHANT_DB_CA_PEM }
        : {}),
    },
    connectionTimeoutMillis: 5000,
    query_timeout: 7000,
  });
  try {
    await client.connect();
    const report = await preflightPayPalMigration(client);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.migrationAllowed ? 0 : 1;
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    "BLOCKED: read-only migration preflight unavailable or incomplete. No migration was executed.",
  );
  process.exitCode = 1;
});
