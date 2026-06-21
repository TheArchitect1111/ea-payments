type AdminNotifyInput = {
    subject: string;
    title: string;
    bodyHtml: string;
    idempotencyKey?: string;
    to?: string;
    from?: string;
};
/** Send an admin alert email via Resend. Non-fatal — returns false on failure. */
declare function notifyAdmin(input: AdminNotifyInput): Promise<boolean>;

export { type AdminNotifyInput, notifyAdmin };
