import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { submitCapture, progressCapture, type CaptureKind } from '@/lib/bricks/capture-family';
import type { BrickTenant } from '@/lib/bricks/durable';

/** Only registered, fully installed tenants use canonical capture. Never create synthetic tenants. */
export async function resolveCaptureTenant(slug:string,kind:CaptureKind):Promise<BrickTenant|null>{
 const org=await findOrganizationByPortalSlug(slug);
 if(!org || !/^rec[a-zA-Z0-9]+$/.test(org.id)) return null;
 const install=await loadTenantInstall(org.id);
 if(!install || install.state!=='installed' || install.portalSlug!==slug || !install.admitted.includes(kind))return null;
 return {organizationId:org.id,portalSlug:slug};
}
export async function bridgeCapturedRecord(input:{
 slug:string;kind:CaptureKind;identity:string;requestId:string;email:string;name:string;
 payload:Record<string,unknown>;route?:boolean;
 confirm?:(message:{email:string;subject:string})=>Promise<void>;
}){
 const tenant=await resolveCaptureTenant(input.slug,input.kind);
 if(!tenant)return null;
 const row=await submitCapture(tenant,input.kind,{identity:input.identity,requestId:input.requestId,
  email:input.email,name:input.name,payload:input.payload});
 if(!input.route)return row;
 return progressCapture(tenant,input.kind,input.identity,{confirm:input.confirm});
}
