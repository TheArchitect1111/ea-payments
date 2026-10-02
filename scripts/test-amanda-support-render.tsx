import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import AmandaSupport from '../app/components/amanda/AmandaSupport';
import { amandaJaneBookingUrl, AMANDA_SUPPORT_GMAIL_ADDRESS, AMANDA_DEFAULT_JANE_BOOKING_URL } from '../lib/amanda-catherine/support-config';
import { AMANDA_SUPPORT_WORDING } from '../lib/amanda-catherine/lms-policy';
const render = (bookingUrl: string, trainingDate?: string) => renderToStaticMarkup(<AmandaSupport email="qa@example.com" bookingUrl={bookingUrl} trainingDate={trainingDate} />);
const approved = render(amandaJaneBookingUrl(), '2026-10-02');
assert.ok(approved.includes(AMANDA_SUPPORT_WORDING));
assert.ok(approved.includes('href="https://aesthetikine.janeapp.com/"'));
assert.ok(approved.includes('Schedule Mentorship Call'));
assert.ok(approved.includes('Email Amanda via Gmail'));
assert.ok(approved.includes('Support ends: 2026-12-31'));
assert.ok(approved.includes('href="/portal/amanda-catherine/messaging"'));
assert.ok(!approved.includes('example.com/schedule'));
const unknownTraining = render(amandaJaneBookingUrl());
assert.ok(unknownTraining.includes('class/training date has not been recorded'));
assert.equal(AMANDA_SUPPORT_GMAIL_ADDRESS, 'amandacatherinec@gmail.com');
assert.equal(amandaJaneBookingUrl('https://example.com/schedule'), AMANDA_DEFAULT_JANE_BOOKING_URL);
assert.equal(amandaJaneBookingUrl('https://aesthetikine.janeapp.com.evil.example/'), AMANDA_DEFAULT_JANE_BOOKING_URL);
assert.equal(amandaJaneBookingUrl('https://aesthetikine.janeapp.com/locations/1'), 'https://aesthetikine.janeapp.com/locations/1');
for (const invalid of ['http://booking.example.org', 'javascript:alert(1)', 'https://user:pass@booking.example.org', 'invalid']) {
  assert.ok(!render(invalid).includes('Schedule Mentorship Call'));
}
console.log('Rendered support wording, training-date end date, channels and scheduling validation tests passed.');
