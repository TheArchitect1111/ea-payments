import { sourceAdapter } from './sourceAdapter';
import { readFile } from 'node:fs/promises';
export const chassisCertAdapter=sourceAdapter({id:'chassis-cert',files:[{path:'.github/workflows/amanda-e2e.yml',contains:'Amanda Automated Certification'}],verify:async()=>{
 const [ci,protection]=await Promise.all([readFile('.github/workflows/amanda-e2e.yml','utf8'),readFile('config/production-protection.json','utf8')]);
 const valid=ci.includes('server-side-fulfillment:')&&ci.includes('public-playwright:')&&protection.includes('amanda-catherine');
 return {status:valid?200:503,evidence:`CI job definitions and client protection policy present: ${valid}; actual GitHub checks separately required`};
}});
