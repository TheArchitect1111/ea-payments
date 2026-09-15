import fs from 'node:fs'; import assert from 'node:assert/strict';
const c=JSON.parse(fs.readFileSync('.ea/universal-factory/run7-custom-experience-factory.v1.json','utf8'));
assert.equal(c.run,7); assert.equal(c.component,'CUSTOM_EXPERIENCE_FACTORY');
for(const x of ['EXTRACT_VISUAL_DNA','PLAN_ASSET_ROLES','COMPOSE_CUSTOM_LAYOUT','VISUAL_REGRESSION_PASS','ANTI_SAMENESS_PASS','CLIENT_INTENT_PASS']) assert(c.lifecycle.includes(x),x);
assert.equal(c.assetPolicy.noRepeatedHeroOrNarrativeImage,true); assert.equal(c.assetPolicy.noUnapprovedIdentitySubstitution,true);
assert.equal(c.antiGenericPolicy.fixedTemplateOutputForbidden,true); assert.equal(c.antiGenericPolicy.sameLayoutAcrossUnrelatedClientsForbidden,true); assert.equal(c.antiGenericPolicy.goldenPathDefinesStructureNotAppearance,true);
assert.equal(c.guidedLanguage.processMustBeVisuallyExplainedWhenComplex,true);
for(const x of ['generic-template-output','placeholder-copy','client-intent-drift']) assert(c.failClosedOn.includes(x),x);
assert.equal(c.handoff.nextRun,'RUN_8_AUTONOMOUS_OPERATIONS'); console.log('EA Universal Factory Run 7 custom experience factory certified.');