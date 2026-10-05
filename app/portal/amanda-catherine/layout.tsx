import './portal.css';
import { registry } from '@/lib/amanda-catherine/registry';
import type { CSSProperties } from 'react';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){
 let theme:Record<string,string>={};try{theme=(await registry()).theme;}catch{}
 const color=(v:string|undefined,fallback:string)=>/^#[0-9a-f]{3,8}$/i.test(v || '')?v:fallback;
 return <div className="amanda-portal" style={{'--ink':color(theme['Primary Color'],'#17211c'),'--accent':color(theme['Accent Color'],'#b48a49'),'--paper':color(theme['Background Color'],'#f6f0e6')} as CSSProperties}><div className="amanda-shell"><nav className="amanda-nav" aria-label="Amanda navigation"><a href="/amanda-catherine">Amanda Catherine</a><a href="/portal/amanda-catherine/classes">Classes</a><a href="/portal/amanda-catherine/apply">Apply</a><a href="/portal/amanda-catherine/book">Book</a><a href="/portal/amanda-catherine/foundry">Foundry</a></nav>{children}</div></div>;
}
