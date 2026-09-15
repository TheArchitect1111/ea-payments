import fs from 'node:fs';
const f='.ea/visual-foundry/provider-abstraction.v1.json';
if(!fs.existsSync(f)) throw new Error('VISUAL_FOUNDRY_PROVIDER_CONTRACT_MISSING');
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const checks=[
 p.id==='EA_VISUAL_FOUNDRY_PROVIDER_ABSTRACTION_V1',
 p.status==='ENFORCED',
 p.executionModes?.FULL?.default===true,
 p.executionModes?.LITE?.requiresExplicitOwnerAuthorization===true,
 p.executionModes?.LITE?.mayNotClaimFullStack===true,
 p.selection?.silentFallback===false,
 p.selection?.failClosed===true,
 p.acceptance?.externalHealthRequestRequired===true,
 p.acceptance?.tarrisMaster1IsFirstIdentityAcceptanceWorkload===true,
 p.acceptance?.remainingTarrisMastersBlockedUntilMaster1Passes===true,
 p.receipt?.required===true
];
if(checks.some(v=>!v)) throw new Error('VISUAL_FOUNDRY_PROVIDER_CONTRACT_INVALID');
console.log('EA_VISUAL_FOUNDRY_PROVIDER_ABSTRACTION_V1_PASS');
