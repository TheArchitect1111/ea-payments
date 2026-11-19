import type { NextRequest } from "next/server";
import { requireAdminActionFromRequest } from "@/lib/admin-session-guard";
import { tb3PayPalOAuthConfig } from "@/lib/tb3/paypal-oauth-config";
import { createTb3PayPalOAuthDiagnostic } from "@/lib/tb3/paypal-oauth-diagnostic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const diagnostic = createTb3PayPalOAuthDiagnostic({
  environment: () => process.env.VERCEL_ENV,
  enabled: () => process.env.TB3_PAYPAL_OAUTH_DIAGNOSTIC_ENABLED,
  config: tb3PayPalOAuthConfig,
});

export async function POST(request: NextRequest) {
  const authorization = await requireAdminActionFromRequest(request, "admin:manage");
  if (!authorization.ok) return Response.json({ status: "BLOCKED", httpStatus: 0, errorCategory: "ADMIN_AUTHORIZATION_REQUIRED" }, { status: authorization.status, headers: { "Cache-Control": "private, no-store" } });
  const result = await diagnostic();
  return Response.json(result, { status: result.status === "BLOCKED" ? 404 : 200, headers: { "Cache-Control": "private, no-store" } });
}
