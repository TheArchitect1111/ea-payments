'use client';

import { useState } from 'react';

const REQUEST_TYPES = [
  'Add Event',
  'Add Announcement',
  'Add Team Member',
  'Add Staff Member',
  'Add Testimonial',
  'Add Sponsor',
  'Add Partner',
  'Add Product',
  'Add Service',
  'Add Property Listing',
  'Add Resource',
  'Replace Image',
  'Replace Video',
  'Upload Document',
  'Update Text',
  'Update Contact Information',
  'Update Business Hours',
  'General Website Update',
];

export default function NewContentRequestForm({ slug }: { slug: string }) {
  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState('');
  const [form, setForm] = useState({
    pageLocation: '',
    title: '',
    description: '',
    content: '',
    imageUrl: '',
    videoLink: '',
    documentUrl: '',
    priority: 'Normal',
    requestedPublishDate: '',
    additionalNotes: '',
  });
  const [enhanced, setEnhanced] = useState('');
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function prepareReview() {
    setError('');
    if (!requestType || !form.title.trim()) {
      setError('Choose a request type and add a title.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/portal/content-requests/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content || form.description || form.title }),
      });
      const data = (await res.json()) as { enhanced?: string; error?: string };
      setEnhanced(data.enhanced ?? form.content);
      setStep(3);
    } catch {
      setEnhanced(form.content);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/content-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          ...form,
          selectedContent: useEnhanced ? enhanced : form.content,
        }),
      });
      const data = (await res.json()) as { requestId?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Request could not be submitted.');
        return;
      }
      setMessage(`Your request was submitted. Request ID: ${data.requestId ?? 'Pending'}. Status: Pending Review.`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="border border-neutral-200 bg-white p-8">
        <h2 className="text-2xl font-black text-[#1B2B4D]">Request Received</h2>
        <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
        <a href={`/portal/${slug}/updates`} className="mt-6 inline-block bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D]">Return To Dashboard</a>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white p-6">
      {step === 1 && (
        <>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C9A844]">Step 1</p>
          <h2 className="mt-2 text-2xl font-black text-[#1B2B4D]">Select Request Type</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REQUEST_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setRequestType(type);
                  setStep(2);
                }}
                className="border border-neutral-200 p-4 text-left text-sm font-semibold text-neutral-700 hover:border-[#C9A844] hover:bg-[#F8F6F2]"
              >
                {type}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C9A844]">Step 2</p>
          <h2 className="mt-2 text-2xl font-black text-[#1B2B4D]">{requestType}</h2>
          <div className="mt-6 grid gap-4">
            {[
              ['pageLocation', 'Page Location'],
              ['title', 'Title'],
              ['description', 'Description'],
              ['content', 'Content'],
              ['imageUrl', 'Image Link'],
              ['videoLink', 'Video Link'],
              ['documentUrl', 'Document Link'],
              ['requestedPublishDate', 'Requested Publish Date'],
              ['additionalNotes', 'Additional Notes'],
            ].map(([field, label]) => (
              <label key={field} className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {label}
                {field === 'description' || field === 'content' || field === 'additionalNotes' ? (
                  <textarea value={form[field as keyof typeof form]} onChange={(e) => update(field as keyof typeof form, e.target.value)} rows={4} className="mt-1 block w-full border border-neutral-300 p-3 text-sm font-normal normal-case tracking-normal text-neutral-900" />
                ) : (
                  <input value={form[field as keyof typeof form]} onChange={(e) => update(field as keyof typeof form, e.target.value)} className="mt-1 block w-full border border-neutral-300 p-3 text-sm font-normal normal-case tracking-normal text-neutral-900" />
                )}
              </label>
            ))}
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Priority
              <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="mt-1 block w-full border border-neutral-300 p-3 text-sm font-normal normal-case tracking-normal text-neutral-900">
                {['Low', 'Normal', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="border border-neutral-300 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-neutral-600">Back</button>
            <button type="button" onClick={prepareReview} disabled={loading} className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D]">{loading ? 'Preparing...' : 'Review'}</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C9A844]">Step 3</p>
          <h2 className="mt-2 text-2xl font-black text-[#1B2B4D]">Review And Submit</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="border border-neutral-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Original</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{form.content || form.description || form.title}</p>
            </div>
            <div className="border border-[#C9A844] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Enhanced</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{enhanced}</p>
            </div>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={useEnhanced} onChange={(e) => setUseEnhanced(e.target.checked)} />
            Use the enhanced version
          </label>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="border border-neutral-300 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-neutral-600">Back</button>
            <button type="button" onClick={submit} disabled={loading} className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D]">{loading ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </>
      )}
    </div>
  );
}
