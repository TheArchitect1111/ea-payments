import fs from 'node:fs/promises';
import { critiqueScreenshotWithConfiguredProvider } from '../lib/experience-creation/vision-critic-provider';
async function main() {
const root='docs/baseline-screenshots';
const out='artifacts/visual-quality/vision-report.json';
const names=['after-home-desktop.png','after-home-mobile.png','after-portal-desktop.png','after-portal-mobile.png'];
const prompt=`Evaluate this real rendered screenshot of Amanda Catherine's premium website or portal. Do not presume visual perfection. Assess these metrics on 0-10: composition, typography, imageSelection, faceFocalCropping, responsiveBehavior, accessibility, brandConsistency, technicalQuality, premiumQuality. Explain visible flaws only, no fictional details. Return only JSON object with "scores" numeric fields, "issues" array of short descriptions, "fixes" array of specific repair instructions. Brand colors: ink #17211c, sage #596b5b, cream #f6f0e6, paper #fffdf8, gold #b48a49. Approved imagery must not be replaced. A screenshot alone does not prove interactive behavior.`;
const report={schemaVersion:1,gate:'EA multimodal visual approval',threshold:8.5,status:'BLOCKED_PROVIDER',assessments:[]};
await fs.mkdir('artifacts/visual-quality',{recursive:true});
try {
 if(!process.env.OPENAI_API_KEY?.trim()&&!process.env.ANTHROPIC_API_KEY?.trim())throw new Error('Vision credentials are not available to GitHub Actions. Vercel Preview variables are not automatically available in GitHub.');
 for (const name of names){
  const base64=(await fs.readFile(`${root}/${name}`)).toString('base64');
  const response=await critiqueScreenshotWithConfiguredProvider(base64,'image/png',prompt+' Screenshot: '+name);
  if(!response.text)throw new Error('Vision provider returned no review for '+name);
  const match=response.text.match(/\{[\s\S]*\}/);
  if(!match)throw new Error('Unparseable AI review for '+name);
  const data=JSON.parse(match[0]);
  const required=['composition','typography','imageSelection','faceFocalCropping','responsiveBehavior','accessibility','brandConsistency','technicalQuality','premiumQuality'];
  if(!required.every(k=>Number.isFinite(data.scores?.[k])&&data.scores[k]>=0&&data.scores[k]<=10))throw new Error('Incomplete vision scores for '+name);
  const overall=Number((required.reduce((a,k)=>a+data.scores[k],0)/required.length).toFixed(2));
  report.assessments.push({name,provider:response.provider.id,model:response.provider.model,overall,scores:data.scores,issues:data.issues||[],fixes:data.fixes||[],passed:overall>=8.5&&required.every(k=>data.scores[k]>=8)});
 }
 report.status=report.assessments.every(x=>x.passed)?'PASS':'FAIL';
} catch(error) {report.status='BLOCKED_PROVIDER';report.error=String(error);}
await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,assessments:report.assessments.map(x=>({name:x.name,overall:x.overall,passed:x.passed})),error:report.error}));
if(report.status!=='PASS') process.exitCode=1;

}
main().catch(error=>{console.error(error);process.exitCode=1;});
