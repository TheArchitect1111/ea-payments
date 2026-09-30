// app/tarris/page.tsx - PUBLIC - MORE THAN A GAME - Production Ready - NO IMAGES BUNDLED
// This is what tb3.online / www.tb3.online shows (via vercel.json rewrite to /tarris/future, but this is the root public)
// WIRED: Public page -> ENTER TB3 HQ -> /tarris/future (portal)

import Link from "next/link";

export default function TarrisPublicPage() {
  return (
    <div className="min-h-screen bg-[#070708] text-white">
      {/* NAV */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="font-black tracking-tight">TB3 <span className="text-[#c41e3a]">.</span></div>
        <div className="text-[10px] tracking-[0.3em] opacity-60">MORE THAN A GAME</div>
      </nav>

      {/* HERO */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.4em] opacity-60 mb-4">TARRIS BOUIE III</p>
          <h1 className="text-7xl lg:text-8xl font-black leading-[0.85] tracking-tight">
            MORE<br/>
            THAN A<br/>
            <span className="text-[#c41e3a]">GAME</span><span className="text-white">.</span>
          </h1>
          <p className="mt-6 text-lg opacity-70 max-w-md leading-relaxed">
            Discipline. Determination. Development. Destiny.<br/>
            <span className="italic">A bigger purpose than basketball.</span>
          </p>

          <div className="mt-10 flex gap-4">
            <Link href="/tarris/future" className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm tracking-wide hover:bg-zinc-200 transition">
              ENTER TB3 HQ →
            </Link>
            <div className="flex items-center gap-3 text-[11px] opacity-60">
              <span>PLAN.</span><span>PREPARE.</span><span>PERFORM.</span><span>BUILD.</span>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 text-[11px]">
            <div><p className="font-bold">ACADEMICS</p><p className="opacity-60">On Track</p></div>
            <div><p className="font-bold">TRAINING</p><p className="opacity-60">On Track</p></div>
            <div><p className="font-bold">NIL & BRAND</p><p className="opacity-60">In Progress</p></div>
          </div>
        </div>

        {/* IMAGE PLACEHOLDER - PUBLIC HERO - MOM-SAFE */}
        <div className="w-full aspect-[4/5] bg-[#111] rounded-[32px] border border-[#222] border-dashed flex items-center justify-center text-center p-8">
          <div className="text-xs opacity-50 leading-relaxed">
            PUBLIC HERO IMAGE<br/>
            Replace: /images/tarris/YOUR_PUBLIC_HERO.jpg<br/>
            Mom-safe: polo or TB3 tee, warm smile, arms crossed or hands in pockets<br/>
            No: tank, sweat, locker room, intense stare<br/>
            Size: 800x1000 recommended
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-10 text-[10px] opacity-30 tracking-wide">
        WIRED: / (tb3.online via rewrites) → /tarris/future (portal) → /tarris/future/agreement | Design: Approved MORE THAN A GAME | Images: placeholders for you to replace
      </footer>
    </div>
  );
}
