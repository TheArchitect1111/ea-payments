/** The only per-tenant Subportal configuration lives in durable tenant manifests. */
import { z } from 'zod';
import { loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { getOrganizationById, findOrganizationByPortalSlug } from '@/lib/organizations';

const Offer = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
  title: z.string().min(1).max(180),
  amountCadCents: z.number().int().positive(),
  provider: z.enum(['stripe', 'square']),
  squareCatalogObjectId: z.string().min(1).optional(),
  modules: z.array(z.object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(180),
    href: z.string().startsWith('/').max(500),
  }).strict()).max(100).default([]),
}).strict().superRefine((offer,ctx) => {
  if(offer.provider === 'square' && !offer.squareCatalogObjectId)
    ctx.addIssue({ code:'custom', message:'Square offer requires a trusted catalog object ID' });
});
export const SubportalManifest = z.object({
  enabled: z.literal(true),
  organizationId: z.string().regex(/^rec[A-Za-z0-9]+$/),
  orgSlug: z.string().regex(/^[a-z0-9-]+$/),
  brand: z.object({
    name: z.string().min(1).max(120),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    supportEmail: z.string().email(),
  }).strict(),
  offers: z.array(Offer).min(1).max(150),
}).strict().superRefine((data, ctx) => {
  if(new Set(data.offers.map(o=>o.id)).size !== data.offers.length)
    ctx.addIssue({code:'custom', message:'Offer ids must be unique'});
});
export type Manifest = z.infer<typeof SubportalManifest>;
export type ManifestOffer = Manifest['offers'][number];

const manifestId=(organizationId:string)=>'subportal-install-'+organizationId;
export async function installSubportalBrick(config: unknown): Promise<Manifest> {
  const manifest=SubportalManifest.parse(config);
  const org=await getOrganizationById(manifest.organizationId);
  if(!org || org.status !== 'Active' || (org.portalSlug || org.slug)!==manifest.orgSlug)
    throw new Error('Manifest does not match an active persisted organization');
  const saved=await saveStudioRecord({
    recordType:'experience', id:manifestId(manifest.organizationId),
    organizationId:manifest.organizationId, title:'Subportal Brick tenant manifest',
    payload:manifest,
  });
  if(!saved.ok || !saved.persistedToAirtable) throw new Error('Durable Subportal manifest required');
  return manifest;
}
export async function loadSubportalManifest(organizationId:string):Promise<Manifest>{
  if(!/^rec[A-Za-z0-9]+$/.test(organizationId)) throw new Error('Invalid organization ID');
  const record=await loadStudioRecordFromAirtable<unknown>('experience',manifestId(organizationId));
  const manifest=SubportalManifest.parse(record);
  if(manifest.organizationId!==organizationId) throw new Error('Manifest tenant mismatch');
  const org=await getOrganizationById(organizationId);
  if(!org || org.status!=='Active' || (org.portalSlug || org.slug)!==manifest.orgSlug)
    throw new Error('Tenant disabled or manifest slug mismatch');
  return manifest;
}
export async function loadSubportalBySlug(slug:string):Promise<Manifest>{
  if(!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid portal slug');
  const org=await findOrganizationByPortalSlug(slug);
  if(!org) throw new Error('Unknown organization');
  const manifest=await loadSubportalManifest(org.id);
  if(manifest.orgSlug!==slug) throw new Error('Tenant mismatch');
  return manifest;
}
export function requireSubportalOffer(manifest:Manifest, offerId:string, provider?:'stripe'|'square'):ManifestOffer{
  const offer=manifest.offers.find(o=>o.id===offerId);
  if(!offer || (provider && offer.provider!==provider)) throw new Error('Unmapped or disabled offer');
  return offer;
}
