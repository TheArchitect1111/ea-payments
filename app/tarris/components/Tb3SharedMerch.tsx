"use client";
import catalog from "@/public/tb3/merch/manifest.json";

type Offer = { id: string; name: string; price: number; color: string; image: string; fourthwall_product_url?: string };
const items = catalog as Offer[];
const shop = "https://tarris-bouie-shop.fourthwall.com";

export default function Tb3SharedMerch({dark=false}:{dark?:boolean}) {
 return <section aria-label="TB3 merchandise" data-catalog-source="tb3-merch-manifest" className={dark?"text-white":"text-black"}>
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
 {items.map(item => {
   const link = item.fourthwall_product_url;
   const verifiedLink = typeof link==="string" && link.startsWith(shop+"/") ? link : null;
   return <article key={item.id} className="min-w-0">
    <div className="aspect-square overflow-hidden rounded-lg bg-white p-2"><img src={item.image} alt={item.name+" reference mockup"} loading="lazy" className="h-full w-full object-contain"/></div>
    <p className="mt-2 text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs">USD $ {item.price.toFixed(2)}</p>
    {verifiedLink ? <a href={verifiedLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded bg-[#A51C30] px-3 py-2 text-xs font-bold text-white">View on Fourthwall</a> : <p className="mt-2 text-xs opacity-65">Not yet available for purchase</p>}
   </article>;
 })}
 </div>
 </section>
}
