'use client';
import {useEffect,type ReactNode} from 'react';
import {amandaCtaKey,trackAmandaClick} from '@/lib/amanda-catherine/tracking';
export default function AmandaCtaTracker({children}:{children:ReactNode}) {
 useEffect(()=>{
  let visitorId:string;
  try {const saved=sessionStorage.getItem('amanda-visitor');visitorId=saved&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)?saved:crypto.randomUUID();sessionStorage.setItem('amanda-visitor',visitorId);}catch{visitorId=crypto.randomUUID();}
  const decorate=()=>document.querySelectorAll<HTMLElement>('a,button').forEach(node=>{
   if(!node.dataset.ctaName)node.dataset.ctaName=(node.getAttribute('aria-label')||node.textContent||'Open').trim().slice(0,200)||'Open';
   if(!node.dataset.ctaKey)node.dataset.ctaKey=amandaCtaKey(node.dataset.ctaName);
  });
  decorate();const observer=new MutationObserver(decorate);observer.observe(document.body,{childList:true,subtree:true});
  const click=(e:MouseEvent)=>{
   if(!(e.target instanceof Element)||e.button!==0)return;
   const node=e.target.closest<HTMLElement>('a,button');
   if(!node||node.hasAttribute('disabled')||node.getAttribute('aria-disabled')==='true')return;
   const name=node.dataset.ctaName||(node.getAttribute('aria-label')||node.textContent||'Open').trim().slice(0,200);
   trackAmandaClick({event_id:crypto.randomUUID(),visitor_id:visitorId,cta_key:node.dataset.ctaKey||amandaCtaKey(name),cta_name:name||'Open',page:location.pathname,
    destination:node instanceof HTMLAnchorElement?node.href:location.origin+location.pathname,timestamp:new Date().toISOString(),...(node.dataset.courseKey?{course_key:node.dataset.courseKey}:{})});
  };
  document.addEventListener('click',click,true);
  return()=>{observer.disconnect();document.removeEventListener('click',click,true);};
 },[]);
 return <>{children}</>;
}
