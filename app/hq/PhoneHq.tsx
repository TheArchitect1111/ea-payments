'use client';

import { useMemo, useState } from 'react';

type RouteEntry = { path: string; label: string };
type ProjectEntry = { id: string; name: string; domain: string; route: string; features: string[] };
type PageEdit = { title: string; hero: string; content: string; links: string };
type VideoEntry = { title: string; url: string };
type ProjectTools = { waitlistLetter: string; registerLetter: string; testPayment: boolean; videos: VideoEntry[] };
const emptyEdit: PageEdit = { title: '', hero: '', content: '', links: '' };
const emptyTools: ProjectTools = { waitlistLetter: '', registerLetter: '', testPayment: false, videos: [] };
const buttonClass = 'min-h-20 w-full rounded-2xl border border-white/15 bg-[#171717] px-4 text-left text-sm font-bold text-white active:scale-[.99]';

export default function PhoneHq({ routes, projects }: { routes: RouteEntry[]; projects: ProjectEntry[] }) {
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [edit, setEdit] = useState<PageEdit>(emptyEdit);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [tools, setTools] = useState<ProjectTools>(emptyTools);
  const [toolTitle, setToolTitle] = useState('');
  const [toolUrl, setToolUrl] = useState('');
  const filtered = useMemo(() => routes.filter(({ path, label }) => (path + ' ' + label).toLowerCase().includes(query.toLowerCase())), [routes, query]);

  async function selectPage(path: string) {
    setSelectedPath(path); setEdit(emptyEdit); setMessage('Loading saved fields…');
    try {
      const response = await fetch('/client/api/editor?path=' + encodeURIComponent(path), { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load page.');
      setEdit({ ...emptyEdit, ...(body.edit ?? {}) }); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load page.'); }
  }
  async function save() {
    if (!selectedPath) return;
    setBusy(true); setMessage('Saving…');
    try {
      const response = await fetch('/client/api/editor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selectedPath, ...edit }) });
      const body = await response.json().catch(() => ({}));
      setMessage(response.ok ? (body.message || 'Saved.') : body.error || 'Save failed.');
    } catch { setMessage('Could not save. Check the connection and try again.'); }
    finally { setBusy(false); }
  }
  async function openProject(project: ProjectEntry) {
    setSelectedProject(project); setTools(emptyTools); setMessage('Loading project settings…');
    try {
      const response = await fetch('/client/api/project-tools?projectId=' + encodeURIComponent(project.id), { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Project settings could not be loaded.');
      setTools({ ...emptyTools, ...(body.tools ?? {}) }); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Project settings could not be loaded.'); }
  }
  async function saveTools() {
    if (!selectedProject) return;
    setBusy(true); setMessage('Saving project settings…');
    try {
      const response = await fetch('/client/api/project-tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProject.id, tools }) });
      const body = await response.json().catch(() => ({}));
      setMessage(response.ok ? 'Project settings saved.' : body.error || 'Save failed.');
    } catch { setMessage('Project settings could not be saved.'); }
    finally { setBusy(false); }
  }
  function moveVideo(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= tools.videos.length) return;
    const videos = [...tools.videos]; [videos[index], videos[destination]] = [videos[destination], videos[index]];
    setTools({ ...tools, videos });
  }
  const isAmandaPage = /amanda/i.test(selectedPath);

  return <main className="min-h-screen bg-[#0a0a0a] px-4 pb-8 text-white">
    <header className="mx-auto flex min-h-20 max-w-xl items-center justify-between border-b border-white/10"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/50">My Projects HQ</p><h1 className="text-xl font-black">Fix Anything</h1></div><a href="/admin" className="grid min-h-20 min-w-20 place-items-center rounded-xl border border-white/15 text-sm font-bold">Admin</a></header>
    <section className="mx-auto grid max-w-xl gap-3 pt-4">
      <h2 className="text-2xl font-black">EDIT ANY PAGE</h2>
      <p className="text-sm text-white/60">Choose a page, make the change, and save.</p>
      <label className="grid gap-2 text-sm font-bold">Find a page<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search routes" className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-4 text-base text-white" /></label>
      <div className="grid max-h-[34dvh] gap-2 overflow-y-auto rounded-2xl border border-white/10 p-2" aria-label="Pages">
        {filtered.map((route) => <button key={route.path} type="button" onClick={() => void selectPage(route.path)} aria-pressed={selectedPath === route.path} className={buttonClass + (selectedPath === route.path ? ' border-[#df5a6c] bg-[#2a171a]' : '')}><span className="block">{route.label}</span><span className="mt-1 block text-xs font-normal text-white/50">{route.path}</span></button>)}
        {filtered.length === 0 && <p className="p-3 text-sm text-white/60">No matching pages.</p>}
      </div>
      {selectedPath && <section className="grid gap-3 rounded-2xl border border-white/10 bg-[#111] p-4"><h3 className="font-black">{selectedPath}</h3>
        <label className="grid gap-1 text-sm font-bold">Title<input value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-3 text-base" /></label>
        <label className="grid gap-1 text-sm font-bold">{isAmandaPage ? 'Hero Image' : 'Hero / Videos'}<input value={edit.hero} onChange={(event) => setEdit({ ...edit, hero: event.target.value })} placeholder={isAmandaPage ? 'Image URL' : 'Image or video URL'} className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-3 text-base" /></label>
        <label className="grid gap-1 text-sm font-bold">Content<textarea value={edit.content} onChange={(event) => setEdit({ ...edit, content: event.target.value })} rows={5} className="rounded-xl border border-white/20 bg-[#171717] p-3 text-base" /></label>
        <label className="grid gap-1 text-sm font-bold">Links<textarea value={edit.links} onChange={(event) => setEdit({ ...edit, links: event.target.value })} placeholder="One URL per line" rows={3} className="rounded-xl border border-white/20 bg-[#171717] p-3 text-base" /></label>
        <button type="button" disabled={busy} onClick={() => void save()} className="min-h-20 rounded-2xl bg-[#a51c30] px-4 font-black disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
      </section>}
    </section>

    <section className="mx-auto mt-6 grid max-w-xl gap-3 border-t border-white/10 pt-5"><h2 className="text-xl font-black">Discovered projects</h2>
      {projects.map((project) => <article key={project.id} className="rounded-2xl border border-white/10 bg-[#111] p-3"><button type="button" onClick={() => void openProject(project)} aria-expanded={selectedProject?.id === project.id} className={buttonClass}><span className="block">{project.name}</span><span className="mt-1 block text-xs font-normal text-white/50">{project.domain || project.route}</span></button>
        {selectedProject?.id === project.id && <div className="mt-3 grid gap-3 rounded-xl border border-white/10 p-3">
          {project.features.includes('letters') && <><label className="grid gap-1 text-sm font-bold">Warm Wait List Letter<textarea value={tools.waitlistLetter} onChange={(event) => setTools({ ...tools, waitlistLetter: event.target.value })} rows={5} className="rounded-xl border border-white/20 bg-[#171717] p-3" /></label><label className="grid gap-1 text-sm font-bold">Separate Register for Classes Letter<textarea value={tools.registerLetter} onChange={(event) => setTools({ ...tools, registerLetter: event.target.value })} rows={5} className="rounded-xl border border-white/20 bg-[#171717] p-3" /></label></>}
          {project.features.includes('test-payment') && <label className="flex min-h-20 items-center gap-3 rounded-xl border border-white/15 px-3 text-sm font-bold"><input type="checkbox" checked={tools.testPayment} onChange={(event) => setTools({ ...tools, testPayment: event.target.checked })} className="size-6" />$1 Registration Test</label>}
          {project.features.includes('video-library') && <div className="grid gap-3"><h3 className="font-black">Videos</h3><label className="grid gap-1 text-sm font-bold">Video title<input value={toolTitle} onChange={(event) => setToolTitle(event.target.value)} className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-3" /></label><label className="grid gap-1 text-sm font-bold">Video URL<input value={toolUrl} onChange={(event) => setToolUrl(event.target.value)} placeholder="https://…" className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-3" /></label><button type="button" onClick={() => { if (!toolTitle.trim() || !toolUrl.trim()) return; setTools({ ...tools, videos: [...tools.videos, { title: toolTitle.trim(), url: toolUrl.trim() }] }); setToolTitle(''); setToolUrl(''); }} className="min-h-20 rounded-xl border border-white/20 font-bold">Add video</button>
            {tools.videos.map((video, index) => <div key={video.url + index} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-xl border border-white/10 p-2"><span className="break-all text-sm">{video.title}<small className="block text-white/50">{video.url}</small></span><button type="button" aria-label="Move video up" onClick={() => moveVideo(index, -1)} className="min-h-20 min-w-12 rounded-lg border border-white/20">↑</button><button type="button" aria-label="Move video down" onClick={() => moveVideo(index, 1)} className="min-h-20 min-w-12 rounded-lg border border-white/20">↓</button><button type="button" aria-label="Remove video" onClick={() => setTools({ ...tools, videos: tools.videos.filter((_, itemIndex) => itemIndex !== index) })} className="min-h-20 min-w-12 rounded-lg border border-white/20">×</button></div>)}</div>}
          {(project.features.includes('letters') || project.features.includes('test-payment') || project.features.includes('video-library')) && <button type="button" disabled={busy} onClick={() => void saveTools()} className="min-h-20 rounded-xl bg-[#a51c30] font-black">{busy ? 'Saving…' : 'Save project settings'}</button>}
          <a href={project.route} className="grid min-h-20 place-items-center rounded-xl border border-white/20 font-bold">Open project page</a>
        </div>}
      </article>)}
      {projects.length === 0 && <p className="text-sm text-white/60">No project portals found.</p>}
      {message && <p role="status" className="rounded-xl border border-white/10 bg-[#171717] p-3 text-sm">{message}</p>}
    </section>
  </main>;
}
