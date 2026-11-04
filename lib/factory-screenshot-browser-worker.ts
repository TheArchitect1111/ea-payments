import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import sharp from 'sharp';
import type { BrowserContext } from '@playwright/test';
import { ACCEPTANCE_CHECKS, ScreenshotPageInput, ScreenshotSpecification, type ScreenshotBuildResult, type ScreenshotCheck, type ScreenshotEvidence } from './factory-screenshot-build';

const page = ScreenshotPageInput.extend({ previewPath: z.string().startsWith('/api/projects/'), imageHash:z.string().regex(/^[a-f0-9]{64}$/),
  sourceImagePath: z.string().startsWith('/api/projects/'), spec: ScreenshotSpecification,
  links: z.record(z.string()), forms: z.record(z.enum(['intake','applications'])),images:z.record(z.number().int().min(0).max(1023)) }).strict();
export const BrowserWorkerRequest = z.object({ version: z.literal(1), projectId: z.string().min(1).max(120),
  revision: z.string().regex(/^[a-f0-9]{64}$/), timestamp: z.string().datetime(),
  tenant: z.object({ organizationId: z.string().regex(/^rec[a-zA-Z0-9]+$/), portalSlug: z.string().regex(/^[a-z0-9-]+$/) }),
  pages: z.array(page).min(1).max(24), requiredChecks: z.array(z.enum(ACCEPTANCE_CHECKS)),
  constraints: z.object({privateOnly:z.literal(true),testIdentitiesOnly:z.literal(true),noEmails:z.literal(true),noPayments:z.literal(true),noPublicPublish:z.literal(true)}).strict(),
}).strict();

export async function rasterDifference(reference: Buffer, rendered: Buffer) {
  const convert=async(bytes:Buffer)=>sharp(bytes).toColourspace('srgb').flatten({background:'#ffffff'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const [a,b]=await Promise.all([convert(reference),convert(rendered)]);
  if(a.info.width!==b.info.width||a.info.height!==b.info.height||a.info.channels!==b.info.channels)return 1;
  let sum=0;for(let i=0;i<a.data.length;i++)sum+=Math.abs(a.data[i]!-b.data[i]!);
  return sum/(255*a.data.length);
}

type Draft = Pick<ScreenshotBuildResult,'projectId'|'revision'|'tenant'|'pages'>;
export type BrowserWorkerOptions = {
  baseUrl: string; context: BrowserContext; anonymous: BrowserContext; otherTenant?: BrowserContext;
  outputDir: string;
  /** Pre-issued test-member sessions only. No password/2FA/email actions are performed by this worker. */
  fixtures: Array<{pageId:string;componentId:string;fields:Record<string,string>}>;
  mobileReferences?: Record<string,string>;
  tolerance?: number;
};
class MissingTestInput extends Error {}
export async function runScreenshotBrowserChecks(draft: Draft, options: BrowserWorkerOptions) {
  const origin=new URL(options.baseUrl).origin;
  const tenant=draft.tenant;if(!tenant)throw Error('Persisted test tenant required');
  const allowed=(path:string)=>{
    const url=new URL(path,origin);
    const projectPrefix=`/api/projects/${encodeURIComponent(draft.projectId)}/screenshot-build/`;
    const portalPrefix=`/portal/${tenant.portalSlug}`;
    if(url.origin!==origin||!(url.pathname.startsWith(projectPrefix)||url.pathname===portalPrefix||url.pathname.startsWith(portalPrefix+'/')))throw Error('Worker destination is outside the private project/tenant');
    return url.href;
  };
  await mkdir(options.outputDir,{recursive:true});
  const runId=`browser-${Date.now()}`;
  const artifact=join(options.outputDir,'browser-evidence.json');
  const evidence: ScreenshotEvidence[]=[];
  const outcomes: Array<{check:ScreenshotCheck;status:'PASS'|'FAIL'|'BLOCKED';reason:string}>=[];
  const check=async(id:ScreenshotCheck,action:()=>Promise<void>)=>{
    try{await action();outcomes.push({check:id,status:'PASS',reason:'Actual private browser/HTTP interactions passed'});
      evidence.push({check:id,passed:true,method:id.startsWith('visual-')?'visual-comparison':'browser',detail:'Private browser worker; test-member sessions, actual routes and read-back',artifact,runId,revision:draft.revision,checkedAt:new Date().toISOString()});
    }catch(error){const reason=error instanceof Error?error.message:String(error);const blocked=error instanceof MissingTestInput;
      outcomes.push({check:id,status:blocked?'BLOCKED':'FAIL',reason});
      if(!blocked)evidence.push({check:id,passed:false,method:id.startsWith('visual-')?'visual-comparison':'browser',detail:reason,artifact,runId,revision:draft.revision,checkedAt:new Date().toISOString()});
    }
  };
  const browserPage=await options.context.newPage();
  const formCases:Array<{url:string;data:Record<string,string>;id:string;portalPath:string;name:string}>=[];
  const requireTrue=(condition:unknown,message:string)=>{if(!condition)throw Error(message);};
  try{
    await check('rendering',async()=>{
      for(const p of draft.pages){const response=await browserPage.goto(allowed(p.previewPath));requireTrue(response?.status()===200,`Private preview did not render: ${p.id}`);
        for(const component of p.spec.components){const element=browserPage.locator(`[data-component="${component.id}"]`);requireTrue(await element.count()===1,`Missing component ${p.id}/${component.id}`);const box=await element.boundingBox();requireTrue(box&&box.width>0&&box.height>0,'Rendered component has no visible geometry');}
        for(const image of await browserPage.locator('img').all())requireTrue(await image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0),'Approved image failed to load');
      }
    });
    await check('links',async()=>{
      for(const p of draft.pages)for(const href of Object.values(p.links)){const target=allowed(href);const response=await browserPage.goto(target);
        requireTrue(response&&response.status()<400,`Navigation failed: ${new URL(target).pathname}`);
        requireTrue(!new URL(browserPage.url()).pathname.endsWith('/login')||new URL(target).pathname.endsWith('/login'),'Protected portal redirected to login');
      }
    });
    await check('login',async()=>{
      const href=draft.pages.flatMap(p=>Object.values(p.links)).find(h=>h.startsWith(`/portal/${tenant.portalSlug}`)&&!h.endsWith('/login'));
      if(!href)throw new MissingTestInput('A bound protected portal module and authorized test-member session are required');
      const response=await browserPage.goto(allowed(href));requireTrue(response?.status()===200&&!new URL(browserPage.url()).pathname.endsWith('/login'),'Test-member portal session was rejected');
      requireTrue(await browserPage.locator('h1').count()>0,'Protected portal content missing');
    });
    await check('form-persistence',async()=>{
      const expected=draft.pages.flatMap(p=>Object.keys(p.forms).map(componentId=>`${p.id}/${componentId}`));
      if(!expected.length||expected.some(key=>!options.fixtures.some(f=>`${f.pageId}/${f.componentId}`===key)))throw new MissingTestInput('Explicit test field values required for every wired form');
      for(const fixture of options.fixtures){const p=draft.pages.find(p=>p.id===fixture.pageId);if(!p?.forms[fixture.componentId])throw Error('Test fixture does not name a wired form');
        await browserPage.goto(allowed(p.previewPath));const form=browserPage.locator(`[data-component="${fixture.componentId}"] form`);
        const hidden=await form.evaluate((node:HTMLFormElement)=>Object.fromEntries(new FormData(node)));
        const requestId=createHash('sha256').update([draft.projectId,draft.revision,fixture.pageId,fixture.componentId,fixture.fields.email].join('/')).digest('hex');
        const name=`${fixture.fields.name} ${requestId.slice(0,8)}`;
        const data={...hidden,...fixture.fields,name,requestId,revision:draft.revision} as Record<string,string>;
        const url=allowed(`/api/projects/${encodeURIComponent(draft.projectId)}/screenshot-build/submit`);
        const headers={origin,'accept':'application/json'};
        const response=await options.context.request.post(url,{form:data,headers});requireTrue(response.status()===200,'Capture/portal ledger persistence failed');
        const saved=await response.json();requireTrue(saved.ok&&saved.id&&saved.portalPath,'Persistence receipt missing');
        const repeat=await options.context.request.post(url,{form:data,headers});requireTrue(repeat.status()===200&&(await repeat.json()).id===saved.id,'Replay did not preserve the capture identity');
        await browserPage.goto(allowed(saved.portalPath));requireTrue(await browserPage.getByText(name,{exact:true}).count()>0,'Saved submission absent from the actual portal');
        formCases.push({url,data,id:saved.id,portalPath:saved.portalPath,name});
      }
    });
    await check('authorization',async()=>{
      for(const p of draft.pages){const response=await options.anonymous.request.get(allowed(p.previewPath),{maxRedirects:0});requireTrue([401,403].includes(response.status()),'Anonymous private preview was exposed');}
      if(!formCases.length)throw new MissingTestInput('A persisted test submission is required for authorization probing');
      for(const test of formCases){const response=await options.anonymous.request.post(test.url,{form:test.data,headers:{origin}});requireTrue([401,403].includes(response.status()),'Anonymous form write was admitted');}
    });
    await check('tenant-isolation',async()=>{
      if(!options.otherTenant||!formCases.length)throw new MissingTestInput('An independently authenticated second-tenant test session is required');
      for(const test of formCases){const response=await options.otherTenant.request.post(test.url,{form:test.data,headers:{origin}});requireTrue(response.status()===403,'Cross-tenant write was admitted');
        const view=await options.otherTenant.request.get(allowed(test.portalPath),{maxRedirects:0});requireTrue([401,403].includes(view.status()),'Cross-tenant portal read was admitted');}
    });
    const tolerance=options.tolerance??0.005;if(tolerance<0||tolerance>0.02)throw Error('Visual tolerance must be between 0 and 0.02');
    for(const mode of ['desktop','mobile'] as const)await check(`visual-${mode}`,async()=>{
      if(mode==='mobile'&&draft.pages.some(p=>!options.mobileReferences?.[p.id]))throw new MissingTestInput('Approved mobile reference files required for every page');
      for(const p of draft.pages){let reference:Buffer;
        if(mode==='mobile')reference=await readFile(options.mobileReferences![p.id]!);
        else{const response=await options.context.request.get(allowed(p.sourceImagePath));requireTrue(response.status()===200,'Authenticated original reference is unavailable');reference=await response.body();}
        const size=await sharp(reference).metadata();requireTrue(size.width&&size.height,'Reference raster dimensions unavailable');
        await browserPage.setViewportSize({width:size.width!,height:Math.min(size.height!,2000)});await browserPage.goto(allowed(p.previewPath));
        const rendered=await browserPage.locator('main').screenshot();await writeFile(join(options.outputDir,`${p.id}-${mode}.png`),rendered);
        const difference=await rasterDifference(reference,rendered);requireTrue(difference<=tolerance,`${p.id} ${mode} pixel difference ${difference.toFixed(5)} exceeds approved tolerance ${tolerance}`);
      }
    });
  }finally{await browserPage.close();}
  const report={projectId:draft.projectId,revision:draft.revision,runId,outcomes,evidence};await writeFile(artifact,JSON.stringify(report,null,2));return report;
}

/** HMAC + timestamp + idempotent single-flight boundary for the optional internal worker service. */
export function createScreenshotVerifierHandler(secret:string,execute:(job:z.infer<typeof BrowserWorkerRequest>)=>Promise<{evidence:ScreenshotEvidence[]}>) {
  if(secret.length<24)throw Error('A dedicated verifier signing secret of at least 24 characters is required');
  const cache=new Map<string,Promise<{evidence:ScreenshotEvidence[]}>>();
  return async(request:Request)=>{
    const bytes=await request.text();if(bytes.length>1500000)return Response.json({error:'Request too large'},{status:413});
    const signature=request.headers.get('x-ea-signature')||'';const expected=createHmac('sha256',secret).update(bytes).digest('hex');
    if(!/^[a-f0-9]{64}$/.test(signature)||!timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(expected,'hex')))return Response.json({error:'Unauthorized verifier request'},{status:401});
    try{const job=BrowserWorkerRequest.parse(JSON.parse(bytes));if(Math.abs(Date.now()-Date.parse(job.timestamp))>300000)return Response.json({error:'Expired verifier request'},{status:401});
      const key=createHash('sha256').update(bytes).digest('hex');if(!cache.has(key)){if(cache.size>=64)cache.delete(cache.keys().next().value!);cache.set(key,execute(job).catch(error=>{cache.delete(key);throw error;}));}
      const result=await cache.get(key);return Response.json({evidence:result!.evidence},{headers:{'cache-control':'private, no-store'}});
    }catch{return Response.json({error:'Private verifier failed; acceptance was not recorded'},{status:503});}
  };
}
