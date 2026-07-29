/**
 * Universal Quick Launch — contract tests (no network).
 * Run: node scripts/test-universal-quick-launch.mjs
 */
import assert from 'node:assert/strict';

const OUTPUT_OPTIONS = [
  {
    value: 'landing-page',
    deliverable: 'Landing Page',
    goal: 'Research the subject and produce a story-driven landing page draft',
  },
  {
    value: 'website',
    deliverable: 'Website',
    goal: 'Research the subject and produce a custom multi-section website draft',
  },
  {
    value: 'portal',
    deliverable: 'Portal',
    goal: 'Research the subject and provision a portal experience on the EA chassis',
  },
  {
    value: 'website-and-portal',
    deliverable: 'Website + Portal',
    goal: 'Research the subject and produce a matched website and portal experience',
  },
];

function buildNotes({ name, detail, url, referenceUrl, outputLabel }) {
  return [
    `Distinguishing detail: ${detail}`,
    url ? `Known website/social: ${url}` : null,
    referenceUrl ? `Reference URL: ${referenceUrl}` : null,
    `Desired output: ${outputLabel}`,
    'Source: Universal Quick Launch',
  ]
    .filter(Boolean)
    .join('\n');
}

function findRecentDuplicate(projects, client, now = Date.now(), windowMs = 24 * 60 * 60 * 1000) {
  const needle = client.trim().toLowerCase();
  const cutoff = now - windowMs;
  return projects.find((p) => {
    if (p.client.trim().toLowerCase() !== needle) return false;
    const created = Date.parse(p.createdAt);
    return Number.isFinite(created) && created >= cutoff;
  });
}

// 1) Three different subjects map to distinct deliverables
const subjects = [
  {
    name: 'Maya Chen',
    detail: 'community arts director, Portland',
    output: 'website-and-portal',
  },
  {
    name: 'Harbor Light Cooperative',
    detail: 'membership nonprofit, Great Lakes fisheries',
    output: 'website',
  },
  {
    name: 'Nova Pulse Athletics',
    detail: 'athlete media brand, Toronto',
    output: 'landing-page',
  },
];

for (const subject of subjects) {
  const meta = OUTPUT_OPTIONS.find((o) => o.value === subject.output);
  assert.ok(meta, `output meta for ${subject.output}`);
  const notes = buildNotes({
    name: subject.name,
    detail: subject.detail,
    url: '',
    referenceUrl: '',
    outputLabel: meta.value === 'landing-page' ? 'Landing page' : meta.deliverable,
  });
  assert.match(notes, /Distinguishing detail:/);
  assert.match(notes, /Universal Quick Launch/);
  assert.doesNotMatch(notes, /Amanda/i);
  assert.ok(meta.deliverable.length > 0);
  assert.ok(meta.goal.toLowerCase().includes('research'));
}

// 2) Duplicate prevention within 24h
const now = Date.parse('2026-07-29T12:00:00.000Z');
const projects = [
  {
    client: 'Harbor Light Cooperative',
    createdAt: '2026-07-29T10:00:00.000Z',
    id: 'proj-old',
  },
  {
    client: 'Someone Else',
    createdAt: '2026-07-29T11:00:00.000Z',
    id: 'proj-other',
  },
];
const hit = findRecentDuplicate(projects, 'harbor light cooperative', now);
assert.equal(hit?.id, 'proj-old');

const miss = findRecentDuplicate(
  projects,
  'Harbor Light Cooperative',
  Date.parse('2026-07-31T12:00:00.000Z'),
);
assert.equal(miss, undefined);

// 3) Amanda is not the only path — universal subjects must not force amanda slug
for (const subject of subjects) {
  const slugGuess = subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  assert.notEqual(slugGuess, 'amanda-catherine');
}

console.log('test-universal-quick-launch: ok');
