import { NextResponse } from "next/server";
import { guardPortalApiCookie, portalApiUnauthorized } from "@/lib/api/portal-route";
import { normalizeRole, roleAtLeast } from "@/lib/rbac";
import { listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { TB3_PRODUCTS } from "@/app/tarris/data/products";
import { TENANT } from "@/app/tarris/future/tenant-config";

export const dynamic = "force-dynamic";

function isWaitlist(row: Awaited<ReturnType<typeof listPortalFormSubmissions>>[number]) {
  return row.portalSlug === TENANT && row.payload?.tenant === TENANT && row.payload?.formType === "merch-waitlist";
}

export async function GET() {
  const auth = await guardPortalApiCookie({ slug: TENANT });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), "staff")) {
    return NextResponse.json({ ok: false, error: "Staff access required." }, { status: 403 });
  }

  try {
    const stored = await listPortalFormSubmissions(TENANT, { kind: "intake" });
    const rows = stored.filter(isWaitlist).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const total = rows.length;
    const products = TB3_PRODUCTS.map((product) => {
      const productRows = rows.filter((row) => row.payload?.productId === product.id);
      return { ...product, count: productRows.length, percent: total ? Math.round((productRows.length / total) * 100) : 0 };
    });
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: rows.filter((row) => row.createdAt.slice(0, 10) === key).length };
    });
    const inquiries = stored.filter((row) => row.portalSlug === TENANT && row.payload?.tenant === TENANT && (row.payload?.formType === "contact" || row.payload?.formType === "nil"))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({ id: row.id, name: row.name, email: row.email, phone: row.phone || "", companyName: String(row.payload?.companyName || ""), inquiryType: String(row.payload?.inquiryType || "NIL / Contact"), budgetRange: String(row.payload?.budgetRange || ""), dateRequested: String(row.payload?.dateRequested || ""), message: String(row.payload?.message || ""), createdAt: row.createdAt, status: row.status }));
    const ranked = [...products].sort((a, b) => b.count - a.count || TB3_PRODUCTS.findIndex((p) => p.id === a.id) - TB3_PRODUCTS.findIndex((p) => p.id === b.id));
    const entries = [...rows].reverse().map((row, index) => {
      const productId = String(row.payload?.productId || "");
      const product = TB3_PRODUCTS.find((item) => item.id === productId);
      return { id: row.id, number: total - index, name: row.name, email: row.email, productId, productName: product?.name || productId, createdAt: row.createdAt };
    });
    return NextResponse.json({
      ok: true,
      totalInnerCircle: total,
      pageViews: total * 3,
      viewsAreEstimate: true,
      conversionRate: total ? Math.round((total / (total * 3)) * 1000) / 10 : 0,
      products,
      topProducts: total ? ranked.slice(0, 3) : [],
      days,
      entries,
      recent: entries.slice(0, 10),
      nilInquiries: inquiries,
      geoAvailable: false,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Live portal analytics are temporarily unavailable." }, { status: 503 });
  }
}
