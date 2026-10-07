import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { guardPortalApiCookie, portalApiUnauthorized } from "@/lib/api/portal-route";
import { normalizeRole, roleAtLeast } from "@/lib/rbac";
import { createPortalFormSubmission, listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { platformStoreConfigured } from "@/lib/platform-store";

export const dynamic = "force-dynamic";

const TENANT_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const TRACK_EVENTS = new Set(["page_view", "product_view"]);

type TrackRow = Awaited<ReturnType<typeof listPortalFormSubmissions>>[number];

function isTrackEvent(row: TrackRow, tenant: string, event?: string) {
  return row.portalSlug === tenant
    && row.payload?.tenant === tenant
    && row.payload?.formType === "track-event"
    && (event ? row.payload?.event === event : TRACK_EVENTS.has(String(row.payload?.event || "")));
}

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Open tracking from the tenant website." }, { status: 403 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(`portal-track:${ip}`, 120, 60 * 60 * 1000).ok) {
    return NextResponse.json({ ok: false, error: "Tracking limit reached." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const tenant = String(body.tenant || "").trim().toLowerCase();
  const event = String(body.event || "").trim();
  const page = String(body.page || "").trim().slice(0, 300);
  const productId = typeof body.productId === "string" ? body.productId.trim().slice(0, 100) : "";
  if (!TENANT_PATTERN.test(tenant) || !TRACK_EVENTS.has(event) || !(page === `/${tenant}` || page.startsWith(`/${tenant}/`)) || (event === "product_view" && !productId)) {
    return NextResponse.json({ ok: false, error: "Invalid tracking event." }, { status: 400 });
  }

  try {
    // Track events share the durable tenant intake ledger used by waitlist submissions.
    await createPortalFormSubmission({
      portalSlug: tenant,
      kind: "intake",
      name: "",
      email: "",
      payload: { tenant, formType: "track-event", event, page, ...(productId ? { productId } : {}) },
      requireDurable: false,
    });
    if (!platformStoreConfigured()) {
      // TODO: durable save when a persistent portal store is configured.
      console.info(`[portal-track] ${tenant} ${event} ${page}`);
    }
    return NextResponse.json({ ok: true });
  } catch {
    // TODO: durable save fallback if the shared portal ledger is unavailable.
    return NextResponse.json({ ok: false, error: "Tracking is temporarily unavailable." }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const tenant = String(req.nextUrl.searchParams.get("tenant") || "").trim().toLowerCase();
  if (!TENANT_PATTERN.test(tenant)) return NextResponse.json({ ok: false, error: "Invalid tenant." }, { status: 400 });
  const auth = await guardPortalApiCookie({ slug: tenant });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), "staff")) {
    return NextResponse.json({ ok: false, error: "Staff access required." }, { status: 403 });
  }
  try {
    const rows = await listPortalFormSubmissions(tenant, { kind: "intake" });
    const views = rows.filter((row) => isTrackEvent(row, tenant, "page_view")).length;
    return NextResponse.json({ ok: true, tenant, views }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Live view data is temporarily unavailable." }, { status: 503 });
  }
}
