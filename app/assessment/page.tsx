'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';

const REVENUE_RANGES = [
  'Under $100k',
  '$100k-$500k',
  '$500k-$1M',
  '$1M-$5M',
  '$5M+',
];

const COMPLEXITY_OPTIONS = ['Low', 'Medium', 'High'];

interface FormState {
  businessName: string;
  contactName: string;
  email: string;
  teamSize: string;
  revenueRange: string;
  currentSystems: string;
  systemsCount: string;
  operationalChallenges: string[];
  growthGoals: string;
  capacityConstraints: string;
  workflowCount: string;
  automationCount: string;
  integrationCount: string;
  dashboardRequired: boolean;
  portalRequired: boolean;
  userCount: string;
  businessComplexity: string;
}

const EMPTY: FormState = {
  businessName: '',
  contactName: '',
  email: '',
  teamSize: '',
  revenueRange: '',
  currentSystems: '',
  systemsCount: '',
  operationalChallenges: [],
  growthGoals: '',
  capacityConstraints: '',
  workflowCount: '',
  automationCount: '',
  integrationCount: '',
  dashboardRequired: false,
  portalRequired: false,
  userCount: '',
  businessComplexity: '',
};

export default function AssessmentPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setText(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function toggleChallenge(label: string) {
    setForm((prev) => {
      const has = prev.operationalChallenges.includes(label);
      return {
        ...prev,
        operationalChallenges: has
          ? prev.operationalChallenges.filter((c) => c !== label)
          : [...prev.operationalChallenges, label],
      };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (
      !form.businessName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.revenueRange ||
      !form.businessComplexity
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
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          teamSize: Number(form.teamSize) || 1,
          revenueRange: form.revenueRange,
          currentSystems: form.currentSystems.trim(),
          systemsCount: Number(form.systemsCount) || 0,
          operationalChallenges: form.operationalChallenges,
          growthGoals: form.growthGoals.trim(),
          capacityConstraints: form.capacityConstraints.trim(),
          workflowCount: Number(form.workflowCount) || 0,
          automationCount: Number(form.automationCount) || 0,
          integrationCount: Number(form.integrationCount) || 0,
          dashboardRequired: form.dashboardRequired,
          portalRequired: form.portalRequired,
          userCount: Number(form.userCount) || 0,
          businessComplexity: form.businessComplexity,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="bg-neutral-950 px-6 py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Efficiency Architects
          </p>
          <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest text-white">
            Assessment Received
          </h1>
        </div>

        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <div className="border border-neutral-200 bg-white p-10">
            <p
              className="mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              Thank You
            </p>
            <h2 className="mb-4 text-xl font-extrabold uppercase tracking-wide text-neutral-950">
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

  const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700';
  const inputClass =
    'w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800';
  const textareaClass =
    'w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 resize-y';
  const selectClass =
    'w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800';

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest text-white">
          Operational Assessment
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          Complete the form below so our team can evaluate your operational profile.
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* Section: Business Information */}
          <div className="border border-neutral-200 bg-white p-8">
            <p
              className="mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              Business Information
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Business Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.businessName}
                  onChange={setText('businessName')}
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Contact Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.contactName}
                  onChange={setText('contactName')}
                  autoComplete="name"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={setText('email')}
                  autoComplete="email"
                  placeholder="jane@company.com"
                />
              </div>
            </div>
          </div>

          {/* Section: Business Profile */}
          <div className="border border-neutral-200 bg-white p-8">
            <p
              className="mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              Business Profile
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Team Size</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.teamSize}
                  onChange={setText('teamSize')}
                  placeholder="Number of full-time team members"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Annual Revenue Range <span className="text-red-600">*</span>
                </label>
                <select
                  className={selectClass}
                  value={form.revenueRange}
                  onChange={setText('revenueRange')}
                >
                  <option value="">Select a range</option>
                  {REVENUE_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Business Complexity <span className="text-red-600">*</span>
                </label>
                <select
                  className={selectClass}
                  value={form.businessComplexity}
                  onChange={setText('businessComplexity')}
                >
                  <option value="">Select complexity</option>
                  {COMPLEXITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-neutral-500">
                  Low: straightforward processes. Medium: some custom workflows or exceptions. High: complex rules, multiple service lines, or regulatory requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Current State */}
          <div className="border border-neutral-200 bg-white p-8">
            <p
              className="mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              Current Systems and Challenges
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Current Systems and Software</label>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={form.currentSystems}
                  onChange={setText('currentSystems')}
                  placeholder="List the main tools, platforms, and software your team currently uses (e.g., QuickBooks, HubSpot, Google Workspace, Slack)"
                />
              </div>

              <div>
                <label className={labelClass}>Number of Distinct Tools or Systems</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.systemsCount}
                  onChange={setText('systemsCount')}
                  placeholder="Approximate count of separate software tools in use"
                />
              </div>

              <div>
                <label className={labelClass}>Operational Challenges</label>
                <p className="mb-3 text-xs text-neutral-500">
                  Select all that currently apply to your organization.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {OPERATIONAL_CHALLENGES.map((challenge) => {
                    const checked = form.operationalChallenges.includes(challenge.label);
                    return (
                      <label
                        key={challenge.id}
                        className={`flex cursor-pointer items-start gap-3 border p-3 text-sm leading-snug transition-colors ${
                          checked
                            ? 'border-neutral-800 bg-neutral-50'
                            : 'border-neutral-200 bg-white hover:border-neutral-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0 accent-neutral-950"
                          checked={checked}
                          onChange={() => toggleChallenge(challenge.label)}
                        />
                        <span className="text-neutral-700">{challenge.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Goals */}
          <div className="border border-neutral-200 bg-white p-8">
            <p
              className="mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              Goals and Constraints
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Growth Goals</label>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={form.growthGoals}
                  onChange={setText('growthGoals')}
                  placeholder="Describe your primary business growth objectives over the next 12-24 months"
                />
              </div>

              <div>
                <label className={labelClass}>Capacity Constraints</label>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={form.capacityConstraints}
                  onChange={setText('capacityConstraints')}
                  placeholder="What operational bottlenecks or resource limitations are holding your team back right now?"
                />
              </div>
            </div>
          </div>

          {/* Section: Scope */}
          <div className="border border-neutral-200 bg-white p-8">
            <p
              className="mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              Scope and Requirements
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Recurring Workflows</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.workflowCount}
                    onChange={setText('workflowCount')}
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Distinct repeating processes</p>
                </div>

                <div>
                  <label className={labelClass}>Currently Automated</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.automationCount}
                    onChange={setText('automationCount')}
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Workflows already automated</p>
                </div>

                <div>
                  <label className={labelClass}>Integrations Needed</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.integrationCount}
                    onChange={setText('integrationCount')}
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Systems to connect</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Team Members Who Would Use the System</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.userCount}
                  onChange={setText('userCount')}
                  placeholder="Number of active users"
                />
              </div>

              <div className="space-y-3">
                <label className={labelClass}>Additional Requirements</label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    className="accent-neutral-950"
                    checked={form.dashboardRequired}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dashboardRequired: e.target.checked }))
                    }
                  />
                  Reporting or performance dashboard required
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    className="accent-neutral-950"
                    checked={form.portalRequired}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, portalRequired: e.target.checked }))
                    }
                  />
                  Client or partner portal required
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Assessment'}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Your information is kept confidential and used only to prepare your operational analysis.
          </p>
        </form>
      </div>
    </main>
  );
}
