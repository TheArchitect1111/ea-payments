'use client';

import { useState } from 'react';
import type { NewExperiencePlan } from '@/lib/ea-intelligence';

const GOALS = [
  'Grow',
  'Save Time',
  'Create Better Experiences',
  'Build Capacity',
  'Increase Profitability',
  'Gain Peace of Mind',
  'Train People',
  'Communicate Better',
  'Capture Opportunities',
];

const AUDIENCES = [
  'Clients',
  'Customers',
  'Parents',
  'Staff',
  'Volunteers',
  'Members',
  'Donors',
  'Athletes',
  'Students',
  'Patients',
  'Prospects',
];

const ORG_TYPES = [
  'Business',
  'Sports organization',
  'Church',
  'Nonprofit',
  'School',
  'Creator',
  'Coach',
  'Consultant',
  'Restaurant',
  'Construction',
  'Healthcare',
  'Custom',
];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function NewExperienceClient() {
  const [goals, setGoals] = useState<string[]>(['Train People']);
  const [audience, setAudience] = useState<string[]>(['Staff']);
  const [organizationType, setOrganizationType] = useState('Business');
  const [notes, setNotes] = useState('');
  const [plan, setPlan] = useState<NewExperiencePlan | null>(null);
  const [status, setStatus] = useState('');

  async function generatePlan() {
    setStatus('Thinking through the best starting experience...');
    setPlan(null);
    const response = await fetch('/api/intelligence/new-experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, audience, organizationType, notes }),
    });
    const payload = (await response.json()) as { ok?: boolean; plan?: NewExperiencePlan; error?: string };
    if (!response.ok || !payload.ok || !payload.plan) {
      setStatus(payload.error || 'Could not create a plan yet.');
      return;
    }
    setPlan(payload.plan);
    setStatus('Review the recommended starting point before anything is generated.');
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d6ad36]">EA Intelligence Engine</p>
        <div className="mt-4 flex flex-col gap-4 border-b border-[#d6ad36]/30 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">New Experience</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              Choose the goal, audience, and available context. The shared engine recommends the best starting experience, components, automations, training, communications, dashboard, and outcomes.
            </p>
          </div>
          <button
            type="button"
            onClick={generatePlan}
            className="rounded-full bg-[#f3c74d] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(243,199,77,0.28)]"
          >
            Recommend Starting Point
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[8px] border border-[#d6ad36]/25 bg-[#111]/95 p-6">
            <div className="space-y-8">
              <ChoiceGroup title="Step 1: Choose Goal" values={GOALS} selected={goals} onToggle={(value) => setGoals(toggle(goals, value))} />
              <ChoiceGroup title="Step 2: Choose Audience" values={AUDIENCES} selected={audience} onToggle={(value) => setAudience(toggle(audience, value))} />

              <div>
                <label className="text-xs font-black uppercase tracking-[0.2em] text-[#d6ad36]">Organization Type</label>
                <select
                  value={organizationType}
                  onChange={(event) => setOrganizationType(event.target.value)}
                  className="mt-3 w-full rounded-[8px] border border-white/15 bg-black px-4 py-4 text-white outline-none focus:border-[#f3c74d]"
                >
                  {ORG_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.2em] text-[#d6ad36]">Available Material Or Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={7}
                  className="mt-3 w-full rounded-[8px] border border-white/15 bg-black px-4 py-4 text-white outline-none focus:border-[#f3c74d]"
                  placeholder="Paste notes about SOPs, policies, videos, training, offers, audiences, systems, or goals."
                />
              </div>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#d6ad36]/25 bg-[#151515] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d6ad36]">Engine Recommendation</p>
            <p className="mt-3 text-sm text-white/60">{status || 'Select what matters, then ask the engine for the starting point.'}</p>

            {plan && (
              <div className="mt-8 space-y-6">
                <div className="rounded-[8px] border border-[#f3c74d]/30 bg-black p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/50">Best Experience</p>
                  <h2 className="mt-2 text-3xl font-black capitalize text-[#f3c74d]">{plan.bestExperience.replace(/-/g, ' ')}</h2>
                  <p className="mt-4 text-white/70">{plan.recommendations[0]?.reason}</p>
                </div>

                <PlanBlock title="Required Components" items={plan.requiredComponents} />
                <PlanBlock title="Suggested Pages" items={plan.suggestedPages} />
                <PlanBlock title="Suggested Automations" items={plan.suggestedAutomations} />
                <PlanBlock title="Suggested Training" items={plan.suggestedTraining} />
                <PlanBlock title="Suggested Communications" items={plan.suggestedCommunications} />
                <PlanBlock title="Dashboard Signals" items={plan.suggestedDashboard} />
                <PlanBlock title="Expected Outcomes" items={plan.expectedOutcomes} />

                <div className="rounded-[8px] border border-white/10 bg-black p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d6ad36]">Why Am I Seeing This?</p>
                  <div className="mt-4 space-y-3">
                    {plan.recommendations.slice(0, 3).map((item) => (
                      <div key={`${item.experience}-${item.recommendation}`} className="border-t border-white/10 pt-3">
                        <p className="font-black">{item.recommendation}</p>
                        <p className="mt-1 text-sm text-white/65">{item.reason}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#f3c74d]">
                          {item.confidence} confidence · {item.suggestedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ChoiceGroup(props: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d6ad36]">{props.title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {props.values.map((value) => {
          const active = props.selected.includes(value);
          return (
            <button
              type="button"
              key={value}
              onClick={() => props.onToggle(value)}
              className={`rounded-[8px] border px-4 py-3 text-left text-sm font-bold transition ${
                active
                  ? 'border-[#f3c74d] bg-[#f3c74d] text-black'
                  : 'border-white/15 bg-black text-white hover:border-[#f3c74d]/70'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d6ad36]">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="rounded-[8px] border border-white/10 bg-black px-4 py-3 text-sm text-white/75">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
