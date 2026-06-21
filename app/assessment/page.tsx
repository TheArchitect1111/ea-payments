'use client';

import Link from 'next/link';
import { useState, FormEvent, ChangeEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';

import { eaPulseTheme } from '@ea/premium-chassis/theme';

const GOLD = eaPulseTheme.colors.goldBright;
const BLACK = eaPulseTheme.colors.black;
const CONDENSED = eaPulseTheme.fonts.display;
const BARLOW = eaPulseTheme.fonts.body;

// ---------------------------------------------------------------------------
// Static option lists
// ---------------------------------------------------------------------------

const TEAM_SIZE_OPTIONS = [
  'Just me',
  '2-5 people',
  '6-15 people',
  '16-50 people',
  'More than 50 people',
];

const REVENUE_OPTIONS = [
  'Under $100k',
  '$100k to $500k',
  '$500k to $1M',
  '$1M to $5M',
  'More than $5M',
];

const TOOLS_OPTIONS = [
  'QuickBooks or accounting software',
  'Google Sheets or Excel spreadsheets',
  'A separate CRM or contact management tool',
  'Email only (Gmail, Outlook, etc.)',
  'Project management software (Asana, Monday, Trello, etc.)',
  'Scheduling or booking software',
  'Point of sale or inventory system',
  'HR or payroll software',
  'Social media management tools',
  'None, everything is done manually',
  'Other',
];

const GROWTH_OPTIONS = [
  'Grow revenue without adding more staff',
  'Open a new location or expand to new markets',
  'Get my time back and stop doing everything myself',
  'Build systems so the business can run without me',
  'Improve the customer experience and retention',
  'Raise funding or prepare for acquisition',
  'Stabilize and create more predictable revenue',
  'Other',
];

const BLOCKER_OPTIONS = [
  'Not enough time in the day',
  'Too much manual work and repetitive tasks',
  'My team is not aligned or operating efficiently',
  'I do not have clear visibility into what is happening in my business',
  'My systems and tools do not talk to each other',
  'I cannot find or afford the right people',
  'I do not have a clear plan or strategy',
  'Cash flow or budget constraints',
  'Other',
];

// Plain-English display labels for each challenge ID.
const CHALLENGE_DISPLAY: Record<string, string> = {
  manual_scheduling:           'Scheduling is done manually, no automation in place',
  no_client_database:          'No single place to track all clients or customers',
  inconsistent_follow_up:      'Leads or clients fall through the cracks',
  manual_invoicing:            'Invoicing or billing is done by hand',
  disconnected_systems:        'Tools do not talk to each other so data gets entered twice',
  no_centralized_reporting:    'No dashboard to see how the business is performing',
  leadership_lacks_visibility: 'Hard to know what is happening in the business day to day',
  manual_data_entry:           'Manual data entry is taking too much time',
  inconsistent_communication:  'Client or customer communication is inconsistent',
  manual_onboarding:           'Onboarding new clients or employees takes too long',
  compliance_reporting:        'Compliance or reporting is handled manually in spreadsheets',
  vendor_management_manual:    'Tracking vendors or suppliers in spreadsheets',
  team_scaling_issues:         'Hard to grow the team without things falling apart',
  no_sops:                     'No written processes, so everything depends on who you ask',
  project_tracking_gaps:       'Projects or tasks slip through without proper tracking',
};

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  businessName: string;
  contactName: string;
  email: string;
  teamSizeLabel: string;
  revenueRange: string;
  currentSystems: string[];        // multi-select
  operationalChallenges: string[]; // multi-select (IDs)
  growthGoals: string;             // single-select
  capacityConstraints: string[];   // multi-select
}

const EMPTY: FormState = {
  businessName: '',
  contactName: '',
  email: '',
  teamSizeLabel: '',
  revenueRange: '',
  currentSystems: [],
  operationalChallenges: [],
  growthGoals: '',
  capacityConstraints: [],
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const baseInput =
  'ea-input w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 transition-colors';

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="mb-6 text-sm font-bold uppercase tracking-[0.18em]"
      style={{ fontFamily: CONDENSED, color: GOLD }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label
      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700"
      style={{ fontFamily: CONDENSED }}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

// Reusable multi-select checklist rendered as a grid of toggle tiles.
function Checklist({
  options,
  selected,
  onToggle,
  cols = 2,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  cols?: 1 | 2;
}) {
  const gridClass =
    cols === 1
      ? 'grid grid-cols-1 gap-2'
      : 'grid grid-cols-1 gap-2 sm:grid-cols-2';

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-start gap-3 border p-3.5 text-sm leading-snug transition-colors ${
              checked
                ? 'border-[#F5A623] bg-amber-50'
                : 'border-neutral-200 bg-white hover:border-neutral-400'
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              style={{ accentColor: GOLD }}
              checked={checked}
              onChange={() => onToggle(opt)}
            />
            <span className="text-neutral-700">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AssessmentPage() {
  return (
    <Suspense fallback={null}>
      <AssessmentPageInner />
    </Suspense>
  );
}

function AssessmentPageInner() {
  const searchParams = useSearchParams();
  const considerSlug = searchParams.get('consider')?.trim() || undefined;
  const partnerSlug = searchParams.get('partner')?.trim() || undefined;

  const [form, setForm]           = useState<FormState>(EMPTY);
  const [submitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!considerSlug) return;
    fetch(`/api/consider/${considerSlug}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'assessment_started' }),
    }).catch(() => {});
  }, [considerSlug]);

  function setField(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function toggleArray(field: 'currentSystems' | 'operationalChallenges' | 'capacityConstraints') {
    return (val: string) =>
      setForm((prev) => {
        const arr = prev[field] as string[];
        const has = arr.includes(val);
        return {
          ...prev,
          [field]: has ? arr.filter((v) => v !== val) : [...arr, val],
        };
      });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setError('');

    if (
      !form.businessName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.teamSizeLabel ||
      !form.revenueRange
    ) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName:          form.businessName.trim(),
          contactName:           form.contactName.trim(),
          email:                 form.email.trim(),
          teamSizeLabel:         form.teamSizeLabel,
          revenueRange:          form.revenueRange,
          currentSystems:        form.currentSystems.join(', '),
          operationalChallenges: form.operationalChallenges,
          growthGoals:           form.growthGoals,
          capacityConstraints:   form.capacityConstraints.join('; '),
          considerSlug,
          partnerSlug,
        }),
      });

      if (!res.ok) {
        let msg = 'Something went wrong. Please try again.';
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          // response was not JSON
        }
        setError(msg);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        proposalId?: string;
        saved?: boolean;
        message?: string;
      };
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.proposalId) {
        window.location.href = `/assessment/thank-you?proposal=${encodeURIComponent(data.proposalId)}`;
        return;
      }

      if (data.ok && data.saved === false) {
        window.location.href = '/assessment/thank-you?received=1';
        return;
      }

      window.location.href = '/assessment/thank-you';
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Thank-you view
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#F8F6F2', fontFamily: BARLOW }}>
        <div className="px-6 py-16 text-center" style={{ backgroundColor: BLACK }}>
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ fontFamily: CONDENSED, color: GOLD }}
          >
            Efficiency Architects
          </p>
          <h1
            className="mt-3 text-4xl font-bold uppercase tracking-widest"
            style={{ fontFamily: CONDENSED, color: GOLD }}
          >
            Assessment Received
          </h1>
        </div>

        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <div className="rounded bg-white p-10 shadow-md">
            <p
              className="mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ fontFamily: CONDENSED, color: GOLD }}
            >
              Thank You
            </p>
            <h2
              className="mb-4 text-xl font-bold uppercase tracking-wide text-neutral-950"
              style={{ fontFamily: CONDENSED }}
            >
              We received your assessment
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-neutral-600">
              Our team will review your submission and reach out within 1-2 business days
              to discuss your operational profile and next steps.
            </p>
            <p className="text-sm leading-relaxed text-neutral-600">
              Questions? Contact us at{' '}
              <a
                href="mailto:freedom@efficiencyarchitects.online"
                className="font-semibold text-neutral-950 underline"
              >
                freedom@efficiencyarchitects.online
              </a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Form view
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F8F6F2', fontFamily: BARLOW }}>

      {/* Hero */}
      <div style={{ backgroundColor: BLACK }}>
        {/* EA wordmark row */}
        <div className="mx-auto max-w-5xl px-6 pt-6">
          <Link href="/" aria-label="Efficiency Architects home" style={{ textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ea-logo.png" alt="Efficiency Architects" style={{ height: '80px', width: 'auto' }} />
          </Link>
        </div>

        {/* Headline */}
        <div className="px-6 pb-20 pt-10 text-center">
          <h1
            className="text-4xl font-bold uppercase leading-tight sm:text-5xl"
            style={{ fontFamily: CONDENSED, color: GOLD }}
          >
            Let&apos;s See What&apos;s Possible
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white">
            Answer a few questions. We&apos;ll show you what&apos;s slowing you down and what it&apos;s costing you.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div
          className="mb-8 rounded border-2 border-[#F5A623] bg-amber-50 px-5 py-4 text-sm leading-relaxed text-neutral-800"
          style={{ fontFamily: BARLOW }}
        >
          <p className="font-bold uppercase tracking-wide text-neutral-950" style={{ fontFamily: CONDENSED }}>
            Start here — contact info required
          </p>
          <p className="mt-1">
            Enter your <strong>business name</strong>, <strong>your name</strong>, and <strong>email</strong> in the
            first section before you submit. We use this to send your capacity analysis and next steps.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Section 1: About Your Business */}
          <div className="rounded bg-white p-8 shadow-sm ring-2 ring-[#F5A623]/40">
            <SectionLabel>Step 1 — Your Contact Info (Required)</SectionLabel>
            <div className="space-y-5">

              <div>
                <FieldLabel required>Business Name</FieldLabel>
                <input
                  type="text"
                  className={baseInput}
                  value={form.businessName}
                  onChange={setField('businessName')}
                  placeholder="Your business name"
                  autoComplete="organization"
                />
              </div>

              <div>
                <FieldLabel required>Your Name</FieldLabel>
                <input
                  type="text"
                  className={baseInput}
                  value={form.contactName}
                  onChange={setField('contactName')}
                  placeholder="First and last name"
                  autoComplete="name"
                />
              </div>

              <div>
                <FieldLabel required>Your Email</FieldLabel>
                <input
                  type="email"
                  className={baseInput}
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="you@yourbusiness.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <FieldLabel required>How many people work in your business?</FieldLabel>
                <select
                  className={baseInput}
                  value={form.teamSizeLabel}
                  onChange={setField('teamSizeLabel')}
                >
                  <option value="">Select one</option>
                  {TEAM_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel required>What is your annual revenue?</FieldLabel>
                <select
                  className={baseInput}
                  value={form.revenueRange}
                  onChange={setField('revenueRange')}
                >
                  <option value="">Select a range</option>
                  {REVENUE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Section 2: How You Work Today */}
          <div className="rounded bg-white p-8 shadow-sm">
            <SectionLabel>How You Work Today</SectionLabel>
            <div className="space-y-6">

              <div>
                <FieldLabel>What tools or software does your business currently use?</FieldLabel>
                <p className="mb-3 text-xs leading-relaxed text-neutral-500">
                  Select everything that applies.
                </p>
                <Checklist
                  options={TOOLS_OPTIONS}
                  selected={form.currentSystems}
                  onToggle={toggleArray('currentSystems')}
                />
              </div>

              <div>
                <FieldLabel>What is slowing your business down right now?</FieldLabel>
                <p className="mb-3 text-xs leading-relaxed text-neutral-500">
                  Select everything that applies.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {OPERATIONAL_CHALLENGES.map((challenge) => {
                    const checked = form.operationalChallenges.includes(challenge.id);
                    const display = CHALLENGE_DISPLAY[challenge.id] ?? challenge.label;
                    return (
                      <label
                        key={challenge.id}
                        className={`flex cursor-pointer items-start gap-3 border p-3.5 text-sm leading-snug transition-colors ${
                          checked
                            ? 'border-[#F5A623] bg-amber-50'
                            : 'border-neutral-200 bg-white hover:border-neutral-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          style={{ accentColor: GOLD }}
                          checked={checked}
                          onChange={() => toggleArray('operationalChallenges')(challenge.id)}
                        />
                        <span className="text-neutral-700">{display}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Your Goals */}
          <div className="rounded bg-white p-8 shadow-sm">
            <SectionLabel>Your Goals</SectionLabel>
            <div className="space-y-6">

              <div>
                <FieldLabel>Where do you want your business to be in the next 12-24 months?</FieldLabel>
                <select
                  className={baseInput}
                  value={form.growthGoals}
                  onChange={setField('growthGoals')}
                >
                  <option value="">Select one</option>
                  {GROWTH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>What is stopping you from getting there?</FieldLabel>
                <p className="mb-3 text-xs leading-relaxed text-neutral-500">
                  Select everything that applies.
                </p>
                <Checklist
                  options={BLOCKER_OPTIONS}
                  selected={form.capacityConstraints}
                  onToggle={toggleArray('capacityConstraints')}
                  cols={1}
                />
              </div>

            </div>
          </div>

          {attempted && error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-sm font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontFamily: CONDENSED, backgroundColor: BLACK, color: GOLD }}
          >
            {loading ? 'Submitting...' : 'Submit My Assessment'}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Your information is kept confidential and used only to prepare your operational analysis.
          </p>

        </form>
      </div>
    </main>
  );
}
