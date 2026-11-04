/** Disk-backed provider transport. The real portal ledger mapper, filters and idempotency run unchanged. */
export const screenshotLedgerTransport = String.raw`
import {readFile,writeFile,readdir} from 'node:fs/promises';import {join} from 'node:path';
export function platformStoreConfigured(){return !globalThis.__screenshotTest.ledgerOffline}
export function syntheticOrgId(slug){return 'org_'+slug}
export function escapeAirtableString(value){return value.replace(/'/g,"\\'")}
export async function platformUpsertByField(table,field,id,fields){
 const state=globalThis.__screenshotTest;if(state.failLedgerWrites)return null;
 const row={id,fields};if(!state.dropLedgerWrites)await writeFile(join(state.storage,'ledger-'+encodeURIComponent(id)+'.json'),JSON.stringify(row));return row;
}
export async function platformQuery(table,formula){
 const state=globalThis.__screenshotTest;
 const rows=await Promise.all((await readdir(state.storage)).filter(x=>x.startsWith('ledger-')).map(async x=>JSON.parse(await readFile(join(state.storage,x),'utf8'))));
 const values=[...formula.matchAll(/\{([^}]+)\}\s*=\s*'([^']*)'/g)];
 return rows.filter(row=>values.every(([,key,value])=>row.fields[key]===value));
}
`;
