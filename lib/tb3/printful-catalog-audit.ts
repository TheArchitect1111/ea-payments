import 'server-only';
import catalog from '../../public/tb3/merch/manifest.json';
import {tb3Printful} from './printful-client';

type SyncProduct = {id:number;name:string;is_ignored?:boolean;synced?:number;variants?:number};
type SyncVariant = {id:number;variant_id:number;is_ignored?:boolean;availability_status?:string;files?:unknown[]};
type SyncDetail = {sync_variants?:SyncVariant[]};

export async function auditTb3PrintfulCatalog() {
  const synced:SyncProduct[]=[];
  for(let offset=0;offset<1000;offset+=100) {
    const page=await tb3Printful<SyncProduct[]>('/store/products?limit=100&offset='+offset);
    if(!Array.isArray(page)) throw new Error('Invalid Printful product list.');
    synced.push(...page);
    if(page.length<100)break;
    if(offset===900)throw new Error('Printful catalog pagination limit reached.');
  }
  const available=new Map(synced.map(product=>[product.id,product]));
  const products: {id:string;productId:number;status:string;missingVariants:number[]}[]=[];
  for(const item of catalog) {
    const storeProduct=available.get(item.printfulProductId);
    if(!storeProduct || storeProduct.is_ignored===true ||
       (typeof storeProduct.synced==='number' && storeProduct.synced<item.variants.length)) {
      products.push({id:item.id,productId:item.printfulProductId,status:'missing',
        missingVariants:item.variants.map(v=>v.id)});
      continue;
    }
    const detail=await tb3Printful<SyncDetail>('/store/products/'+item.printfulProductId);
    if(!Array.isArray(detail.sync_variants))throw new Error('Invalid Printful variant list.');
    const variants=new Map(detail.sync_variants.map(v=>[v.id,v]));
    const missingVariants=item.variants.filter(v=>{
      const actual=variants.get(v.id);
      return !actual || actual.variant_id!==v.catalogVariantId ||
        actual.is_ignored===true || actual.availability_status==='discontinued' ||
        actual.availability_status==='out_of_stock' ||
        actual.availability_status==='temporary_out_of_stock' ||
        !Array.isArray(actual.files) || actual.files.length===0;
    }).map(v=>v.id);
    products.push({id:item.id,productId:item.printfulProductId,
      status:missingVariants.length?'variant-mismatch':'matched',missingVariants});
  }
  const matchedProductCount=products.filter(p=>p.status==='matched').length;
  return {
    source:'live-printful-api',store:'tb3',configuredProductCount:catalog.length,
    matchedProductCount,verified:matchedProductCount===catalog.length,
    products,
    note:'Identity, blank variants, availability and file presence only. Print quality, taxes, manufacturing costs, shipping and billing require independent verification.',
  };
}
