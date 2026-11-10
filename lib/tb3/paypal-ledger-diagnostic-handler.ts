import { createHash, timingSafeEqual } from "node:crypto";

export const TB3_LEDGER_DIAGNOSTIC_BRANCH = "work/tb3-commerce-hq-20261109";
export const TB3_LEDGER_DIAGNOSTIC_SANDBOX_PROJECT = "jkoasrnjlehjziynxfrn";
export const TB3_LEDGER_DIAGNOSTIC_PRODUCTION_PROJECT = "dwygvwnjjaennksddniu";

const TOKEN_HEADER = "x-tb3-ledger-diagnostic-token";
const REQUIRED_COLUMNS = ["id", "tenant_slug", "payload", "paypal_id", "capture_id", "updated_at"];

type QueryResult = { rows: Record<string, unknown>[] };
export type Tb3LedgerDiagnosticClient = {
  connect(): Promise<void>;
  query(sql: string): Promise<QueryResult>;
  end(): Promise<void>;
};

export function verifyTb3LedgerDiagnosticToken(token: string | null, expectedHex: string | undefined): boolean {
  if (!token || token.length < 43 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) return false;
  if (!expectedHex || !/^[a-f0-9]{64}$/i.test(expectedHex)) return false;
  return timingSafeEqual(
    createHash("sha256").update(token, "utf8").digest(),
    Buffer.from(expectedHex, "hex"),
  );
}

function projectFromUrl(url: URL): { project: string; role: string; safeUrl: string } | null {
  if (url.searchParams.get("sslmode") === "disable") return null;
  if (!(url.protocol === "postgres:" || url.protocol === "postgresql:")) return null;
  const hostRef = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1]?.toLowerCase() ?? "";
  const hostIsSupabase = url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".pooler.supabase.com");
  if (!hostIsSupabase) return null;
  let username = "";
  try { username = decodeURIComponent(url.username); } catch { return null; }
  const match = username.match(/^(ea_merchant_api)(?:\.([a-z0-9]+))?$/i);
  if (!match) return null;
  const userRef = (match[2] ?? "").toLowerCase();
  if (hostRef && userRef && hostRef !== userRef) return null;
  const project = hostRef || userRef;
  if (!project) return null;
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) url.searchParams.delete(key);
  return { project, role: match[1].toLowerCase(), safeUrl: url.toString() };
}

const TABLE_SQL = `SELECT c.relrowsecurity AS rls, c.relforcerowsecurity AS forced,
  array_agg(a.attname ORDER BY a.attnum) FILTER (WHERE a.attname IS NOT NULL) AS columns
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
  WHERE n.nspname='public' AND c.relname='tb3_paypal_orders'
  GROUP BY c.relrowsecurity,c.relforcerowsecurity`;

const COLUMN_DETAILS_SQL = `SELECT a.attname AS name,format_type(a.atttypid,a.atttypmod) AS data_type,
  a.attnotnull AS not_null,a.attgenerated AS generated,pg_get_expr(d.adbin,d.adrelid) AS expression
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_attribute a ON a.attrelid=c.oid
  LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
  WHERE n.nspname='public' AND c.relname='tb3_paypal_orders'
    AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`;

const CONSTRAINT_SQL = `SELECT con.conname AS name,con.contype AS type,
  ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY k(attnum,ord)
    JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=k.attnum ORDER BY k.ord) AS columns,
  pg_get_constraintdef(con.oid) AS definition
  FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='tb3_paypal_orders' ORDER BY con.conname`;

const INDEX_SQL = `SELECT i.relname AS name,ix.indisprimary AS primary,ix.indisunique AS unique,
  ix.indisvalid AS valid,ix.indisready AS ready,(ix.indpred IS NOT NULL) AS partial,
  array_agg(a.attname ORDER BY k.ordinality) FILTER (WHERE k.ordinality<=ix.indnkeyatts AND a.attname IS NOT NULL) AS columns
  FROM pg_index ix JOIN pg_class t ON t.oid=ix.indrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  JOIN pg_class i ON i.oid=ix.indexrelid
  JOIN unnest(ix.indkey) WITH ORDINALITY k(attnum, ordinality) ON true
  LEFT JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=k.attnum
  WHERE n.nspname='public' AND t.relname='tb3_paypal_orders'
  GROUP BY i.relname,ix.indisprimary,ix.indisunique,ix.indisvalid,ix.indisready,ix.indpred,ix.indnkeyatts`;

const POLICY_SQL = `SELECT policyname, roles::text[] AS roles, cmd, qual, with_check
  FROM pg_policies WHERE schemaname='public' AND tablename='tb3_paypal_orders'`;

const ACCESS_SQL = `SELECT current_user AS actual_role,
  has_table_privilege(current_user,'public.tb3_paypal_orders','SELECT') AS api_select,
  has_table_privilege(current_user,'public.tb3_paypal_orders','INSERT') AS api_insert,
  has_table_privilege(current_user,'public.tb3_paypal_orders','UPDATE') AS api_update,
  has_table_privilege(current_user,'public.tb3_paypal_orders','DELETE') AS api_delete,
  has_table_privilege(current_user,'public.tb3_paypal_orders','TRUNCATE') AS api_truncate,
  has_table_privilege(current_user,'public.tb3_paypal_orders','REFERENCES') AS api_references,
  has_table_privilege(current_user,'public.tb3_paypal_orders','TRIGGER') AS api_trigger,
  has_table_privilege('anon','public.tb3_paypal_orders','SELECT') AS anon_select,
  has_table_privilege('anon','public.tb3_paypal_orders','INSERT') AS anon_insert,
  has_table_privilege('anon','public.tb3_paypal_orders','UPDATE') AS anon_update,
  has_table_privilege('anon','public.tb3_paypal_orders','DELETE') AS anon_delete,
  has_table_privilege('authenticated','public.tb3_paypal_orders','SELECT') AS authenticated_select,
  has_table_privilege('authenticated','public.tb3_paypal_orders','INSERT') AS authenticated_insert,
  has_table_privilege('authenticated','public.tb3_paypal_orders','UPDATE') AS authenticated_update,
  has_table_privilege('authenticated','public.tb3_paypal_orders','DELETE') AS authenticated_delete,
  has_table_privilege('service_role','public.tb3_paypal_orders','SELECT') AS service_select,
  has_table_privilege('service_role','public.tb3_paypal_orders','INSERT') AS service_insert,
  has_table_privilege('service_role','public.tb3_paypal_orders','UPDATE') AS service_update,
  has_table_privilege('service_role','public.tb3_paypal_orders','DELETE') AS service_delete,
  COALESCE((SELECT bool_or(x.grantee=0) FROM pg_class c
    CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) x
    WHERE c.oid='public.tb3_paypal_orders'::regclass),false) AS public_acl`;

type DiagnosticChecks = {
  previewBranch: boolean;
  sandboxProject: boolean;
  productionExcluded: boolean;
  databaseConnected: boolean;
  ledgerExists: boolean;
  requiredColumns: boolean;
  primaryAndProviderUniqueKeys: boolean;
  rlsEnabled: boolean;
  rlsForced: boolean;
  tenantPolicy: boolean;
  restrictedRoleAccess: boolean;
  checkoutDisabled: boolean;
  printfulSubmissionDisabled: boolean;
};

const blankChecks = (checkoutDisabled: boolean, printfulSubmissionDisabled: boolean): DiagnosticChecks => ({
  previewBranch: false,
  sandboxProject: false,
  productionExcluded: false,
  databaseConnected: false,
  ledgerExists: false,
  requiredColumns: false,
  primaryAndProviderUniqueKeys: false,
  rlsEnabled: false,
  rlsForced: false,
  tenantPolicy: false,
  restrictedRoleAccess: false,
  checkoutDisabled,
  printfulSubmissionDisabled,
});

export function createTb3PayPalLedgerDiagnosticHandler(deps: {
  environment: () => { vercel?: string; branch?: string; checkoutEnabled?: string; printfulDraftApproved?: string; printfulAutoApproved?: string };
  diagnosticTokenSha256: () => string | undefined;
  sandboxDatabaseUrl: () => string | undefined;
  databaseCa: () => string | undefined;
  connect: (connectionString: string, ca?: string) => Promise<Tb3LedgerDiagnosticClient>;
  json?: (body: unknown, status?: number) => Response;
}) {
  const json = deps.json ?? ((body, status = 200) => Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  }));

  return async function GET(request: Request): Promise<Response> {
    const env = deps.environment();
    if (env.vercel !== "preview" || env.branch !== TB3_LEDGER_DIAGNOSTIC_BRANCH) {
      return json({ status: "FAIL" }, 404);
    }
    const checkoutDisabled = env.checkoutEnabled !== "true";
    const printfulSubmissionDisabled = env.printfulDraftApproved !== "true" && env.printfulAutoApproved !== "true";
    const preflightChecks = blankChecks(checkoutDisabled, printfulSubmissionDisabled);
    preflightChecks.previewBranch = true;
    if (!checkoutDisabled || !printfulSubmissionDisabled) return json({ status: "FAIL", checks: preflightChecks }, 503);
    if (!verifyTb3LedgerDiagnosticToken(request.headers.get(TOKEN_HEADER), deps.diagnosticTokenSha256())) {
      return json({ status: "FAIL" }, 401);
    }

    const raw = deps.sandboxDatabaseUrl();
    if (!raw) return json({ status: "FAIL", checks: preflightChecks }, 503);
    let parsed: ReturnType<typeof projectFromUrl> = null;
    try { parsed = projectFromUrl(new URL(raw)); } catch { parsed = null; }
    if (!parsed || parsed.project !== TB3_LEDGER_DIAGNOSTIC_SANDBOX_PROJECT || parsed.project === TB3_LEDGER_DIAGNOSTIC_PRODUCTION_PROJECT) {
      preflightChecks.sandboxProject = parsed?.project === TB3_LEDGER_DIAGNOSTIC_SANDBOX_PROJECT;
      preflightChecks.productionExcluded = !!parsed && parsed.project !== TB3_LEDGER_DIAGNOSTIC_PRODUCTION_PROJECT;
      return json({ status: "FAIL", checks: preflightChecks }, 503);
    }

    let client: Tb3LedgerDiagnosticClient | undefined;
    let inTransaction = false;
    try {
      client = await deps.connect(parsed.safeUrl, deps.databaseCa());
      await client.connect();
      preflightChecks.databaseConnected = true;
      await client.query("BEGIN READ ONLY");
      inTransaction = true;
      const [tableResult, columnResult, constraintResult, indexResult, policiesResult, accessResult] = await Promise.all([
        client.query(TABLE_SQL), client.query(COLUMN_DETAILS_SQL), client.query(CONSTRAINT_SQL),
        client.query(INDEX_SQL), client.query(POLICY_SQL), client.query(ACCESS_SQL),
      ]);
      await client.query("ROLLBACK");
      inTransaction = false;

      const table = tableResult.rows[0];
      const columns = Array.isArray(table?.columns) ? table.columns.map(String) : [];
      const columnDetails = columnResult.rows.map((row) => ({
        name: String(row.name),
        type: String(row.data_type),
        notNull: row.not_null === true,
        generated: row.generated === "s",
        expression: typeof row.expression === "string" ? row.expression : null,
      }));
      const indexRows = indexResult.rows;
      const indexes = indexRows.map((row) => ({
        name: String(row.name),
        primary: row.primary === true,
        unique: row.unique === true,
        valid: row.valid === true,
        ready: row.ready === true,
        partial: row.partial === true,
        columns: Array.isArray(row.columns) ? row.columns.map(String) : [],
      }));
      const constraints = constraintResult.rows.map((row) => ({
        name: String(row.name),
        type: String(row.type),
        columns: Array.isArray(row.columns) ? row.columns.map(String) : [],
        definition: String(row.definition),
      }));
      const policy = policiesResult.rows.find((row) => row.policyname === "tb3_paypal_server_only");
      const roles = Array.isArray(policy?.roles) ? policy.roles.map(String) : [];
      const tenantPolicy = policiesResult.rows.length === 1 && !!policy && roles.length === 1 && roles[0] === "ea_merchant_api" && policy.cmd === "ALL"
        && /tenant_slug/i.test(String(policy.qual ?? "")) && /tarris/i.test(String(policy.qual ?? ""))
        && /tenant_slug/i.test(String(policy.with_check ?? "")) && /tarris/i.test(String(policy.with_check ?? ""));
      const access = accessResult.rows[0] ?? {};
      const noBroadAccess = access.actual_role === "ea_merchant_api"
        && access.api_select === true && access.api_insert === true && access.api_update === true
        && access.api_delete === false && access.api_truncate === false && access.api_references === false && access.api_trigger === false
        && access.anon_select === false && access.anon_insert === false && access.anon_update === false && access.anon_delete === false
        && access.authenticated_select === false && access.authenticated_insert === false && access.authenticated_update === false && access.authenticated_delete === false
        && access.service_select === false && access.service_insert === false && access.service_update === false && access.service_delete === false
        && access.public_acl === false;
      const normalizeExpression = (expression: string | null) => (expression ?? "")
        .toLowerCase().replace(/::text/g, "").replace(/[\s()'\"]/g, "");
      const generatedIdentityColumns = {
        paypal_id: columnDetails.some((column) => column.name === "paypal_id" && column.generated
          && normalizeExpression(column.expression) === "payload->>paypalid"),
        capture_id: columnDetails.some((column) => column.name === "capture_id" && column.generated
          && normalizeExpression(column.expression) === "payload->>captureid"),
      };
      const identityConstraints = {
        primaryId: constraints.some((constraint) => constraint.type === "p" && constraint.columns.join(",") === "id"),
        uniquePaypalId: constraints.some((constraint) => constraint.type === "u" && constraint.columns.join(",") === "paypal_id"),
        uniqueCaptureId: constraints.some((constraint) => constraint.type === "u" && constraint.columns.join(",") === "capture_id"),
      };
      const identityIndexes = {
        primaryId: indexes.some((index) => index.primary && index.unique && index.valid && index.ready && !index.partial && index.columns.join(",") === "id"),
        uniquePaypalId: indexes.some((index) => !index.primary && index.unique && index.valid && index.ready && !index.partial && index.columns.join(",") === "paypal_id"),
        uniqueCaptureId: indexes.some((index) => !index.primary && index.unique && index.valid && index.ready && !index.partial && index.columns.join(",") === "capture_id"),
      };
      const resultChecks = {
        previewBranch: true,
        sandboxProject: parsed.project === TB3_LEDGER_DIAGNOSTIC_SANDBOX_PROJECT,
        productionExcluded: parsed.project !== TB3_LEDGER_DIAGNOSTIC_PRODUCTION_PROJECT,
        databaseConnected: preflightChecks.databaseConnected,
        ledgerExists: !!table,
        requiredColumns: REQUIRED_COLUMNS.every((column) => columns.includes(column)),
        primaryAndProviderUniqueKeys: Object.values(identityIndexes).every(Boolean),
        generatedIdentityColumns: Object.values(generatedIdentityColumns).every(Boolean),
        rlsEnabled: table?.rls === true,
        rlsForced: table?.forced === true,
        tenantPolicy,
        restrictedRoleAccess: noBroadAccess,
        checkoutDisabled,
        printfulSubmissionDisabled,
      };
      const status = Object.values(resultChecks).every(Boolean) ? "PASS" : "FAIL";
      return json({
        status,
        checks: resultChecks,
        schemaMetadata: {
          columns: columnDetails,
          constraints,
          indexes,
          identityConstraintsBacked: Object.values(identityConstraints).every(Boolean),
        },
      }, status === "PASS" ? 200 : 503);
    } catch {
      return json({
        status: "FAIL",
        checks: { ...preflightChecks, sandboxProject: true, productionExcluded: true },
      }, 503);
    } finally {
      if (client) {
        if (inTransaction) await client.query("ROLLBACK").catch(() => undefined);
        await client.end().catch(() => undefined);
      }
    }
  };
}
