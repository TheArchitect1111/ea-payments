import { paypalHandlers } from "@/lib/tb3/paypal-routes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = paypalHandlers.cancel;
