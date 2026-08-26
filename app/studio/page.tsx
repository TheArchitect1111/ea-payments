import Link from "next/link";

const work = [
  { type: "EVENT CREATIVE", title: "Experiences people notice.", copy: "Signature event campaigns, invitations, flyers and visual systems built to make the first impression feel like the event already started.", tone: "dark" },
  { type: "WEB EXPERIENCES", title: "Websites with a point of view.", copy: "Editorial digital experiences designed around the person on the other side of the screen, not a template.", tone: "light" },
  { type: "PORTALS + SYSTEMS", title: "Beautiful on the surface. Intelligent underneath.", copy: "Client portals and operational experiences that turn great design into useful infrastructure.", tone: "gold" },
  { type: "PRESENTATIONS", title: "Make the room lean in.", copy: "Proposals, presentations and visual storytelling that make complex ideas feel inevitable.", tone: "light" },
];

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#111] selection:bg-[#111] selection:text-white">
      <style>{`
        .studio-serif{font-family:Iowan Old Style,Palatino Linotype,Book Antiqua,Palatino,Georgia,serif}
        .studio-sans{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif}
        .hero-word{font-size:clamp(4.8rem,17vw,13rem);line-height:.72;letter-spacing:-.075em}
        .display{font-size:clamp(3rem,8vw,7rem);line-height:.9;letter-spacing:-.055em}
        .reveal{transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s}.reveal:hover{transform:translateY(-8px)}
      `}</style>
      <section className="studio-sans min-h-[94vh] flex flex-col px-6 md:px-12 lg:px-20 pt-8 pb-10">
        <nav className="flex items-center justify-between text-[11px] tracking-[.22em] font-semibold uppercase">
          <span>Efficiency Architects</span><span className="text-black/45">Creative Studio</span>
        </nav>
        <div className="flex-1 flex flex-col justify-center max-w-[1500px] w-full mx-auto py-20">
          <p className="text-xs md:text-sm tracking-[.3em] uppercase mb-9 text-black/50">You noticed the work.</p>
          <h1 className="hero-word studio-serif font-normal">Imagine what<br/><span className="italic">we could create.</span></h1>
          <div className="mt-14 md:mt-20 grid md:grid-cols-2 gap-8 items-end">
            <p className="text-xl md:text-3xl leading-tight max-w-xl font-medium">Design that earns attention.<br/>Digital experiences that earn trust.</p>
            <p className="md:justify-self-end max-w-sm text-base leading-relaxed text-black/55">Creative direction, event design, websites, portals, presentations and intelligent digital experiences, built as one connected system.</p>
          </div>
        </div>
        <div className="flex justify-between text-[10px] tracking-[.18em] uppercase text-black/45"><span>Scroll to explore</span><span>↓</span></div>
      </section>

      <section className="bg-[#101010] text-white px-6 md:px-12 lg:px-20 py-28 md:py-44">
        <div className="max-w-[1500px] mx-auto">
          <p className="studio-sans text-xs tracking-[.3em] uppercase text-white/45 mb-12">Featured / Twin City Kappas</p>
          <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-14 lg:gap-24 items-end">
            <div>
              <div className="aspect-[4/5] max-w-3xl relative overflow-hidden bg-[radial-gradient(circle_at_65%_25%,#7a6541_0%,#2c2922_25%,#111_58%,#050505_100%)]">
                <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-14">
                  <div className="studio-sans text-[10px] tracking-[.28em] uppercase text-white/60">Twin City Kappas · Winston-Salem</div>
                  <div><div className="studio-serif text-[clamp(5rem,13vw,10rem)] leading-[.72] tracking-[-.07em]">GOLF</div><div className="studio-sans mt-7 flex gap-6 text-[10px] md:text-xs tracking-[.16em] uppercase text-white/70"><span>March 12</span><span>8:00 AM</span><span>$85 / Player</span></div></div>
                </div>
              </div>
            </div>
            <div className="pb-4">
              <p className="studio-sans text-xs tracking-[.25em] uppercase text-[#c6a15b] mb-6">Event Creative</p>
              <h2 className="studio-serif display">Not a flyer.<br/><span className="italic">An entrance.</span></h2>
              <p className="studio-sans mt-9 text-lg leading-relaxed text-white/55 max-w-lg">The first touchpoint should carry the same energy as the experience itself. We build event creative to stop the scroll, start conversations and make the organization behind it unforgettable.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-sans px-6 md:px-12 lg:px-20 py-28 md:py-44">
        <div className="max-w-[1500px] mx-auto">
          <p className="text-xs tracking-[.3em] uppercase text-black/45 mb-16">What we create</p>
          <div className="border-t border-black/15">
            {work.map((item,i)=>(
              <article key={item.type} className="reveal grid md:grid-cols-[.25fr_.75fr] gap-8 py-12 md:py-16 border-b border-black/15">
                <div className="text-[10px] tracking-[.22em] uppercase text-black/45">0{i+1} / {item.type}</div>
                <div className="grid lg:grid-cols-[1fr_.55fr] gap-8 lg:gap-20">
                  <h3 className="studio-serif text-4xl md:text-6xl tracking-[-.04em] leading-[.95]">{item.title}</h3>
                  <p className="text-base leading-relaxed text-black/55 max-w-md">{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ded4c1] px-6 md:px-12 lg:px-20 py-28 md:py-44">
        <div className="max-w-[1500px] mx-auto grid lg:grid-cols-2 gap-16 items-end">
          <div><p className="studio-sans text-xs tracking-[.3em] uppercase text-black/45 mb-10">The difference</p><h2 className="studio-serif display">Creative on top.<br/><span className="italic">Smartchitecture™ underneath.</span></h2></div>
          <p className="studio-sans text-lg md:text-xl leading-relaxed text-black/60 max-w-xl lg:justify-self-end">We do not stop when something looks beautiful. We connect the experience to the next action, the next conversation and the systems that make the business work.</p>
        </div>
      </section>

      <section className="studio-sans bg-[#f7f6f2] px-6 md:px-12 lg:px-20 py-28 md:py-44 text-center">
        <div className="max-w-5xl mx-auto"><p className="text-xs tracking-[.3em] uppercase text-black/45 mb-10">Have something worth noticing?</p><h2 className="studio-serif display">Let’s make people<br/><span className="italic">ask who created it.</span></h2><Link href="/contact" className="inline-flex mt-14 rounded-full bg-black text-white px-9 py-4 text-sm font-semibold hover:scale-[1.03] transition-transform">Start a Project →</Link></div>
      </section>
      <footer className="studio-sans px-6 md:px-12 lg:px-20 py-8 border-t border-black/10 flex flex-col md:flex-row gap-3 justify-between text-[10px] tracking-[.18em] uppercase text-black/45"><span>Efficiency Architects · Creative Studio</span><span>Designed with intention. Built with intelligence.</span></footer>
    </main>
  );
}
