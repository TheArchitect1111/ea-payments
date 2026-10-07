import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { createPortalFormSubmission } from "@/lib/portal-forms/store";
import { notifyPortal } from "@/lib/portal-notify";
import { sendEmail } from "@ea/portal-chassis/email";
import { syntheticOrgId } from "@/lib/platform-store";
import { bookingSchema } from "@/lib/tb3/contracts";
import { TENANT, PORTAL_BASE } from "@/app/tarris/future/tenant-config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Open the inquiry from the TB3 website." }, { status: 403 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(`tb3-nil-inquiry:${ip}`, 10, 60 * 60 * 1000).ok) {
    return NextResponse.json({ ok: false, error: "Too many inquiries. Please try again later." }, { status: 429 });
  }
  const parsed = bookingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Check the required inquiry details and try again." }, { status: 400 });
  }
  const inquiry = parsed.data;
  let submission;
  try {
    // TENANT_KEY: the route uses the shared tenant constant and records the contact form type.
    submission = await createPortalFormSubmission({
      portalSlug: TENANT,
      kind: "intake",
      name: inquiry.contact_name,
      email: inquiry.contact_email,
      phone: inquiry.phone,
      notes: `${inquiry.type} · ${inquiry.company_name}`,
      payload: {
        tenant: TENANT,
        formType: "contact",
        companyName: inquiry.company_name,
        inquiryType: inquiry.type,
        budgetRange: inquiry.budget_range,
        dateRequested: inquiry.date_requested,
        visionAnswer: inquiry.vision_answer,
        message: inquiry.message,
        requestId: inquiry.request_id,
      },
      requireDurable: true,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "The inquiry form is temporarily unavailable. Please try again." }, { status: 503 });
  }
  // QA FIX — Notify family through configured Resend delivery; do not put inquiry email addresses in server logs.
  let familyEmailSent = false;
  const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  try {
    await sendEmail({
      to: "info@tb3fundamentals.com",
      subject: `TB3 NIL inquiry — ${inquiry.type}`,
      html: `<main style="font-family:Arial,sans-serif;line-height:1.6"><h1>New TB3 NIL inquiry</h1><p><strong>Name:</strong> ${escapeHtml(inquiry.contact_name)}</p><p><strong>Email:</strong> ${escapeHtml(inquiry.contact_email)}</p><p><strong>Company:</strong> ${escapeHtml(inquiry.company_name)}</p><p><strong>Type:</strong> ${escapeHtml(inquiry.type)}</p><p><strong>Message:</strong><br />${escapeHtml(inquiry.message).replaceAll("\n", "<br />")}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tb3.online"}${PORTAL_BASE}/nil">Open TB3 Deal Room</a></p></main>`,
    });
    familyEmailSent = true;
    console.info("[NIL] family notification sent to info@tb3fundamentals.com");
  } catch (error) {
    console.warn("[tb3-nil] family email delivery failed; inquiry remains saved.", error instanceof Error ? error.message : "unknown error");
  }
  try {
    await notifyPortal({
      product: "ea-platform",
      type: "portal.form.submitted",
      title: "TB3 NIL inquiry received",
      detail: inquiry.type,
      href: `${PORTAL_BASE}/nil`,
      tenantId: syntheticOrgId(TENANT),
      objectId: submission.id,
      metadata: { kind: "intake", portalSlug: TENANT, formType: "contact", status: submission.status },
    });
  } catch {
    // The durable inquiry remains saved if notification delivery is unavailable.
  }
  return NextResponse.json({ ok: true, submissionId: submission.id, familyEmailSent }, { status: 201 });
}
