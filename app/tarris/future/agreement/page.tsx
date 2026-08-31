const scope = [
  ['Custom Website', 'Responsive custom athlete website experience', 'Approved pages/sections, CTAs, storytelling, mobile optimization and launch', '$850'],
  ['Splash Website Experience', 'Cinematic opening experience using authentic Tarris media', 'Branded video splash, motion/transition, desktop and mobile behavior', '$350'],
  ['Custom UX & Client Journey Design', 'Strategic visitor journey and conversion architecture', 'Content hierarchy, calls to action, audience pathways and experience flow', '$275'],
  ['Business / Client Portal', 'Secure operational or client-facing portal', 'Dashboard, document area and agreed athlete/business tools', '$400'],
  ['Eva Digital Assistant', 'EA digital-assistant functionality', 'Project-specific guidance, visitor support and approved assistant experience', '$200'],
  ['Smartchitecture Automation', 'Workflow and operational automation', 'Approved routing, triggers, confirmations and notifications', '$200'],
  ['Client Update Hub', 'Client-controlled update capability', 'Access to update approved website and business information', '$150'],
  ['Forms & Data Capture', 'Digital lead, inquiry and opportunity capture', 'Approved contact, partnership, intake or opportunity forms', '$125'],
  ['System Integrations', 'Connection of approved third-party services', 'Agreed integrations and workflow connections', '$125'],
  ['Mobile Optimization', 'Device-responsive refinement', 'Responsive layouts, touch behavior and mobile QA', '$100'],
  ['Testing & Quality Assurance', 'Functional and visual pre-launch validation', 'Cross-page QA, media checks, forms, routing and final review', '$100'],
  ['Launch, Deployment & Configuration', 'Production setup and deployment', 'Production configuration, launch and initial verification', '$75'],
  ['Client Training & Handoff', 'Operational handoff', 'Orientation to approved client controls and update workflow', '$47'],
];

const terms = [
  ['2. STANDARD SERVICES', 'Efficiency Architects (EA) will design, configure, test and deploy the deliverables identified in the Project Scope & Investment Breakdown. Standard implementation includes reasonable project management, configuration, quality assurance and launch support required for the listed deliverables.'],
  ['3. CLIENT RESPONSIBILITIES', 'The Client will provide timely access to approved content, authentic media, account credentials and feedback reasonably required to complete the project. Delays in receiving required materials or approvals may affect the delivery timeline.'],
  ['4. PAYMENT TERMS', 'A $500 deposit is due to begin the project. The remaining project balance is $2,497 and is due according to the agreed payment schedule. Work outside the controlling Project Scope & Investment Breakdown requires written approval and may be billed separately. Third-party provider, transaction, domain, premium API, SMS, email-volume or similar usage fees are not included unless expressly stated.'],
  ['5. ANNUAL PLATFORM FEE', 'Standard EA-managed platform access is $99 per year beginning on the first anniversary of launch. The annual platform fee supports applicable EA-managed infrastructure and standard platform access. Third-party usage fees remain separate.'],
  ['6. CHANGE REQUESTS & ADDITIONAL SERVICES', 'Requests that materially change the approved scope, add new functionality, require new integrations, or introduce additional deliverables will be treated as additional services. EA will communicate the scope and cost before beginning approved additional work.'],
  ['9. REFERRAL COMMISSION', 'For any referral made by the Client that results in a paid agreement with Efficiency Architects, Efficiency Architects will pay a referral commission equal to 20% of the amount actually paid to Efficiency Architects under that referred agreement. The commission will be sent to the person, organization, or business designated by the Client.'],
];

export default function TarrisAgreementPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 text-[#15171b] sm:px-8">
      <article className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,.08)]">
        <header className="bg-[#0b0d10] px-7 py-12 text-white sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5ab3c]">Efficiency Architects</p>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Client Services Agreement</h1>
          <p className="mt-5 text-xl text-white/65">Tarris Bouie · Tarris Bouie Digital Experience</p>
        </header>

        <section className="px-7 py-10 sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#aa8122]">A note from Efficiency Architects</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Tarris, we're excited about what's ahead</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-neutral-600">
            <p>Thank you for trusting Efficiency Architects to help build the next phase of your digital presence. This project is about much more than creating a great website. Tarris is entering an important stage where basketball, personal brand, business opportunities, partnerships, and his long-term future can begin working together.</p>
            <p>Our goal is to build the digital foundation that supports that growth. We are creating a platform that can tell Tarris's story professionally, showcase who he is beyond the court, make it easier for people and organizations to connect with him, and provide the systems needed to manage opportunities as they develop.</p>
            <p>Most importantly, we are building with the future in mind. The platform should be able to grow alongside Tarris, from his college career to NIL and partnership opportunities, community initiatives, professional opportunities, and whatever comes next.</p>
            <p>We're excited to help build that foundation and grateful for the opportunity to be part of the journey.</p>
            <p className="font-semibold text-neutral-900">Robert Brickey<br/>Efficiency Architects</p>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50 px-7 py-8 sm:px-12">
          <div className="grid gap-5 sm:grid-cols-4">
            <div><p className="text-xs uppercase text-neutral-400">Client</p><p className="mt-1 font-semibold">Tarris Bouie</p></div>
            <div><p className="text-xs uppercase text-neutral-400">Investment</p><p className="mt-1 font-semibold">$2,997</p></div>
            <div><p className="text-xs uppercase text-neutral-400">Initial payment</p><p className="mt-1 font-semibold">$500</p></div>
            <div><p className="text-xs uppercase text-neutral-400">Balance</p><p className="mt-1 font-semibold">$2,497</p></div>
          </div>
        </section>

        <section className="px-7 py-10 sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#aa8122]">01 · Project scope & investment breakdown</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead><tr className="border-b-2 border-neutral-900"><th className="py-3 pr-4">Project component</th><th className="py-3 pr-4">Task description</th><th className="py-3 pr-4">Deliverable(s)</th><th className="py-3 text-right">Cost</th></tr></thead>
              <tbody>{scope.map((row) => <tr key={row[0]} className="border-b border-neutral-200 align-top"><td className="py-4 pr-4 font-semibold">{row[0]}</td><td className="py-4 pr-4 text-neutral-600">{row[1]}</td><td className="py-4 pr-4 text-neutral-600">{row[2]}</td><td className="py-4 text-right font-semibold">{row[3]}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-7 rounded-2xl bg-[#0b0d10] p-6 text-white">
            <div className="flex justify-between gap-4"><span>One-time project investment</span><strong>$2,997</strong></div>
            <div className="mt-2 flex justify-between gap-4"><span>Deposit / initial payment</span><strong>$500</strong></div>
            <div className="mt-2 flex justify-between gap-4"><span>Remaining project balance</span><strong>$2,497</strong></div>
            <div className="mt-2 flex justify-between gap-4"><span>Annual platform fee</span><strong>$99 / year</strong></div>
            <p className="mt-4 border-t border-white/15 pt-4 text-xs leading-5 text-white/55">First-year cash commitment: $2,997 project investment. The $99 annual platform fee begins on the first anniversary of launch.</p>
          </div>
        </section>

        <section className="border-t border-neutral-200 px-7 py-10 sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#aa8122]">Terms</p>
          <h2 className="mt-3 text-3xl font-semibold">Agreement terms</h2>
          <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">{terms.map(([title, text]) => <div key={title} className="py-6"><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-neutral-600">{text}</p></div>)}</div>
        </section>

        <footer className="bg-[#0b0d10] px-7 py-8 text-white sm:px-12">
          <p className="text-sm font-semibold">Official agreement reference</p>
          <p className="mt-2 break-all font-mono text-[10px] leading-5 text-white/45">Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf · SHA-256 390ed4546f66522f1ed84ccecd95bc037b24acd87eee7288913c9288027ac667</p>
        </footer>
      </article>
    </main>
  );
}
