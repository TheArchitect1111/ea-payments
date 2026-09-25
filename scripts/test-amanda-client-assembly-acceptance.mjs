import { readFileSync } from 'node:fs';
const required=[
 'scripts/test-amanda-page-portal-parity.mjs',
 'scripts/test-amanda-learning-handoff.mjs',
 'scripts/test-amanda-checkout-config.mjs',
 'scripts/test-amanda-completion.mjs',
 'scripts/test-amanda-practitioner-kit.mts'
];
const failures=[];
for(const p of required){try{readFileSync(p)}catch{failures.push(`missing:${p}`)}}
const page=readFileSync('app/amanda-catherine/page.tsx','utf8');
const updates=readFileSync('app/amanda-catherine/ClientRequestedUpdates.tsx','utf8');
const source=page+'\n'+updates;
for(const marker of ['/portal/amanda-catherine/enroll?course=','/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning','/amanda-catherine/private/practitioner-kit']){
 if(!source.includes(marker)) failures.push(`public-connection-missing:${marker}`);
}
const fulfillment=readFileSync('lib/amanda-catherine/payment-fulfillment.ts','utf8');
if(!fulfillment.includes('provisionAmandaClientAccess')) failures.push('payment-to-access-missing');
const owner=readFileSync('app/portal/amanda-catherine/owner/OwnerApplicationQueue.tsx','utf8');
if(!owner) failures.push('owner-visibility-missing');
console.log(JSON.stringify({client:'amanda-catherine',contract:'public CTA -> checkout/application -> payment fulfillment -> entitlement -> learning -> owner visibility',failures},null,2));
if(failures.length) process.exit(1);
