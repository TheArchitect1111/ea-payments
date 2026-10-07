import { NextRequest, NextResponse } from "next/server";
import { guardPortalApiCookie, portalApiUnauthorized } from "@/lib/api/portal-route";
import { normalizeRole, roleAtLeast } from "@/lib/rbac";
import { createPortalFormSubmission, listPortalFormSubmissions } from "@/lib/portal-forms/store";

export const dynamic = "force-dynamic";
const TENANT = "tarris"; // TENANT_KEY: change for a new athlete.
const IMAGE_PATTERN = /^(\/images\/tb3-official\/OFFICIAL_[A-Z0-9_-]+\.png|\/tb3\/merch\/tb3-[a-z0-9-]+\.png)$/;
async function authorize() {
  const auth = await guardPortalApiCookie({ slug: TENANT });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), "staff")) return NextResponse.json({ ok: false, error: "Staff access required." }, { status: 403 });
  return null;
}
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("tenant") !== TENANT) return NextResponse.json({ ok: false, error: "Invalid tenant." }, { status: 400 });
  const denied = await authorize();
  if (denied) return denied;
  try {
    const rows = await listPortalFormSubmissions(TENANT, { kind: "intake" });
    const tenantRows = rows.filter((row) => row.portalSlug === TENANT && row.payload?.tenant === TENANT);
    const approvals = new Set(tenantRows.filter((row) => row.payload?.contentType === "social_draft_approval").map((row) => String(row.payload?.draftId || "")));
    const drafts = tenantRows.filter((row) => row.payload?.contentType === "social_draft");
    return NextResponse.json({ ok: true, drafts: drafts.map((row) => ({ id: row.id, ...row.payload, status: approvals.has(row.id) ? "approved" : "pending approval", createdAt: row.createdAt })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ ok: false, error: "Drafts could not be loaded." }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ ok: false, error: "Open the draft queue from the TB3 portal." }, { status: 403 });
  const denied = await authorize();
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.action === "approve") {
    const draftId = String(body.draftId || "").slice(0, 100);
    try {
      const rows = await listPortalFormSubmissions(TENANT, { kind: "intake" });
      const exists = rows.some((row) => row.id === draftId && row.portalSlug === TENANT && row.payload?.tenant === TENANT && row.payload?.contentType === "social_draft");
      if (!exists) return NextResponse.json({ ok: false, error: "Draft not found." }, { status: 404 });
      await createPortalFormSubmission({ portalSlug: TENANT, kind: "intake", name: "TB3 Social Draft Approval", email: "", payload: { tenant: TENANT, contentType: "social_draft_approval", draftId, status: "approved" }, requireDurable: false });
      return NextResponse.json({ ok: true, draftId, status: "approved" });
    } catch { return NextResponse.json({ ok: false, error: "Approval could not be saved." }, { status: 503 }); }
  }
  const tenant = String(body?.tenant || "");
  const templateId = String(body?.templateId || "").slice(0, 80);
  const image = String(body?.image || "").slice(0, 220);
  const caption = String(body?.caption || "").trim().slice(0, 280);
  if (tenant !== TENANT || !/^[a-z0-9-]{1,80}$/.test(templateId) || !IMAGE_PATTERN.test(image) || !caption) return NextResponse.json({ ok: false, error: "Draft details are invalid." }, { status: 400 });
  try {
    const row = await createPortalFormSubmission({ portalSlug: TENANT, kind: "intake", name: "TB3 Social Draft", email: "", payload: { tenant: TENANT, contentType: "social_draft", templateId, image, caption, status: "pending approval" }, requireDurable: false });
    return NextResponse.json({ ok: true, draft: { id: row.id, templateId, image, caption, status: "pending approval", createdAt: row.createdAt } }, { status: 201 });
  } catch { return NextResponse.json({ ok: false, error: "Draft could not be saved." }, { status: 503 }); }
}
