export default function ClientExperience({ projectId, projectName }: { projectId: string; projectName: string }) {
  return <main className="grid min-h-screen place-items-center bg-[#f6f0e6] px-4 text-[#17211c]">
    <section className="w-full max-w-xl rounded-3xl bg-[#fffdf8] p-6 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#596b5b]">Client page</p>
      <h1 className="mt-3 text-3xl font-black">{projectName}</h1>
      <p className="mt-3 leading-6 text-black/60">This client route is clear and ready for its live page.</p>
      <p className="mt-2 text-xs text-black/40">{projectId}</p>
      <a href="/hq" className="mt-6 grid min-h-20 place-items-center rounded-xl bg-[#596b5b] px-4 font-bold text-white">Open HQ</a>
    </section>
  </main>;
}
