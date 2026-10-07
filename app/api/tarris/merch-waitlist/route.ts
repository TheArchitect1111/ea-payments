import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { createPortalFormSubmission, listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { notifyPortal } from "@/lib/portal-notify";
import { syntheticOrgId } from "@/lib/platform-store";
import { TB3_PRODUCTS } from "@/app/tarris/data/products";
import { TENANT } from "@/app/tarris/future/tenant-config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Open the waitlist from the TB3 website." }, { status: 403 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(`tb3-merch-waitlist:${ip}`, 12, 60 * 60 * 1000).ok) {
    return NextResponse.json({ ok: false, error: "Too many signups. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const tenant = String(body.tenant || "").trim().toLowerCase();
  const formType = String(body.formType || "").trim();
  const productId = String(body.productId || "").trim();
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
  }
  if (tenant !== TENANT || formType !== "merch-waitlist" || !TB3_PRODUCTS.some((product) => product.id === productId)) {
    return NextResponse.json({ ok: false, error: "Choose a valid TB3 Drop 01 product." }, { status: 400 });
  }
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter your name and a valid email address." }, { status: 400 });
  }

  let submission;
  let waitlistPosition = 1;
  try {
    // TENANT_KEY: this count is scoped to the tenant and waitlist form type.
    const existing = await listPortalFormSubmissions(tenant, { kind: "intake" });
    waitlistPosition = existing.filter((row) => row.portalSlug === tenant && row.payload?.tenant === tenant && row.payload?.formType === formType).length + 1;
    submission = await createPortalFormSubmission({
      portalSlug: tenant,
      kind: "intake",
      name,
      email,
      notes: `TB3 Drop 01 merch waitlist · ${productId}`,
      payload: { tenant, formType, productId },
      requireDurable: true,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "The waitlist is temporarily unavailable. Please try again." }, { status: 503 });
  }

  try {
    await notifyPortal({
      product: "ea-platform",
      type: "portal.form.submitted",
      title: "TB3 merch waitlist signup",
      detail: `Drop 01 · ${productId}`,
      href: `/portal/${TENANT}/intake`,
      tenantId: syntheticOrgId(tenant),
      objectId: submission.id,
      metadata: { kind: "intake", portalSlug: tenant, formType, productId, status: submission.status },
    });
  } catch {
    // The durable signup is saved; notification failures must not discard it.
  }

  return NextResponse.json({ ok: true, position: waitlistPosition });
}
