import Link from 'next/link';
import { notFound } from 'next/navigation';

const moduleCopy: Record<string,{title:string;body:string}> = {
  journey:{title:'My Journey',body:'Milestones, progress, goals, and Player One journey tracking.'},
  academics:{title:'Academics',body:'Academic goals, progress, resources, and important checkpoints.'},
  training:{title:'Training',body:'Training plans, performance priorities, and development work.'},
  'nil-brand':{title:'NIL & Brand',body:'Brand development, NIL readiness, campaigns, and approved opportunities.'},
  opportunities:{title:'Opportunities',body:'Review active opportunities and next actions.'},
  media:{title:'Media Library',body:'Approved photos, videos, graphics, and media assets.'},
  calendar:{title:'Calendar',body:'Events, appointments, deadlines, and scheduled activities.'},
  documents:{title:'Documents',body:'Contracts, forms, reports, and approved files.'},
  community:{title:'Community',body:'Community initiatives, relationships, and engagement.'},
  messages:{title:'Messages',body:'Portal communications and conversation history.'},
  eva:{title:'Eva',body:'EA assistance for navigating the TB3 workspace and next steps.'},
  settings:{title:'Settings',body:'Portal preferences, account settings, and permissions.'},
  store:{title:'TB3 Store',body:'Commerce is not connected in this Preview. This destination is intentionally safe until an approved store provider is wired.'},
};

export default async function TB3Module({params}:{params:Promise<{module:string}>}) {
  const {module} = await params; const item=moduleCopy[module]; if(!item) notFound();
  return <main style={{minHeight:'100vh',background:'#050607',color:'#fff',fontFamily:'Arial,Helvetica,sans-serif',padding:'clamp(28px,6vw,80px)'}}><div style={{maxWidth:920,margin:'0 auto'}}><Link href="/portal/tarris-bouie" style={{color:'#fff',textDecoration:'none',opacity:.72}}>← TB3 HQ</Link><p style={{marginTop:72,letterSpacing:4,textTransform:'uppercase',opacity:.55}}>Player One · TB3 HQ</p><h1 style={{fontSize:'clamp(44px,8vw,96px)',lineHeight:.95,margin:'14px 0 28px'}}>{item.title}</h1><p style={{fontSize:20,lineHeight:1.7,maxWidth:700,opacity:.82}}>{item.body}</p><section style={{marginTop:48,padding:28,border:'1px solid #282b2f',borderRadius:16,background:'#0d0f11'}}><strong>Preview module</strong><p style={{lineHeight:1.6,opacity:.68}}>This route is wired and reachable. Live records appear only when an approved EA data source is connected. No production data is invented here.</p></section></div></main>;
}
