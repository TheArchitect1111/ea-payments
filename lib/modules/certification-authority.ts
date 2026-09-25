import capabilityInventory from '@/config/capability-inventory.json';
import evidenceLedger from '@/config/module-certification-evidence.json';
import type { ModuleId } from '@/lib/modules/registry';
type LegacyStatus='certified'|'inventoried'|'review-required';
const inventory=new Map((capabilityInventory.modules as {id:string;assemblyStatus:LegacyStatus;version:number|string}[]).map(x=>[x.id,x]));
const certificates=new Map((evidenceLedger.certificates as {moduleId:string;status:string;moduleVersion:number|string}[]).map(x=>[x.moduleId,x]));
export function certificationAuthority(id:ModuleId){const legacy=inventory.get(id),certificate=certificates.get(id);const exact=!!certificate&&certificate.moduleVersion===legacy?.version;return {legacyStatus:legacy?.assemblyStatus,certificateStatus:certificate?.status,moduleVersion:certificate?.moduleVersion,exactVersion:exact,reusable:certificate?.status==='certified'&&exact};}
export function requireCertifiedLego(id:ModuleId){const a=certificationAuthority(id);if(!a.reusable)throw new Error(`EA Lego blocked: ${id}:missing-10-class-certificate`);return a;}
