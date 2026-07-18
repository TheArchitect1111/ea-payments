/**
 * Pure Discovery derivation — Research artifacts → Discovery artifact drafts.
 * No web requests, no external APIs, no AI summarization.
 */

import { DISCOVERY_ARTIFACT_KINDS, listResearchArtifacts } from '../factory-artifact.mjs';

export { DISCOVERY_ARTIFACT_KINDS };

function byKind(researchArtifacts, kind) {
  return researchArtifacts.filter((item) => item.kind === kind);
}

function first(researchArtifacts, kind) {
  return byKind(researchArtifacts, kind)[0] || null;
}

function idsOf(artifacts) {
  return artifacts.map((item) => item.id).filter(Boolean);
}

function textBlob(researchArtifacts) {
  const parts = [];
  for (const art of researchArtifacts) {
    const data = art.data || {};
    if (typeof data.notes === 'string') parts.push(data.notes);
    if (typeof data.goal === 'string') parts.push(data.goal);
    if (typeof data.textPreview === 'string') parts.push(data.textPreview);
    if (typeof data.description === 'string') parts.push(data.description);
    if (data.extracted?.description) parts.push(String(data.extracted.description));
    if (data.extracted?.title) parts.push(String(data.extracted.title));
    if (typeof data.organizationName === 'string') parts.push(data.organizationName);
  }
  return parts.join(' \n ').toLowerCase();
}

function keywordHits(blob, keywords) {
  return keywords.filter((keyword) => blob.includes(keyword.toLowerCase()));
}

function clampConfidence(value) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

/**
 * Build a structured recommendation object.
 */
export function createRecommendation({
  id,
  title,
  category,
  summary,
  evidence,
  confidence,
  priority = 'medium',
}) {
  return {
    id,
    title,
    category,
    summary,
    evidence: (evidence || []).map((item) => ({
      artifactId: item.artifactId,
      kind: item.kind,
      field: item.field || null,
      excerpt: item.excerpt ? String(item.excerpt).slice(0, 280) : null,
    })),
    confidence: clampConfidence(confidence),
    priority,
  };
}

function baseProvenance(sourceArtifactIds, seedClient, intakeOutputId, notes) {
  return {
    capabilityId: 'discovery',
    sourceType: 'research_artifacts',
    sourceArtifactIds: [...sourceArtifactIds],
    seedClient,
    intakeOutputId,
    notes,
  };
}

/**
 * Derive all discovery artifact drafts from research artifacts only.
 * @returns {Array<{ kind: string, providerId: string, provenance: object, data: object }>}
 */
export function deriveDiscoveryDrafts(researchArtifacts, options = {}) {
  const research = listResearchArtifacts(researchArtifacts || []);
  if (research.length === 0) {
    return [];
  }

  const seedClient = options.seedClient || first(research, 'organization')?.data?.client || null;
  const intakeOutputId = options.intakeOutputId;
  const org = first(research, 'organization');
  const website = first(research, 'website');
  const metadata = first(research, 'metadata');
  const documents = byKind(research, 'document');
  const branding = byKind(research, 'branding');
  const blob = textBlob(research);

  const allIds = idsOf(research);
  const orgIds = idsOf([org, website, metadata].filter(Boolean));
  const contentIds = idsOf([website, ...documents, ...branding].filter(Boolean));

  const drafts = [];

  // 1. Organization Profile
  {
    const sourceIds = orgIds.length ? orgIds : allIds.slice(0, 3);
    drafts.push({
      kind: 'organization_profile',
      providerId: 'discovery',
      provenance: baseProvenance(sourceIds, seedClient, intakeOutputId, 'Derived from research org/website/metadata'),
      data: {
        name: org?.data?.organizationName || org?.data?.client || seedClient,
        goal: org?.data?.goal || null,
        deliverable: org?.data?.deliverable || null,
        industry: org?.data?.industry || null,
        primaryUrl: org?.data?.primaryUrl || website?.data?.url || null,
        websiteTitle: website?.data?.extracted?.title || null,
        websiteDescription: website?.data?.extracted?.description || null,
        source: metadata?.data?.source || null,
        primarySourceType: metadata?.data?.primarySourceType || null,
      },
    });
  }

  // 2. Programs
  {
    const programKeywords = keywordHits(blob, [
      'program',
      'programs',
      'club',
      'training',
      'course',
      'curriculum',
      'initiative',
      'camp',
    ]);
    const sourceIds = idsOf([org, website, ...documents].filter(Boolean));
    const items = programKeywords.map((keyword) => ({
      label: keyword,
      signal: 'keyword',
      confidence: clampConfidence(0.45 + programKeywords.length * 0.05),
    }));
    if (org?.data?.goal) {
      items.push({
        label: org.data.goal,
        signal: 'organization.goal',
        confidence: 0.55,
      });
    }
    drafts.push({
      kind: 'programs',
      providerId: 'discovery',
      provenance: baseProvenance(sourceIds.length ? sourceIds : allIds, seedClient, intakeOutputId),
      data: {
        items: items.slice(0, 12),
        count: items.length,
        notes:
          items.length === 0
            ? 'No explicit program signals in research artifacts'
            : 'Heuristic program signals from research text fields',
      },
    });
  }

  // 3. Services
  {
    const serviceKeywords = keywordHits(blob, [
      'service',
      'services',
      'support',
      'consulting',
      'portal',
      'membership',
      'coaching',
    ]);
    const sourceIds = idsOf([org, website, ...documents].filter(Boolean));
    const items = serviceKeywords.map((keyword) => ({
      label: keyword,
      signal: 'keyword',
      confidence: clampConfidence(0.4 + serviceKeywords.length * 0.05),
    }));
    if (org?.data?.deliverable) {
      items.push({
        label: String(org.data.deliverable),
        signal: 'organization.deliverable',
        confidence: 0.6,
      });
    }
    drafts.push({
      kind: 'services',
      providerId: 'discovery',
      provenance: baseProvenance(sourceIds.length ? sourceIds : allIds, seedClient, intakeOutputId),
      data: {
        items: items.slice(0, 12),
        count: items.length,
      },
    });
  }

  // 4. Audience Segments
  {
    const audienceKeywords = keywordHits(blob, [
      'youth',
      'student',
      'students',
      'parent',
      'parents',
      'member',
      'members',
      'staff',
      'volunteer',
      'community',
      'client',
      'customers',
    ]);
    const sourceIds = idsOf([org, website, metadata].filter(Boolean));
    const segments = audienceKeywords.map((keyword) => ({
      segment: keyword,
      confidence: clampConfidence(0.5 + (audienceKeywords.length > 2 ? 0.1 : 0)),
      evidenceField: 'research_text',
    }));
    if (segments.length === 0 && org?.data?.industry) {
      segments.push({
        segment: `${org.data.industry} stakeholders`,
        confidence: 0.35,
        evidenceField: 'organization.industry',
      });
    }
    drafts.push({
      kind: 'audience_segments',
      providerId: 'discovery',
      provenance: baseProvenance(sourceIds.length ? sourceIds : allIds, seedClient, intakeOutputId),
      data: { segments, count: segments.length },
    });
  }

  // 5. Content Inventory
  {
    const entries = [];
    if (website) {
      entries.push({
        type: 'website_page',
        title: website.data?.extracted?.title || website.data?.url || 'Website',
        url: website.data?.url || null,
        sourceArtifactId: website.id,
      });
      if (website.data?.extracted?.ogImage) {
        entries.push({
          type: 'og_image',
          title: 'Open Graph image',
          url: website.data.extracted.ogImage,
          sourceArtifactId: website.id,
        });
      }
    }
    for (const doc of documents) {
      entries.push({
        type: 'document',
        title: doc.data?.name || doc.provenance?.sourceName || 'Document',
        url: doc.data?.url || null,
        documentType: doc.data?.type || null,
        sourceArtifactId: doc.id,
      });
    }
    for (const brand of branding) {
      entries.push({
        type: brand.data?.assetType === 'image' ? 'brand_image' : 'brand_signal',
        title: brand.data?.name || brand.data?.brandName || 'Branding',
        url: brand.data?.url || brand.data?.faviconGuess || null,
        sourceArtifactId: brand.id,
      });
    }
    drafts.push({
      kind: 'content_inventory',
      providerId: 'discovery',
      provenance: baseProvenance(contentIds.length ? contentIds : allIds, seedClient, intakeOutputId),
      data: { entries, count: entries.length },
    });
  }

  // 6. Technology Stack (honest heuristics only — no probing)
  {
    const stack = [];
    if (website?.data?.ok) {
      stack.push({
        name: 'Public website',
        category: 'web',
        confidence: 0.7,
        evidenceArtifactId: website.id,
      });
      if (website.data?.contentType?.includes('text/html')) {
        stack.push({
          name: 'HTML document',
          category: 'markup',
          confidence: 0.65,
          evidenceArtifactId: website.id,
        });
      }
    } else if (website) {
      stack.push({
        name: 'Website unreachable at research time',
        category: 'web',
        confidence: 0.4,
        evidenceArtifactId: website.id,
      });
    }
    if (documents.some((d) => d.data?.type === 'pdf')) {
      const pdf = documents.find((d) => d.data?.type === 'pdf');
      stack.push({
        name: 'PDF documents in intake',
        category: 'content',
        confidence: 0.75,
        evidenceArtifactId: pdf.id,
      });
    }
    drafts.push({
      kind: 'technology_stack',
      providerId: 'discovery',
      provenance: baseProvenance(
        idsOf([website, ...documents].filter(Boolean)).length
          ? idsOf([website, ...documents].filter(Boolean))
          : allIds,
        seedClient,
        intakeOutputId,
        'No external tech fingerprinting — research artifacts only',
      ),
      data: {
        items: stack,
        count: stack.length,
        limited: true,
      },
    });
  }

  // 7. Learning Opportunities
  {
    const learningKeywords = keywordHits(blob, [
      'learn',
      'learning',
      'training',
      'education',
      'course',
      'workshop',
      'onboarding',
      'certification',
    ]);
    const sourceIds = idsOf([org, ...documents, website].filter(Boolean));
    const opportunities = learningKeywords.map((keyword) => ({
      label: keyword,
      confidence: 0.5,
    }));
    if (org?.data?.deliverable && String(org.data.deliverable).toLowerCase().includes('portal')) {
      opportunities.push({
        label: 'Portal-based learning / knowledge delivery',
        confidence: 0.55,
        signal: 'deliverable',
      });
    }
    if (opportunities.length === 0) {
      opportunities.push({
        label: 'Capture institutional knowledge into structured learning paths',
        confidence: 0.3,
        signal: 'default',
      });
    }
    drafts.push({
      kind: 'learning_opportunities',
      providerId: 'discovery',
      provenance: baseProvenance(sourceIds.length ? sourceIds : allIds, seedClient, intakeOutputId),
      data: { opportunities: opportunities.slice(0, 10), count: opportunities.length },
    });
  }

  // 8. Accessibility Findings (evidence-limited — no page audit)
  {
    const findings = [];
    if (website?.data?.ok && website.data?.extracted) {
      if (!website.data.extracted.description) {
        findings.push({
          code: 'missing_meta_description',
          severity: 'low',
          summary: 'Website research did not find a meta description',
          confidence: 0.55,
          evidenceArtifactId: website.id,
        });
      }
      if (!website.data.extracted.title) {
        findings.push({
          code: 'missing_title',
          severity: 'medium',
          summary: 'Website research did not find a document title',
          confidence: 0.6,
          evidenceArtifactId: website.id,
        });
      }
      findings.push({
        code: 'full_audit_not_performed',
        severity: 'info',
        summary: 'Discovery did not run an accessibility crawl — findings limited to research metadata',
        confidence: 1,
        evidenceArtifactId: website.id,
      });
    } else {
      findings.push({
        code: 'no_website_artifact',
        severity: 'info',
        summary: 'No successful website research artifact — accessibility signals unavailable',
        confidence: 0.8,
        evidenceArtifactId: website?.id || org?.id || allIds[0],
      });
    }
    drafts.push({
      kind: 'accessibility_findings',
      providerId: 'discovery',
      provenance: baseProvenance(
        idsOf([website, org].filter(Boolean)).length
          ? idsOf([website, org].filter(Boolean))
          : allIds,
        seedClient,
        intakeOutputId,
      ),
      data: { findings, count: findings.length },
    });
  }

  // 9. Automation Opportunities
  {
    const opportunities = [];
    if (documents.length > 0) {
      opportunities.push({
        label: 'Automate document intake → structured knowledge records',
        confidence: 0.6,
        evidenceArtifactIds: idsOf(documents),
      });
    }
    if (website?.data?.ok) {
      opportunities.push({
        label: 'Monitor public website metadata for content drift',
        confidence: 0.5,
        evidenceArtifactIds: [website.id],
      });
    }
    if (org?.data?.goal) {
      opportunities.push({
        label: 'Track goal-aligned portal workflows from launch brief',
        confidence: 0.45,
        evidenceArtifactIds: idsOf([org].filter(Boolean)),
      });
    }
    if (opportunities.length === 0) {
      opportunities.push({
        label: 'Establish repeatable research→discovery refresh pipeline',
        confidence: 0.35,
        evidenceArtifactIds: allIds.slice(0, 2),
      });
    }
    drafts.push({
      kind: 'automation_opportunities',
      providerId: 'discovery',
      provenance: baseProvenance(allIds, seedClient, intakeOutputId),
      data: { opportunities, count: opportunities.length },
    });
  }

  // 10. Recommendations (structured + evidence + confidence)
  {
    const recommendations = [];
    const profileSources = orgIds.length ? orgIds : allIds.slice(0, 2);

    recommendations.push(
      createRecommendation({
        id: 'rec-org-profile-baseline',
        title: 'Lock organization profile as planning source of truth',
        category: 'organization',
        summary:
          'Use the discovered organization profile (name, goal, deliverable, primary URL) as the baseline for planning.',
        evidence: profileSources.map((artifactId) => {
          const art = research.find((item) => item.id === artifactId);
          return {
            artifactId,
            kind: art?.kind || 'unknown',
            field: art?.kind === 'organization' ? 'organizationName' : art?.kind,
            excerpt:
              art?.data?.organizationName ||
              art?.data?.extracted?.title ||
              art?.data?.client ||
              null,
          };
        }),
        confidence: org ? 0.75 : 0.45,
        priority: 'high',
      }),
    );

    if (website?.data?.ok) {
      recommendations.push(
        createRecommendation({
          id: 'rec-website-content-map',
          title: 'Map public website content into portal information architecture',
          category: 'content',
          summary:
            'Website title/description from research should seed the content inventory and IA for the deliverable.',
          evidence: [
            {
              artifactId: website.id,
              kind: 'website',
              field: 'extracted.title',
              excerpt: website.data?.extracted?.title || website.data?.url,
            },
          ],
          confidence: 0.7,
          priority: 'high',
        }),
      );
    } else if (documents.length > 0) {
      recommendations.push(
        createRecommendation({
          id: 'rec-document-first',
          title: 'Treat uploaded documents as primary discovery corpus',
          category: 'content',
          summary:
            'No successful website research artifact — prioritize document artifacts for planning inputs.',
          evidence: documents.slice(0, 3).map((doc) => ({
            artifactId: doc.id,
            kind: 'document',
            field: 'name',
            excerpt: doc.data?.name || doc.data?.textPreview,
          })),
          confidence: 0.72,
          priority: 'high',
        }),
      );
    }

    if (branding.length > 0) {
      recommendations.push(
        createRecommendation({
          id: 'rec-brand-assets',
          title: 'Carry branding artifacts into visual system constraints',
          category: 'branding',
          summary: 'Image/brand signals from research should constrain later production styling.',
          evidence: branding.slice(0, 3).map((b) => ({
            artifactId: b.id,
            kind: 'branding',
            field: 'brandName',
            excerpt: b.data?.brandName || b.data?.name || null,
          })),
          confidence: 0.65,
          priority: 'medium',
        }),
      );
    }

    recommendations.push(
      createRecommendation({
        id: 'rec-accessibility-followup',
        title: 'Schedule accessibility audit in a later phase',
        category: 'accessibility',
        summary:
          'Discovery only inspected research metadata — a dedicated accessibility pass is still required before publish.',
        evidence: [
          {
            artifactId: website?.id || allIds[0],
            kind: website?.kind || research[0].kind,
            field: 'research_coverage',
            excerpt: 'full_audit_not_performed',
          },
        ],
        confidence: 0.9,
        priority: 'medium',
      }),
    );

    drafts.push({
      kind: 'recommendations',
      providerId: 'discovery',
      provenance: baseProvenance(allIds, seedClient, intakeOutputId, 'Structured recommendations with evidence'),
      data: {
        recommendations,
        count: recommendations.length,
      },
    });
  }

  return drafts;
}

/** Validate every discovery draft has non-empty sourceArtifactIds. */
export function validateDiscoveryDraftLineage(drafts) {
  const errors = [];
  for (const draft of drafts || []) {
    const ids = draft.provenance?.sourceArtifactIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      errors.push(`${draft.kind} missing sourceArtifactIds`);
    }
    if (draft.provenance?.capabilityId !== 'discovery') {
      errors.push(`${draft.kind} capabilityId must be discovery`);
    }
  }
  return { ok: errors.length === 0, errors };
}
