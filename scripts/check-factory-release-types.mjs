import ts from 'typescript';
import { writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

// Diagnostic scope only. The separate root typecheck remains mandatory and unchanged.
const entrypoints = [
  'app/admin/ea-factory/quick-launch/QuickLaunchClient.tsx',
  'app/api/admin/factory/screenshot-assets/route.ts', 'app/api/launch/route.ts',
  'app/api/projects/[id]/route.ts',
  ...['assets/[index]','preview/[pageId]','source/[pageId]','submit',''].map(part => `app/api/projects/[id]/screenshot-build/${part ? `${part}/` : ''}route.ts`),
  ...['experience-creation/build-knowledge-pack','factory-launch-request','factory-orchestrator','factory-project-store',
    'factory-project','factory-queue','factory-screenshot-browser-worker','factory-screenshot-build','factory-screenshot-runtime',
    'factory-screenshot-submit','factory-screenshot-verifier','screenshot-vision'].map(part => `lib/${part}.ts`),
  'scripts/serve-factory-screenshot-verifier.mts',
];
const root = process.cwd();
const config = ts.readConfigFile(join(root,'tsconfig.json'),ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText,'\n'));
const parsed = ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const program = ts.createProgram({ rootNames:[resolve('next-env.d.ts'),...entrypoints.map(file => resolve(file))], options:{...parsed.options,incremental:false,noEmit:true} });
const diagnostics = [...parsed.errors,...ts.getPreEmitDiagnostics(program)].map(d => ({
  file:d.file ? relative(root,d.file.fileName).replaceAll('\\','/') : '(configuration)', code:d.code,
  line:d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : null,
  message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),
}));
const report = { scope:'Factory entrypoints and transitive dependencies; root compiler options preserved', entrypoints, diagnosticCount:diagnostics.length, diagnostics };
if (process.env.EA_FACTORY_TYPES_OUTPUT) writeFileSync(process.env.EA_FACTORY_TYPES_OUTPUT,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
process.exitCode = diagnostics.length ? 1 : 0;
