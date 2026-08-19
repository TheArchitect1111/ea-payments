export type WarmIntroductionInput = {
  referrerName: string;
  prospectName: string;
  organizationName: string;
  relationshipContext: string;
  prospectRelationshipContext: string;
  workSummary: string;
  discovery: string;
  evaSupport: string;
  evaluationUrl?: string;
  websiteMockupUrl?: string;
  portalMockupUrl?: string;
};

export type WarmIntroductionPackage = {
  contextMessage: string;
  explanationScript: string;
  groupIntroduction: string;
  robertFollowUp: string;
  verbalIntroduction: string;
};

const EA_OUTCOME_LANGUAGE =
  'reclaim time, help their organizations run more efficiently, expand their media and social media presence, and ultimately increase their impact';

function clean(value: string, fallback: string) {
  return value.trim() || fallback;
}

function firstName(value: string, fallback: string) {
  return clean(value, fallback).split(/\s+/)[0];
}

function assetList(input: WarmIntroductionInput) {
  const assets = [
    input.evaluationUrl?.trim() ? `Evaluation: ${input.evaluationUrl.trim()}` : '',
    input.websiteMockupUrl?.trim() ? `Website mockup: ${input.websiteMockupUrl.trim()}` : '',
    input.portalMockupUrl?.trim() ? `Operations portal mockup: ${input.portalMockupUrl.trim()}` : '',
  ].filter(Boolean);

  return assets.length ? `\n\nMaterials:\n${assets.join('\n')}` : '';
}

export function buildWarmIntroductionPackage(input: WarmIntroductionInput): WarmIntroductionPackage {
  const referrer = clean(input.referrerName, 'there');
  const prospect = clean(input.prospectName, 'the prospect');
  const prospectFirst = firstName(input.prospectName, 'there');
  const organization = clean(input.organizationName, `${prospect}'s organization`);
  const relationship = clean(input.relationshipContext, `you know ${prospect} and understand the scope of the work`);
  const prospectRelationship = clean(
    input.prospectRelationshipContext,
    `I know you and understand the scope of your work`,
  );
  const work = clean(input.workSummary, 'the full scope of the work');
  const discovery = clean(
    input.discovery,
    'the work is impressive, but its full value is spread across multiple digital channels and can be difficult for people to understand',
  );
  const eva = clean(
    input.evaSupport,
    'manage outreach, relationships, programs, opportunities and follow-up while reducing repetitive administrative work',
  );
  const assets = assetList(input);

  const contextMessage = `${referrer},

Before sharing the materials, please give ${prospect} a little context so the evaluation does not come as a surprise.

You can explain that Efficiency Architects helps leaders ${EA_OUTCOME_LANGUAGE}. Because ${relationship}, we looked at how ${prospect}'s public digital presence supports ${work}.

We found that ${discovery}. We created a preliminary evaluation and visual concept showing how the work could be connected, made easier to understand and supported by Eva—a 24/7 digital assistant working across ${organization}.

Nothing has been changed, and there is no obligation. We simply believed the vision could be valuable and wanted ${prospectFirst} to have an opportunity to see it.

After providing that context, please introduce us in a group text or email. You do not have to explain the complete system. I will personally walk ${prospectFirst} through the evaluation, mockups and how Eva could support the work.${assets}

Robert`;

  const explanationScript = `Robert and Efficiency Architects help leaders ${EA_OUTCOME_LANGUAGE}. Because ${relationship}, we asked Robert to look at how your public digital presence supports ${work}. He found that ${discovery}. He created a preliminary evaluation and visual concept showing how the work could be connected and supported by Eva, a 24/7 digital assistant. Nothing has been changed, and there is no obligation. I simply thought the vision could be valuable to you.`;

  const groupIntroduction = `${prospectFirst}, I’d like to introduce you to my friend Robert Brickey of Efficiency Architects. Because ${prospectRelationship}, I asked Robert to look at how your public digital presence supports ${work}.

Robert found that ${discovery}. He created an evaluation and visual concept showing how the work could be brought together more effectively and supported by Eva—a 24/7 digital assistant that could help ${eva}.

Robert can explain it much better than I can, but I believed the work was important enough to make the introduction. Robert, I’ll let you take it from here.${assets}`;

  const robertFollowUp = `${prospectFirst}, thank you for allowing me to share what we created. The goal is not simply to give ${organization} a new website. It is to help you reclaim time, make the organization easier to run, expand your reach and increase the impact of the work you have already built.

The evaluation identifies where opportunities may be getting lost, the mockups show how the public story and private operations could work together, and Eva shows what it would mean to have a digital team member supporting outreach and follow-up around the clock.

I would be glad to walk you through the vision and hear what would be most valuable to you.${assets}

Robert Brickey
Efficiency Architects`;

  const verbalIntroduction = `I asked Robert Brickey to look at your digital presence because I understand the breadth of your work. His company helps leaders reclaim time, run their organizations more efficiently and expand their reach and impact. He created an evaluation, mockups and a concept for Eva—a 24/7 digital assistant that could help ${eva}. I thought you should see it, and Robert can walk you through the details.`;

  return { contextMessage, explanationScript, groupIntroduction, robertFollowUp, verbalIntroduction };
}
