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

// lib/env.ts
function adminEmail(fallback = "") {
  return process.env.ADMIN_EMAIL?.trim() || fallback;
}

// lib/admin-notify.ts
async function notifyAdmin(input) {
  const to = input.to || adminEmail();
  if (!to) {
    console.error("notifyAdmin: no ADMIN_EMAIL or to address");
    return false;
  }
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px;margin:0 0 16px;color:#0C0C0A">${input.title}</h1>
      ${input.bodyHtml}
    </div>
  `;
  try {
    await sendEmail({
      to,
      subject: input.subject,
      html,
      from: input.from
    });
    return true;
  } catch (err) {
    console.error("notifyAdmin failed:", err);
    return false;
  }
}

export { notifyAdmin };
//# sourceMappingURL=notify.js.map
//# sourceMappingURL=notify.js.map