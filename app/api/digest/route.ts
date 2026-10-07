import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@ea/portal-chassis/email";
import { guardPortalApiCookie, portalApiUnauthorized } from "@/lib/api/portal-route";
import { normalizeRole, roleAtLeast } from "@/lib/rbac";
import { listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { TB3_PRODUCTS } from "@/app/tarris/data/products";

export const dynamic = "force-dynamic";
const TENANT = "tarris"; // TENANT_KEY: change for a new athlete.
const FAMILY_EMAIL = "info@tb3fundamentals.com";
type Submission = Awaited<ReturnType<typeof listPortalFormSubmissions>>[number];
function tenantRow(row: Submission) { return row.portalSlug === TENANT && row.payload?.tenant === TENANT; }
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
async function makeDigest() {
  const rows = (await listPortalFormSubmissions(TENANT, { kind: "intake" })).filter(tenantRow);
  const waitlist = rows.filter((row) => row.payload?.formType === "merch-waitlist");
  const views = rows.filter((row) => row.payload?.formType === "track-event" && row.payload?.event === "page_view").length;
  const nilCount = rows.filter((row) => row.payload?.formType === "contact" || row.payload?.formType === "nil").length;
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekNew = waitlist.filter((row) => Date.parse(row.createdAt) >= since).length;
  const demand = TB3_PRODUCTS.map((product) => ({ id: product.id, name: product.name, count: waitlist.filter((row) => row.payload?.productId === product.id).length }))
    .sort((a, b) => b.count - a.count || TB3_PRODUCTS.findIndex((product) => product.id === a.id) - TB3_PRODUCTS.findIndex((product) => product.id === b.id));
  const topProduct = waitlist.length ? demand[0].name : "No signups yet";
  const pageViews = views || waitlist.length * 3;
  const subject = `TB3 Weekly — +${weekNew} Inner Circle — Top: ${topProduct}`;
  const text = ["TB3 Weekly Digest", `Inner Circle: ${waitlist.length}`, `Page views${views ? "" : " (estimated)"}: ${pageViews}`, `New in the last 7 days: ${weekNew}`, `NIL inquiries: ${nilCount}`, `Top product: ${topProduct}`, "", `Portal: ${process.env.NEXT_PUBLIC_SITE_URL || "https://tb3.online"}/tarris/future`].join("\n");
  return { to: FAMILY_EMAIL, subject, text, counts: { innerCircleCount: waitlist.length, pageViews, viewsAreEstimate: views === 0, nilCount, weekNew, topProduct } };
}
async function authorize(req: NextRequest) {
  if (req.nextUrl.searchParams.get("tenant") !== TENANT) return { response: NextResponse.json({ ok: false, error: "Invalid tenant." }, { status: 400 }) };
  const auth = await guardPortalApiCookie({ slug: TENANT });
  if (!auth.ok) return { response: portalApiUnauthorized(auth) };
  if (!roleAtLeast(normalizeRole(auth.session.role), "staff")) return { response: NextResponse.json({ ok: false, error: "Staff access required." }, { status: 403 }) };
  return {};
}
export async function GET(req: NextRequest) {
  const permission = await authorize(req);
  if (permission.response) return permission.response;
  try { return NextResponse.json({ ok: true, ...(await makeDigest()) }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ ok: false, error: "Digest data is temporarily unavailable." }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ ok: false, error: "Open the digest from the TB3 portal." }, { status: 403 });
  const permission = await authorize(req);
  if (permission.response) return permission.response;
  try {
    const digest = await makeDigest();
    const body = escapeHtml(digest.text).replaceAll("\n", "<br />");
    await sendEmail({ to: digest.to, subject: digest.subject, html: `<main style="font-family:Arial,sans-serif;line-height:1.6"><h1>TB3 Weekly Digest</h1><p>${body}</p></main>` });
    return NextResponse.json({ ok: true, sentTo: digest.to, subject: digest.subject, counts: digest.counts });
  } catch (error) {
    console.error("[tb3-digest] email delivery failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ ok: false, error: "Digest email could not be sent. Check the configured email provider." }, { status: 503 });
  }
}
