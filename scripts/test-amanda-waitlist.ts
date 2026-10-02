import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/public/amanda/waitlist/route';
import { AMANDA_COURSES, AMANDA_ROLE_DASHBOARDS } from '../lib/amanda-catherine/config';
import { amandaCourseReady } from '../lib/amanda-catherine/lms-policy';
import { AMANDA_WAITLIST_MENU_IDS, findAmandaWaitlistInterest } from '../lib/amanda-catherine/waitlist-interests';
async function main() {
const menuSource = readFileSync('app/portal/[slug]/member/AmandaMemberHome.tsx', 'utf8');
for (const items of Object.values(AMANDA_ROLE_DASHBOARDS)) for (const id of items) assert.ok(AMANDA_WAITLIST_MENU_IDS.some(value => value === id) || menuSource.includes(id), `Missing menu destination: ${id}`);
for (const id of AMANDA_WAITLIST_MENU_IDS) assert.equal(findAmandaWaitlistInterest(id)?.id, id);
assert.equal(findAmandaWaitlistInterest('unapproved-interest'), null);
for (const c of AMANDA_COURSES) assert.equal(Boolean(findAmandaWaitlistInterest(c.id)), !amandaCourseReady(c.id));
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
const calls: string[] = [];
const data = { courseId: AMANDA_WAITLIST_MENU_IDS[0], name: 'Test Student', email: 'test@example.invalid', phone: '+1 555 0100', message: 'Test only' };
function request(body: object, origin = 'https://amanda.example.invalid') { return new NextRequest('https://amanda.example.invalid/api/public/amanda/waitlist', { method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'x-forwarded-for': String(Math.random()) }, body: JSON.stringify(body) }); }
try {
  for (const key of ['AIRTABLE_API_KEY', 'AMANDA_GMAIL_CLIENT_ID', 'AMANDA_GMAIL_CLIENT_SECRET', 'AMANDA_GMAIL_REFRESH_TOKEN']) process.env[key] = 'mock-only';
  global.fetch = async (input, init) => {
    const url = String(input); calls.push(url);
    if (url.includes('api.airtable.com')) { const fields = JSON.parse(String(init?.body)).records[0].fields; assert.equal(fields.portal_slug, 'amanda-catherine'); assert.equal(fields.student_phone, data.phone); assert.equal(fields.course_slug, data.courseId); return Response.json({ records: [{ id: 'mock-record', fields }] }); }
    if (url.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'mock-token' });
    if (url.includes('gmail.googleapis.com')) { const mime = Buffer.from(JSON.parse(String(init?.body)).raw, 'base64url').toString(); assert.match(mime, /To: Amanda@aesthetikine.com/); const encoded = mime.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/)![1]; assert.equal(Buffer.from(encoded, 'base64').toString(), 'New Waitlist: Preparation And Aftercare'); return Response.json({ id: 'mock-email' }); }
    throw new Error('Unexpected network request');
  };
  assert.equal((await POST(request(data))).status, 200);
  assert.equal(calls.length, 3);
  calls.length = 0;
  assert.equal((await POST(request(data, 'https://other.example.invalid'))).status, 403);
  assert.equal((await POST(request({ ...data, courseId: AMANDA_COURSES.find(c => amandaCourseReady(c.id))!.id }))).status, 400);
  assert.equal((await POST(request({ ...data, courseId: 'unapproved-interest' }))).status, 400);
  assert.equal(calls.length, 0);
  delete process.env.AIRTABLE_API_KEY; delete process.env.AIRTABLE_PAT;
  assert.equal((await POST(request(data))).status, 503);
  assert.equal(calls.length, 0);
  process.env.AIRTABLE_API_KEY = 'mock-only'; delete process.env.AMANDA_GMAIL_REFRESH_TOKEN;
  const partial = await POST(request(data)); assert.equal(partial.status, 503); assert.match((await partial.json()).error, /saved, but Amanda could not be notified/);
  assert.equal(calls.length, 1);
  console.log('PASS: 14 interests, READY/unknown/cross-origin rejection, durable save, Gmail MIME, and storage/email failure reporting (mocked transports; no live email).');
} finally { global.fetch = originalFetch; for (const k of Object.keys(process.env)) if (!(k in originalEnv)) delete process.env[k]; Object.assign(process.env, originalEnv); }

}
main().catch(error => { console.error(error); process.exitCode = 1; });
