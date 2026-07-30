import { NextRequest, NextResponse } from 'next/server';
import { appendArtifacts } from '@/lib/factory-artifact';
import { createFactoryProject } from '@/lib/factory-project';
import { getFactoryProject } from '@/lib/factory-project-store';
import { workerHealthCheck, getWorkerClientConfig } from '@/lib/uxg/research/client';
import { runUxgResearchPipeline } from '@/lib/uxg/research/pipeline';
import { resolveUxgResearchProviderId } from '@/lib/uxg/research/select-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Preview-only Crawl4AI smoke: health + authenticated worker crawl + pack persist.
 * Auth: Bearer PREVIEW_RECOVER_TOKEN (or admin session). Never available in Production.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 404 });
  }

  const recoverToken = (process.env.PREVIEW_RECOVER_TOKEN || '').trim();
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const tokenOk = Boolean(recoverToken && bearer && bearer === recoverToken);

  let adminOk = false;
  if (!tokenOk) {
    const { cookies } = await import('next/headers');
    const { requireAdminAction } = await import('@/lib/admin-session-guard');
    const { EA_ADMIN_COOKIE } = await import('@/lib/ea-admin-auth');
    const cookieStore = await cookies();
    const admin = requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:access');
    adminOk = admin.ok === true;
  }

  if (!tokenOk && !adminOk) {
    if (!recoverToken) {
      return NextResponse.json(
        { error: 'Preview recover auth is not configured (PREVIEW_RECOVER_TOKEN).' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: {
    client?: string;
    url?: string;
    notes?: string;
    goal?: string;
    deliverable?: string;
    forceNew?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const client = String(body.client || '').trim();
  const url = String(body.url || '').trim();
  if (!client || !url) {
    return NextResponse.json({ error: 'client and url are required.' }, { status: 400 });
  }

  const workerConfig = getWorkerClientConfig();
  const providerId = resolveUxgResearchProviderId(process.env);
  const workerHost = (() => {
    try {
      return workerConfig ? new URL(workerConfig.baseUrl).host : null;
    } catch {
      return null;
    }
  })();

  const healthOk = workerConfig ? await workerHealthCheck(workerConfig) : false;
  if (!workerConfig || !healthOk) {
    return NextResponse.json(
      {
        ok: false,
        stage: 'worker_health',
        providerId,
        workerConfigured: Boolean(workerConfig),
        workerHost,
        healthOk,
        error: 'Worker not configured or /health failed',
      },
      { status: 503 },
    );
  }

  const created = await createFactoryProject({
    client,
    companyName: client,
    url,
    website: url,
    notes: body.notes || undefined,
    goal: body.goal || 'Website + portal',
    deliverable: body.deliverable || 'website',
    source: 'admin',
  });
  if (!created.ok) {
    return NextResponse.json(
      { ok: false, stage: 'create_project', error: 'Failed to create project', missing: created.missing },
      { status: 400 },
    );
  }

  const project = created.project;
  const result = await runUxgResearchPipeline(project, {
    knownUrls: [url],
  });

  const now = new Date().toISOString();
  const drafts = [];
  if (result.crawl) {
    drafts.push({
      kind: 'research_crawl_result' as const,
      providerId: 'uxg-deep-crawl',
      data: result.crawl as unknown as Record<string, unknown>,
      provenance: {
        capabilityId: 'research' as const,
        sourceType: 'uxg-deep-crawl',
        collectedAt: now,
        notes: `provider=${result.providerId} completeness=${result.completeness}`,
      },
    });
  }
  if (result.knowledge) {
    drafts.push({
      kind: 'subject_knowledge_pack' as const,
      providerId: 'uxg-deep-crawl',
      data: result.knowledge as unknown as Record<string, unknown>,
      provenance: {
        capabilityId: 'research' as const,
        sourceType: 'uxg-deep-crawl',
        collectedAt: now,
        notes: result.knowledge.verifiedIdentity.reason,
      },
    });
  }
  if (result.media) {
    drafts.push({
      kind: 'media_brand_pack' as const,
      providerId: 'uxg-deep-crawl',
      data: result.media as unknown as Record<string, unknown>,
      provenance: {
        capabilityId: 'research' as const,
        sourceType: 'uxg-deep-crawl',
        collectedAt: now,
        notes: `${result.media.assets.length} assets`,
      },
    });
  }
  if (drafts.length) {
    await appendArtifacts(project.id, drafts);
  }

  const saved = await getFactoryProject(project.id);
  const artifactKinds = (saved?.context?.artifacts || []).map((a) => a.kind);
  const crawl = result.crawl;
  const logos = (crawl?.brandAssets || []).filter((b) =>
    ['logo', 'favicon', 'app_icon'].includes(b.kind),
  );
  const brandColors = (crawl?.brandAssets || []).filter((b) => b.kind === 'color');
  const brandFonts = (crawl?.brandAssets || []).filter((b) => b.kind === 'font');
  const brandLanguage = (crawl?.brandAssets || []).filter((b) => b.kind === 'brand_language');
  const media = (crawl?.mediaAssets || []).filter((m) => !m.rejected);
  const docs = crawl?.documents || [];

  return NextResponse.json({
    ok: result.ok && !result.skipped && Boolean(result.crawl),
    stage: 'crawl_complete',
    previewOnly: true,
    projectId: project.id,
    providerId: result.providerId,
    skipped: result.skipped,
    reason: result.reason || null,
    worker: {
      host: workerHost,
      healthOk,
      used:
        result.providerId === 'crawl4ai' &&
        !result.skipped &&
        Boolean(result.crawl) &&
        Boolean(crawl?.job),
      expectedHost: 'ea-uxg-research-worker-preview.onrender.com',
      hostMatch: workerHost === 'ea-uxg-research-worker-preview.onrender.com',
    },
    identity: crawl?.identity
      ? {
          canonicalName: crawl.identity.canonicalName,
          entityType: crawl.identity.entityType,
          officialDomains: crawl.identity.officialDomains,
          identityStatus: crawl.identity.identityStatus,
          identityVerified: crawl.identity.identityVerified,
          employerAffiliated: crawl.identity.employerAffiliated,
          employerDomain: crawl.identity.employerDomain,
          rejectedDomains: crawl.identity.rejectedDomains?.slice(0, 12) || [],
        }
      : null,
    job: crawl?.job || null,
    diagnostics: crawl?.diagnostics
      ? {
          pagesFetched: crawl.diagnostics.pagesFetched,
          errors: (crawl.diagnostics.errors || []).slice(0, 5),
          warnings: (crawl.diagnostics.warnings || []).slice(0, 5),
        }
      : null,
    completeness: result.completeness,
    completenessPass: result.completenessPass,
    evidence: {
      count: crawl?.evidence?.length || 0,
      samples: (crawl?.evidence || []).slice(0, 8).map((e) => ({
        claim: e.claim.slice(0, 180),
        category: e.category,
        sourceUrl: e.sourceUrl,
        confidence: e.confidence,
      })),
    },
    brand: {
      logos: logos.map((l) => ({
        kind: l.kind,
        value: l.value,
        sourceUrl: l.sourceUrl,
        ownership: l.ownership,
        licenseEvidence: l.licenseEvidence || null,
      })),
      colors: brandColors.slice(0, 12).map((c) => c.value),
      fonts: brandFonts.slice(0, 8).map((f) => f.value),
      brandLanguage: brandLanguage.slice(0, 6).map((b) => b.value.slice(0, 120)),
    },
    media: {
      count: media.length,
      samples: media.slice(0, 10).map((m) => ({
        originalUrl: m.originalUrl,
        pageUrl: m.pageUrl,
        relevanceCategory: m.relevanceCategory,
        ownership: m.ownership,
        licenseEvidence: m.licenseEvidence || null,
        durableUrl: m.durableUrl || null,
      })),
    },
    documents: {
      count: docs.length,
      samples: docs.slice(0, 8).map((d) => ({
        url: d.url,
        title: d.title || null,
        kind: d.kind || null,
      })),
    },
    packs: {
      knowledgePersisted: artifactKinds.includes('subject_knowledge_pack'),
      mediaPersisted: artifactKinds.includes('media_brand_pack'),
      crawlPersisted: artifactKinds.includes('research_crawl_result'),
      artifactKinds,
      knowledgeFacts: result.knowledge
        ? {
            identity: result.knowledge.verifiedIdentity,
            claimCount: result.knowledge.claims?.length || 0,
            claimSamples: (result.knowledge.claims || []).slice(0, 8).map((f) => ({
              text: String(f.text || '').slice(0, 160),
              category: f.category || null,
            })),
            organizations: (result.knowledge.organizations || []).slice(0, 8),
            currentWork: (result.knowledge.currentWork || []).slice(0, 6),
            biography: (result.knowledge.biography || '').slice(0, 240),
          }
        : null,
      mediaPack: result.media
        ? {
            assetCount: result.media.assets.length,
            colors: (result.media.colors || []).slice(0, 10),
            typographyClues: (result.media.typographyClues || []).slice(0, 8),
            brandPatterns: (result.media.brandPatterns || []).slice(0, 8),
            rightsSummary: result.media.assets.slice(0, 8).map((a) => ({
              kind: a.kind,
              rightsStatus: a.rightsStatus,
              licenseClass: a.licenseClass || null,
              previewEligible: a.previewEligible,
              publicationEligible: a.publicationEligible,
            })),
          }
        : null,
    },
  });
}
