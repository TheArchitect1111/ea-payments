/**
 * Field Demo Orchestrator — ChatGPT → live site + portal + findings + founder email.
 * Reuses EACP, portal access, website provision, CTP snapshot, Resend, Pulse.
 */
import crypto from 'node:crypto';
import { createOrUpdateClientRecord } from '@/lib/airtable';
import type { PortalConfig } from '@/lib/catalog';
import { lifecycleForProspect } from '@/lib/client-lifecycle';
import { getDefaultBrandProfile } from '@/lib/creative-studio/brand-profile';
import { saveBrandProfile } from '@/lib/creative-studio/brand-store';
import { buildCtpExecutiveSnapshot } from '@/lib/ctp-executive-snapshot';
import { publicPortalLoginUrl, publicPortalUrl } from '@/lib/ctp-portal-host';
import {
  createEACPLaunch,
  parseEACPCommand,
  validateEACPLaunchInput,
  type EACPLaunchInput,
} from '@/lib/eacp-launch';
import { sendInternalNotification } from '@/lib/email';
import { saveFieldDemoPack, type FieldDemoPack } from '@/lib/field-demo-store';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { createPortalAccess } from '@/lib/portal-access';
import { provisionWebsitePortalSite, siteUrlForSlug } from '@/lib/provision-website-portal';
import { emitPulseEvent } from '@/lib/pulse-bus';

const EA_PORTAL_CONFIG: PortalConfig = {
  platform: 'efficiency-architects',
  loginPath: '/portal/login',
};

const FIELD_DEMO_OFFER = 'website_portal_starter';
const FIELD_DEMO_PACKAGE = 'Implementation Package' as const;

export type FieldDemoInput = Partial<EACPLaunchInput> & {
  command?: string;
  contactEmail?: string;
};

export type FieldDemoResult = {
  ok: boolean;
  slug?: string;
  pack?: FieldDemoPack;
  errors: string[];
  message: string;
};

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(/\/$/, '');
}

function plannedSlug(client: string): string {
  const base = client
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  const suffix = crypto.randomBytes(2).toString('hex');
  return `fd-${base || 'client'}-${suffix}`;
}

function fieldDemoEmail(client: string, contactEmail?: string): string {
  const provided = contactEmail?.trim().toLowerCase();
  if (provided && provided.includes('@') && !provided.endsWith('@example.com')) {
    return provided;
  }
  const local = client
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
  return `field-demo+${local || 'client'}@efficiencyarchitects.online`;
}

function talkingPoints(input: EACPLaunchInput, siteUrl: string): string {
  return [
    `${input.client} can see a working starter website now at ${siteUrl}.`,
    `Goal we captured: ${input.goal}.`,
    `Recommended path: ${input.deliverable}.`,
    'Next we tune brand, offer, and portal modules so this becomes their operating system — not just a brochure.',
  ].join(' ');
}

function syntheticAnalysis(notes?: string) {
  const friction =
    notes?.toLowerCase().includes('no website') || notes?.toLowerCase().includes('facebook')
      ? 62
      : 48;
  return {
    capacityScore: friction,
    scoreBand: (friction >= 60 ? 'strained' : 'healthy') as 'strained' | 'healthy',
    primaryConstraint: 'Visibility and follow-through',
    weeklyTimeRecovery: Math.round(6 + friction / 10),
    opportunityLow: 18000 + friction * 400,
    opportunityHigh: 42000 + friction * 900,
  };
}

export function resolveFieldDemoInput(body: FieldDemoInput): {
  input?: EACPLaunchInput;
  contactEmail?: string;
  missing: string[];
  correction?: string;
} {
  const commandInput = body.command ? parseEACPCommand(body.command) : {};
  const merged: Partial<EACPLaunchInput> = {
    ...commandInput,
    client: body.client ?? commandInput.client,
    goal: body.goal ?? commandInput.goal,
    deliverable: body.deliverable ?? commandInput.deliverable ?? 'Website + Portal',
    industry: body.industry ?? commandInput.industry,
    notes: body.notes ?? commandInput.notes,
  };

  if (!merged.client?.trim() || !merged.goal?.trim()) {
    const missing = validateEACPLaunchInput({
      ...merged,
      deliverable: merged.deliverable || 'Website + Portal',
    }).filter((field) => field === 'client' || field === 'goal');
    return {
      missing: missing.length ? missing : ['client', 'goal'],
      correction: 'Provide client and goal (deliverable defaults to Website + Portal).',
    };
  }

  return {
    input: {
      client: merged.client.trim(),
      goal: merged.goal.trim(),
      deliverable: (merged.deliverable || 'Website + Portal').trim(),
      industry: merged.industry?.trim() || undefined,
      notes: merged.notes?.trim() || undefined,
    },
    contactEmail: body.contactEmail?.trim(),
    missing: [],
  };
}

export async function runFieldDemo(body: FieldDemoInput): Promise<FieldDemoResult> {
  const errors: string[] = [];
  const resolved = resolveFieldDemoInput(body);
  if (!resolved.input) {
    return {
      ok: false,
      errors: resolved.missing,
      message: resolved.correction || 'Missing required field-demo fields.',
    };
  }

  const input = resolved.input;
  let slug = plannedSlug(input.client);
  const email = fieldDemoEmail(input.client, resolved.contactEmail);
  const tagline =
    input.notes?.split(/[.!\n]/).map((s) => s.trim()).find(Boolean) ||
    `${input.goal} — with a clear next step.`;

  let launchId: string | undefined;
  let launchReviewUrl: string | undefined;
  let organizationId: string | undefined;
  let portalLoginUrl = publicPortalLoginUrl();
  let siteUrl = siteUrlForSlug(slug);
  let tempCredentials: string | undefined;
  let clientRecordId: string | undefined;

  try {
    const launch = await createEACPLaunch(input);
    launchId = launch.id;
    launchReviewUrl = `${baseUrl()}${launch.links.reviewPackage}`;
  } catch (err) {
    errors.push(`EACP launch: ${err instanceof Error ? err.message : 'failed'}`);
  }

  try {
    const clientResult = await createOrUpdateClientRecord({
      clientName: input.client,
      organization: input.client,
      email,
      packagePurchased: FIELD_DEMO_PACKAGE,
      commerceOfferId: FIELD_DEMO_OFFER,
      amountPaid: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      stripeTransactionId: `field-demo-${slug}`,
      portalAccessStatus: 'Pending',
      onboardingStatus: 'Not Started',
      lifecycle: {
        ...lifecycleForProspect(),
        lifecycleStage: 'Discovery',
        discoveryStatus: 'Completed',
      },
    });
    if (!clientResult.ok || !clientResult.recordId) {
      errors.push(`Client record: ${clientResult.error || 'failed'}`);
    } else {
      clientRecordId = clientResult.recordId;
    }
  } catch (err) {
    errors.push(`Client record: ${err instanceof Error ? err.message : 'failed'}`);
  }

  if (clientRecordId) {
    try {
      const portalResult = await createPortalAccess(
        {
          clientName: input.client,
          email,
          organization: input.client,
          airtableRecordId: clientRecordId,
        },
        EA_PORTAL_CONFIG,
      );
      if (!portalResult.ok || !portalResult.slug) {
        errors.push(`Portal: ${portalResult.error || 'failed'}`);
      } else {
        slug = portalResult.slug;
        siteUrl = siteUrlForSlug(slug);
        if (portalResult.portalLoginUrl) portalLoginUrl = portalResult.portalLoginUrl;
        if (portalResult.username && portalResult.tempPassword) {
          tempCredentials = `Email: ${portalResult.username} · Temp password: ${portalResult.tempPassword}`;
        }
      }
    } catch (err) {
      errors.push(`Portal: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  try {
    const { orgId } = await ensureOrganizationForPortal({
      portalSlug: slug,
      name: input.client,
      clientRecordId,
      organizationName: input.client,
    });
    organizationId = orgId;
    if (!orgId.startsWith('org_')) {
      await ensurePackageEntitlements({
        orgId,
        packagePurchased: FIELD_DEMO_PACKAGE,
        commerceOfferId: FIELD_DEMO_OFFER,
        slug,
      });
    }
  } catch (err) {
    errors.push(`Organization: ${err instanceof Error ? err.message : 'failed'}`);
  }

  if (organizationId) {
    try {
      const baseBrand = getDefaultBrandProfile(organizationId);
      await saveBrandProfile({
        ...baseBrand,
        organizationId,
        organizationName: input.client,
        missionStatement: tagline,
        audience: input.industry
          ? `${input.industry} leaders and clients`
          : baseBrand.audience,
        preferredHeadlines: [input.goal, ...(baseBrand.preferredHeadlines ?? [])].slice(0, 4),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      errors.push(`Brand profile: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  try {
    const site = await provisionWebsitePortalSite({
      portalSlug: slug,
      businessName: input.client,
      organizationName: input.client,
      organizationId:
        organizationId && !organizationId.startsWith('org_') ? organizationId : undefined,
      tagline,
      industry: input.industry,
      email,
      force: true,
    });
    if (!site.ok) {
      errors.push(`Website: ${site.error || 'failed'}`);
    } else if (site.siteUrl) {
      siteUrl = site.siteUrl;
    }
  } catch (err) {
    errors.push(`Website: ${err instanceof Error ? err.message : 'failed'}`);
  }

  const analysis = syntheticAnalysis(input.notes);
  const snapshot = buildCtpExecutiveSnapshot({
    businessName: input.client,
    clientType: 'website_portal',
    analysis,
    projectTypeLabel: input.deliverable,
    recommendedFee: 7500,
    operationalChallenges: ['inconsistent_follow_up', 'no_centralized_reporting'],
    recommendations: [
      'Launch a clear offer page with one primary CTA',
      'Route inquiries into a client portal workspace',
    ],
  });

  const reportUrl = `${baseUrl()}/demo/${encodeURIComponent(slug)}/report`;
  const portalUrl = publicPortalUrl(slug);
  const points = talkingPoints(input, siteUrl);

  const pack: FieldDemoPack = {
    version: 1,
    slug,
    client: input.client,
    industry: input.industry,
    goal: input.goal,
    deliverable: input.deliverable,
    notes: input.notes,
    siteUrl,
    portalLoginUrl,
    portalUrl,
    reportUrl,
    launchId,
    launchReviewUrl,
    organizationId,
    talkingPoints: points,
    snapshot,
    source: 'field-demo',
    createdAt: new Date().toISOString(),
    errors: [...errors],
  };

  try {
    const saved = await saveFieldDemoPack(pack);
    if (!saved.ok) errors.push(`Pack store: ${saved.error || 'failed'}`);
  } catch (err) {
    errors.push(`Pack store: ${err instanceof Error ? err.message : 'failed'}`);
  }

  const emailBody = [
    `Client: ${input.client}`,
    input.industry ? `Industry: ${input.industry}` : null,
    `Goal: ${input.goal}`,
    `Deliverable: ${input.deliverable}`,
    '',
    'SHOW THE CLIENT',
    `1) Website: ${siteUrl}`,
    `2) Findings report: ${reportUrl}`,
    `3) Portal: ${portalUrl}`,
    `   Login: ${portalLoginUrl}`,
    tempCredentials ? `   ${tempCredentials}` : null,
    '',
    'WHAT TO SAY',
    points,
    '',
    launchReviewUrl ? `EACP launch review: ${launchReviewUrl}` : null,
    errors.length ? `Warnings: ${errors.join(' | ')}` : 'All core steps completed.',
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    await sendInternalNotification({
      subject: `Field demo ready — ${input.client}`,
      title: `Field demo: ${input.client}`,
      body: emailBody,
    });
  } catch (err) {
    errors.push(`Notify: ${err instanceof Error ? err.message : 'failed'}`);
  }

  try {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.website.live',
      title: `Field demo ready — ${input.client}`,
      detail: siteUrl,
      priority: 'high',
      href: reportUrl,
      tenantId: slug,
      objectId: launchId || slug,
      metadata: {
        source: 'field-demo',
        siteUrl,
        reportUrl,
        launchId: launchId || '',
      },
    });
  } catch {
    // non-blocking
  }

  pack.errors = [...errors];
  const websiteFailed = errors.some((e) => e.startsWith('Website:'));
  const hasShowableLinks = Boolean(pack.siteUrl && pack.reportUrl && pack.portalUrl);
  const ok = hasShowableLinks && !websiteFailed;

  return {
    ok,
    slug,
    pack,
    errors,
    message: ok
      ? `Field demo ready for ${input.client}. Check your email for the show pack.`
      : `Field demo partial for ${input.client}. See errors and any links returned.`,
  };
}
