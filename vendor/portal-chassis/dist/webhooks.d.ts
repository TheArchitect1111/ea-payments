/**
 * Fires a Make.com webhook. The caller must supply a URL resolved from
 * process.env — never pass raw user input here.
 */
declare function triggerMakeWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<{
    success: boolean;
}>;

export { triggerMakeWebhook };
