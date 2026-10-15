import { getCTA, amandaClassCopy } from '@/lib/amanda-catherine/class-cta-policy';
import type { Course } from '@/lib/amanda-catherine/registry';

export default function AmandaClassesGrid({courses}:{courses:Course[]}) {
  return <section id="classes-grid" data-source-commit={process.env.VERCEL_GIT_COMMIT_SHA} className="scroll-mt-24" style={{scrollMarginTop:'6rem'}} aria-label="Classes"><div className="amanda-grid">{courses.map(c=>{
 const cta=getCTA(c);
 const available=cta.kind==='checkout';
 const label=cta.label;
 const href=cta.action;
 return <article className="amanda-card" key={c.key}><h2>{c.title}</h2><p>{amandaClassCopy(c.description,available)}</p>{c.price!==null&&<p>{'$'+c.price.toLocaleString('en-US')} CAD</p>}<div className="flex flex-wrap gap-3">{href?<a className={available ? "amanda-button" : "amanda-button amanda-button--outline"} href={href} data-cta-name={label} data-course-key={c.key} data-cta-key={`${available?'register':'join-waitlist'}-${c.key}`}>{label}</a>:<span role="status">Checkout temporarily unavailable</span>}</div></article>;
})}</div></section>;
}
