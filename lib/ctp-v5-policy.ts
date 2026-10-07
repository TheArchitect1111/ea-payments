const volumeMid: Record<string, number> = {
  '1 to 10': 5, '11 to 25': 18, '26 to 50': 38, '51 to 100': 75, 'More than 100': 150,
  '1 to 25': 13, '26 to 75': 50, '76 to 150': 113, '151 to 300': 225, 'More than 300': 400,
};
const helperMid: Record<string, number> = {
  'Just me': 1, '1 to 2': 1.5, '2 to 3': 2.5, '3 to 5': 4, '4 to 6': 5, '6 to 10': 8, '7 to 10': 8.5, 'More than 10': 12,
};
const eventMid: Record<string, number> = { '1': 1, '2 to 4': 3, '5 to 12': 8.5, 'More than 12': 16 };
const timeMid: Record<string, number> = {
  'Less than 15 minutes': .2, '15 to 30 minutes': .4, '31 to 60 minutes': .75, '1 to 2 hours': 1.5, 'More than 2 hours': 3,
};
const frequencyMid: Record<string, number> = {
  'Several times a day': 110, 'About once a day': 22, 'Several times a week': 12, 'About once a week': 4, 'Few times a month': 2, 'A few times a month': 2,
};
const costByType: Record<string, number> = { service: 30, events: 35, teaching: 40, products: 25, community: 28, mixed: 30, other: 30 };
const arr = (x: unknown): string[] => Array.isArray(x) ? x.map(String) : x == null ? [] : [String(x)];
const includes = (xs: unknown, s: string) => arr(xs).some(x => x.toLowerCase().includes(s.toLowerCase()));
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export type CtpV5Intake = Record<string, any>;

export function ctpClientType(a: CtpV5Intake) {
  const s = String(a.q2 || '').toLowerCase();
  return s.includes('provide a service') ? 'service'
    : s.includes('events or gatherings') ? 'events'
    : s.includes('teach, coach') ? 'teaching'
    : s.includes('products') ? 'products'
    : s.includes('team, group, or community') ? 'community'
    : s.includes('more than one') ? 'mixed'
    : 'other';
}

export function calculateCtpCapacity(a: CtpV5Intake = {}, kind = ctpClientType(a)) {
  const x = a.q3 || {};
  const q9 = a.q9 || {};
  const time = timeMid[q9.duration];
  const crew = helperMid[q9.peopleInvolved];
  const ev = eventMid[x.eventCount];
  const rate = frequencyMid[a.q8];
  const eventMode = a.q8 === 'Mostly during events or busy seasons';
  const unit = eventMode ? 'event' : 'month';
  const volume = volumeMid[x.monthlyVolume] ?? volumeMid[x.attendees] ?? volumeMid[x.groupSize] ?? ev ?? null;
  const cost = costByType[kind] || 30;
  const recoveryPercent = 30;
  if (time == null || crew == null || (!eventMode && rate == null) || (eventMode && ev == null)) {
    return {
      unit: 'unknown', hours: null, value: null, annualHours: null, annualValue: null,
      assumptions: { averageVolume: volume, frequencyPerMonth: rate ?? null, timeHours: time ?? null, peopleCount: crew ?? null, loadedCost: cost, recoveryPercent },
    };
  }
  const hours = round(time * crew * (eventMode ? 1 : rate), 1);
  const annualHours = round(eventMode ? hours * ev : hours * 12, 1);
  const value = round(hours * cost * recoveryPercent / 100, 2);
  const annualValue = round(annualHours * cost * recoveryPercent / 100, 2);
  return {
    unit, hours, value, annualHours, annualValue,
    assumptions: { averageVolume: volume, frequencyPerMonth: eventMode ? 1 : rate, timeHours: time, peopleCount: crew, loadedCost: cost, recoveryPercent },
  };
}

export function buildCtpV5Policy(a: CtpV5Intake = {}) {
  const kind = ctpClientType(a);
  const cap = calculateCtpCapacity(a, kind);
  const q3 = a.q3 || {};
  const q6 = arr(a.q6), q10 = arr(a.q10), q12 = arr(a.q12), q14 = arr(a.q14), personal = arr(a.q14Personal), q4 = arr(a.q4), q11 = arr(a.q11), q15 = a.q15 || {};
  const bricks = ['capacity.core','scheduling.core','comm.core','vault.core','task.core','brand.core','portal.shell'];
  if (kind === 'events') bricks.push('events.core');
  else if (kind === 'teaching') bricks.push('learning.core');
  else if (kind === 'products') bricks.push('shop.core');
  else if (kind === 'community') bricks.push('community.core');

  const seq: string[] = [];
  if (q12.some(x => x.startsWith('Welcome'))) seq.push('welcome');
  if (q12.some(x => x.includes('directions') || x.includes('materials'))) seq.push(kind === 'events' ? 'directions' : 'materials');
  if (q12.some(x => x.startsWith('Remind'))) seq.push('reminder');
  if (q12.some(x => x.startsWith('Check in'))) seq.push('checkin');
  if (q12.some(x => x.includes('payment'))) seq.push('payment reminder');
  if (kind === 'events') seq.push('sponsor thank you','day-of information','post-event photos');
  else if (kind === 'teaching') seq.push('checkin');

  const missing: string[] = [];
  if (kind === 'teaching') missing.push('Welcome and onboarding packet','Student progress tracker');
  if (kind === 'events') missing.push('Team packets','Tee sheets and signage');
  if (kind === 'products') missing.push('Order and product tracking');
  if (q6.some(x => x.includes('file')) || q11.some(x => x.includes('finding information') || x.includes('what to do next'))) missing.push('Searchable, organized file space');

  const attention: string[] = [];
  if (kind === 'events' && q6.some(x => x.includes('pile up'))) attention.push('Confirm event pile-up pattern');
  else if (cap.hours == null) attention.push('Discuss volume and time estimate');
  else attention.push('Confirm time estimate');
  attention.push(kind === 'events' ? 'Draft player welcome' : 'Draft welcome message');
  attention.push(kind === 'events' ? 'Upload roster template' : 'Upload missing asset');
  attention.push(kind === 'events' ? 'Set tee deadline' : 'Set reminder timing');

  const emailName = a.contactChoice === 'Email' ? String(a.contactValue || '').split('@')[0].match(/^[A-Za-z]+/)?.[0] : null;
  const aliasName = String(a.portalAlias || '').split('-')[0].match(/^[A-Za-z]+/)?.[0] || null;
  const rawFirstName = aliasName || emailName;
  const firstName = rawFirstName ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1) : 'there';
  const channel = a.contactChoice === 'Text message' ? 'text' : a.contactChoice === 'I would rather discuss it in conversation' ? 'conversation' : 'email';
  const autoReminder = q12.some(x => x.startsWith('Remind'));
  const schedulingVolume = kind === 'teaching' ? q3.sessions : kind === 'events' ? q3.eventCount : kind === 'community' ? q3.groupSize : q3.monthlyVolume || q3.orders || q3.sessions || 'I am not sure';

  return {
    version: 'ctp-v5',
    clientType: kind,
    answers: a,
    bricks,
    capacity: cap,
    scheduling: { type: kind === 'events' ? 'event' : 'ongoing', volume: schedulingVolume || 'I am not sure', attendees: q3.attendees || null, helpers: q3.helpers || null, autoReminder, buffer: includes(a.q5,'Too much depends on me'), eventTimeline: kind === 'events' },
    communications: { sequences: [...new Set(seq)], channel, priority: q10.some(x => x.includes('wait longer') || x.includes('miss chances')) ? 'high' : 'normal', autoReply: q11.some(x => x.includes('wait too long')) },
    vault: { existing: q14, missing: [...new Set(missing)], uploads: a.uploads || [], personalProtected: personal, searchEnabled: q6.some(x => x.includes('file')) },
    roles: arr(q15.who),
    workQueue: { biggestToll: a.q5 || 'Not shared yet', stuck: q6, recentExample: a.q7 || 'Not shared yet', effects: q10, afterYes: q12 },
    brand: { pillars: q4, clarityNeeded: q11.some(x => x.includes('understand what we do')) },
    events: kind === 'events' ? { eventCount: q3.eventCount, attendees: q3.attendees, helpers: q3.helpers, modules: ['registration','payment','teams','tee times','scoring','signage','photos','thank yous'] } : null,
    learning: kind === 'teaching' ? { students: q3.monthlyVolume, sessions: q3.sessions, materials: q14.filter(x => x.includes('Teaching')), modules: ['onboarding','materials delivery','progress tracking','reminders'] } : null,
    shop: kind === 'products' ? { orders: q3.monthlyVolume, products: q3.products, checkoutNeeded: true, inventoryNeeded: ['21 to 50','More than 50'].includes(q3.products) } : null,
    eva: { greeting: 'Hi ' + firstName + ', your free look is ready. Here are ' + attention.length + ' things needing your attention.', attention },
  };
}
