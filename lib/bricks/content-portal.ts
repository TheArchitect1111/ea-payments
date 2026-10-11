import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { contentDefaults, type ContentKind } from './content-family';
export async function portalContentDefault(slug:string,kind:ContentKind){
 const org=await findOrganizationByPortalSlug(slug);
 if(!org||!/^rec[A-Za-z0-9]+$/.test(org.id))return null;
 const install=await loadTenantInstall(org.id);
 if(!install||install.portalSlug!==slug||install.state!=='installed'||!install.admitted.includes(kind))return null;
 return contentDefaults({organizationId:org.id,portalSlug:slug},kind);
}
