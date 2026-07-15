/**
 * Dual CTP post-intake welcome emails.
 * - ops: business transformation / portal capacity journey
 * - presence: website, landing page, follow-up / branding studio
 */
import type { CtpClientType } from '@/lib/ctp-client-type';

export type CtpWelcomeEmailTrack = 'ops' | 'presence';

export function ctpWelcomeEmailTrack(clientType: CtpClientType | undefined | null): CtpWelcomeEmailTrack {
  if (clientType === 'website' || clientType === 'website_portal') return 'presence';
  return 'ops';
}

export function ctpWelcomeStudioPath(track: CtpWelcomeEmailTrack): string {
  // Presence track lands in Design Studio (progress); ops lands on CTP overview.
  return track === 'presence' ? 'ctp/progress' : 'ctp';
}

export type CtpWelcomeEmailModel = {
  firstName: string;
  businessName: string;
  contactName: string;
  capacityScore: number;
  scoreBand: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  projectTypeLabel: string;
  recommendedFee: number;
  timelineLabel: string;
  investmentLow: number;
  investmentHigh: number;
  portalUrl?: string | null;
  proposalUrl: string;
  supportEmail: string;
  /** Website + portal selected */
  includesPortal?: boolean;
  /** Journey project-scope bullets from CTP assignment */
  scopePhases?: string[];
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

function hoursBand(weekly: number): string {
  const low = Math.max(1, Math.round(weekly * 0.7));
  const high = Math.max(low, Math.round(weekly));
  return `${low}-${high} hours each week`;
}

const th = `padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6B7280;border-bottom:1px solid #E8E2D6;text-align:left;background:#FAF8F4;`;
const td = `padding:12px 14px;font-size:14px;color:#1A1A2E;border-bottom:1px solid #E8E2D6;vertical-align:top;line-height:1.5;`;
const section = `margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#1B2B4D;`;
const p = `margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.75;`;

/** Business / ops confirmation — capacity + opportunities. */
export function buildOpsWelcomeEmail(model: CtpWelcomeEmailModel): {
  subject: string;
  title: string;
  eyebrow: string;
  ctaLabel: string;
  ctaUrl: string;
  bodyHtml: string;
} {
  const first = esc(model.firstName);
  const hours = hoursBand(model.weeklyTimeRecovery);
  const opp = money(model.opportunityHigh);
  const workspaceUrl = model.portalUrl || model.proposalUrl;
  const workspaceDisplay = model.portalUrl || 'your private workspace';

  const bodyHtml = `
    <p style="${p}">Hello ${first},</p>
    <p style="${p}">Thank you for completing the Consider the Possibilities™ Assessment.</p>
    <p style="${p}">Every successful project begins with understanding where things stand today before deciding where to go next.</p>
    <p style="${p}">That's what you've just helped us do.</p>
    <p style="${p}margin-bottom:22px;">Based on what you've shared, we've started putting together a picture of your organization. While there's still more to learn, we've already uncovered several opportunities that could make your day-to-day work easier and help your organization move forward with greater confidence.</p>

    <p style="${section}">A First Look</p>
    <p style="${p}">Every business has strengths. Every business also has opportunities that are difficult to see from the inside.</p>
    <p style="${p}margin-bottom:22px;">Your assessment has helped bring some of those opportunities into focus. The information below is a starting point. As we learn more about your organization, this picture will become even clearer.</p>

    <p style="${section}">What We've Discovered So Far</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr>
        <th style="${th}">Area</th>
        <th style="${th}">What We Found</th>
        <th style="${th}">Why It Matters</th>
        <th style="${th}">What You Could Gain</th>
      </tr>
      <tr>
        <td style="${td}"><strong>Getting Time Back</strong></td>
        <td style="${td}">Many everyday tasks still rely on manual work.</td>
        <td style="${td}">Less time on routine work means more time leading your business.</td>
        <td style="${td}">${esc(hours)}</td>
      </tr>
      <tr>
        <td style="${td}"><strong>Reducing Busy Work</strong></td>
        <td style="${td}">Some processes appear to require more steps than necessary.</td>
        <td style="${td}">Simpler processes help everyone work more efficiently.</td>
        <td style="${td}">${money(Math.round(model.opportunityLow * 0.15))}/year</td>
      </tr>
      <tr>
        <td style="${td}"><strong>Helping Customers More Easily</strong></td>
        <td style="${td}">There are opportunities to make it easier for people to do business with you.</td>
        <td style="${td}">A smoother experience often leads to happier customers and more referrals.</td>
        <td style="${td}">Increased customer satisfaction</td>
      </tr>
      <tr>
        <td style="${td}"><strong>Seeing the Whole Picture</strong></td>
        <td style="${td}">Important information may be spread across different places.</td>
        <td style="${td}">Having everything in one place makes decisions easier and faster.</td>
        <td style="${td}">Better day-to-day decisions</td>
      </tr>
      <tr>
        <td style="${td}"><strong>Getting Your Tools to Work Together</strong></td>
        <td style="${td}">Some of your systems may not be working together as well as they could.</td>
        <td style="${td}">Connected systems reduce duplicate work and save time.</td>
        <td style="${td}">${money(Math.round(model.opportunityLow * 0.11))}/year</td>
      </tr>
      <tr>
        <td style="${td}"><strong>Making Growth Easier</strong></td>
        <td style="${td}">Several improvements could help your business handle more without adding more work.</td>
        <td style="${td}">Strong systems make growth much easier to manage.</td>
        <td style="${td}">Long-term scalability</td>
      </tr>
    </table>

    <p style="${section}">Where You Are Today</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><td style="${td}">Your Journey So Far</td><td style="${td}"><strong>${esc(model.scoreBand)}</strong></td></tr>
      <tr><td style="${td}">Capacity Score</td><td style="${td}"><strong>${model.capacityScore} / 100</strong></td></tr>
      <tr><td style="${td}">Time You Could Get Back</td><td style="${td}"><strong>${esc(hours)}</strong></td></tr>
      <tr><td style="${td}">Potential Annual Improvement</td><td style="${td}"><strong>${opp}</strong></td></tr>
      <tr><td style="${td}">Ready for the Next Step</td><td style="${td}"><strong>Yes</strong></td></tr>
    </table>

    <p style="${section}">A Path Designed Around Your Business</p>
    <p style="${p}">Every organization is different. The path ahead is shaped by your goals, your challenges, and the opportunities we've already identified.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr>
        <th style="${th}">Step</th>
        <th style="${th}">What We'll Build Together</th>
        <th style="${th}">Why It Matters</th>
      </tr>
      <tr><td style="${td}"><strong>Understanding Your Business</strong></td><td style="${td}">A clearer picture of how everything works today.</td><td style="${td}">So every decision is based on the right information.</td></tr>
      <tr><td style="${td}"><strong>Improving Your Online Presence</strong></td><td style="${td}">A website that tells your story clearly and guides visitors to take action.</td><td style="${td}">First impressions matter.</td></tr>
      <tr><td style="${td}"><strong>Creating Your Client Portal</strong></td><td style="${td}">A single place for clients, staff, and important information.</td><td style="${td}">Less searching. More clarity.</td></tr>
      <tr><td style="${td}"><strong>Saving Time Every Day</strong></td><td style="${td}">Systems that handle repetitive tasks for you.</td><td style="${td}">More time for the work only you can do.</td></tr>
      <tr><td style="${td}"><strong>Bringing Everything Together</strong></td><td style="${td}">Your tools, information, and workflows working as one.</td><td style="${td}">A simpler way to run your organization.</td></tr>
      <tr><td style="${td}"><strong>Preparing for Growth</strong></td><td style="${td}">A foundation that can grow with your business.</td><td style="${td}">So today's solution still works tomorrow.</td></tr>
    </table>

    <p style="${section}">Looking Ahead</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><td style="${td}">Recommended Path</td><td style="${td}"><strong>${esc(model.projectTypeLabel)}</strong></td></tr>
      <tr><td style="${td}">Time to Complete</td><td style="${td}"><strong>${esc(model.timelineLabel.replace(/^Timeline:\s*/i, '') || '3-5 weeks')}</strong></td></tr>
      <tr><td style="${td}">Investment Range</td><td style="${td}"><strong>${money(model.investmentLow)}–${money(model.investmentHigh)}</strong></td></tr>
    </table>

    <p style="${section}">Your Workspace Is Ready</p>
    <p style="${p}">We've created a private workspace where everything for your project will come together.</p>
    <p style="margin:0 0 12px;font-size:14px;color:#1B2B4D;font-weight:700;"><a href="${esc(workspaceUrl)}" style="color:#1B2B4D;text-decoration:underline;">${esc(String(workspaceDisplay))}</a></p>
    <p style="${p}">Inside, you'll be able to:</p>
    <ul style="margin:0 0 18px;padding-left:20px;font-size:14px;color:#1A1A2E;line-height:1.7;">
      <li style="margin:0 0 6px;">Explore what we've uncovered so far.</li>
      <li style="margin:0 0 6px;">Share anything else you'd like us to know.</li>
      <li style="margin:0 0 6px;">Upload your logo, photos, and documents.</li>
      <li style="margin:0 0 6px;">Watch your project take shape.</li>
      <li style="margin:0 0 6px;">Schedule a conversation when you're ready.</li>
    </ul>
    <p style="${p}margin-bottom:22px;">Think of it as the home for your project from this point forward.</p>

    <p style="${section}">What Comes Next</p>
    <p style="${p}">There's nothing you need to figure out on your own. Open your workspace, take a look around, and continue when you're ready.</p>
    <p style="${p}">With each step, the picture becomes clearer, the plan becomes more personal, and your path forward becomes easier to see.</p>
    <p style="margin:0;font-size:15px;color:#1A1A2E;line-height:1.75;">We're glad you're here — and we're ready when you are.</p>
    <p style="margin:18px 0 0;font-size:13px;color:#555;">Questions? Reply to this email or reach us at <a href="mailto:${esc(model.supportEmail)}" style="color:#1B2B4D;">${esc(model.supportEmail)}</a>.</p>
  `;

  return {
    subject: `Welcome. Let's Explore What's Possible.`,
    title: `Welcome, ${model.firstName}`,
    eyebrow: "Let's explore what becomes possible from here.",
    ctaLabel: 'Open My Workspace',
    ctaUrl: workspaceUrl,
    bodyHtml,
  };
}

const DEFAULT_PRESENCE_PHASES = [
  'Discovery & brand planning',
  'Website / page design',
  'Content development',
  'Contact & follow-up paths',
  'Testing & launch',
];

/** Website / landing / follow-up confirmation — proud-to-share creative track. */
export function buildPresenceWelcomeEmail(model: CtpWelcomeEmailModel): {
  subject: string;
  title: string;
  eyebrow: string;
  ctaLabel: string;
  ctaUrl: string;
  bodyHtml: string;
} {
  const first = esc(model.firstName);
  const studioUrl = model.portalUrl || model.proposalUrl;
  const studioDisplay = model.portalUrl || 'your private Design Studio';
  const studioLabel = model.includesPortal ? 'Personal Branding Studio' : 'Design Studio';
  const phases =
    model.scopePhases && model.scopePhases.length > 0
      ? model.scopePhases
      : DEFAULT_PRESENCE_PHASES;

  const scopeRows = phases
    .map(
      (phase) =>
        `<tr><td style="${td}">${esc(phase)}</td><td style="${td}">Included in your recommended path</td><td style="${td}">Included</td></tr>`,
    )
    .join('');

  const glancePortalRow = model.includesPortal
    ? `<tr><td style="${td}"><strong>Client Portal</strong></td><td style="${td}">A private place for clients and important information</td><td style="${td}">Gives people one place for everything they need</td></tr>`
    : '';

  const bodyHtml = `
    <p style="${p}">Hello ${first},</p>
    <p style="${p}">Thank you for sharing your project with us.</p>
    <p style="${p}">Whether you're creating a new website, a simple landing page, or an easier way for people to reach you after they meet you, you've already taken the most important step — getting started.</p>
    <p style="${p}margin-bottom:22px;">Every great digital experience begins by understanding the people behind it. Before we design pages, choose colors, or build features, we want to understand your story, your goals, and the experience you want others to have.</p>

    <p style="${section}">Where We Are Today</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><th style="${th}">Step</th><th style="${th}">Status</th></tr>
      <tr><td style="${td}">Project Received</td><td style="${td}"><strong>Complete</strong></td></tr>
      <tr><td style="${td}">Initial Review</td><td style="${td}"><strong>Complete</strong></td></tr>
      <tr><td style="${td}">Project Workspace Created</td><td style="${td}"><strong>Ready</strong></td></tr>
      <tr><td style="${td}">${esc(studioLabel)} Ready</td><td style="${td}"><strong>Ready</strong></td></tr>
    </table>

    <p style="${section}">Your Project at a Glance</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr>
        <th style="${th}">Project Area</th>
        <th style="${th}">What's Included</th>
        <th style="${th}">Why It Matters</th>
      </tr>
      <tr><td style="${td}"><strong>Brand Discovery</strong></td><td style="${td}">Understanding your business, audience, and goals</td><td style="${td}">Creates a presence that feels authentic to your organization</td></tr>
      <tr><td style="${td}"><strong>Website Experience</strong></td><td style="${td}">Pages designed around your visitors</td><td style="${td}">Helps people quickly understand what you do</td></tr>
      <tr><td style="${td}"><strong>Mobile Experience</strong></td><td style="${td}">Optimized for every device</td><td style="${td}">Most visitors will find you on a phone</td></tr>
      <tr><td style="${td}"><strong>Contact &amp; Lead Capture</strong></td><td style="${td}">Clear ways for people to reach you</td><td style="${td}">Turns visitors into conversations</td></tr>
      ${glancePortalRow}
      <tr><td style="${td}"><strong>Search Optimization</strong></td><td style="${td}">Built with search engines in mind</td><td style="${td}">Makes it easier for people to find you</td></tr>
      <tr><td style="${td}"><strong>Future Growth</strong></td><td style="${td}">Designed to grow with your organization</td><td style="${td}">Avoids rebuilding as your needs evolve</td></tr>
    </table>

    <p style="${section}">Project Scope &amp; Investment</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:12px;">
      <tr>
        <th style="${th}">Phase</th>
        <th style="${th}">What's Being Built</th>
        <th style="${th}">Estimated Investment</th>
      </tr>
      ${scopeRows}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E2D6;margin-bottom:22px;">
      <tr><td style="${td}">Estimated Timeline</td><td style="${td}"><strong>${esc(model.timelineLabel.replace(/^Timeline:\s*/i, '') || '3-5 Weeks')}</strong></td></tr>
      <tr><td style="${td}">Estimated Investment</td><td style="${td}"><strong>${money(model.investmentLow)}–${money(model.investmentHigh)}</strong></td></tr>
      <tr><td style="${td}">Recommended Path</td><td style="${td}"><strong>${esc(model.projectTypeLabel)}</strong></td></tr>
    </table>

    <p style="${section}">Your ${esc(studioLabel)} Is Ready</p>
    <p style="${p}">We've created a private workspace where your project will come together.</p>
    <p style="margin:0 0 12px;font-size:14px;color:#1B2B4D;font-weight:700;"><a href="${esc(studioUrl)}" style="color:#1B2B4D;text-decoration:underline;">${esc(String(studioDisplay))}</a></p>
    <p style="${p}">Inside, you'll be guided through a simple process that helps us understand your vision. You can:</p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#1A1A2E;line-height:1.7;">
      <li style="margin:0 0 6px;">Share your logo and brand colors</li>
      <li style="margin:0 0 6px;">Upload photos and videos</li>
      <li style="margin:0 0 6px;">Tell us about your products or services</li>
      <li style="margin:0 0 6px;">Describe your audience</li>
      <li style="margin:0 0 6px;">Share websites you admire</li>
      <li style="margin:0 0 6px;">Add features you'd like to include</li>
      <li style="margin:0 0 6px;">Upload documents or existing marketing materials</li>
    </ul>
    <p style="${p}margin-bottom:22px;">Don't worry if you don't have everything ready. If you're starting from scratch, we'll help you build your brand along the way.</p>

    <p style="${section}">What Happens Next</p>
    <p style="${p}">Once you've completed your ${esc(studioLabel)} experience, we'll use everything you've shared to begin shaping your website or digital presence.</p>
    <p style="${p}">As your project comes together, your workspace will keep you updated every step of the way. When everything is ready, we'll walk through the finished experience together before launch.</p>
    <p style="margin:0 0 8px;font-size:15px;color:#1A1A2E;line-height:1.75;"><strong>Ready to Begin?</strong> Your workspace is waiting.</p>
    <p style="margin:18px 0 0;font-size:13px;color:#555;font-style:italic;">Every great website begins with a clear story. Let's build yours.</p>
    <p style="margin:12px 0 0;font-size:13px;color:#555;">Questions? Reply to this email or reach us at <a href="mailto:${esc(model.supportEmail)}" style="color:#1B2B4D;">${esc(model.supportEmail)}</a>.</p>
  `;

  return {
    subject: 'Your Project Is Ready to Take Shape',
    title: `Let's build something you'll be proud to share.`,
    eyebrow: 'Consider The Possibilities™',
    ctaLabel: `Open My ${studioLabel}`,
    ctaUrl: studioUrl,
    bodyHtml,
  };
}
