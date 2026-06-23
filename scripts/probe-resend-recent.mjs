#!/usr/bin/env node
const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error('NO_RESEND_KEY');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails?limit=10', {
  headers: { Authorization: `Bearer ${key}` },
});
const data = await res.json();
const emails = (data.data || []).filter((e) =>
  String(e.subject || '').toLowerCase().includes('launch') ||
  String(e.subject || '').toLowerCase().includes('you are in') ||
  String(e.subject || '').toLowerCase().includes('new client payment'),
);
console.log(JSON.stringify(emails.length ? emails : data.data?.slice(0, 5), null, 2));
