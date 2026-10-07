import Link from "next/link";
import { TB3_PRODUCTS } from "../../data/products";
import { TarrisPortalFrame } from "../portal-shell";
import { PORTAL_BASE } from "../tenant-config";

const collectionGrid = "/tb3/downloads/brand-assets/TB3-COLLECTION-DROP-01-GRID.jpg";

export default function BrandAssetsPage() {
  return (
    <TarrisPortalFrame contentClassName="py-8">
      <div className="mx-auto max-w-7xl">
        <Link href={PORTAL_BASE} className="text-xs font-semibold tracking-widest text-white/60 hover:text-white">← TB3 HQ</Link>
        <header className="mt-8 border-b border-white/15 pb-6">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-[#C41E3A]">TB3 HQ · ASSET LIBRARY</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">BRAND ASSETS</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">11 approved files: 10 Drop 01 products and the collection grid.</p>
        </header>

        <section aria-labelledby="drop-01-title" className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.22em] text-white/45">FOLDER</p>
              <h2 id="drop-01-title" className="mt-1 text-2xl font-bold">Merch - Drop 01</h2>
            </div>
            <span className="text-xs text-white/50">{TB3_PRODUCTS.length} assets</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TB3_PRODUCTS.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
                <div className="aspect-[4/5] bg-white p-2">
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
                </div>
                <div className="p-3">
                  <h3 className="min-h-10 text-[10px] font-bold leading-5 tracking-wide">{product.name}</h3>
                  <a href={product.download} download className="mt-3 inline-flex w-full justify-center rounded bg-[#A51C30] px-3 py-2 text-[10px] font-bold tracking-wider text-white hover:bg-[#bd2037]">DOWNLOAD</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="collection-grid-title" className="mt-12 border-t border-white/15 pt-8">
          <p className="text-[10px] tracking-[0.22em] text-white/45">FOLDER</p>
          <h2 id="collection-grid-title" className="mt-1 text-2xl font-bold">Collection Grid</h2>
          <article className="mt-5 max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
            <img src={collectionGrid} alt="TB3 Collection Drop 01 product grid" className="w-full bg-white" loading="lazy" />
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <h3 className="text-xs font-bold tracking-wide">TB3 COLLECTION · DROP 01</h3>
              <a href={collectionGrid} download className="inline-flex justify-center rounded bg-[#A51C30] px-4 py-2 text-[10px] font-bold tracking-wider text-white hover:bg-[#bd2037]">DOWNLOAD GRID</a>
            </div>
          </article>
        </section>
      </div>
    </TarrisPortalFrame>
  );
}
