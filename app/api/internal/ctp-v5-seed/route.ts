import { get } from '@vercel/blob';
import { appendBlueprintVaultFile, createBlueprintRecord, getBlueprintByAlias, saveBlueprintRecord } from '@/lib/blueprint-store';
import { buildCtpV5Policy } from '@/lib/ctp-v5-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AMANDA = {
  portalAlias: 'amanda-catherine',
  contactChoice: 'I would rather discuss it in conversation',
  contactValue: '',
  q2: 'I teach, coach, or train people through AesthetiKine Studio Lab.',
  q3: { monthlyVolume: '26 to 50', sessions: '11 to 20', helpers: 'Just me' },
  q4: ['We make people feel cared for', 'We get results'],
  q5: 'The teaching and client experience still depends too much on me.',
  q6: ['finding information', 'onboarding can pile up'],
  q7: 'Teaching materials, onboarding, reminders, and client follow-up need one organized flow.',
  q8: 'About once a week',
  q9: { duration: '31 to 60 minutes', peopleInvolved: '3 to 5' },
  q10: ['People wait longer when the next step is unclear'],
  q11: ['People sometimes need help finding information'],
  q12: ['Welcome people', 'Send materials and directions', 'Remind people automatically', 'Check in after the session', 'Send payment reminders'],
  q14: ['Teaching materials'],
  q14Personal: ['The way we welcome people'],
  q15: { who: ['Amanda', 'Students and clients'] },
  uploads: [{ name: 'AesthetiKine 1-Day Nervous System Reset Manual.pdf', type: 'application/pdf', size: 12801515 }],
};

const TARRIS = {
  portalAlias: 'tarris',
  contactChoice: 'I would rather discuss it in conversation',
  contactValue: '',
  q2: 'I organize events or gatherings for the TB3 athlete brand and community.',
  q3: { eventCount: '2 to 4', attendees: '151 to 300', helpers: '6 to 10' },
  q4: ['We create a memorable experience', 'Our mission matters to people'],
  q5: 'Event work piles up close to the date.',
  q6: ['registration can pile up', 'team details can pile up', 'finding information takes too long'],
  q7: 'Registration, payment, teams, tee times, scoring, signage, photos, and thank-yous need one event timeline.',
  q8: 'Mostly during events or busy seasons',
  q9: { duration: '1 to 2 hours', peopleInvolved: '4 to 6' },
  q10: ['People miss chances when information arrives late'],
  q11: ['People sometimes wait too long for answers'],
  q12: ['Welcome players', 'Send directions and day-of information', 'Remind people automatically', 'Send payment reminders'],
  q14: ['Logo', 'Photos', 'Flyers', 'Sponsor logo'],
  q14Personal: [],
  q15: { who: ['Tarris', 'Players', 'Teams', 'Sponsors'] },
  uploads: [],
};

async function upsert(alias: string, intake: Record<string, any>) {
  const policy = buildCtpV5Policy(intake);
  const existing = await getBlueprintByAlias(alias);
  if (existing) {
    existing.policy = policy;
    existing.summary = { ...(existing.summary || {}), greeting: policy.eva.greeting };
    return saveBlueprintRecord(existing);
  }
  return createBlueprintRecord({
    policy,
    summary: { greeting: policy.eva.greeting },
    contactChoice: intake.contactChoice,
    contactValue: intake.contactValue,
    alias,
  });
}

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('confirm') !== 'amanda-tarris') {
    return Response.json({ ok: false }, { status: 404 });
  }
  let amanda = await upsert('amanda-catherine', AMANDA);
  const manualPath = 'AesthetiKine 1-Day Nervous System Reset Manual.pdf';
  const manual = await get(manualPath, { access: 'private', useCache: false });
  if (manual?.statusCode === 200 && !(amanda.vaultFiles || []).some((f) => f.name === manualPath)) {
    amanda = await appendBlueprintVaultFile(amanda.clientId, {
      name: manualPath,
      type: 'application/pdf',
      size: 12801515,
      blobPath: manualPath,
      uploadedAt: new Date().toISOString(),
    });
  }
  const tarris = await upsert('tarris', TARRIS);
  return Response.json({
    ok: true,
    amanda: { clientId: amanda.clientId, capacity: amanda.policy.capacity, scheduling: amanda.policy.scheduling, eva: amanda.policy.eva, vault: amanda.policy.vault, vaultFiles: amanda.vaultFiles.map((f) => f.name), bricks: amanda.policy.bricks },
    tarris: { clientId: tarris.clientId, capacity: tarris.policy.capacity, scheduling: tarris.policy.scheduling, events: tarris.policy.events, eva: tarris.policy.eva, vault: tarris.policy.vault, vaultFiles: tarris.vaultFiles.map((f) => f.name), bricks: tarris.policy.bricks },
  });
}
