/** Report parsing for a staging-only cigar CTP. No persistent storage or ledger changes. */
import JSZip from 'jszip';
export type ExtractedSheet={name:string;rows:number;preview:string[][];category:string;reportedAmounts?:{label:string;amount:number}[]};
export type ReportExtract={fileName:string;format:string;sheets:ExtractedSheet[];findings:string[];caveat:string};
function decode(s:string):string {return s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'");}
function text(s:string):string {return decode(s.replace(/<[^>]*>/g,' ').trim()).slice(0,200);}
function type(name:string):string {const n=name.toLowerCase();return /free goods|promo|sample/.test(n)?'non-sale':/unpaid|outstanding/.test(n)?'unpaid':/paid/.test(n)?'paid':/fulfill|b2c|ship/.test(n)?'fulfillment':'other';}
function sheet(name:string,rows:string[][]):ExtractedSheet{
 const reportedAmounts=/recap|summary/i.test(name)?
 rows.slice(0,100).flatMap(row=>{
  const label=(row[0]??'').trim().slice(0,120);
  const raw=(row[1]??'').trim();
  const normalized=raw.replace(/[$,\s]/g,'');
  if(!label||!/^[-+]?\d+(?:\.\d+)?$/.test(normalized))return [];
  const amount=Number(normalized);
  return Number.isFinite(amount)?[{label,amount}]:[];
 }).slice(0,30):undefined;
 return {name,rows:rows.length,category:type(name),preview:rows.slice(0,8).map(row=>row.slice(0,12)),reportedAmounts};
}
function csv(input:string):string[][]{
 const output:string[][]=[];let row:string[]=[],v='',quoted=false;
 const value=input.replace(/^\uFEFF/,'').slice(0,1_000_000);
 for(let i=0;i<value.length;i++){const c=value[i];
 if(c==='"'&&quoted&&value[i+1]==='"'){v+='"';i++;continue;}
 if(c==='"'){quoted=!quoted;continue;}
 if(c===','&&!quoted){row.push(v.slice(0,200));v='';continue;}
 if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&value[i+1]==='\n')i++;row.push(v.slice(0,200));v='';if(row.some(Boolean))output.push(row.slice(0,40));row=[];if(output.length>2000)break;continue;}
 v+=c;}
 if(v||row.length){row.push(v.slice(0,200));output.push(row.slice(0,40));}return output;
}
async function xlsx(bytes:Buffer):Promise<ExtractedSheet[]>{
 if(bytes[0]!==0x50||bytes[1]!==0x4b)throw new Error('Not a valid XLSX file.');
 const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});
 const all=Object.values(zip.files).filter(f=>!f.dir);
 const expanded=all.reduce((n,f)=>n+((f as unknown as {_data?:{uncompressedSize?:number}})._data?.uncompressedSize??0),0);
 if(all.length>400||expanded>20*1024*1024)throw new Error('Workbook is too large.');
 if(all.some(f=>/externalLinks|vbaProject|activeX|embeddings/i.test(f.name)))throw new Error('Upload a values-only spreadsheet without embedded content.');
 const sharedXml=await zip.file('xl/sharedStrings.xml')?.async('string')??'';
 const shared=[...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(a=>decode(a[1])).join('').slice(0,200));
 const workbook=await zip.file('xl/workbook.xml')?.async('string')??'';
 const relationships=await zip.file('xl/_rels/workbook.xml.rels')?.async('string')??'';
 const relMap=new Map<string,string>();
 for(const m of relationships.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/g)){
  const id=/\bId="([^"]+)"/.exec(m[1])?.[1];
  const rawTarget=/\bTarget="([^"]+)"/.exec(m[1])?.[1];
  if(!id||!rawTarget||!/worksheets\//.test(rawTarget))continue;
  const p=rawTarget.startsWith('/xl/')?rawTarget.slice(1):rawTarget.startsWith('xl/')?rawTarget:'xl/'+rawTarget;
  if(!p.startsWith('xl/worksheets/')||p.includes('..'))throw new Error('Invalid workbook worksheet path.');
  relMap.set(id,p);
 }
 const entries=[...workbook.matchAll(/<sheet\b([^>]*)\/?>(?:<\/sheet>)?/g)].map(m=>({
  name:decode(/\bname="([^"]+)"/.exec(m[1])?.[1]??'Unknown sheet'),
  relation:/\br:id="([^"]+)"/.exec(m[1])?.[1]??'',
  sheetId:/\bsheetId="([^"]+)"/.exec(m[1])?.[1]??'',
 }));
 const fallback=Object.keys(zip.files).filter(x=>/^xl\/worksheets\/sheet\d+\.xml$/.test(x)).sort((a,b)=>Number(a.match(/sheet(\d+)/)?.[1])-Number(b.match(/sheet(\d+)/)?.[1])).slice(0,20);
 const selected=entries.length?entries.slice(0,20).map((entry,i)=>({
  name:entry.name,
  path:entry.relation && relMap.size ? relMap.get(entry.relation) : fallback.find(p=>p==='xl/worksheets/sheet'+entry.sheetId+'.xml')??fallback[i],
 })) :fallback.map(p=>({name:p,path:p}));
 if(!selected.length||selected.some(x=>!x.path||!zip.file(x.path)))throw new Error('Unable to safely resolve Excel worksheets.');
 const output:ExtractedSheet[]=[];
 for(const item of selected){const raw=await zip.file(item.path!)?.async('string')??'';const rows:string[][]=[];
 for(const match of raw.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){const cells:string[]=[];
 for(const m of match[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
 const ref=/\br="([A-Z]+)/.exec(m[1])?.[1]??'A';let col=0;for(const c of ref)col=col*26+c.charCodeAt(0)-64;
 if(col<1||col>40)continue;
 const v=/<v>([\s\S]*?)<\/v>/.exec(m[2]??'')?.[1]??'';
 const inline=[...(m[2]??'').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(a=>decode(a[1])).join('');
 cells[col-1]=(/\bt="s"/.test(m[1])?shared[Number(v)]??'':/\bt="inlineStr"/.test(m[1])?inline:text(v||inline)).slice(0,200);
 }
 if(cells.some(Boolean))rows.push(Array.from({length:Math.min(cells.length,40)},(_,n)=>cells[n]??''));
 if(rows.length>=2000)break;}
 output.push(sheet(item.name,rows));}
 return output;
}
export async function extractCigarReport(fileName:string,bytes:Buffer):Promise<ReportExtract>{
 const name=fileName.slice(0,160);const ext=name.toLowerCase().split('.').pop();
 if(bytes.length===0||bytes.length>4*1024*1024)throw new Error('Choose a report under 4 MB.');
 if(!['xlsx','csv','pdf'].includes(ext??''))throw new Error('Please choose XLSX, CSV or PDF.');
 let sheets:ExtractedSheet[]=[];
 if(ext==='xlsx')sheets=await xlsx(bytes);
 if(ext==='csv')sheets=[sheet('CSV report',csv(bytes.toString('utf8')))];
 if(ext==='pdf'){
  if(bytes.subarray(0,5).toString('utf8')!=='%PDF-')throw new Error('Not a valid PDF.');
  const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:bytes});let data;
  try{data=await parser.getText({first:1});}finally{await parser.destroy();}
  sheets=[sheet('PDF text (first page)',(data.text??'').split(/\r?\n/).filter(Boolean).slice(0,200).map(s=>[s.slice(0,200)]))];
 }
 const findings:string[]=[];
 if(sheets.some(s=>s.category==='unpaid'))findings.push('Unpaid invoice section found. Verify the statement date and payment status.');
 if(sheets.some(s=>s.category==='non-sale'))findings.push('Non-sale goods section found. Review quantities, authorization, and compliance.');
 if(sheets.some(s=>s.category==='fulfillment'))findings.push('Fulfillment section found. Reconcile with online order IDs before calculating total sales.');
 if(sheets.some(s=>s.category==='paid'))findings.push('Paid invoice section found. Invoice values are not necessarily cash received or profit.');
 if(ext==='pdf'&&!sheets[0].rows)findings.push('No selectable text was found. Manual review or text-based PDF required.');
 return {fileName:name,format:ext??'',sheets,findings,caveat:'PREVIEW ONLY: Data has not been verified or saved. No inventory balances, cash receipts, losses, or ROI are inferred from this upload.'};
}
