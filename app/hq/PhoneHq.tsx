'use client';

import { useEffect, useMemo, useState } from 'react';
import { upload } from '@vercel/blob/client';
import type { ContentAudience, ContentStatus, ContentWhen, HqItem, HqProject, ShelfId } from '../client/_lib/hq-store';

const shelves: Array<{ id: ShelfId; label: string; detail: string }> = [
  { id: 'top', label: 'TOP', detail: 'Hero / Videos' },
  { id: 'middle', label: 'MIDDLE', detail: 'Warm Letter / Text Blocks' },
  { id: 'form', label: 'FORM', detail: 'Intake / Registration Forms' },
  { id: 'gallery', label: 'GALLERY', detail: 'Photos / Film Vault' },
  { id: 'footer', label: 'FOOTER', detail: 'Contact / Links' },
];
const whenOptions: Array<[ContentWhen, string]> = [
  ['always', 'Always on homepage'], ['register', 'When they tap Register'], ['waitlist', 'When they tap Waitlist'],
  ['foundry', 'When they tap Foundry'], ['multiple', 'When they tap multiple'],
];

const buttonClass = 'min-h-20 w-full rounded-2xl border border-white/15 bg-[#171717] px-4 text-left text-sm font-bold text-white active:scale-[.99]';

function fileToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed.')), type, quality));
}

async function optimizeImage(file: File): Promise<File[]> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    if (!/\.heic$|\.heif$/i.test(file.name) && !/heic|heif/i.test(file.type)) throw error;
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const jpeg = Array.isArray(converted) ? converted[0] : converted;
    bitmap = await createImageBitmap(jpeg);
  }
  const source = bitmap;
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot optimize the image.');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  const result: File[] = [];
  for (const [type, name] of [['image/webp', 'webp'], ['image/jpeg', 'jpg']] as const) {
    let quality = 0.82;
    let blob = await fileToBlob(canvas, type, quality);
    while (blob.size > 300 * 1024 && quality > 0.35) {
      quality -= 0.08;
      blob = await fileToBlob(canvas, type, quality);
    }
    if (blob.size > 300 * 1024) throw new Error('This image cannot be reduced below 300 KB at 1600 px.');
    result.push(new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${name}`, { type }));
  }
  return result;
}

function shortTime(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 1 ? 'just now' : minutes === 1 ? '1 min ago' : `${minutes} min ago`;
}

export default function PhoneHq() {
  const [projects, setProjects] = useState<HqProject[]>([]);
  const [projectId, setProjectId] = useState('tb3');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newProject, setNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [shelf, setShelf] = useState<ShelfId>('top');
  const [editing, setEditing] = useState<HqItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [destinationEmails, setDestinationEmails] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');

  const project = useMemo(() => projects.find((entry) => entry.id === projectId) ?? null, [projects, projectId]);
  const currentShelf = shelves.find((entry) => entry.id === shelf)!;

  async function loadProjects() {
    setLoading(true);
    const response = await fetch('/client/api/projects', { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || 'Projects could not be loaded.');
    else setProjects(body.projects ?? []);
    setLoading(false);
  }

  useEffect(() => { void loadProjects(); }, []);

  async function persist(next: HqProject, status?: ContentStatus) {
    setSaving(true); setMessage('');
    const response = await fetch(`/client/api/projects/${next.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: { ...next, items: next.items.map((item) => item.id === editing?.id && status ? { ...item, status, scheduledAt: undefined } : item) } }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || 'Save failed.');
    else {
      setProjects((items) => items.map((item) => item.id === next.id ? body.project : item));
      if (editing && status) setEditing({ ...editing, status, scheduledAt: undefined });
      setMessage(status === 'live' ? 'Published. The client preview is live.' : status === 'draft' ? 'Draft saved.' : 'Saved.');
    }
    setSaving(false);
  }

  async function createProject() {
    setSaving(true); setMessage('');
    const response = await fetch('/client/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, domain: newDomain }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || 'Project could not be created.');
    else { setProjects((items) => [...items, body.project]); setProjectId(body.project.id); setNewProject(false); setNewName(''); setNewDomain(''); setMessage('Project created with five shelves.'); }
    setSaving(false);
  }

  async function undo() {
    if (!project) return;
    const response = await fetch(`/client/api/projects/${project.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'undo' }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || 'Undo failed.');
    else { setProjects((items) => items.map((item) => item.id === project.id ? body.project : item)); setMessage('Last change undone.'); }
  }

  function newItem() {
    if (!project) return;
    const now = new Date().toISOString();
    const item: HqItem = { id: `item-${Date.now()}`, shelf, title: '', text: '', when: 'always', audience: 'everyone', status: 'draft', updatedAt: now, updatedBy: 'Robert' };
    setEditing(item);
    setDestinationEmails(''); setSheetUrl('');
  }

  function editItem(item: HqItem) {
    setEditing({ ...item });
    const destination = project?.formDestinations[item.id];
    setDestinationEmails(destination?.emails.join(', ') ?? ''); setSheetUrl(destination?.sheetUrl ?? '');
  }

  async function saveItem(status: ContentStatus) {
    if (!project || !editing) return;
    const now = new Date().toISOString();
    const savedItem = { ...editing, title: editing.title.trim() || 'Untitled', status, scheduledAt: undefined, updatedAt: now, updatedBy: 'Robert' };
    const next: HqProject = {
      ...project,
      items: [...project.items.filter((item) => item.id !== editing.id), savedItem],
      formDestinations: editing.shelf === 'form' ? {
        ...project.formDestinations,
        [editing.id]: { emails: destinationEmails.split(',').map((email) => email.trim()).filter(Boolean), ...(sheetUrl.trim() ? { sheetUrl: sheetUrl.trim() } : {}) },
      } : project.formDestinations,
    };
    await persist(next, status);
  }

  async function scheduleTomorrow() {
    if (!project || !editing) return;
    const scheduled = new Date(); scheduled.setDate(scheduled.getDate() + 1); scheduled.setHours(9, 0, 0, 0);
    const item = { ...editing, title: editing.title.trim() || 'Untitled', status: 'draft' as const, scheduledAt: scheduled.toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'Robert' };
    await persist({ ...project, items: [...project.items.filter((entry) => entry.id !== item.id), item] });
  }

  async function uploadPhoto(file?: File) {
    if (!project || !file) return;
    setOptimizing(true); setMessage('Optimizing…');
    try {
      const files = await optimizeImage(file);
      const uploaded = await Promise.all(files.map((entry) => upload(`public/uploads/${project.id}/${entry.name}`, entry, {
        access: 'public', handleUploadUrl: '/client/api/media',
        clientPayload: JSON.stringify({ projectId: project.id, kind: 'image' }),
      })));
      setMessage('Optimized JPG + WebP uploaded. Add the item and save it to show the photo in the client link.');
      setEditing((current) => current ? { ...current, mediaUrl: uploaded.find((entry) => entry.pathname.endsWith('.webp'))?.url, mediaType: 'image' } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Photo optimization failed.'); }
    setOptimizing(false);
  }

  async function uploadVideo(file?: File) {
    if (!project || !file) return;
    if (file.size > 250 * 1024 * 1024) { setMessage('Video exceeds the 250 MB upload limit.'); return; }
    setOptimizing(true); setMessage('Uploading and transcoding…');
    try {
      const source = await upload(`data/upload-staging/${project.id}/${file.name}`, file, {
        access: 'private', handleUploadUrl: '/client/api/media',
        clientPayload: JSON.stringify({ projectId: project.id, kind: 'video' }),
      });
      const response = await fetch('/client/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'transcode', projectId: project.id, pathname: source.pathname, filename: file.name }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Video transcode failed.');
      setEditing((current) => current ? { ...current, mediaUrl: result.video.url, posterUrl: result.poster.url, mediaType: 'video' } : current);
      setMessage('H.264 video and poster are ready. Save the item to add it to the client link.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Video upload failed.'); }
    setOptimizing(false);
  }

  const whenLabel = (value: ContentWhen) => whenOptions.find(([id]) => id === value)?.[1] ?? value;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-xl px-4 pb-12 pt-5">
        <header className="border-b border-white/15 pb-4">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#df5a6c]">Robert · Universal edit door</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">My Projects HQ</h1>
          <p className="text-lg font-bold text-white/65">Fix Anything in 30s</p>
        </header>

        <section className="mt-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/55" htmlFor="project-select">Choose a project</label>
          <select id="project-select" value={projectId} onChange={(event) => { setProjectId(event.target.value); setEditing(null); }} className="min-h-20 w-full rounded-2xl border border-white/20 bg-[#171717] px-4 text-lg font-bold" aria-label="Project selector">
            {projects.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.domain}</option>)}
          </select>
          <button type="button" className={`${buttonClass} mt-3`} onClick={() => setNewProject(true)}>＋ Add New Project</button>
          {project && <p className="mt-2 break-all text-xs text-white/55">Client link: <a className="underline" href={`/client/${project.id}`} target="_blank" rel="noreferrer">/client/{project.id}</a> · Edit: /hq</p>}
        </section>

        {project && <>
          <section className="mt-5 rounded-2xl border border-white/15 bg-[#141414] p-4">
            <div className="flex items-center justify-between gap-2">
              <div><p className="text-xs font-bold text-white/50">LAST CHANGE</p><p className="mt-1 text-sm font-bold">{shortTime(project.updatedAt)} by {project.updatedBy}</p></div>
              <button type="button" onClick={undo} className="min-h-20 rounded-xl border border-[#df5a6c] px-3 text-xs font-black">Undo Last Change</button>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><div><p className="text-sm font-bold">Lock Design: {project.lockDesign ? 'ON' : 'OFF'}</p><p className="text-xs text-white/50">Only an admin can change TOP branding.</p></div><button type="button" onClick={() => void persist({ ...project, lockDesign: !project.lockDesign })} aria-pressed={project.lockDesign} className={`min-h-20 rounded-xl px-4 text-xs font-black ${project.lockDesign ? 'bg-green-800' : 'bg-white/15'}`}>{project.lockDesign ? 'ON' : 'OFF'}</button></div>
          </section>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#111] p-4">
            <h2 className="text-lg font-black">Content shelves</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {shelves.map((entry) => <button key={entry.id} type="button" onClick={() => setShelf(entry.id)} aria-pressed={shelf === entry.id} className={`min-h-20 rounded-xl border px-3 text-left ${shelf === entry.id ? 'border-[#df5a6c] bg-[#301319]' : 'border-white/10 bg-[#191919]'}`}><span className="block text-xs font-black">{entry.label}</span><span className="text-[11px] text-white/55">{entry.detail}</span></button>)}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-[#df5a6c]">{currentShelf.label}</p><p className="text-sm font-bold">{currentShelf.detail}</p></div><button type="button" onClick={newItem} className="min-h-20 rounded-xl bg-[#a51c30] px-4 text-sm font-black">＋ Add</button></div>
            <ul className="mt-3 grid gap-2">{project.items.filter((item) => item.shelf === shelf).map((item) => <li key={item.id}><button type="button" onClick={() => editItem(item)} className="flex min-h-20 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#191919] px-3 text-left"><span className="min-w-0"><span className="block truncate text-sm font-bold">{item.title || 'Untitled'}</span><span className="text-xs text-white/50">{item.shelf.toUpperCase()} · {whenLabel(item.when)}</span></span><span className={`shrink-0 text-xs font-black ${item.status === 'live' ? 'text-green-400' : 'text-yellow-300'}`}>{item.status === 'live' ? '● LIVE' : '● DRAFT'}</span></button></li>)}</ul>
          </div>

          <section className="mt-5 rounded-2xl border border-white/10 bg-[#111] p-4">
            <h2 className="text-lg font-black">Film 5 Vault</h2>
            <p className="mt-1 text-xs text-white/55">Drive · Defense · Putback live. Dunk · Jumbotron archived.</p>
            <div className="mt-3 grid gap-2">{['Drive · Live', 'Defense · Live', 'Putback · Live', 'Dunk · Archive', 'Jumbotron · Archive'].map((label) => <div key={label} className="rounded-xl border border-white/10 px-3 py-3 text-sm font-bold">{label}</div>)}</div>
          </section>
          {message && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-[#171717] p-3 text-sm">{message}</p>}
          {loading && <p className="mt-4 text-sm text-white/60">Loading projects…</p>}
        </>}
      </div>

      {newProject && <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-3 sm:items-center" onClick={(event) => { if (event.target === event.currentTarget) setNewProject(false); }}><section role="dialog" aria-modal="true" className="mx-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#151515] p-5"><h2 className="text-xl font-black">Add project</h2><label className="mt-4 block text-sm font-bold">Name<input value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3" /></label><label className="mt-3 block text-sm font-bold">Domain<input value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="example.com" className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3" /></label><button disabled={saving} type="button" onClick={() => void createProject()} className="mt-5 min-h-20 w-full rounded-xl bg-[#a51c30] font-black">Create project + five shelves</button><button type="button" onClick={() => setNewProject(false)} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 font-bold">Cancel</button></section></div>}

      {editing && project && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-3"><section role="dialog" aria-modal="true" aria-labelledby="edit-title" className="mx-auto my-3 w-full max-w-lg rounded-2xl border border-white/15 bg-[#151515] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#df5a6c]">{editing.shelf.toUpperCase()} SHELF</p><h2 id="edit-title" className="text-xl font-black">Edit item</h2></div><button type="button" aria-label="Close" onClick={() => setEditing(null)} className="min-h-20 min-w-20 rounded-xl border border-white/20 text-2xl">×</button></div>
        <label className="mt-4 block text-sm font-bold">Title<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3" /></label>
        <label className="mt-3 block text-sm font-bold">Text<textarea value={editing.text} onChange={(event) => setEditing({ ...editing, text: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-white/20 bg-black p-3" /></label>
        {editing.shelf === 'form' && <><p className="mt-4 text-sm font-bold">Send submissions to:</p><label className="mt-2 block text-xs text-white/60">Email(s), comma separated<input value={destinationEmails} onChange={(event) => setDestinationEmails(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3 text-sm" /></label><label className="mt-2 block text-xs text-white/60">Google Sheet URL (optional)<input value={sheetUrl} onChange={(event) => setSheetUrl(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3 text-sm" /></label></>}
        <label className="mt-4 block text-sm font-bold">When should they see this?<select value={editing.when} onChange={(event) => setEditing({ ...editing, when: event.target.value as ContentWhen })} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3">{whenOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="mt-3 block text-sm font-bold">Who sees it?<select value={editing.audience} onChange={(event) => setEditing({ ...editing, audience: event.target.value as ContentAudience })} className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3"><option value="everyone">Show to Everyone</option><option value="waitlist">Waitlist Only</option><option value="foundry">Foundry Only</option></select></label>
        {editing.when !== 'always' && <><label className="mt-3 block text-sm font-bold">Button text<input value={editing.buttonLabel ?? ''} onChange={(event) => setEditing({ ...editing, buttonLabel: event.target.value })} placeholder="Register" className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3" /></label><label className="mt-3 block text-sm font-bold">Continue to<input value={editing.destination ?? ''} onChange={(event) => setEditing({ ...editing, destination: event.target.value })} placeholder="/register" className="mt-2 min-h-20 w-full rounded-xl border border-white/20 bg-black px-3" /></label></>}
        <label className="mt-4 flex min-h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 px-3 text-sm font-bold">{optimizing ? 'Optimizing…' : 'Choose photo from phone'}<input type="file" accept="image/*" className="sr-only" disabled={optimizing} onChange={(event) => void uploadPhoto(event.target.files?.[0])} /></label>
        <label className="mt-2 flex min-h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 px-3 text-sm font-bold">{optimizing ? 'Uploading and optimizing…' : 'Choose video from phone'}<input type="file" accept="video/*" className="sr-only" disabled={optimizing} onChange={(event) => void uploadVideo(event.target.files?.[0])} /></label>
        {editing.mediaUrl && <p className="mt-2 break-all text-xs text-white/50">Media uploaded: {editing.mediaUrl}</p>}
        <div className="mt-4 grid gap-2"><button disabled={saving} type="button" onClick={() => void saveItem('draft')} className="min-h-20 w-full rounded-xl bg-[#423807] text-sm font-black text-yellow-100">{saving ? 'Saving…' : 'Save as Draft'}</button><button disabled={saving} type="button" onClick={() => void saveItem('live')} className="min-h-20 w-full rounded-xl bg-green-800 text-sm font-black">{saving ? 'Saving…' : 'Publish Now'}</button><button disabled={saving} type="button" onClick={() => void scheduleTomorrow()} className="min-h-20 w-full rounded-xl border border-white/20 text-sm font-black">Publish Tomorrow 9am</button></div>
        {message && <p role="status" className="mt-3 text-sm text-yellow-100">{message}</p>}
      </section></div>}
    </main>
  );
}
