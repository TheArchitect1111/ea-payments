/**
 * Smoke: Opportunity Experience view + email builders.
 * Run: node --import tsx scripts/smoke-opportunity-experience.mjs
 * or: npx tsx scripts/smoke-opportunity-experience.mjs
 */
import { buildCtpOpportunityDashboardView, buildCtpOpportunityReviewView, buildCtpOpportunityDetailView } from '../lib/ctp-opportunity-view.ts';
import { buildOpportunityExperienceEmail, ctpWelcomeStudioPath } from '../lib/ctp-welcome-email.ts';

const sub = {
  id: 'CTP-TEST',
  businessName: 'Acme Co',
  contactName: 'Robert Smith',
  email: 'r@a.com',
  status: 'Workspace Active',
  workspaceStatus: 'Active',
  studioStatus: 'Not Started',
  assessmentId: 'A1',
  proposalId: 'P1',
  submittedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  clientType: 'website',
  executiveScoring: {
    scoringVersion: 'ctp-c-1.0',
    operationalHealthScore: 72,
    verdict: 'Promising, With Gaps',
    confidence: 'Medium',
    why: 'Strong foundation with clear room to grow.',
    biggestOpportunity: 'Improve customer experience',
    whatsWorking: [],
    whatsHoldingYouBack: [],
    opportunityEstimate: { label: '', detail: '', confidence: 'Medium' },
    recommendedStartingPoint: '',
    prioritizedNextSteps: [
      'Improve Customer Experience',
      'Strengthen Credibility',
      'Reduce Manual Work',
    ],
    areaScores: {
      capacity: { label: 'Capacity', score: 68, confidence: 'Medium', why: '', evidence: [], improve: [] },
      visibility: { label: 'Visibility', score: 52, confidence: 'Medium', why: '', evidence: [], improve: [] },
      timeLeakage: { label: 'Time Leakage', score: 55, confidence: 'Medium', why: '', evidence: [], improve: [] },
      growthReadiness: {
        label: 'Growth Readiness',
        score: 71,
        confidence: 'Medium',
        why: '',
        evidence: [],
        improve: [],
      },
    },
  },
  digitalPresenceAudit: {
    overallScore: 61,
    scores: {
      website: 74,
      brandConsistency: 70,
      messaging: 68,
      mobileExperience: 72,
      navigation: 58,
      callsToAction: 55,
      leadCapture: 60,
      conversionOptimization: 52,
      trustSignals: 83,
      accessibility: 80,
      seo: 52,
      socialPresence: 50,
      googleBusinessProfile: 48,
      performance: 60,
    },
    findings: [],
    impactEstimate: '',
    mode: 'generic-baseline',
    auditedAt: new Date().toISOString(),
  },
};

const d = buildCtpOpportunityDashboardView(sub, 'acme', { firstName: 'Robert' });
const r = buildCtpOpportunityReviewView(sub, 'acme', { firstName: 'Robert' });
const det = buildCtpOpportunityDetailView(sub, 'acme', 'customer-experience');
const email = buildOpportunityExperienceEmail({
  firstName: 'Robert',
  businessName: 'Acme Co',
  contactName: 'Robert Smith',
  capacityScore: 72,
  scoreBand: 'Promising',
  weeklyTimeRecovery: 8,
  opportunityLow: 10000,
  opportunityHigh: 40000,
  projectTypeLabel: 'Website',
  recommendedFee: 1497,
  timelineLabel: '3-5 Weeks',
  investmentLow: 997,
  investmentHigh: 2497,
  portalUrl: 'https://efficiencyarchitects.online/portal/acme/ctp',
  proposalUrl: 'https://efficiencyarchitects.online/proposal/P1',
  supportEmail: 'freedom@efficiencyarchitects.online',
  clientType: 'website',
  categoryScores: d.healthAreas.map((a) => ({ label: a.label, score: a.score })),
  opportunitySummary: d.executiveSummary,
});

const failures = [];
if (d.readinessScore !== 72) failures.push('readiness');
if (d.opportunityStars !== 4) failures.push('stars');
if (d.healthAreas.length < 4) failures.push('health');
if (d.opportunities.length !== 3) failures.push('opps');
if (!det) failures.push('detail');
if (ctpWelcomeStudioPath() !== 'ctp') failures.push('path');
if (email.ctaLabel !== 'VIEW MY OPPORTUNITY DASHBOARD') failures.push('cta');
if (!email.bodyHtml.includes('Your Digital Foundation')) failures.push('foundation');

if (failures.length) {
  console.error('smoke FAILED', failures);
  process.exit(1);
}
console.log('Opportunity Experience smoke: PASS');
console.log(
  JSON.stringify(
    {
      greeting: d.greeting,
      readiness: d.readinessScore,
      health: d.healthAreas.map((h) => h.label),
      emailCta: email.ctaLabel,
      showStudio: d.showDesignStudio,
      reviewItems: r.agenda.length,
    },
    null,
    2,
  ),
);
