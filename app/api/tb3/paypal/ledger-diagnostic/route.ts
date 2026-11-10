import { Client } from "pg";
import { createTb3PayPalLedgerDiagnosticHandler } from "@/lib/tb3/paypal-ledger-diagnostic-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createTb3PayPalLedgerDiagnosticHandler({
  environment: () => ({
    vercel: process.env.VERCEL_ENV,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    checkoutEnabled: process.env.TB3_PAYPAL_ENABLED,
    printfulDraftApproved: process.env.TB3_MERCH_DRAFT_FULFILLMENT_APPROVED,
    printfulAutoApproved: process.env.TB3_PAYPAL_AUTO_FULFILLMENT_APPROVED,
  }),
  diagnosticTokenSha256: () => process.env.TB3_PAYPAL_DB_DIAGNOSTIC_TOKEN_SHA256,
  sandboxDatabaseUrl: () => process.env.TB3_PAYPAL_SANDBOX_DATABASE_URL,
  databaseCa: () => process.env.EA_MERCHANT_DB_CA_PEM,
  connect: async (connectionString, ca) => {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
      connectionTimeoutMillis: 5000,
      query_timeout: 10000,
      statement_timeout: 10000,
    });
    return client;
  },
});
