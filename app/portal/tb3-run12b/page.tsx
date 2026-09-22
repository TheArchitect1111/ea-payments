import './tb3-run15.css';

const navigation = [
  ['Home', 'home'], ['My Journey', 'journey'], ['Academics', 'academics'],
  ['Training', 'training'], ['NIL & Brand', 'nil-brand'], ['Opportunities', 'opportunities'],
  ['Media Library', 'media'], ['Calendar', 'calendar'], ['Documents', 'documents'],
  ['Community', 'community'], ['Messages', 'messages'], ['Eva (AI Assistant)', 'eva'],
  ['Settings', 'settings'],
] as const;

export default function TB3Run12BPortal() {
  return (
    <main className="tb3-shell" id="home">
      <h1 className="tb3-sr-only">TB3 HQ</h1>
      <section className="tb3-reference" aria-label="TB3 HQ command center">
        {/* The approved Run 15 composition remains the visual source at every viewport. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="tb3-reference-image"
          src="/benchmarks/tb3-hq-approved-reference.jpg"
          width="1463"
          height="1536"
          alt="TB3 HQ command center for Tarris Bouie"
        />
        <nav className="tb3-hotspots" aria-label="TB3 HQ modules">
          {navigation.map(([label, id]) => (
            <a key={id} className={`tb3-hotspot tb3-hotspot-${id}`} href={`#${id}`}>
              <span>{label}</span>
            </a>
          ))}
          <a className="tb3-hotspot tb3-hotspot-store" href="#store"><span>TB3 Store</span></a>
        </nav>
        <div className="tb3-targets" aria-hidden="true">
          {navigation.slice(1).map(([, id]) => <span id={id} key={id} />)}
          <span id="store" />
        </div>
      </section>
    </main>
  );
}
