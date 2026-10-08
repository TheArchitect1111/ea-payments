import Link from 'next/link';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';

export const metadata={title:'Amanda Catherine Portal'};
const quick=[
 ['◫','Book Appointment','/portal/amanda-catherine/owner/appointments'],
 ['◍','Review Client Intake','/portal/amanda-catherine/owner/clients'],
 ['▭','Review Certifications','/portal/amanda-catherine/owner/academy'],
 ['＄','Test course enrollment · CAD $1','/portal/amanda-catherine/billing?showTest=1'],
 ['⧉','View Orders','/portal/amanda-catherine/owner/practitioner-kit'],
 ['◫','Send Message','/portal/amanda-catherine/messaging'],
 ['↗','Open Marketing Kit','/portal/amanda-catherine/owner/marketing']
] as const;

export default async function Page(){
 const submissions=await listPortalFormSubmissions('amanda-catherine',{});
 const applications=submissions.filter((x)=>x.kind==='application');
 const active=applications.filter((x)=>x.status==='submitted'||x.status==='reviewed');
 return <div className="approved-dashboard">
  <section className="approved-hero"><img src="/amanda-catherine/amanda-catherine-founder.webp" alt="Amanda Catherine"/><div><h1>Welcome, Amanda</h1><p>Create Beauty. Change Lives. Build Legacy.</p><blockquote>“Wellness is not just a service, it’s a calling.”</blockquote></div></section>
  <section><h2>Quick Actions</h2><div className="approved-quick">{quick.map(([icon,label,href])=><Link href={href} key={href}><span>{icon}</span><b>{label}</b></Link>)}</div></section>
  <div className="approved-grid">
   <section className="approved-card"><div className="approved-card-head"><h2>Business Overview</h2><span>Last 30 Days ▾</span></div><div className="approved-metrics"><div><b>{submissions.length}</b><small>Total Activity</small></div><div><b>{active.length}</b><small>New Requests</small></div><div><b>4</b><small>Academy Programs</small></div><div><b>Live</b><small>Page + Portal</small></div></div></section>
   <section className="approved-card"><div className="approved-card-head"><h2>Recent Activity</h2><Link href="/portal/amanda-catherine/owner/clients">View All →</Link></div><p>{active.length?`${active.length} active application${active.length===1?'':'s'} need attention.`:'No active applications need attention.'}</p><p>Website enrollment is connected to secure checkout and learning access.</p></section>
   <section className="approved-card"><div className="approved-card-head"><h2>Today&apos;s Appointments</h2><Link href="/portal/amanda-catherine/owner/appointments">View All →</Link></div><p>Appointments are managed through Amanda&apos;s Jane pathway.</p><Link className="approved-pill" href="/portal/amanda-catherine/owner/appointments">Open Appointments</Link></section>
   <section className="approved-card"><div className="approved-card-head"><h2>Programs & Services</h2><Link href="/portal/amanda-catherine/owner/academy">Manage →</Link></div><div className="approved-programs"><Link href="/portal/amanda-catherine/owner/academy">AesthetiKine Academy</Link><Link href="/portal/amanda-catherine/owner/advisory">Founder Advisory</Link><Link href="/portal/amanda-catherine/owner/speaking">Speaking</Link><Link href="/portal/amanda-catherine/owner/lifeline">LIFELINE</Link></div></section>
   <section className="approved-card approved-impact"><h2>❤ Your Impact</h2><div><b>{submissions.length}</b><small>Recorded interactions</small><b>4</b><small>Programs active</small><b>1</b><small>Connected portal</small></div><p>“When you pour into others, you create a ripple that never ends.”</p></section>
   <section className="approved-card approved-riman"><h2>RIMAN</h2><p>Real Science. Real Beauty. Real You.</p><img src="https://www.buyincellderm.com/cdn/shop/files/ICDExpertExperienceKit.png?v=1772504566&width=2000" alt="RIMAN Incellderm ICD Expert Experience Kit"/><Link className="approved-pill" href="/portal/amanda-catherine/owner/riman">Manage Products →</Link></section>
  </div>
 </div>;
}
