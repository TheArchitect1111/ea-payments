import type{StudioBriefV2,CompositionCandidate}from'../schema';

export const twinCityBriefV2:StudioBriefV2={
 projectId:'twin-city-golf-2027',
 title:'Twin City Kappa Provincial Golf Experience',
 artifactType:'poster',
 audience:'Kappa Alpha Psi members, provincial meeting attendees, golfers and prospective participants',
 viewingContext:'Primarily shared and viewed on phones; secondary 8.5x11 print use',
 objective:'Create immediate desire to participate and make the event feel established, energetic and unmistakably Kappa.',
 facts:[
  {label:'Date',value:'March 12',priority:'primary'},
  {label:'Time',value:'8:00 AM',priority:'primary'},
  {label:'Entry',value:'$85 / Player',priority:'primary'},
  {label:'Format',value:'2-Man Teams',priority:'primary'},
  {label:'Course',value:'Winston Lake Golf Course',priority:'primary'},
  {label:'Location',value:'Winston-Salem, NC',priority:'secondary'},
  {label:'Context',value:'In conjunction with the Kappa Provincial Meeting',priority:'secondary'},
 ],
 assets:[
  {id:'crest',kind:'logo',approved:true,url:'https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png',requirements:['Use small but unmistakable']},
  {id:'founders',kind:'heritage',approved:true,url:'https://thestory-kappaalphapsi.directfrompublisher.com/sites/thestory-kappaalphapsi.directfrompublisher.com/files/styles/edv_large/public/2025-07/CoverSampFinal.jpg?itok=1nuMH-tQ',requirements:['Atmospheric only','Never compete with event title']},
  {id:'golfer',kind:'photo',approved:true,url:'https://images.pexels.com/photos/36818362/pexels-photo-36818362/free-photo-of-golfer-swinging-on-lush-green-course-outdoors.jpeg?auto=compress&dpr=2&h=1600&w=1200',requirements:['African American golfer','Dominant subject','Crimson apparel treatment applied by composition overlays']},
  {id:'eventQr',kind:'qr',approved:true,requirements:['Minimum 112px','High contrast','Quiet zone']},
 ],
 referenceSignals:['Premium sports event poster','Athlete dominates visual field','Brush/paint energy rather than card grid','Crimson + cream + gold','Large high-impact GOLF typography','Compact information band','Subtle historic Kappa layer','Immediate registration action'],
 nonNegotiables:['African American golfer','Crimson pants visual treatment','Cream shirt','Crimson headwear visual treatment','No invented address','No invented prizes or benefits','All primary facts visible without scrolling','Poster must not resemble a landing page'],
 antiPatterns:['Long paragraphs','Generic cards','Detached rectangular stock photo','Minimal beige editorial page','Tiny date/time','Clipped QR','Random golfer demographics','Overpowering founders image'],
 targetSizes:[{name:'phone-share',width:1080,height:1350},{name:'print-letter',width:2550,height:3300}],
};

export const twinCityCandidates:CompositionCandidate[]=[
 {id:'A',name:'Crimson Drive',thesis:'A dominant action golfer cuts through a crimson field while oversized GOLF typography and a gold date medallion create immediate event recognition.',heroStrategy:'Golfer occupies right two-thirds, overlapping title and color field.',informationFlow:['Chapter identity','GOLF + date','Athlete action','Price/format/course','QR CTA'],geometry:'Diagonal crimson wipe + oversized athlete + bottom fact rail.',imageTreatment:'Full-height subject crop with crimson lower-body and cap overlays; founders ghosted behind title.',typographyStrategy:'Condensed oversized sans paired with expressive serif accent.',ctaStrategy:'Large cream QR tile anchored bottom-right.',differentiation:'Most promotional and sports-forward; closest to reference energy without copying it.'},
 {id:'B',name:'Kappa Scoreboard',thesis:'Event facts lead like a televised tournament graphic with an athlete breaking the grid.',heroStrategy:'Golfer interrupts a structured scoreboard band.',informationFlow:['Date/time','Title','Athlete','Price/format','Course + QR'],geometry:'Top scoreboard strip, central image, bottom CTA band.',imageTreatment:'High-contrast photo with crimson duotone edge and gold linework.',typographyStrategy:'Broadcast-style sans with compact labels.',ctaStrategy:'Full-width bottom registration band.',differentiation:'More informational and highly scannable.'},
 {id:'C',name:'Legacy in Motion',thesis:'Historic founders imagery dissolves into a contemporary golfer, connecting Kappa legacy to the event.',heroStrategy:'Founders occupy upper background; athlete emerges through a diagonal transition.',informationFlow:['Heritage cue','GOLF','Athlete','Date + facts','QR'],geometry:'Layered collage with modern subject breaking archival frame.',imageTreatment:'Cream archival treatment above, saturated crimson/gold athlete field below.',typographyStrategy:'Editorial serif heritage cue + bold modern sans title.',ctaStrategy:'Gold medallion QR zone.',differentiation:'Strongest fraternity storytelling but slightly less immediate than A.'},
];

export const selectedTwinCityCandidate=twinCityCandidates[0];
