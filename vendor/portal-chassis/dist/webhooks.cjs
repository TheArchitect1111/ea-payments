'use strict';

// lib/make-client.ts
async function triggerMakeWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { success: res.ok };
}

exports.triggerMakeWebhook = triggerMakeWebhook;
//# sourceMappingURL=webhooks.cjs.map
//# sourceMappingURL=webhooks.cjs.map