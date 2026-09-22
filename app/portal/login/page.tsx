import Image from 'next/image';
import Link from 'next/link';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { getRealmLoginCopy, magicLinkErrorMessage } from '@/lib/auth/realm-login-copy';
import amandaPhoto from '@/public/home/client-amanda-catherine.jpg';
import './portal-login.css';

const copy = getRealmLoginCopy('portal');
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function safeNextPath(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined;
  if (raw === '/simplifi/capture' || raw.startsWith('/simplifi/')) return undefined;
  return raw;
}
function single(value: string | string[] | undefined): string | null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }
function isAmandaPortal(nextPath?: string) { const path=nextPath?.toLowerCase(); return Boolean(path==='/amanda-business'||path?.startsWith('/portal/amanda-catherine')); }
function isAmandaLearningPortal(nextPath?: string) { return nextPath?.toLowerCase().startsWith('/portal/amanda-catherine/learning') ?? false; }
function isTb3Portal(nextPath?: string) { return nextPath?.toLowerCase().startsWith('/portal/tarris-bouie') ?? false; }

function Tb3LoginBrand() {
  return <>
    <header className="pl-header pl-header-tb3">
      <p className="pl-tb3-mark">TB3</p>
      <p className="pl-eyebrow">PLAYER ONE • PRIVATE ATHLETE ACCESS</p>
      <h1 className="pl-title">Tarris Bouie HQ</h1>
      <p className="pl-lede">Sign in to enter the TB3 command center for academics, training, NIL &amp; brand, opportunities, media, calendar, documents, community and Eva.</p>
      <p className="pl-portal-line">Built for more.</p>
    </header>
    <div className="pl-hero pl-tb3-hero" aria-label="TB3 HQ preview">
      <img className="pl-hero-img" src="/benchmarks/tb3-hq-approved-reference.jpg" alt="TB3 HQ command center" width="1463" height="1536" />
    </div>
  </>;
}
function AmandaLearningLoginBrand(){return <><header className="pl-header pl-header-amanda"><Image src={amandaPhoto} alt="Amanda Catherine" width={240} height={240} className="pl-amanda-photo" priority/><p className="pl-eyebrow">AesthetiKine Academy</p><h1 className="pl-title">Amanda Catherine Courses &amp; Learning</h1><p className="pl-lede">Sign in with the email used for your enrollment to open your lessons, resources, progress, and certificates.</p><p className="pl-portal-line">Secure student and practitioner learning access</p></header><div className="pl-hero pl-amanda-hero"><div className="pl-amanda-hero-overlay"><p>Courses</p><p>Video lessons</p><p>Resources</p><p>Progress</p></div></div></>}
function AmandaLoginBrand(){return <><header className="pl-header pl-header-amanda"><Image src={amandaPhoto} alt="Amanda Catherine" width={240} height={240} className="pl-amanda-photo" priority/><p className="pl-eyebrow">AesthetiKine Studio Lab</p><h1 className="pl-title">Amanda Catherine Business Portal</h1><p className="pl-lede">Sign in to manage programs, appointments, applications, payments, communications, people, and reports.</p><p className="pl-portal-line">Private administrator access for Amanda Catherine</p></header><div className="pl-hero pl-amanda-hero"><div className="pl-amanda-hero-overlay"><p>AesthetiKine</p><p>LIFELINE</p><p>Training</p><p>Community</p></div></div></>}
function DefaultLoginBrand(){return <><header className="pl-header"><Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority/>{copy.eyebrow?<p className="pl-eyebrow">{copy.eyebrow}</p>:null}<h1 className="pl-title">{copy.pageTitle}</h1><p className="pl-lede">{copy.pageSubtitle}</p><p className="pl-portal-line">Sign in to your Client Experience</p></header><div className="pl-hero"><img className="pl-hero-img" src="/client-experience/welcome-possibility-strip.png" alt="Welcoming collage" width="1200" height="640"/></div></>}

export default async function PortalLoginPage({searchParams}:{searchParams:SearchParams}){
 const params=await searchParams; const nextPath=safeNextPath(single(params.next)); const error=magicLinkErrorMessage('portal',single(params.error));
 const amanda=isAmandaPortal(nextPath); const amandaLearning=isAmandaLearningPortal(nextPath); const tb3=isTb3Portal(nextPath);
 return <div className={`pl-page${amanda?' pl-page-amanda':''}${tb3?' pl-page-tb3':''}`}><div className="pl-shell">
   {tb3?<Tb3LoginBrand/>:amandaLearning?<AmandaLearningLoginBrand/>:amanda?<AmandaLoginBrand/>:<DefaultLoginBrand/>}
   <RealmLoginCard realm="portal" next={nextPath} error={error} showTitle={false}/>
   <footer className="pl-footer">{tb3?<p className="pl-tagline">TB3 • Player One • Powered by Efficiency Architects</p>:amanda?<p className="pl-tagline">{amandaLearning?'Amanda Catherine course access':'Amanda Catherine portal access'} • Powered by Efficiency Architects</p>:<><p className="pl-footer-text">Looking for Simplifi capture? <Link href="/simplifi/login" className="pl-footer-link">Simplifi sign in</Link></p><p className="pl-footer-text">Partner account? <Link href="/partners/login" className="pl-footer-link">Partner sign in</Link></p><p className="pl-tagline">You’re expected. We’re already preparing what comes next.</p></>}</footer>
 </div></div>;
}
