import {CreativeDirection,StudioProjectType,directions,premiumGate} from './design-system';

export type StudioAsset={id:string;kind:'logo'|'photo'|'heritage'|'qr'|'icon';url?:string;approved:boolean;label:string};
export type StudioBrief={title:string;projectType:StudioProjectType;industry?:string;keywords?:string[];facts:string[];assets:StudioAsset[];outputs:string[];requestedDirection?:CreativeDirection};
export type StudioPlan={direction:CreativeDirection;directionName:string;agents:string[];renderer:string;productionSteps:string[];requiredChecks:string[];status:'READY_TO_RENDER'|'BLOCKED';blockers:string[]};

export function chooseDirection(brief:StudioBrief):CreativeDirection{
 if(brief.requestedDirection) return brief.requestedDirection;
 const hay=[brief.industry,...(brief.keywords||[]),brief.title].filter(Boolean).join(' ').toLowerCase();
 if(/sport|golf|basketball|football|athlete|tournament/.test(hay)&&/heritage|fraternity|chapter|alumni|kappa/.test(hay)) return 'sports-editorial-heritage';
 if(/sport|event|concert|festival|tournament/.test(hay)) return 'cinematic-event';
 if(/heritage|fraternity|chapter|alumni|institution/.test(hay)) return 'heritage-institutional';
 if(/executive|corporate|business|professional/.test(hay)) return 'corporate-modern';
 return 'luxury-editorial';
}

function requiredAssetKinds(direction:CreativeDirection,projectType:StudioProjectType){
 const base:StudioAsset['kind'][]=['logo'];
 if(direction==='sports-editorial-heritage') base.push('photo','heritage');
 if(projectType==='event-creative'||projectType==='landing-page') base.push('qr');
 return [...new Set(base)];
}

export function buildStudioPlan(brief:StudioBrief):StudioPlan{
 const direction=chooseDirection(brief);
 const required=requiredAssetKinds(direction,brief.projectType);
 const blockers:string[]=[];
 for(const kind of required){if(!brief.assets.some(a=>a.kind===kind&&a.approved)) blockers.push(`Missing approved ${kind} asset`)}
 if(!brief.facts.length) blockers.push('No verified facts supplied');
 if(!brief.outputs.length) blockers.push('No output formats supplied');
 return {
  direction,directionName:directions[direction].name,
  agents:['Creative Director','Brand Guardian','Production','Visual QA','Conversion'],
  renderer:'EA Studio Vector/Web Renderer',
  productionSteps:['Lock verified facts','Lock approved assets','Compose art-directed master','Generate responsive/print variants','Render target sizes','Run technical QA','Run creative QA','Release only after all hard gates pass'],
  requiredChecks:premiumGate.map(g=>g.label),status:blockers.length?'BLOCKED':'READY_TO_RENDER',blockers,
 };
}

export type RenderEvidence={approvedAssetIds:string[];hasPrimaryImage:boolean;hasHeritageImage:boolean;hasRequiredQr:boolean;overflowCount:number;collisionCount:number;brokenImageCount:number;contrastFailures:number;mobileReviewed:boolean;desktopReviewed:boolean;printReviewed:boolean;purposeClear:boolean;creativeScore:number;brandScore:number};
export function evaluatePremiumGate(brief:StudioBrief,e:RenderEvidence){
 const direction=chooseDirection(brief); const failures:string[]=[];
 if(brief.assets.filter(a=>a.approved).some(a=>!e.approvedAssetIds.includes(a.id))) failures.push('Not all approved assets are represented in the render');
 if(direction==='sports-editorial-heritage'&&!e.hasPrimaryImage) failures.push('Primary sports photography missing');
 if(direction==='sports-editorial-heritage'&&!e.hasHeritageImage) failures.push('Heritage imagery missing');
 if((brief.projectType==='event-creative'||brief.projectType==='landing-page')&&!e.hasRequiredQr) failures.push('Required QR code missing');
 if(e.overflowCount||e.collisionCount) failures.push('Clipping, overflow or collisions detected');
 if(e.brokenImageCount) failures.push('Broken images detected');
 if(e.contrastFailures) failures.push('Contrast failures detected');
 if(!(e.mobileReviewed&&e.desktopReviewed&&e.printReviewed)) failures.push('All target formats have not been visually reviewed');
 if(!e.purposeClear) failures.push('Purpose or next action is unclear');
 if(e.creativeScore<8) failures.push('Creative score below premium threshold (8/10)');
 if(e.brandScore<9) failures.push('Brand integrity score below threshold (9/10)');
 return {pass:failures.length===0,status:failures.length?'BLOCKED':'APPROVED',failures,creativeScore:e.creativeScore,brandScore:e.brandScore};
}
