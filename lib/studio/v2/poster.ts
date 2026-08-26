import{z}from'zod';

export const PosterLayer=z.discriminatedUnion('type',[
 z.object({type:z.literal('image'),id:z.string(),assetId:z.string(),x:z.number(),y:z.number(),w:z.number(),h:z.number(),fit:z.enum(['cover','contain']).default('cover'),opacity:z.number().min(0).max(1).default(1),radius:z.number().default(0),blend:z.enum(['normal','screen','multiply','overlay']).default('normal'),z:z.number().int()}),
 z.object({type:z.literal('text'),id:z.string(),text:z.string(),x:z.number(),y:z.number(),w:z.number(),font:z.enum(['display','serif','sans']),size:z.number(),weight:z.number().int(),lineHeight:z.number(),tracking:z.number(),color:z.string(),align:z.enum(['left','center','right']).default('left'),italic:z.boolean().default(false),z:z.number().int()}),
 z.object({type:z.literal('shape'),id:z.string(),shape:z.enum(['rect','circle','line','diamond']),x:z.number(),y:z.number(),w:z.number(),h:z.number(),fill:z.string().optional(),stroke:z.string().optional(),strokeWidth:z.number().default(0),opacity:z.number().min(0).max(1).default(1),rotation:z.number().default(0),z:z.number().int()}),
 z.object({type:z.literal('qr'),id:z.string(),value:z.string(),x:z.number(),y:z.number(),size:z.number(),label:z.string().optional(),z:z.number().int()}),
]);
export type PosterLayer=z.infer<typeof PosterLayer>;

export const PosterDocument=z.object({id:z.string(),name:z.string(),width:z.number().int().positive(),height:z.number().int().positive(),background:z.string(),safeArea:z.number().default(40),layers:z.array(PosterLayer),metadata:z.object({artifact:z.literal('poster'),version:z.number().int().positive(),candidateId:z.string(),designSystem:z.string()})});
export type PosterDocument=z.infer<typeof PosterDocument>;

export function validatePosterGeometry(doc:PosterDocument){const failures:string[]=[];for(const l of doc.layers){const right=('size'in l?l.x+l.size:l.x+l.w),bottom=('size'in l?l.y+l.size:l.y+l.h);if(l.x<0||l.y<0||right>doc.width||bottom>doc.height)failures.push(`${l.id} exceeds canvas`);if(l.type==='qr'&&l.size<96)failures.push(`${l.id} QR below minimum 96px`)}return failures;}
