export const AMANDA_APPLICATION_QUEUES = {
 'founder-advisory':'advisory', 'speaking-media':'speaking',
 'lifeline-media-guest':'lifeline', 'partner-vendor-application':'lifeline',
 'amanda-apply':'clients', foundry:'clients',
} as const;
export type AmandaApplicationId=keyof typeof AMANDA_APPLICATION_QUEUES;
export function amandaApplicationIdentity(formId:unknown,context:unknown,program:unknown) {
 const candidate=typeof formId==='string'&&formId!=='amanda-apply'?formId:
  typeof context==='string'&&Object.hasOwn(AMANDA_APPLICATION_QUEUES,context)?context:'amanda-apply';
 if(!Object.hasOwn(AMANDA_APPLICATION_QUEUES,candidate))throw new Error('Unknown Amanda application form.');
 const id=candidate as AmandaApplicationId;
 return {formId:id,ownerQueue:AMANDA_APPLICATION_QUEUES[id],
  ...(id==='partner-vendor-application'?{program:'lifeline'}:program==='lifeline'?{program:'lifeline'}:{})};
}

export function amandaApplicationsForQueue<T extends {payload?:Record<string,unknown>}>(applications:T[],queue:string):T[] {
 return applications.filter(application=>{
  try {return amandaApplicationIdentity(application.payload?.formId,application.payload?.context,application.payload?.program).ownerQueue===queue;}
  catch {return false;}
 });
}
