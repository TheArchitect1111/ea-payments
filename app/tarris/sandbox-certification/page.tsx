import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { authorize } from "@/lib/tb3/server";
import { getPayPalRuntime } from "@/lib/tb3/paypal-runtime";
import { hasTb3SandboxTestSession } from "@/lib/tb3/paypal-sandbox-test-session";
import SandboxTestAccess from "./SandboxTestAccess";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function Page() {
  const runtime = getPayPalRuntime();
  if (!runtime?.sandboxTestItem || runtime.config.mode !== "sandbox") notFound();
  const request = new NextRequest("https://preview.invalid/tarris/sandbox-certification", { headers: await headers() });
  let granted = hasTb3SandboxTestSession(request);
  if (!granted) {
    try {
      await authorize(request, false);
      granted = true;
    } catch {
      // Without either the scoped test session or existing HQ authorization, render only the token prompt.
    }
  }
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 20 }}>
      <h1>TB3 Sandbox certification</h1>
      <p>This Preview path uses a synthetic item and simulated Sandbox funds. No real merchandise is offered or fulfilled.</p>
      <SandboxTestAccess granted={granted} />
    </main>
  );
}
