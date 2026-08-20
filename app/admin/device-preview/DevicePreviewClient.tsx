'use client';

import { useState } from 'react';

const DEVICES = [
  { id: 'phone', label: 'Phone', detail: '390 × 844', width: 390, height: 844, scale: 0.72 },
  { id: 'tablet', label: 'Tablet', detail: '768 × 1024', width: 768, height: 1024, scale: 0.46 },
  { id: 'desktop', label: 'Desktop', detail: '1440 × 900', width: 1440, height: 900, scale: 0.29 },
] as const;

function safeLocalPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export default function DevicePreviewClient() {
  const [draftPath, setDraftPath] = useState('/');
  const [activePath, setActivePath] = useState('/');
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  function openPreview() {
    const path = safeLocalPath(draftPath);
    if (!path) {
      setError('Enter a page path from this EA app, such as /amplifi or /portal/client-name.');
      return;
    }
    setError('');
    setActivePath(path);
    setRefreshKey((value) => value + 1);
  }

  return (
    <section className="mt-5 space-y-5">
      <div className="border border-[#dfd6c2] bg-white p-5 shadow-sm">
        <label className="block text-sm font-bold text-neutral-800" htmlFor="device-preview-path">EA page path</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="device-preview-path"
            value={draftPath}
            onChange={(event) => setDraftPath(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') openPreview(); }}
            className="min-w-0 flex-1 border border-[#cfc4ab] px-4 py-3 text-sm outline-none focus:border-[#b9894d]"
            placeholder="/amplifi"
            inputMode="url"
          />
          <button type="button" onClick={openPreview} className="bg-[#1b2b4d] px-5 py-3 text-xs font-black uppercase tracking-wider text-white">
            Preview on all devices
          </button>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="border border-[#1b2b4d] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1b2b4d]">
            Refresh
          </button>
        </div>
        {error ? <p className="mt-3 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p> : null}
        <p className="mt-3 text-xs leading-5 text-neutral-500">Only pages inside this EA app can be previewed. Sign-in and role permissions still apply inside each frame.</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {DEVICES.map((device) => (
          <article key={device.id} className="border border-[#d8ccb2] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-[#1b2b4d]">{device.label}</h2>
                <p className="text-xs text-neutral-500">{device.detail}</p>
              </div>
              <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#7a5b0d]">Live</span>
            </div>
            <div
              className="mx-auto overflow-hidden rounded-[24px] border-[7px] border-[#172033] bg-white shadow-xl"
              style={{ width: device.width * device.scale + 14, height: device.height * device.scale + 14 }}
            >
              <iframe
                key={`${device.id}-${activePath}-${refreshKey}`}
                src={activePath}
                title={`${device.label} preview of ${activePath}`}
                sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                style={{
                  width: device.width,
                  height: device.height,
                  border: 0,
                  transform: `scale(${device.scale})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
