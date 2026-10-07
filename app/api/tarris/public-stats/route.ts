import { NextResponse } from "next/server";
import { listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { TB3_PRODUCTS } from "@/app/tarris/data/products";
import { TENANT } from "@/app/tarris/future/tenant-config";

export const dynamic = "force-dynamic";
type Submission = Awaited<ReturnType<typeof listPortalFormSubmissions>>[number];
function belongsToTenant(row: Submission) { return row.portalSlug === TENANT && row.payload?.tenant === TENANT; }

export async function GET() {
  try {
    const rows = (await listPortalFormSubmissions(TENANT, { kind: "intake" })).filter(belongsToTenant);
    const waitlist = rows.filter((row) => row.payload?.formType === "merch-waitlist").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const views = rows.filter((row) => row.payload?.formType === "track-event" && row.payload?.event === "page_view").length;
    const nilCount = rows.filter((row) => row.payload?.formType === "contact" || row.payload?.formType === "nil").length;
    const wall = waitlist.slice(-20).map((row) => {
      const number = waitlist.indexOf(row) + 1;
      const productId = String(row.payload?.productId || "");
      const product = TB3_PRODUCTS.find((item) => item.id === productId);
      const firstName = row.name.trim().split(/\s+/)[0];
      return { number, fan: firstName || `Fan #${number}`, product: product?.name || "TB3 Drop 01", createdAt: row.createdAt };
    });
    const demand = TB3_PRODUCTS.map((product) => ({ id: product.id, name: product.name, count: waitlist.filter((row) => row.payload?.productId === product.id).length }))
      .sort((a, b) => b.count - a.count || TB3_PRODUCTS.findIndex((product) => product.id === a.id) - TB3_PRODUCTS.findIndex((product) => product.id === b.id));
    return NextResponse.json({ ok: true, tenant: TENANT, innerCircleCount: waitlist.length, pageViews: views || waitlist.length * 3, viewsAreEstimate: views === 0, nilCount, topProduct: waitlist.length ? demand[0] : null, demand, wall }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Live TB3 counts are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
