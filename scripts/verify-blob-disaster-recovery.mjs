/**
 * BRICKS/private-Blob disaster recovery: export, encrypt, restore to an
 * INDEPENDENT Blob store, and fresh-read each restored object.
 *
 * Requires BLOB_READ_WRITE_TOKEN, EA_BLOB_DR_RESTORE_TOKEN (DIFFERENT store),
 * EA_DR_BACKUP_KEY (64 hex chars), EA_BLOB_DR_PREFIXES (comma separated).
 * Fail closed if any credential is missing. Never print plaintext records.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
import {list,get,put} from '@vercel/blob';
const source=process.env.BLOB_READ_WRITE_TOKEN;
const destination=process.env.EA_BLOB_DR_RESTORE_TOKEN;
const encryptionKey=process.env.EA_DR_BACKUP_KEY;
const rawPrefixes=process.env.EA_BLOB_DR_PREFIXES||'';
const output=process.env.EA_BLOB_DR_OUTPUT||'.recovery/blob';
const maxEntries=Number(process.env.EA_BLOB_DR_MAX_ENTRIES||'5000');
function must(cond,msg){if(!cond)throw new Error('DR_FAIL: '+msg)}
function sha(buf){return createHash('sha256').update(buf).digest('hex')}
function keyPart(s){return typeof s==='string'&&/^[a-zA-Z0-9_./-]+$/.test(s)&&!s.includes('..')}
async function main(){
  must(source&&destination,'BLOB source and independent restore store tokens are required');
  must(source!==destination,'SOURCE_EQUALS_RESTORE_STORE');
  must(typeof encryptionKey==='string'&&/^[\da-f]{64}$/i.test(encryptionKey),'EA_DR_BACKUP_KEY_REQUIRED');
  must(Number.isInteger(maxEntries)&&maxEntries>0&&maxEntries<=5000,'invalid entry cap');
  const prefixes=rawPrefixes.split(',').map(p=>p.trim()).filter(Boolean);
  must(prefixes.length>0&&prefixes.every(p=>keyPart(p)&&p.endsWith('/')),'Explicit namespace prefixes required');
  const snapshots=new Map();
  for(const prefix of prefixes){
    let cursor;
    for(let page=0;page<100;page++){
      const r=await list({prefix,limit:100,...(cursor?{cursor}:{}),token:source});
      must(Array.isArray(r?.blobs),'source list failed');
      for(const b of r.blobs){
        must(b.pathname.startsWith(prefix)&&keyPart(b.pathname),'out-of-prefix blob');
        if(snapshots.has(b.pathname))continue;
        must(snapshots.size<maxEntries,'entry cap exceeded');
        const response=await get(b.pathname,{access:'private',useCache:false,token:source});
        must(response?.statusCode===200&&response.stream,'source private read failed');
        const bytes=Buffer.from(await new Response(response.stream).arrayBuffer());
        must(bytes.length<=5*1024*1024,'oversized record, adjust DR policy before export');
        snapshots.set(b.pathname,{path:b.pathname,size:bytes.length,sha256:sha(bytes),
          contentType:b.contentType||'application/octet-stream',data:bytes.toString('base64')});
      }
      if(!r.hasMore)break;
      must(r.cursor&&r.cursor!==cursor,'pagination stalled');cursor=r.cursor;
      must(page<99,'pagination cap reached');
    }
  }
  must(snapshots.size>0,'empty source recovery inventory cannot certify backup');
  const archive=Buffer.from(JSON.stringify({schema:'ea-blob-dr-v1',createdAt:new Date().toISOString(),
    prefixes,entries:[...snapshots.values()]}),'utf8');
  const key=Buffer.from(encryptionKey,'hex'),iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const encrypted=Buffer.concat([cipher.update(archive),cipher.final()]);
  const tag=cipher.getAuthTag(),payload=Buffer.concat([Buffer.from('EADR1'),iv,tag,encrypted]);
  await fs.mkdir(output,{recursive:true,mode:0o700});
  const file=path.join(output,'private-blobs.aes256gcm');
  await fs.writeFile(file,payload,{mode:0o600});
  const saved=await fs.readFile(file);
  must(saved.subarray(0,5).toString()==='EADR1','invalid archive marker');
  const decipher=createDecipheriv('aes-256-gcm',key,saved.subarray(5,17));
  decipher.setAuthTag(saved.subarray(17,33));
  const decrypted=Buffer.concat([decipher.update(saved.subarray(33)),decipher.final()]);
  const restoredArchive=JSON.parse(decrypted.toString('utf8'));
  must(restoredArchive.schema==='ea-blob-dr-v1'&&restoredArchive.entries.length===snapshots.size,
    'archive roundtrip failed');
  let restored=0;
  for(const entry of restoredArchive.entries){
    must(prefixes.some(p=>entry.path.startsWith(p)),'restore out-of-scope object');
    const bytes=Buffer.from(entry.data,'base64');
    must(bytes.length===entry.size&&sha(bytes)===entry.sha256,'source checksum mismatch');
    // Do not overwrite an existing object in the DR destination.
    const receipt=await put(entry.path,bytes,{token:destination,access:'private',
      contentType:entry.contentType,allowOverwrite:false,addRandomSuffix:false});
    must(receipt?.pathname===entry.path,'restore receipt mismatch');
    const check=await get(entry.path,{token:destination,access:'private',useCache:false});
    must(check?.statusCode===200&&check.stream,'RESTORE_READBACK_FAILED');
    const observed=Buffer.from(await new Response(check.stream).arrayBuffer());
    must(observed.length===entry.size&&sha(observed)===entry.sha256,'restore checksum mismatch');
    restored++;
  }
  const proof={schema:'ea-blob-dr-proof-v1',status:'PASS',sourceNamespacePrefixes:prefixes,
    sourceObjectCount:snapshots.size,restoreObjectCount:restored,
    privateStore:true,freshRead:true,independentProvider:true,
    encryptedArchiveSha256:sha(saved),evidenceCommit:process.env.GITHUB_SHA||null,
    verifiedAt:new Date().toISOString()};
  await fs.writeFile(path.join(output,'recovery-proof.json'),JSON.stringify(proof,null,2)+'\n',
    {mode:0o600});
  console.log(JSON.stringify(proof));
}
main().catch(e=>{console.error(e?.message||'DR_FAIL');process.exitCode=1});
