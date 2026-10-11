import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { finalDefaults,type FinalKind } from './final-family';
export async function portalFinalDefault(slug:string,kind:FinalKind){
 const org=await findOrganizationByPortalSlug(slug);
 if(!org||!/^rec[A-Za-z0-9]+$/.test(org.id))return null;
 const journal=await loadTenantInstall(org.id);
 if(!journal||journal.portalSlug!==slug||journal.state!=='installed'||!journal.admitted.includes(kind))return null;
 return finalDefaults({organizationId:org.id,portalSlug:slug},kind);
}