export type StudioArtifactType='flyer'|'poster'|'landing-page'|'website'|'portal'|'presentation';

export type StudioV4Brief={
  title:string;
  type:StudioArtifactType;
  audience:string;
  purpose:string;
  facts:string[];
  references:string[];
  requiredAssets:string[];
  representationRequirements?:string[];
  nonNegotiables:string[];
};

export type VisualCandidate={
  id:string;
  concept:string;
  composition:string;
  hierarchy:string[];
  typography:string;
  imageTreatment:string;
  colorTreatment:string;
};

export type ArtDirectionScore={
  hierarchy:number;
  composition:number;
  imagery:number;
  typography:number;
  brandFit:number;
  mediumFit:number;
  clarity:number;
};

export function averageArtDirectionScore(score:ArtDirectionScore){
  return Object.values(score).reduce((a,b)=>a+b,0)/Object.values(score).length;
}

export function passesArtDirection(score:ArtDirectionScore){
  return averageArtDirectionScore(score)>=9 && Object.values(score).every(v=>v>=8.5);
}

export function productionTarget(type:StudioArtifactType){
  if(type==='flyer'||type==='poster') return 'penpot-svg-pdf-png';
  if(type==='portal') return 'next-tailwind-shadcn-refine';
  if(type==='landing-page'||type==='website') return 'next-tailwind-shadcn';
  return 'design-native-export';
}

export const twinCityV4Brief:StudioV4Brief={
  title:'Twin City Kappas Provincial Golf Experience',
  type:'flyer',
  audience:'Kappa Alpha Psi members, Provincial Meeting attendees, golfers and prospective participants viewing primarily on phones',
  purpose:'Drive registration while making the event feel prestigious, energetic and unmistakably Kappa',
  facts:['March 12 working date','8:00 AM','Winston Lake Golf Course','Winston-Salem, NC','$85 per player','2-man teams','In conjunction with the Kappa Provincial Meeting'],
  references:['premium sports-event poster','country-club premium','athletic editorial','Kappa heritage'],
  requiredAssets:['Twin City/Kappa crest','Kappa founders imagery','African American golfer','registration QR'],
  representationRequirements:['African American golfer','crimson pants','cream shirt','crimson headwear'],
  nonNegotiables:['3-second comprehension','phone-first','print-ready','no invented address','no landing-page copy','no reuse of rejected prior compositions'],
};
