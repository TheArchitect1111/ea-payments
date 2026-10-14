import { assertPriceContract, type ClientPriceCatalog, type PriceContract } from '../../chassis/priceContract';
/** Amanda client-owned CAD offer amounts; validate against Airtable before activating billing. */
export const AMANDA_OFFERS = Object.freeze({
 'strategy-call':249,
 'strategy-90-day':2500,
 'lifeline-artist-business-launch':997,
 'aesthetikine-reset-training':997,
 'body-sculpt-practitioner-certification':2497,
 'non-surgical-bbl-training':1497,
 'wood-therapy-certification':997,
 'clinical-fat-loss-injectables':1497,
} as const);
export const AMANDA_PRICE_CONTRACT_ID='amanda-cad-v1';
export const amandaPrices:ClientPriceCatalog={clientId:'amanda-catherine',price(offerId:string):PriceContract{
 const amountCad=(AMANDA_OFFERS as Record<string,number>)[offerId];
 if(amountCad===undefined)throw Error('Amanda offer not configured: '+offerId);
 return assertPriceContract({amountCad,contractId:AMANDA_PRICE_CONTRACT_ID});
}};
