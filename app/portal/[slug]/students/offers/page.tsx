import {notFound} from 'next/navigation';
import {loadSubportalBySlug} from '@/lib/subportal/manifest';
import CheckoutCard from '../CheckoutCard';
export const dynamic='force-dynamic';
export default async function StudentOffers({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const manifest=await loadSubportalBySlug(slug).catch(()=>null);
  if(!manifest)notFound();
  return <main style={{background:'#f9f7f3',minHeight:'100vh',padding:'38px 20px'}}>
    <section style={{maxWidth:1000,margin:'auto'}}>
      <p style={{fontSize:13,color:manifest.brand.color}}>{manifest.brand.name}</p>
      <h1 style={{fontFamily:'Georgia,serif',fontSize:34}}>Programs and enrollment</h1>
      <p>Choose your program. A personal student portal will be provisioned after verified payment.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,marginTop:25}}>
        {manifest.offers.map(offer=><CheckoutCard key={offer.id} orgSlug={manifest.orgSlug}
          offerId={offer.id} title={offer.title} amountCadCents={offer.amountCadCents}
          provider={offer.provider}/>)}
      </div>
    </section>
  </main>;
}