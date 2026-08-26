export type StudioProjectType='website'|'landing-page'|'portal'|'event-creative'|'presentation';
export type CreativeDirection='sports-editorial-heritage'|'luxury-editorial'|'corporate-modern'|'cinematic-event'|'heritage-institutional';

export const studioAgents={
 creativeDirector:{role:'Creative Director',owns:['creative direction','composition','hierarchy','reference interpretation'],rejects:['generic template aesthetics','style drift','weak visual hierarchy']},
 brandGuardian:{role:'Brand Guardian',owns:['approved assets','logo integrity','brand colors','identity motifs'],rejects:['unapproved imagery','incorrect marks','brand inconsistency']},
 production:{role:'Production',owns:['renderer selection','responsive composition','print and digital outputs'],rejects:['tool-dependent workflows','single-format builds','broken assets']},
 visualQA:{role:'Visual QA',owns:['render inspection','overflow','collisions','contrast','QR visibility','mobile and print checks'],rejects:['clipping','missing imagery','hidden QR codes','unreadable text']},
 conversion:{role:'Conversion',owns:['purpose','CTA hierarchy','next action','information clarity'],rejects:['unclear action','buried event facts','decorative clutter']},
} as const;

export const directions:Record<CreativeDirection,{name:string;signals:string[];avoid:string[]}>= {
 'sports-editorial-heritage':{name:'Sports Editorial + Heritage',signals:['athlete-led photography','cinematic depth','layered imagery','expressive typography','historic imagery as atmosphere','asymmetric editorial composition'],avoid:['boxy cards','beige minimalism','generic golf templates','text-only posters','clipped display type','fake imagery']},
 'luxury-editorial':{name:'Luxury Editorial',signals:['disciplined whitespace','art-directed photography','editorial type','restrained palette'],avoid:['empty layouts','decorative excess','template grids']},
 'corporate-modern':{name:'Corporate Modern',signals:['clear hierarchy','precise information design','strong brand system'],avoid:['generic SaaS cards','stock illustration overload']},
 'cinematic-event':{name:'Cinematic Event',signals:['full-bleed imagery','dramatic scale','atmospheric depth','high-impact title treatment'],avoid:['flat composition','weak contrast','clip art']},
 'heritage-institutional':{name:'Heritage Institutional',signals:['archival imagery','historic marks','modern typography','ceremonial restraint'],avoid:['museum-like stiffness','symbol overload']},
};

export const premiumGate=[
 {id:'assets',label:'Approved imagery and brand assets are present',owner:'brandGuardian',hard:true},
 {id:'hierarchy',label:'Primary message reads immediately',owner:'creativeDirector',hard:true},
 {id:'composition',label:'Composition has depth, balance and intentional tension',owner:'creativeDirector',hard:true},
 {id:'overflow',label:'No clipping, collisions or overflow at target sizes',owner:'visualQA',hard:true},
 {id:'contrast',label:'All essential text meets readable contrast',owner:'visualQA',hard:true},
 {id:'qr',label:'Required QR codes are visible with adequate quiet space',owner:'visualQA',hard:true},
 {id:'responsive',label:'Mobile, desktop and print variants are independently composed',owner:'production',hard:true},
 {id:'purpose',label:'Audience, event facts and next action are immediately clear',owner:'conversion',hard:true},
 {id:'originality',label:'Does not read as generic, templated or obviously AI-generated',owner:'creativeDirector',hard:true},
] as const;

export const twinCityAcceptance={
 project:'Twin City Provincial Golf Experience',
 type:'event-creative' as StudioProjectType,
 direction:'sports-editorial-heritage' as CreativeDirection,
 requiredAssets:['Twin City/Kappa crest','Kappa founders portrait','real golfer/action photography','event QR','EA Studio QR'],
 facts:['March 12 working date','8:00 AM','Winston Lake Golf Course','Winston-Salem, NC','$85 per player','2-man teams','Kappa Provincial Meeting'],
 outputs:['long-form mobile flyer','print flyer','golf landing hero','social campaign crop'],
 status:'BLOCKED_UNTIL_PREMIUM_GATE_PASSES',
};
