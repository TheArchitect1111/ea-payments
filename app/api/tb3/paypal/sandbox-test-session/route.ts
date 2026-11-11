import { paypalHandlers } from "@/lib/tb3/paypal-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (request: Request) => paypalHandlers.sandboxTestSession(request);
export const DELETE = (request: Request) => paypalHandlers.sandboxTestSession(request);
