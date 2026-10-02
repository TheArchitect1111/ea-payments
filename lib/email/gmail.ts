/** Server-only Gmail OAuth transport. Never expose OAuth credentials to the client. */
import 'server-only';
export async function sendGmailEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const clientId = process.env.AMANDA_GMAIL_CLIENT_ID;
  const clientSecret = process.env.AMANDA_GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.AMANDA_GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Amanda Gmail is not configured');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }), signal: AbortSignal.timeout(15000) });
  if (!tokenResponse.ok) throw new Error('Gmail authentication failed');
  const token = await tokenResponse.json();
  if (!token.access_token) throw new Error('Gmail authentication failed');
  const encodedSubject = Buffer.from(subject.replace(/[\r\n]/g, ' ')).toString('base64');
  const raw = Buffer.from(`To: ${to}\r\nSubject: =?UTF-8?B?${encodedSubject}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(text).toString('base64').match(/.{1,76}/g)?.join('\r\n') || ''}`).toString('base64url');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Gmail notification failed');
}
