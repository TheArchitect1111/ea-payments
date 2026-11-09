import { authorize, json } from "@/lib/tb3/server";
import type { NextRequest } from "next/server";
import { paypalLedger } from "@/lib/tb3/paypal-ledger";
import { tb3Printful } from "@/lib/tb3/printful-client";
import { createTb3CommerceReportHandler } from "@/lib/tb3/paypal-report-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createTb3CommerceReportHandler({
  authorize: (request, write) => authorize(request as NextRequest, write),
  list: (limit) => paypalLedger.list(limit),
  printfulConfigured: () => Boolean(process.env.PRINTFUL_API_KEY?.trim()),
  printful: (path) => tb3Printful(path),
  json: (data, status = 200) => json(data, status),
});
