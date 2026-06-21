// lib/resend-client.ts
async function sendEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const from = payload.from ?? process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...payload, from })
  });
  if (!res.ok) throw new Error(`sendEmail ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { id: data.id };
}

export { sendEmail };
//# sourceMappingURL=email.js.map
//# sourceMappingURL=email.js.map