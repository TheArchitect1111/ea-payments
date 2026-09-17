import Link from 'next/link';
import { notFound } from 'next/navigation';

const sections: Record<string, { title: string; eyebrow: string; description: string }> = {
  updates: { title: 'Update Hub', eyebrow: 'GOVERNED CHANGES', description: 'Website and business change requests will be reviewed, classified and routed here without bypassing the approved baseline.' },
  appointments: { title: 'Appointments / Jane', eyebrow: 'SCHEDULE', description: 'Amanda’s appointment operations remain connected to Jane rather than creating a duplicate calendar.' },
  clients: { title: 'Clients', eyebrow: 'RELATIONSHIPS', description: 'A unified view of Amanda’s client relationships will connect to the existing EA client and CRM layer.' },
  academy: { title: 'AesthetiKine Academy', eyebrow: 'EDUCATION', description: 'Courses, students, enrollments, progress and certifications will share the same canonical business data as the website.' },
  lifeline: { title: 'LIFELINE', eyebrow: 'CREATIVE ENTREPRENEURSHIP', description: 'Stories, mentorship and strategic launch support remain a distinct business path inside one operating portal.' },
  documents: { title: 'Documents & Certifications', eyebrow: 'LIBRARY', description: 'Documents, course completion records and certifications will be gathered into one owner workspace.' },
  marketing: { title: 'Marketing', eyebrow: 'BRAND', description: 'Marketing assets and publishing workflows will live here while preserving approved website content.' },
  insights: { title: 'Business Insights', eyebrow: 'INTELLIGENCE', description: 'Enrollment, client, appointment and revenue reporting will connect to verified sources in later runs.' },
  eva: { title: 'Eva', eyebrow: 'AI ASSISTANT', description: 'Eva will become Amanda’s primary operating interface, with governed actions routed through the Update Hub.' },
  settings: { title: 'Settings', eyebrow: 'PORTAL', description: 'Owner preferences, integrations and access controls will be managed here.' },
};

export default async function AmandaOwnerSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  return <div className="ac-dashboard"><header className="ac-topbar"><div><small>AMANDA CATHERINE · PORTAL V2</small><h1>{item.title}</h1><p>{item.description}</p></div><div className="ac-status">Preview · Isolated</div></header><section className="ac-card" style={{minHeight:360}}><span className="ac-eyebrow">{item.eyebrow}</span><h3>Foundation ready.</h3><p>This route is intentionally isolated during Run 1. Operational data and mutations are connected only after their source-of-truth adapters are verified.</p><Link href="/portal/amanda-catherine/owner">← Return to Dashboard</Link></section></div>;
}
