import{z}from'zod';

export const WebBlock=z.object({
 id:z.string(),
 type:z.enum(['nav','hero','proof','features','story','gallery','stats','process','pricing','faq','cta','footer','portal-summary','portal-actions','portal-table','portal-calendar','portal-documents']),
 variant:z.string(),
 content:z.record(z.any()),
 visualIntent:z.string(),
 priority:z.enum(['primary','secondary','supporting']).default('secondary'),
});

export const WebArtifact=z.object({
 id:z.string(),
 artifactType:z.enum(['landing-page','website','portal']),
 designSystem:z.string(),
 theme:z.object({palette:z.record(z.string()),typography:z.record(z.string()),spacingScale:z.array(z.number()),radius:z.enum(['none','subtle','moderate'])}),
 blocks:z.array(WebBlock).min(1),
 responsive:z.object({mobile:z.string(),tablet:z.string(),desktop:z.string()}),
 conversionGoal:z.string(),
});
export type WebArtifact=z.infer<typeof WebArtifact>;

export function validateWebArtifact(a:WebArtifact){const failures:string[]=[];if(a.artifactType==='portal'&&!a.blocks.some(b=>b.type.startsWith('portal-')))failures.push('Portal artifact lacks task-oriented portal blocks');if(a.artifactType==='landing-page'&&!a.blocks.some(b=>b.type==='cta'))failures.push('Landing page lacks CTA');if(a.artifactType==='website'&&!a.blocks.some(b=>b.type==='nav'))failures.push('Website lacks navigation');if(!a.blocks.some(b=>b.type==='hero'||b.type==='portal-summary'))failures.push('Artifact lacks primary orientation block');return failures;}
