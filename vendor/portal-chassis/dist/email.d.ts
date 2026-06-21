interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}
declare function sendEmail(payload: EmailPayload): Promise<{
    id: string;
}>;

export { type EmailPayload, sendEmail };
