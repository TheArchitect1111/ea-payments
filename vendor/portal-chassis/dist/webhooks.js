// lib/make-client.ts
async function triggerMakeWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { success: res.ok };
}

export { triggerMakeWebhook };
//# sourceMappingURL=webhooks.js.map
//# sourceMappingURL=webhooks.js.map