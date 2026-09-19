'use client';

import { useState } from 'react';
import type { PortalFormStatus, PortalFormSubmission } from '@/lib/portal-forms/types';
import { amandaApplicationHandoff } from '@/lib/amanda-catherine/application-routing';

const statuses: PortalFormStatus[] = ['submitted', 'reviewed', 'accepted', 'rejected'];

function label(value: string) {
  return value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OwnerApplicationQueue({ submissions: initial }: { submissions: PortalFormSubmission[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function updateStatus(id: string, status: PortalFormStatus) {
    setBusy(id);
    setError('');
    try {
      const response = await fetch('/api/portal/forms/status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId: id, status }),
      });
      const data = await response.json() as { ok?: boolean; error?: string; submission?: PortalFormSubmission };
      if (!response.ok || !data.ok || !data.submission) {
        setError(data.error || 'Status could not be updated.');
        return;
      }
      setSubmissions((current) => current.map((item) => item.id === id ? data.submission! : item));
    } catch {
      setError('Status could not be updated.');
    } finally {
      setBusy('');
    }
  }

  if (!submissions.length) return <section className="ac-card"><span className="ac-eyebrow">APPLICATION QUEUE</span><h3>No submissions yet.</h3><p>New public applications will appear here automatically.</p></section>;

  return <section><div className="ac-section-title"><div><span>APPLICATION QUEUE</span><h2>New and active requests</h2></div><p>{submissions.length} total</p></div>{error && <p className="ac-queue-error">{error}</p>}<div className="ac-queue">{submissions.map((submission) => {
    const answers = submission.payload?.answers && typeof submission.payload.answers === 'object' ? submission.payload.answers as Record<string, unknown> : {};
    const uploads = submission.payload?.assetUploads && typeof submission.payload.assetUploads === 'object' ? submission.payload.assetUploads as Record<string, { fileName?: string; url?: string }> : {};
    const formId = submission.payload?.formId;
    const handoff = amandaApplicationHandoff(formId, submission.status, submission.payload?.program);
    const subject = encodeURIComponent(`${label(String(formId || 'application'))} follow-up`);
    return <article className="ac-card" key={submission.id}><div className="ac-queue-heading"><div><span className="ac-eyebrow">{label(String(formId || 'application'))}</span><h3>{submission.name}</h3></div><strong>{label(submission.status)}</strong></div><p><a href={`mailto:${submission.email}`}>{submission.email}</a>{submission.phone ? ` · ${submission.phone}` : ''}</p><p>Submitted {new Date(submission.createdAt).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})}</p>{Object.entries(answers).map(([key,value])=><div className="ac-queue-answer" key={key}><b>{label(key)}</b><p>{String(value)}</p></div>)}{submission.notes&&<div className="ac-queue-answer"><b>Additional notes</b><p>{submission.notes}</p></div>}{Object.entries(uploads).length>0&&<div className="ac-queue-answer"><b>Attachments</b>{Object.entries(uploads).map(([key,file])=><p key={key}>{file.url?<a href={file.url} target="_blank" rel="noopener noreferrer">{file.fileName||label(key)} ↗</a>:file.fileName||label(key)}</p>)}</div>}<div className="ac-queue-handoff"><b>Next handoff</b><p>{handoff}</p><a href={`mailto:${submission.email}?subject=${subject}`}>Email applicant →</a></div><div className="ac-queue-status">{statuses.map((status)=><button type="button" key={status} disabled={busy===submission.id||submission.status===status} onClick={()=>updateStatus(submission.id,status)}>{label(status)}</button>)}</div></article>;
  })}</div></section>;
}
