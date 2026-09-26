export type EACommand='check'|'audit'|'fix'|'build'|'continue'|'proceed'|'rollback'|'whatNow'|'other';
export type CommandEvidence={resolverAllowed?:boolean;canonicalSourceReachable?:boolean;fileCabinetReachable?:boolean;repositoryReachable?:boolean;deploymentTargetResolved?:boolean;authorizationResolved?:boolean;editPerimeterResolved?:boolean;rollbackResolved?:boolean;requiredConnectorsHealthy?:boolean;monitoringStateKnown?:boolean};
const mutation=new Set<EACommand>(['fix','build','continue','proceed','rollback']);
export function classifyEACommand(input:string):EACommand {
 const s=input.trim().toLowerCase();
 if(/^(proceed|go|next)$/.test(s)) return 'proceed';
 if(/^continue\b/.test(s)) return 'continue';
 if(/^check\b/.test(s)) return 'check';
 if(/^audit\b/.test(s)) return 'audit';
 if(/^fix\b/.test(s)) return 'fix';
 if(/^build\b/.test(s)) return 'build';
 if(/^rollback\b/.test(s)) return 'rollback';
 if(/what now/.test(s)) return 'whatNow';
 return 'other';
}
export function commandPreflight(command:EACommand,evidence?:CommandEvidence){
 if(!mutation.has(command)) return {required:false,decision:'NOT_REQUIRED' as const,failed:[] as string[]};
 const keys:(keyof CommandEvidence)[]=['resolverAllowed','canonicalSourceReachable','fileCabinetReachable','repositoryReachable','deploymentTargetResolved','authorizationResolved','editPerimeterResolved','rollbackResolved','requiredConnectorsHealthy','monitoringStateKnown'];
 const failed=keys.filter(k=>evidence?.[k]!==true);
 return {required:true,decision:(failed.length?'BLOCK':'PASS') as 'BLOCK'|'PASS',failed};
}
