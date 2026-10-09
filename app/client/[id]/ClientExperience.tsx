import type { PageContent } from '../_lib/page-content';

function safeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') ? trimmed : '';
}

export default function ClientExperience({ projectId, projectName, pageContent }: { projectId: string; projectName: string; pageContent: PageContent | null }) {
  const hero = safeUrl(pageContent?.hero || '');
  const links = (pageContent?.links || '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean).map(safeUrl).filter(Boolean);
  const isVideo = /\.(?:mp4|webm)(?:[?#].*)?$/i.test(hero);
  return <main className="grid min-h-screen place-items-center bg-[#f6f0e6] px-4 py-6 text-[#17211c]">
    <section className="w-full max-w-xl rounded-3xl bg-[#fffdf8] p-6 shadow-sm">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-[#596b5b]">Client page</p>
      <h1 className="mt-3 text-center text-3xl font-black">{pageContent?.title || projectName}</h1>
      {hero && (isVideo
        ? <video className="mt-5 max-h-96 w-full rounded-xl bg-black object-contain" controls playsInline src={hero} />
        : <img className="mt-5 max-h-96 w-full rounded-xl object-contain" src={hero} alt="" />)}
      {pageContent?.content && <p className="mt-5 whitespace-pre-wrap leading-6">{pageContent.content}</p>}
      {links.length > 0 && <nav aria-label="Page links" className="mt-5 grid gap-2">{links.map((href) => <a key={href} href={href} className="grid min-h-20 place-items-center rounded-xl bg-[#596b5b] px-4 text-center font-bold text-white">{href}</a>)}</nav>}
      {!pageContent && <p className="mt-3 text-center leading-6 text-black/60">This client route is clear and ready for its live page.</p>}
      <p className="mt-4 text-center text-xs text-black/40">{projectId}</p>
      <a href="/hq" className="mt-5 grid min-h-20 place-items-center rounded-xl border border-black/20 px-4 font-bold">Open HQ</a>
    </section>
  </main>;
}
