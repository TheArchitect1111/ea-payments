export type MarketingBrainMode='brand'|'campaign'|'website'|'athlete';
export type MarketingBrainBrief={mode:MarketingBrainMode;brand:string;objective:string;audience:string;offer?:string;context?:string;proof?:string[];constraints?:string[];memory?:Record<string,unknown>};
export type MarketingBrainPlan={audienceTruth:string;coreTension:string;desiredShift:string;positioning:string;promise:string;differentiation:string[];narrative:string[];psychology:string[];contentJobs:string[];visualDirection:string[];proofRequirements:string[];conversion:string;learningQuestions:string[];qa:string[]};

const clean=(v:unknown)=>String(v||'').replace(/\s+/g,' ').trim();
const unique=(xs:string[])=>[...new Set(xs.filter(Boolean))];

/**
 * EA Marketing Brain
 * Strategy-first layer that runs before Smartchitecture, Foundry, Amplifi or page assembly.
 * Architecture borrows the strongest open-source patterns: research -> strategy -> creative -> QA,
 * persistent brand memory, specialist roles and hard quality gates. It intentionally has no external
 * runtime dependency so the EA chassis remains portable and does not require another account.
 */
export function buildMarketingBrainPlan(input:MarketingBrainBrief):MarketingBrainPlan{
 const brand=clean(input.brand)||'the brand';
 const objective=clean(input.objective)||'create meaningful action';
 const audience=clean(input.audience)||'the intended audience';
 const offer=clean(input.offer);
 const context=clean(input.context);
 const athlete=input.mode==='athlete';
 const website=input.mode==='website';
 const audienceTruth=athlete
  ?`${audience} must care about ${brand} for reasons that extend beyond a box score. Athletic performance creates attention; identity, story, impact, culture and enterprise turn attention into durable brand equity.`
  :`${audience} is not looking for more marketing activity. They are trying to make progress toward ${objective} while protecting attention for the work they actually value.`;
 const coreTension=athlete
  ?`The market is crowded with highlights and generic NIL promotion. The risk is becoming another athlete feed instead of a person, story and platform people choose to follow.`
  :`The audience feels the cost of the problem before they care about features. Marketing must make that cost recognizable, then make the new outcome feel attainable.`;
 const desiredShift=athlete
  ?`Move ${brand} from athlete being promoted to athlete-owned media and commercial platform.`
  :`Move the audience from recognition of the problem to belief in a differentiated mechanism, then to a low-friction next action.`;
 const positioning=athlete
  ?`${brand} is not a highlight page. It is an evolving athlete brand operating system: Athlete + Person + Impact + Culture + Enterprise.`
  :`${brand} should be positioned around the transformation and mechanism that competitors cannot credibly copy, not around a list of features.`;
 const promise=offer?`${objective}, delivered through ${offer} without making the audience carry the operational burden.`:`Make ${objective} easier to achieve without turning the audience into the production team.`;
 const differentiation=athlete
  ?['ATHLETE: performance, development and competitive story','PERSON: identity, beliefs, interests and human moments','IMPACT: community, youth, mentoring and causes','CULTURE: style, campus, music and relevant cultural participation','ENTERPRISE: NIL concepts, partnerships, merchandise, appearances and owned ventures','MEDIA BRAIN: continuously decides which story should be strengthened next']
  :['Start with the customer objective, not a feature','Expose the unique mechanism behind the result','Show evidence immediately after making a claim','Use learning/memory to become more specific over time','Turn ideas and discovered opportunities into finished work','Keep the human in control at the decision point'];
 const narrative=athlete
  ?['Why should someone care beyond basketball?','Establish the five-part identity','Show a current human or athletic story','Connect the story to culture/community when authentic','Turn the moment into owned media','Show a brand or commercial possibility without fabricating partnerships','Invite the audience into the next chapter']
  :['Recognition: show the lived problem','Cost: reveal what the problem quietly steals','Possibility: introduce a better way','Difference: explain the unique mechanism','Demonstration: show the mechanism working','Proof: make the output/result tangible','Relief: show the audience after the burden changes','Action: one unmistakable next step'];
 const psychology=unique(['self-recognition before persuasion','specificity over slogans','loss/opportunity cost without manufactured fear','identity and aspiration','cognitive ease','show-before-explain','progressive commitment','control and reversibility',athlete?'parasocial connection through authentic recurring story':'']);
 const contentJobs=athlete
  ?['earn attention','deepen identity','document development','build community affinity','create sponsor-ready stories','create owned IP','convert moments into long-term brand equity']
  :['earn attention','create recognition','teach something useful','build trust','prove differentiation','handle an objection','drive the intended action'];
 const visualDirection=athlete
  ?['Faces and emotion before graphics','Basketball is the platform, not the entire visual identity','Balance court, community, culture, business and human life','Use recurring visual chapters so the audience recognizes the TB3 world','Show partnership concepts as concepts, never as fake endorsements','Every hero visual must advance a brand pillar']
  :['Use emotional human imagery where the pain or outcome is human','Use product UI only when demonstrating the mechanism','Every major claim should receive visual proof within one screen','Vary visual tempo: cinematic image, whitespace, product proof, editorial composition','Avoid repetitive card grids when a scene or transformation can communicate faster','Primary CTA must be visually dominant and isolated'];
 const proofRequirements=unique([...(input.proof||[]),'Do not invent testimonials, partnerships, statistics, performance or customer outcomes','Label concepts and hypotheses clearly','Prefer actual product output, real assets and verifiable behavior over descriptive claims']);
 const conversion=`Primary action must directly advance: ${objective}. It should appear after value has been demonstrated and use one visually dominant treatment.`;
 const learningQuestions=athlete
  ?['Which pillar is underrepresented?','What happened recently that is genuinely part of the athlete story?','What audience response indicates affinity, not just reach?','Which stories create repeatable owned IP?','What commercial categories fit the identity without forcing it?','What should the next chapter make people believe about the athlete?']
  :['What language does the audience use for the problem?','Which pain produces action rather than mere agreement?','Which differentiator is both valuable and defensible?','Which proof removes the biggest doubt?','Which creative treatment earns attention without obscuring the message?','What did prior approved/rejected work teach us?'];
 const qa=unique(['Can a competitor paste its name onto this? If yes, differentiation failed.','Does the first screen create desire before explaining architecture?','Does every section have one job?','Is every important claim demonstrated or supported?','Is the emotional promise visible in the imagery?','Is the CTA unmistakable?','Would removing a section weaken the argument? If no, remove it.','Does mobile preserve hierarchy, legibility and visual payoff?',context?'Use supplied context as grounding; never invent missing facts.':'']);
 return{audienceTruth,coreTension,desiredShift,positioning,promise,differentiation,narrative,psychology,contentJobs,visualDirection,proofRequirements,conversion,learningQuestions,qa};
}

export function marketingBrainPrompt(plan:MarketingBrainPlan){return [
 'EA MARKETING BRAIN DIRECTIVE',
 `AUDIENCE TRUTH: ${plan.audienceTruth}`,
 `CORE TENSION: ${plan.coreTension}`,
 `DESIRED SHIFT: ${plan.desiredShift}`,
 `POSITIONING: ${plan.positioning}`,
 `PROMISE: ${plan.promise}`,
 `DIFFERENTIATION: ${plan.differentiation.join(' | ')}`,
 `NARRATIVE: ${plan.narrative.join(' -> ')}`,
 `PSYCHOLOGY: ${plan.psychology.join(' | ')}`,
 `CONTENT JOBS: ${plan.contentJobs.join(' | ')}`,
 `VISUAL DIRECTION: ${plan.visualDirection.join(' | ')}`,
 `PROOF: ${plan.proofRequirements.join(' | ')}`,
 `CONVERSION: ${plan.conversion}`,
 `LEARNING LOOP: ${plan.learningQuestions.join(' | ')}`,
 `HARD QA: ${plan.qa.join(' | ')}`,
 'Do not begin production until the proposed output can satisfy the differentiation, proof, visual and QA requirements.'
 ].join('\n');}
