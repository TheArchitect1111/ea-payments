import { createServer } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';
import { z } from 'zod';
import { createScreenshotVerifierHandler, runScreenshotBrowserChecks } from '../lib/factory-screenshot-browser-worker';

// Optional dedicated worker process; never started automatically by Next or by acceptance tests.
// Bind loopback and put behind an authenticated TLS reverse proxy for the HTTPS caller contract.
const config=z.object({origin:z.string().url(),organizationId:z.string().regex(/^rec[a-zA-Z0-9]+$/),portalSlug:z.string().regex(/^[a-z0-9-]+$/),
  factoryKey:z.string().min(1),testSession:z.string().min(1),otherTenantSession:z.string().min(1),secret:z.string().min(24),
  fixtures:z.array(z.object({pageId:z.string(),componentId:z.string(),fields:z.record(z.string())})),mobileReferences:z.record(z.string()).optional(),
}).parse({origin:process.env.EA_SCREENSHOT_PREVIEW_ORIGIN,organizationId:process.env.EA_SCREENSHOT_TEST_ORGANIZATION_ID,
  portalSlug:process.env.EA_SCREENSHOT_TEST_PORTAL_SLUG,factoryKey:process.env.EACP_CHATGPT_ACTION_KEY,
  testSession:process.env.EA_SCREENSHOT_TEST_SESSION,otherTenantSession:process.env.EA_SCREENSHOT_OTHER_TENANT_SESSION,
  secret:process.env.EA_SCREENSHOT_VERIFIER_SECRET,fixtures:JSON.parse(process.env.EA_SCREENSHOT_TEST_FORMS_JSON||'[]'),
  mobileReferences:JSON.parse(process.env.EA_SCREENSHOT_MOBILE_REFERENCES_JSON||'{}')});
const configuredUrl=new URL(config.origin);
if(configuredUrl.username||configuredUrl.password)throw Error('Credentials must not be embedded in the preview URL');
if(configuredUrl.protocol!=='https:'&&!(configuredUrl.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(configuredUrl.hostname)))throw Error('Preview origin must use HTTPS or loopback HTTP');
const origin=configuredUrl.origin;
const handler=createScreenshotVerifierHandler(config.secret,async job=>{
  if(job.tenant.organizationId!==config.organizationId||job.tenant.portalSlug!==config.portalSlug)throw Error('Job is outside the explicitly configured test tenant');
  const browser=await chromium.launch({headless:true});
  try{
    const contexts=await Promise.all([browser.newContext({extraHTTPHeaders:{authorization:`Bearer ${config.factoryKey}`}}),browser.newContext(),browser.newContext()]);
    for(const context of contexts)await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await contexts[0]!.addCookies([{name:'ea_portal_session',value:config.testSession,url:origin}]);
    await contexts[2]!.addCookies([{name:'ea_portal_session',value:config.otherTenantSession,url:origin}]);
    return await runScreenshotBrowserChecks(job,{baseUrl:origin,context:contexts[0]!,anonymous:contexts[1]!,otherTenant:contexts[2]!,
      fixtures:config.fixtures,mobileReferences:config.mobileReferences,outputDir:join(tmpdir(),`ea-private-browser-${Date.now()}`)});
  }finally{await browser.close();}
});
const server=createServer(async(req,res)=>{
  if(req.method!=='POST'||req.url!=='/verify'){res.writeHead(404);res.end();return;}
  try{const chunks:Buffer[]=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1500000){res.writeHead(413);res.end();return;}chunks.push(Buffer.from(chunk));}
    const response=await handler(new Request('http://localhost/verify',{method:'POST',headers:{'x-ea-signature':String(req.headers['x-ea-signature']||'')},body:Buffer.concat(chunks).toString()}));
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(503);res.end('Private verifier unavailable; no acceptance claimed');}
});
server.listen(Number(process.env.EA_SCREENSHOT_VERIFIER_PORT||4141),'127.0.0.1',()=>console.log('Private screenshot browser worker listening on loopback; public publishing, email and payments are not supported.'));
