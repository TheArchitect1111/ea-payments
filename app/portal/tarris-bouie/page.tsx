import '../tb3-run12b/tb3-run15.css';

const modules = [
  ['Home', 'home'], ['My Journey', 'journey'], ['Academics', 'academics'],
  ['Training', 'training'], ['NIL & Brand', 'nil-brand'], ['Opportunities', 'opportunities'],
  ['Media Library', 'media'], ['Calendar', 'calendar'], ['Documents', 'documents'],
  ['Community', 'community'], ['Messages', 'messages'], ['Eva (AI Assistant)', 'eva'],
  ['Settings', 'settings'],
] as const;

const destinations: Record<string,string> = {
  home: '/portal/tarris-bouie', journey: '/portal/tarris-bouie/journey', academics: '/portal/tarris-bouie/academics',
  training: '/portal/tarris-bouie/training', 'nil-brand': '/portal/tarris-bouie/nil-brand', opportunities: '/portal/tarris-bouie/opportunities',
  media: '/portal/tarris-bouie/media', calendar: '/portal/tarris-bouie/calendar', documents: '/portal/tarris-bouie/documents',
  community: '/portal/tarris-bouie/community', messages: '/portal/tarris-bouie/messages', eva: '/portal/tarris-bouie/eva', settings: '/portal/tarris-bouie/settings'
};

export default function TarrisBouiePortal() {
  return <main className="tb3-shell" id="home"><h1 className="tb3-sr-only">TB3 HQ</h1><section className="tb3-reference" aria-label="TB3 HQ command center">
    {/* Approved Run 15 reference is immutable visual source of truth on desktop and mobile. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}<img className="tb3-reference-image" src="/benchmarks/tb3-hq-approved-reference.jpg" width="1463" height="1536" alt="TB3 HQ command center for Tarris Bouie" />
    <nav className="tb3-hotspots" aria-label="TB3 HQ modules">{modules.map(([label,id]) => <a key={id} className={`tb3-hotspot tb3-hotspot-${id}`} href={destinations[id]}><span>{label}</span></a>)}<a className="tb3-hotspot tb3-hotspot-store" href="/portal/tarris-bouie/store"><span>TB3 Store</span></a></nav>
  </section></main>;
}
