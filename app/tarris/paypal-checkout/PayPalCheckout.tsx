"use client";
import { useEffect, useRef, useState } from "react";
import catalog from "@/public/tb3/merch/manifest.json";

type ButtonInstance = {
  isEligible(): boolean;
  render(container: HTMLElement): Promise<void>;
  close(): void;
};
type PayPalSDK = {
  FUNDING: { PAYPAL: string; CARD: string };
  Buttons(options: Record<string, unknown>): ButtonInstance;
};
declare global {
  interface Window {
    paypal?: PayPalSDK;
  }
}
export async function renderPayPalButtons(
  sdk: PayPalSDK,
  container: HTMLElement,
  callbacks: Record<string, unknown>,
) {
  const buttons: ButtonInstance[] = [];
  for (const fundingSource of [sdk.FUNDING.PAYPAL, sdk.FUNDING.CARD]) {
    const button = sdk.Buttons({ ...callbacks, fundingSource });
    if (button.isEligible()) {
      await button.render(container);
      buttons.push(button);
    }
  }
  return buttons;
}
let sdkLoading: Promise<PayPalSDK> | undefined;
function loadSDK(clientId: string) {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!sdkLoading)
    sdkLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://www.paypal.com/sdk/js?" +
        new URLSearchParams({
          "client-id": clientId,
          currency: "USD",
          intent: "capture",
          components: "buttons",
          "enable-funding": "card",
          "disable-funding": "paylater,venmo,credit",
        });
      script.onload = () =>
        window.paypal
          ? resolve(window.paypal)
          : reject(Error("PayPal is unavailable."));
      script.onerror = () => {
        sdkLoading = undefined;
        reject(Error("PayPal could not load."));
      };
      document.head.append(script);
    });
  return sdkLoading;
}
async function post(action: string, input: unknown) {
  const response = await fetch("/api/tb3/paypal/" + action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok)
    throw Error(result.error || "Payment could not be verified.");
  return result;
}
export default function PayPalCheckout() {
  const container = useRef<HTMLDivElement>(null),
    token = useRef(""),
    order = useRef(""),
    buttons = useRef<ButtonInstance[]>([]);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false);
  const [hasOrder, setHasOrder] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("tb3-paypal-v1") || "null",
      );
      if (
        saved &&
        /^[a-f0-9]{64}$/.test(saved.token) &&
        /^[A-Za-z0-9]{6,64}$/.test(saved.order)
      ) {
        token.current = saved.token;
        order.current = saved.order;
        queueMicrotask(() => {
          setHasOrder(true);
          setLocked(true);
          setMessage(
            "A previous checkout needs a payment-status check before starting another.",
          );
        });
      }
    } catch {
      /* Storage is optional; never store delivery details or credentials. */
    }
    return () => {
      for (const button of buttons.current) button.close();
    };
  }, []);
  const options = catalog.flatMap((product) =>
    product.variants.map((v) => ({
      id: v.id,
      label: product.name + " · " + v.size + " · $" + v.price.toFixed(2),
    })),
  );
  function receipt(result: { status: string; fulfillment?: string }) {
    if (result.fulfillment === "simulated") {
      setMessage(
        "Sandbox payment verified. Fulfillment simulated; no Printful order was created.",
      );
      return;
    }
    if (result.status === "cancelled") {
      for (const button of buttons.current) button.close();
      buttons.current = [];
      try {
        sessionStorage.removeItem("tb3-paypal-v1");
      } catch {}
      token.current = "";
      order.current = "";
      setHasOrder(false);
      setLocked(false);
    }
    setMessage(
      result.status === "paid"
        ? "Payment verified. " +
            (result.fulfillment === "confirmed"
              ? "Your order is being processed."
              : result.fulfillment === "draft"
                ? "Your order is awaiting manufacturing approval."
                : "Your order requires a fulfillment review.")
        : result.status === "cancelled"
          ? "Checkout cancelled. No payment was recorded."
          : "Payment is pending. Do not start another checkout; check payment status.",
    );
  }
  return (
    <>
      <p>
        Pay with PayPal or an eligible debit/credit card. Available methods are
        determined by PayPal. Shipping and any applicable tax must be verified
        before approval.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          const form = new FormData(event.currentTarget);
          try {
            const response = await fetch("/api/tb3/paypal/config", {
                cache: "no-store",
              }),
              config = await response.json();
            if (!config.available)
              throw Error("PayPal checkout is not available.");
            const sdk = await loadSDK(config.clientId);
            token.current = Array.from(
              crypto.getRandomValues(new Uint8Array(32)),
            )
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("");
            order.current = "";
            const input = {
              checkoutToken: token.current,
              cart: [
                {
                  variantId: Number(form.get("variantId")),
                  quantity: Number(form.get("quantity")),
                },
              ],
              email: form.get("email"),
              recipient: {
                name: form.get("name"),
                address1: form.get("address1"),
                address2: form.get("address2") || undefined,
                city: form.get("city"),
                state_code: String(form.get("state_code")).toUpperCase(),
                zip: form.get("zip"),
                country_code: "US",
              },
            };
            setLocked(true);
            if (!container.current) throw Error("Checkout could not start.");
            buttons.current = await renderPayPalButtons(
              sdk,
              container.current,
              {
                createOrder: async () => {
                  const result = await post("orders", input);
                  order.current = result.orderId;
                  setHasOrder(true);
                  try {
                    sessionStorage.setItem(
                      "tb3-paypal-v1",
                      JSON.stringify({
                        token: token.current,
                        order: order.current,
                      }),
                    );
                  } catch {}
                  setMessage(
                    "Total to approve: $" +
                      result.total +
                      " USD, including shipping and reviewed tax.",
                  );
                  return result.orderId;
                },
                onApprove: async (data: { orderID: string }) => {
                  try {
                    receipt(
                      await post("capture", {
                        checkoutToken: token.current,
                        orderId: data.orderID,
                      }),
                    );
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "Payment could not be verified.",
                    );
                  }
                },
                onCancel: async () => {
                  try {
                    if (order.current)
                      receipt(
                        await post("cancel", {
                          checkoutToken: token.current,
                          orderId: order.current,
                        }),
                      );
                    else setMessage("Checkout cancelled before payment.");
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "Check payment status.",
                    );
                  }
                },
                onError: () =>
                  setMessage(
                    "PayPal could not complete checkout. Check payment status before starting again.",
                  ),
              },
            );
            if (!buttons.current.length)
              throw Error("No eligible payment methods are available.");
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Checkout unavailable.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset
          disabled={busy || locked}
          style={{ display: "grid", gap: 12 }}
        >
          <label>
            Product and size
            <select name="variantId" required>
              {options.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              name="quantity"
              type="number"
              min="1"
              max="10"
              defaultValue="1"
              required
            />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Delivery name
            <input
              name="name"
              autoComplete="shipping name"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            Address
            <input
              name="address1"
              autoComplete="shipping address-line1"
              maxLength={150}
              required
            />
          </label>
          <label>
            Apartment or suite
            <input
              name="address2"
              autoComplete="shipping address-line2"
              maxLength={150}
            />
          </label>
          <label>
            City
            <input
              name="city"
              autoComplete="shipping address-level2"
              required
            />
          </label>
          <label>
            State
            <input
              name="state_code"
              autoComplete="shipping address-level1"
              minLength={2}
              maxLength={2}
              required
            />
          </label>
          <label>
            ZIP code
            <input
              name="zip"
              autoComplete="shipping postal-code"
              pattern="[0-9]{5}(-[0-9]{4})?"
              required
            />
          </label>
          <button type="submit">
            {busy ? "Preparing…" : "Continue to payment options"}
          </button>
        </fieldset>
      </form>
      <div ref={container} aria-label="Eligible PayPal payment methods" />
      {hasOrder ? (
        <button
          disabled={busy}
          type="button"
          onClick={async () => {
            setBusy(true);
            try {
              receipt(
                await post("capture", {
                  checkoutToken: token.current,
                  orderId: order.current,
                }),
              );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Payment status unavailable.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Check payment status
        </button>
      ) : null}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
