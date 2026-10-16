/** Local contract checks are NOT payment or delivery certification evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {SubportalManifest,requireSubportalOffer} from '../lib/subportal/manifest';
import {createSubportalReceipt,subportalPdfChecksum} from '../lib/subportal/receipt';
const install={
  enabled:true as const,organizationId:'recGenericTenant1111',orgSlug:'generic-tenant',
  brand:{name:'Generic Academy',color:'#224466',supportEmail:'support@example.invalid'},
  offers:[{id:'foundations',title:'Foundations',amountCadCents:24900,provider:'stripe' as const,
    modules:[{id:'intro',title:'Orientation',href:'/portal/generic-tenant/learning'}]},
    {id:'practice',title:'Practice',amountCadCents:49700,provider:'square' as const,
      squareCatalogObjectId:'SQ_VARIATION_GENERIC',modules:[]}],
};
test('generic manifest accepts mapped Stripe and Square offers',()=>{
  const m=SubportalManifest.parse(install);
  assert.equal(requireSubportalOffer(m,'foundations','stripe').amountCadCents,24900);
  assert.equal(requireSubportalOffer(m,'practice','square').squareCatalogObjectId,'SQ_VARIATION_GENERIC');
});
test('rejects title-derived, unmapped, and cross-provider products',()=>{
  const m=SubportalManifest.parse(install);
  assert.throws(()=>requireSubportalOffer(m,'title:Practice','square'));
  assert.throws(()=>requireSubportalOffer(m,'foundations','square'));
  const unsafe={...install,offers:[{id:'practice',title:'Practice',amountCadCents:49700,provider:'square',modules:[]}]};
  assert.equal(SubportalManifest.safeParse(unsafe).success,false);
});
test('rejects duplicate offer IDs and disabled install',()=>{
  assert.equal(SubportalManifest.safeParse({...install,offers:[install.offers[0],install.offers[0]]}).success,false);
  assert.equal(SubportalManifest.safeParse({...install,enabled:false}).success,false);
});
test('real PDF bytes contain receipt details and produce stable checksum',()=>{
  const info={studentName:'Test Student',brandName:'Generic Academy',offerTitle:'Foundations',
    amountCadCents:24900,provider:'stripe' as const,paymentReference:'pi_123456789abcdef',
    paidAt:'2026-10-16T12:00:00.000Z'};
  const pdf=createSubportalReceipt(info);
  assert.ok(pdf.toString('ascii',0,8).startsWith('%PDF-1.'));
  assert.match(pdf.toString('ascii'),/249\.00/);
  assert.match(pdf.toString('ascii'),/pi_123456789abcdef/);
  assert.match(pdf.toString('ascii'),/%%EOF/);
  assert.equal(subportalPdfChecksum(pdf),subportalPdfChecksum(createSubportalReceipt(info)));
});
