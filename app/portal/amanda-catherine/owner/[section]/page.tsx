import Link from 'next/link';
import { notFound } from 'next/navigation';
const sections:Record<string,{title:string;eyebrow:string;description:string}>={
 lifeline:{title:'LIFELINE',eyebrow:'CREATIVE ENTREPRENEURSHIP',description:'Creative work, mentorship and launch support inside the same owner workspace.'},
 documents:{title:'Documents & Certifications',eyebrow:'LIBRARY',description:'Business documents, learning records and certifications in one organized workspace.'},
 marketing:{title:'Marketing',eyebrow:'BRAND',description:'Approved brand assets, campaigns and publishing work without leaving the portal.'},
 insights:{title:'Business Insights',eyebrow:'INTELLIGENCE',description:'A clear view of verified enrollment, client, appointment and business activity.'},
 messages:{title:'Messages',eyebrow:'COMMUNICATION',description:'A single doorway for student and business communication so important conversations are not buried across systems.'},
 settings:{title:'Settings',eyebrow:'PORTAL',description:'Owner preferences, integrations and access controls for Amanda Catherine.'},
};
export default async function AmandaOwnerSection({params}:{params:Promise<{section:string}>}){const {section}=await params;const item=sections[section];if(!item)notFound();return <div className="ac-dashboard"><header className="ac-topbar"><div><small>AESTHETIKINE STUDIO LAB</small><h1>{item.title}</h1><p>{item.description}</p></div><div className="ac-status">Owner Portal</div></header><section className="ac-card" style={{minHeight:320}}><span className="ac-eyebrow">{item.eyebrow}</span><h3>Part of Amanda’s single workspace.</h3><p>This destination stays inside the same owner portal and uses the shared EA operating layer rather than sending Amanda into a separate backend experience.</p><Link href="/portal/amanda-catherine/owner">← Home</Link></section></div>}