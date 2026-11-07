/** Catalog-only inspection. Never executes the migration or reads ledger rows. */
export type PreflightClient = {
  query: (
    sql: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};
type Column = {
  name: string;
  type: string;
  notNull: boolean;
  generated: string;
  expression: string | null;
};
type Constraint = { type: string; columns: string[]; definition: string };
export type LedgerSchema = {
  kind: string;
  rls: boolean;
  forceRls: boolean;
  columns: Column[];
  constraints: Constraint[];
};
const expected = [
  ["id", "text", true, ""],
  ["tenant_slug", "text", true, ""],
  ["payload", "jsonb", true, ""],
  ["paypal_id", "text", false, "s"],
  ["capture_id", "text", false, "s"],
  ["updated_at", "timestamp with time zone", true, ""],
] as const;
const requiredPayload = [
  "id",
  "tenant",
  "mode",
  "state",
  "merchantId",
  "inputHash",
  "total",
  "subtotal",
  "shipping",
  "tax",
  "createdAt",
];
export function assessLedgerSchema(schema: LedgerSchema | null) {
  if (!schema)
    return { exists: false, schemaCompatible: null, issues: [] as string[] };
  schema = {
    ...schema,
    columns: schema.columns || [],
    constraints: schema.constraints || [],
  };
  const issues: string[] = [];
  if (schema.kind !== "r") issues.push("Name belongs to a non-table relation");
  if (!schema.rls || !schema.forceRls)
    issues.push("Required RLS protection differs");
  if (schema.columns.length !== expected.length)
    issues.push("Column count differs");
  for (const [name, type, notNull, generated] of expected) {
    const c = schema.columns.find((c) => c.name === name);
    if (
      !c ||
      c.type !== type ||
      c.notNull !== notNull ||
      c.generated !== generated
    )
      issues.push("Column mismatch: " + name);
  }
  for (const [name, key] of [
    ["paypal_id", "paypalId"],
    ["capture_id", "captureId"],
  ]) {
    const expr = schema.columns
      .find((c) => c.name === name)
      ?.expression?.replace(/[\s()]/g, "");
    if (expr !== `payload->>'${key}'::text` && expr !== `payload->>'${key}'`)
      issues.push("Generated identity mismatch: " + name);
  }
  for (const [type, name] of [
    ["p", "id"],
    ["u", "paypal_id"],
    ["u", "capture_id"],
  ])
    if (
      !schema.constraints.some(
        (c) =>
          c.type === type && c.columns.length === 1 && c.columns[0] === name,
      )
    )
      issues.push("Missing key constraint: " + name);
  const checks = schema.constraints
    .filter((c) => c.type === "c")
    .map((c) => c.definition);
  for (const pattern of [
    /id.*\^\[a-f0-9\]\{64\}\$/,
    /tenant_slug.*tarris/,
    /payload.*id.*tenant/,
    /mode.*live.*sandbox/,
    /state.*creating.*created.*paid.*hold/,
  ])
    if (!checks.some((x) => pattern.test(x)))
      issues.push("Required check constraint differs: " + pattern.source);
  if (
    !checks.some(
      (x) =>
        x.includes("?&") &&
        requiredPayload.every((k) => x.includes("'" + k + "'")),
    )
  )
    issues.push("Required payload keys differ");
  return { exists: true, schemaCompatible: issues.length === 0, issues };
}
export async function preflightPayPalMigration(client: PreflightClient) {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    await client.query("SET LOCAL statement_timeout='5s'");
    const result =
      await client.query(`SELECT c.relkind AS kind,c.relrowsecurity AS rls,c.relforcerowsecurity AS "forceRls",
   (SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull,'generated',a.attgenerated,
    'expression',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
   (SELECT COALESCE(jsonb_agg(jsonb_build_object('type',co.contype,'definition',pg_get_constraintdef(co.oid),
     'columns',ARRAY(SELECT a.attname FROM unnest(co.conkey) WITH ORDINALITY k(num,ord)
      JOIN pg_catalog.pg_attribute a ON a.attrelid=co.conrelid AND a.attnum=k.num ORDER BY k.ord))),'[]'::jsonb)
    FROM pg_catalog.pg_constraint co WHERE co.conrelid=c.oid) AS constraints
   FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='tb3_paypal_orders'`);
    const roles = await client.query(
      "SELECT rolname FROM pg_catalog.pg_roles WHERE rolname IN ('ea_merchant_api','anon','authenticated')",
    );
    const types = await client.query(
      "SELECT t.typname FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tb3_paypal_orders'",
    );
    const missingRoles = ["ea_merchant_api", "anon", "authenticated"].filter(
      (name) => !roles.rows.some((r) => r.rolname === name),
    );
    const assessment = assessLedgerSchema(
      (result.rows[0] || null) as LedgerSchema | null,
    );
    const typeCollision = !assessment.exists && types.rows.length > 0;
    const allowed =
      !assessment.exists && !typeCollision && !missingRoles.length;
    return {
      status: allowed ? "PASS" : "BLOCKED",
      migrationAllowed: allowed,
      ...assessment,
      missingRoles,
      typeCollision,
      reason: assessment.exists
        ? "Existing relation: do not execute the create migration, even if structurally compatible"
        : typeCollision
          ? "Existing PostgreSQL type name collision: do not execute the migration"
          : missingRoles.length
            ? "Required migration roles are missing"
            : "Target name is absent; separate migration approval still required",
    };
  } finally {
    await client.query("ROLLBACK");
  }
}
