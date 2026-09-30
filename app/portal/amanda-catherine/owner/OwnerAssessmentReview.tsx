'use client';

import { useState } from 'react';
import type { AmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

export default function OwnerAssessmentReview({ progress: initial }: { progress: AmandaCourseProgress[] }) {
  const [records, setRecords] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  return <section><h2>Assessment review</h2>{error ? <p role="alert">{error}</p> : null}{records.filter((record) => record.assessmentSubmission).map((record) => {
    const key = `${record.email}:${record.courseId}`;
    return <article className="ac-card" key={key}><h3>{record.email} · {record.courseId}</h3><p>{record.assessmentSubmission!.notes}</p>{record.assessmentSubmission!.evidenceUrl ? <a target="_blank" rel="noopener noreferrer" href={record.assessmentSubmission!.evidenceUrl}>Open submitted evidence ↗</a> : null}<p>{record.assessmentReview ? `Last review: ${record.assessmentScore}% · ${record.assessmentReview.notes}` : 'Awaiting review'}</p><form onSubmit={async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(key); setError('');
      try {
        const response = await fetch('/api/portal/amanda/assessment-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: record.email, courseId: record.courseId, score: Number(form.get('score')), practicalApproved: form.get('practical') === 'on', notes: form.get('notes') }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Review could not be saved.');
        setRecords((current) => current.map((item) => `${item.email}:${item.courseId}` === key ? data.progress : item));
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Review could not be saved.'); }
      finally { setBusy(''); }
    }}><label>Assessment score (%) <input name="score" type="number" min={0} max={100} required defaultValue={record.assessmentScore} /></label><label><input name="practical" type="checkbox" defaultChecked={record.assessmentReview?.practicalApproved} /> Practical demonstration approved</label><label>Review notes <textarea name="notes" required maxLength={5000} /></label><button type="submit" disabled={busy === key}>Save review</button></form></article>;
  })}</section>;
}
