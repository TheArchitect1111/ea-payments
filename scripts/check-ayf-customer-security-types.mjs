import ts from 'typescript';
import { resolve, relative } from 'node:path';

const entrypoints = [
  'next-env.d.ts', 'lib/ayf/customer-access.ts', 'lib/bricks/content-family.ts', 'lib/bricks/final-family.ts',
  'app/api/portal/ayf/customer-access/route.ts', 'app/api/portal/content/route.ts',
  'app/api/portal/content/download/route.ts', 'app/api/portal/content/upload/route.ts',
  'app/api/portal/final-bricks/route.ts', 'app/api/portal/content-requests/route.ts',
  ...['documents','reports','resources','deliveries','messaging'].map(page=>`app/portal/[slug]/${page}/page.tsx`),
  'app/portal/components/AyfCustomerAssignments.tsx', 'app/portal/components/CertifiedContentUpload.tsx',
  'app/portal/components/FinalBrickPanel.tsx', 'tests/ayf-customer-security.test.mts',
];
const config=ts.readConfigFile(resolve('tsconfig.json'),ts.sys.readFile);
if(config.error)throw Error(ts.flattenDiagnosticMessageText(config.error.messageText,'\n'));
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd());
const program=ts.createProgram({rootNames:entrypoints.map(file=>resolve(file)),options:{...parsed.options,incremental:false,noEmit:true}});
const diagnostics=[...parsed.errors,...ts.getPreEmitDiagnostics(program)].map(d=>({file:d.file?relative(process.cwd(),d.file.fileName).replaceAll('\\','/'):'(config)',code:d.code,line:d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start).line+1:null,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}));
console.log(JSON.stringify({scope:'AYF security routes, pages, controls and test, with transitive dependencies and unchanged strict root options',entrypoints,diagnosticCount:diagnostics.length,diagnostics},null,2));
process.exitCode=diagnostics.length?1:0;
