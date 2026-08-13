import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [engine, theme, preview, components, publishGate, portalChrome, portalLayout, factoryUi, launchPreset, quickLaunch, activationRoute, publicSite, quarantine, portalProvision, clientExperience, portalPack, amandaConfig, packRegistry, packResolver, liveWrapper] = await Promise.all([
  read('vendor/theme-engine/src/index.ts'),
  read('vendor/theme-engine/src/themes/amanda-editorial/theme.ts'),
  read('app/preview/experience/[slug]/[pageId]/ExperiencePreview.tsx'),
  read('app/components/experience/themes/amanda-editorial/AmandaEditorialTheme.tsx'),
  read('lib/website-publish-gate.ts'),
  read('lib/platform/portal-workspace.ts'),
  read('lib/chassis/PortalLayout.tsx'),
  read('app/admin/ea-factory/experience-director/ExperienceDirectorClient.tsx'),
  read('lib/experience-launch-presets.ts'),
  read('app/admin/ea-factory/quick-launch/QuickLaunchClient.tsx'),
  read('app/api/admin/factory/activate-experience/route.ts'),
  read('app/sites/[slug]/page.tsx'),
  read('lib/site-quarantine.ts'),
  read('lib/experience-portal-provision.ts'),
  read('app/portal/components/ClientExperience.tsx'),
  read('lib/portal-universal/packs/amanda-catherine.ts'),
  read('lib/amanda-catherine/config.ts'),
  read('lib/portal-universal/packs/index.ts'),
  read('lib/portal-universal/resolve-pack-for-org.ts'),
  read('public/design-imports/amanda-catherine-jane-live.html'),
]);

assert.match(engine, /amandaEditorialTheme/);
assert.match(theme, /id: AMANDA_EDITORIAL_THEME_ID/);
assert.match(preview, /themeId === 'amanda-editorial'/);
assert.match(publishGate, /themeId: input\.themeId\?\.trim\(\) \|\| 'ea-default-theme'/);
assert.match(publishGate, /themeId: input\.themeId/);
assert.match(portalChrome, /themeId: shell\.theme\.id/);
assert.match(portalLayout, /data-workspace-theme=\{themeId\}/);
assert.match(factoryUi, /Amanda Editorial/);
assert.match(factoryUi, /portalLoginUrl/);
assert.match(launchPreset, /id: 'amanda-catherine-editorial'/);
assert.match(launchPreset, /themeId: 'amanda-editorial'/);
assert.match(quickLaunch, /Website \+ portal/);
assert.match(activationRoute, /provisionWebsitePortalSite\(preset\.provision\)/);
assert.match(activationRoute, /requireAdminActionFromRequest/);
assert.match(activationRoute, /isSiteQuarantined/);
assert.match(publicSite, /if \(isSiteQuarantined\(slug\)\) notFound\(\)/);
assert.match(quarantine, /'amanda-catherine'/);
assert.match(portalProvision, /upsertProspectFromAssessment/);
assert.match(portalProvision, /fulfillPaidClient/);
assert.match(portalProvision, /ensureCtpWorkspaceForWebsitePortal/);
assert.match(portalProvision, /themeId: input\.themeId/);
assert.match(clientExperience, /themeId === 'amanda-editorial'/);
assert.match(clientExperience, /client-amanda-catherine\.jpg/);
assert.match(launchPreset, /Strategic Connector & Partnership Development/);
assert.match(portalPack, /id: AMANDA_PORTAL_PACK_ID/);
assert.match(portalPack, /Connections & Opportunities/);
assert.match(portalPack, /LIFELINE Featured Guest Information/);
assert.match(amandaConfig, /8-12 professionally edited videos/);
assert.match(amandaConfig, /5-10 branded quote graphics/);
assert.match(amandaConfig, /totalLessons: 6/);
assert.match(amandaConfig, /lessonsPerWeek: 1/);
assert.match(amandaConfig, /releaseMode: 'fixed-days'/);
assert.match(amandaConfig, /releaseDays: \['monday'\]/);
assert.match(amandaConfig, /releaseTime: '09:00'/);
assert.match(amandaConfig, /timeZone: 'America\/New_York'/);
assert.match(amandaConfig, /releaseBatchSize: 1/);
assert.match(amandaConfig, /AMANDA_COURSES/);
assert.match(amandaConfig, /AMANDA_SCHEDULING/);
assert.match(amandaConfig, /AMANDA_PROFILE/);
assert.match(amandaConfig, /AMANDA_EXTERNAL_SERVICES/);
assert.match(amandaConfig, /AMANDA_JANE_CATALOG/);
assert.match(amandaConfig, /aesthetikine\.janeapp\.com\/embed\/book_online/);
assert.match(amandaConfig, /apply\.medicard\.com\/25595/);
assert.match(amandaConfig, /amanda@aesthetikine\.com/);
assert.match(amandaConfig, /amandacatherinec@gmail\.com/);
assert.match(amandaConfig, /bookingProvider: 'jane'/);
assert.match(amandaConfig, /appointmentReminderHours: \[24, 2\]/);
assert.match(amandaConfig, /AMANDA_CRM_STAGES/);
assert.match(amandaConfig, /AMANDA_ADMIN_REPORTS/);
for (const audience of [
  'client',
  'student-trainee',
  'certified-practitioner',
  'member-community-participant',
  'media-guest',
  'volunteer',
  'vendor-partner',
  'staff',
  'admin',
]) assert.match(amandaConfig, new RegExp(`'${audience}'`));
assert.match(amandaConfig, /AMANDA_ROLE_DASHBOARDS/);
assert.match(amandaConfig, /AMANDA_PORTAL_FORMS/);
assert.match(amandaConfig, /AMANDA_ONBOARDING_WORKFLOWS/);
assert.match(amandaConfig, /lifeline-media-guest/);
assert.match(amandaConfig, /partner-vendor-application/);
assert.match(portalPack, /preferredModuleId: 'calendar'/);
assert.match(portalPack, /Events & Registration/);
assert.match(portalPack, /Preferences & Notifications/);
assert.match(portalPack, /notifications: \{/);
assert.match(portalPack, /notifications: \{ enabled: false \}/);
assert.match(portalPack, /label: 'Payments'/);
assert.match(packRegistry, /AMANDA_CATHERINE_PACK/);
assert.match(packResolver, /startsWith\('amanda-catherine'\)/);
assert.match(liveWrapper, /\.\/amanda-catherine-live\/index\.html/);
assert.doesNotMatch(liveWrapper, /amanda-catherine-2\.vercel\.app/);
assert.match(liveWrapper, /Strategic Connector &amp; Partnership Development/);
assert.match(liveWrapper, /Explore a Partnership/);
for (const component of [
  'EditorialNavigation', 'EditorialHero', 'EditorialSection', 'EditorialCardRail',
  'EditorialImageMosaic', 'EditorialQuote', 'EditorialCta', 'EditorialFooter',
]) assert.match(components, new RegExp(`function ${component}`));

for (const forbidden of ['fetch(', 'createClient(', 'stripe.', 'signIn(', 'router.push(']) {
  assert.doesNotMatch(components, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('Amanda Editorial theme contract: PASS');
