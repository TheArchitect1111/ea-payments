/** Provider QA is restricted to authenticated administrators and explicit TEST records. */
export const CIGAR_PROVIDER_TEST_PATH='/api/admin/cigar-ctp/provider-test';
export function isCigarTestRecord(fields:Record<string,unknown>):boolean {
 return /^TEST\b/.test(String(fields['Business Name']??fields.businessName??'')) &&
  /^TEST\b/.test(String(fields['Contact Name']??fields.contactName??''));
}
export function isCigarProviderTestRequest(environment:string|undefined,path:string):boolean {
 return environment==='preview' && path===CIGAR_PROVIDER_TEST_PATH;
}
