import {StudioBrief} from '../production';

export type SevenSportsSlide={
 number:number;
 title:string;
 section:string;
 leftVisual:string;
 rightExplanation:string;
 emotionalRole:string;
};

export const sevenSportsMasterReference={
 id:'seven-sports-master-homepage',
 label:'Approved full-site 7 Sports homepage image from chat, saved as the visual source of truth for Design Studio.',
 source:'Chat upload file_00000000c61081f59a0eaf082b923b96 / /mnt/data/1000044544.png',
 rule:'Do not reinterpret or redesign. Recreate each section sharply at slide scale from this master website concept.',
};

export const sevenSportsDeckSlides:SevenSportsSlide[]=[
 {number:1,title:'Cover',section:'7 Sports Website + Client Portal Experience',leftVisual:'Premium light cover with EA logo, 7 Sports identity, and a restrained black/gold/white editorial sports feel.',rightExplanation:'Sets the tone for a premium guided website and portal recommendation, not a generic website redesign.',emotionalRole:'Invitation'},
 {number:2,title:'The 7 Sports Experience',section:'Homepage Hero',leftVisual:'Enlarged recreation of the master hero: 7 Sports headline, diverse athlete imagery, and primary navigation/CTA language.',rightExplanation:'This section establishes the promise: guiding student-athletes and building legacies. It gives visitors the feeling that 7 Sports understands both performance and possibility.',emotionalRole:'Aspiration'},
 {number:3,title:'The Moment Everything Changes',section:'NIL Signing Moment',leftVisual:'Enlarged recreation of the NIL signing section from the master design, focused on the athlete, family/supporters, signature, and belief.',rightExplanation:'This is the emotional proof of destination. It shows the moment athletes and families are hoping for before asking them to understand the services.',emotionalRole:'Possibility'},
 {number:4,title:'The Dream',section:'Opportunity, Education, Exposure, Development & Life',leftVisual:'Recreate the four-pursuit section from the master image with strong, clean visual tiles and minimal text.',rightExplanation:'This section connects the website to what athletes and families actually want: opportunity, education, visibility, personal growth, and a better future.',emotionalRole:'Desire'},
 {number:5,title:'The Challenge',section:'The road is not always clear',leftVisual:'Recreate the six challenge panels: confusing NIL landscape, lack of exposure, recruiting uncertainty, personal brand, cross-border complexity, and not knowing the next step.',rightExplanation:'This section creates recognition. It tells athletes and parents that 7 Sports understands the obstacles between talent and opportunity.',emotionalRole:'Recognition'},
 {number:6,title:'Meet 7 Sports',section:'You do not navigate it alone',leftVisual:'Recreate the diverse athlete/guide section and the concise proof points from the master homepage.',rightExplanation:'7 Sports enters the story as the guide. The athlete remains the hero while 7 Sports becomes the trusted partner that creates clarity and direction.',emotionalRole:'Trust'},
 {number:7,title:'The 7 Sports Pathway',section:'Discover → Develop → Connect → Elevate → Achieve',leftVisual:'Recreate the clean horizontal pathway system from the master design with generous spacing and clear flow.',rightExplanation:'This turns services into a journey. Visitors can see how 7 Sports moves them from uncertainty to a structured path toward opportunity.',emotionalRole:'Clarity'},
 {number:8,title:'Real Athletes. Real Opportunity.',section:'Proof and Partners',leftVisual:'Recreate the athlete testimonial/proof section and partner credibility strip from the master design.',rightExplanation:'This section converts hope into belief. It supports the emotional promise with athletes, outcomes, trusted relationships, and visible credibility.',emotionalRole:'Belief'},
 {number:9,title:'Your Opportunity Starts Here',section:'Primary CTA',leftVisual:'Recreate the dark CTA band with pathways for athletes, parents, and partners.',rightExplanation:'The CTA appears only after the visitor understands the dream, challenge, guide, pathway, and proof. Now the next step feels earned rather than forced.',emotionalRole:'Action'},
 {number:10,title:'The 7 Sports Client Portal',section:'Portal Dashboard',leftVisual:'Recreate the portal dashboard at large readable scale, including laptop and mobile experience from the master design.',rightExplanation:'This section shows that the relationship continues after the website conversion. The portal becomes the athlete and family’s ongoing home for opportunities, resources, communication, and progress.',emotionalRole:'Belonging'},
 {number:11,title:'Inside the Portal: Client Page',section:'Individual Athlete Client Page',leftVisual:'Create a dedicated individual athlete/client portal page that matches the website and portal visual language, based on the master design direction.',rightExplanation:'This makes the portal personal. It shows how each athlete can see their profile, opportunities, progress, documents, media, and communication in one place.',emotionalRole:'Personalization'},
 {number:12,title:'Next Steps',section:'Implementation Path + Investment',leftVisual:'Recreate the final next-steps section with clean pricing, service bullets, CTA, and subtle 7 Sports court/brand image.',rightExplanation:'Website + portal services start at $1,497. Final investment increases based on functionality, integrations, automation, and overall complexity. CTA: cc.efficiencyarchitects.online/ctp.',emotionalRole:'Momentum'},
];

export const sevenSportsBrief:StudioBrief={
 title:'7 Sports Website + Client Portal Experience',
 projectType:'presentation',
 industry:'student-athlete NIL, recruiting, brand development and client portal experience',
 audience:'Seven Sports Group leadership and decision-makers evaluating a premium website and client portal experience',
 keywords:['7 Sports','student-athletes','NIL','website','portal','pitch deck','emotional journey','Apple-style','light theme','section-by-section','athlete development','exposure','education','opportunity'],
 referenceSignals:[
  'Use approved full-site homepage image as master design reference',
  'Deconstruct the homepage section by section rather than redesigning it',
  'Left side of each slide: enlarged high-resolution recreation of exact website section',
  'Right side of each slide: short explanation of section purpose and emotional role',
  'Light, spacious Apple-style presentation system',
  'Black, white and restrained gold accents',
  'Racially diverse athlete imagery',
  'Client portal and individual client page required as dedicated slides',
  'Final slide must include services start at $1,497 and CTA cc.efficiencyarchitects.online/ctp'
 ],
 nonNegotiables:[
  'Do not reinterpret or redesign the website sections',
  'Do not create unrelated images or independent section concepts',
  'The master full-site image is the visual source of truth',
  'Each section recreation must be sharp enough to inspect at slide size',
  'No clutter, no decorative icon overload, no generic template look',
  'Include EA logo on cover',
  'Include complexity disclaimer with starting price',
  'Preserve the emotional journey: aspiration, possibility, desire, recognition, trust, clarity, belief, action, belonging, personalization, momentum'
 ],
 requestedDirection:'luxury-editorial',
 facts:[
  'Use the approved full-site 7 Sports homepage image as master reference',
  'Deck format: section image on the left, explanation on the right',
  'Include cover with EA logo',
  'Include client portal slide',
  'Include individual client page slide',
  'Services start at $1,497',
  'Final investment increases based on functionality, integrations, automation and complexity',
  'CTA: cc.efficiencyarchitects.online/ctp'
 ],
 assets:[
  {id:'seven-sports-master-homepage',kind:'photo',label:'Approved full-site 7 Sports homepage master image from current chat',approved:true},
  {id:'ea-logo',kind:'logo',label:'Efficiency Architects logo for cover',approved:true},
  {id:'seven-sports-mark',kind:'logo',label:'7 Sports identity from master homepage image',approved:true},
 ],
 outputs:['12-slide client presentation','section-by-section website blueprint','portal experience slide','individual client page slide','next steps/pricing/CTA slide'],
};
