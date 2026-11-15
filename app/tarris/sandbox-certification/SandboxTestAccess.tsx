"use client";

import { useState, type FormEvent } from "react";
import PayPalCheckout from "../paypal-checkout/PayPalCheckout";

export default function SandboxTestAccess({ granted }: { granted: boolean }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/tb3/paypal/sandbox-test-session", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setToken("");
      if (!response.ok) throw new Error("denied");
      window.location.reload();
    } catch {
      setMessage("Test access was not accepted. Check the supplied authorization and try again.");
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    await fetch("/api/tb3/paypal/sandbox-test-session", { method: "DELETE", credentials: "same-origin", cache: "no-store" }).catch(() => undefined);
    window.location.reload();
  }

  if (!granted) {
    return (
      <form onSubmit={submit}>
        <p>Enter the temporary Preview test authorization. It is exchanged for a short-lived, private browser session and is not saved.</p>
        <label>
          Temporary test authorization
          <input name="token" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} required maxLength={200} />
        </label>
        <button type="submit" disabled={busy || !token}>{busy ? "Checking…" : "Continue to Sandbox test"}</button>
        {message ? <p role="alert">{message}</p> : null}
      </form>
    );
  }

  return (
    <>
      <p>This temporary authorization is limited to the synthetic Sandbox checkout and expires automatically.</p>
      <button type="button" onClick={logout} disabled={busy}>End test session</button>
      <PayPalCheckout sandboxTestItem />
    </>
  );
}
