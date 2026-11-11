import { notFound } from "next/navigation";
import { getPayPalRuntime } from "@/lib/tb3/paypal-runtime";
import PayPalCheckout from "./PayPalCheckout";
export const dynamic = "force-dynamic";
export default function Page() {
  const runtime = getPayPalRuntime();
  if (!runtime || runtime.sandboxTestItem) notFound();
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 20 }}>
      <h1>TB3 merchandise checkout</h1>
      {runtime.config.mode === "sandbox" ? (
        <p>
          Sandbox testing only. Shipping and fulfillment are simulated. No real
          Printful order will be created.
        </p>
      ) : null}
      <PayPalCheckout />
    </main>
  );
}
