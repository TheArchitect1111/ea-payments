import { AMANDA_OFFERS, ENTREPRENEURIAL_ARTIST_COURSE } from '@/lib/amanda-catherine/config';
import { AMANDA_PRACTITIONER_KIT } from '@/lib/amanda-catherine/practitioner-kit-catalog';
import './client-updates.css';

function Inquiry({email,subject,children}:{email:string;subject:string;children:React.ReactNode}) {
  return <a className="ac-btn" href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>{children}</a>;
}
function External({href,children}:{href:string;children:React.ReactNode}) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>;
}

export function CreateOffers({email}:{email:string}) {
  return <div className="ac-wrap ac-update-offers">
    <article className="ac-update-card" id="founder-advisory">
      <p className="ac-eyebrow">Direction · Positioning · Practical action</p><h3>Founder Advisory</h3>
      <p>For founders, practitioners, creatives and purpose-driven leaders building businesses, programs or community initiatives.</p>
      <p>Amanda combines business strategy, brand positioning, leadership development, wellness-informed performance and practical implementation.</p>
      <h4>Founder Clarity Session</h4><p>A focused 75-minute consultation for direction on a specific idea, challenge or decision.</p>
      <ul><li>Pre-session business questionnaire</li><li>Review of one primary business challenge</li><li>Clarification of your offer, audience and positioning</li><li>Guidance on pricing, partnerships or revenue opportunities</li><li>Identification of immediate priorities</li><li>Personalized action steps</li></ul>
      <h4>Your next step</h4><p>Leave with clearer direction, immediate priorities and personalized actions for the challenge you bring.</p>
      <h4>Established strategy packages</h4>
      {AMANDA_OFFERS.filter(offer=>offer.audience==='strategy-client').map(offer=><p key={offer.id}><strong>{offer.name}</strong> · ${offer.priceCad.toLocaleString()} CAD · {'durationMinutes' in offer ? `${offer.durationMinutes} minutes` : 'durationDays' in offer ? `${offer.durationDays} days` : ''}</p>)}
      <p>Ask Amanda which advisory pathway fits your goals and what your engagement will include.</p>
      <Inquiry email={email} subject="Founder Advisory application">Apply for Founder Advisory</Inquiry>
    </article>
    <article className="ac-update-card" id="speaking">
      <p className="ac-eyebrow">Keynotes · Panels · Workshops</p><h3>Speaking</h3>
      <img className="ac-speaking-photo" src="/amanda-catherine/amanda-podium.jpg" alt="Amanda Catherine speaking at a podium"/>
      <h4>The Entrepreneurial Artist: Turning God-Given Gifts Into Impact and Income.</h4>
      <p>Recognize your gifts, connect them to a real need, and develop an ethical, sustainable source of income without compromising your faith or values.</p>
      <h4>Speaking topics</h4><p>God-given gifts and purpose, creative entrepreneurship, faith and business, positioning your work, and moving from fear into focused action.</p>
      <h4>Amanda Catherine’s Signature Talks</h4><ul><li>How to Use Your God-Given Gifts for Income &amp; Impact</li><li>How to Start a Business with What You Have</li><li>Monetize Your Gifts</li><li>Faith-Based Entrepreneur Leadership Talks</li><li>Wellness Topics for Female Health</li><li>Turning Setbacks into Strategy</li></ul>
      <h4>Audience outcomes</h4><ul><li>Identify overlooked gifts, experiences and expertise</li><li>Connect purpose to a clear audience and practical need</li><li>Turn a gift into an offer, service, program or platform</li><li>Generate income grounded in service and integrity</li><li>Move from overthinking into focused action</li></ul>
      <p>Previous speaking and media highlights include the Canadian Selah Music Awards. Amanda also serves as Director-at-Large with the Women’s Art Association of Canada.</p>
      <div className="ac-update-links"><External href="https://www.instagram.com/reel/DaLkeD_T4Tu/">Watch Amanda’s speaking & media reel</External><External href="https://womensartofcanada.ca/about/">Women’s Art Association of Canada</External><External href={ENTREPRENEURIAL_ARTIST_COURSE.amazonBookUrl}>Read The Entrepreneurial Artist</External></div>
      <div className="ac-actions"><Inquiry email={email} subject="Book Amanda to Speak">Book Amanda to Speak</Inquiry></div>
    </article>
    <article className="ac-update-card" id="lifeline-live">
      <p className="ac-eyebrow">Watch · Share your story · Partner</p><h3>LIFELINE LIVE</h3>
      <p>Conversations with artists, entrepreneurs, authors, ministry leaders and community builders, connecting meaningful stories with creative opportunity.</p>
      <h4>Latest episodes</h4><p>Explore the newest conversations on Empower Art Collective’s YouTube channel, or begin with the episode Amanda selected.</p>
      <div className="ac-update-links"><External href="https://youtube.com/@empowerartcollective/videos">Watch the latest episodes</External><External href="https://youtu.be/CrMLhxbpjK0">Watch Amanda’s selected episode</External><External href="https://drive.google.com/file/d/1uDv2n2-2QUqNmb_KSyO8nKCSg51Q8Dcv/view">Guest application</External><External href="/amanda-catherine/lifeline-partnership-kit.pdf">Partnership & sponsorship kit</External></div>
      <h4>Participate</h4><p>Apply to share your story. For partnerships, sponsorships or an interview inquiry, tell Amanda about your work, audience and proposed collaboration.</p>
      <div className="ac-actions"><Inquiry email={email} subject="LIFELINE media ministry interview booking">Book a LIFELINE interview</Inquiry><Inquiry email={email} subject="LIFELINE LIVE partnership or sponsorship">Explore a partnership</Inquiry></div>
    </article>
    <article className="ac-update-card" id="empower-art">
      <p className="ac-eyebrow">Creativity · Access · Community</p><h3>Empower Art Collective</h3>
      <p>A nonprofit supporting artists and disadvantaged youth through accessible entrepreneurial skills, mentorship and creative opportunity.</p>
      <h4>Programs</h4><p>Mentorship Essentials, Firm Foundation 12-Week Mentorship, Activate 6-Week Workshop, consulting and one-to-one mentorship.</p>
      <h4>Community impact</h4><p>Accessible mentorship, sliding-scale support and resources help reduce financial barriers for creative communities. The collective also shares information on art scholarships, grants and income-geared studio spaces.</p>
      <h4>Events & support</h4><p>Explore community events and fundraising initiatives. Contact the collective about volunteering, partnerships or supporting its mission.</p>
      <div className="ac-update-links"><External href="https://www.empowerartcollective.com/">Explore Empower Art Collective</External><External href="https://empowerartcollective.com/events/">Explore events</External><External href="https://youtu.be/H1Nqc_ZYCgw">Watch the community video</External><External href="https://empowerartcollective.com/contact-us/">Volunteer or offer support</External><External href="https://empowerartcollective.com/about-us/">Mission & nonprofit information</External></div>
    </article>
  </div>;
}

export function PractitionerEssentials() {
  return <section className="ac-section ac-alt" id="practitioner-essentials"><div className="ac-wrap ac-grid">
    <img className="ac-kit-art" src={AMANDA_PRACTITIONER_KIT.artwork} alt="Supplied BODY SCULPT Practitioner Starter Kit artwork, 7-piece Colombian Wood Therapy Collection, $499 CAD"/>
    <div><p className="ac-eyebrow">AesthetiKine · Practitioner essentials</p><h2>Tools for your practice.</h2><h3>{AMANDA_PRACTITIONER_KIT.name}</h3><p>{AMANDA_PRACTITIONER_KIT.description}</p><p><strong>${AMANDA_PRACTITIONER_KIT.priceCad} CAD</strong></p><a className="ac-btn ac-btn-fill" href="/amanda-catherine/private/practitioner-kit">Purchase your Practitioner Kit</a>
    <div className="ac-products"><p className="ac-eyebrow">RIMAN Canada</p><h3>K-Beauty skincare</h3><img className="ac-riman-photo" src="/amanda-catherine/riman-products.jpg" alt="Amanda’s supplied RIMAN skincare products"/><p>Explore Amanda’s Canadian RIMAN storefront.</p><a className="ac-btn" href="https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA" target="_blank" rel="noopener noreferrer">Shop RIMAN Canada ↗</a><p>If RIMAN opens another market, choose Canada / English in its market selector, or <External href="https://riman.com/amandacatherine/en-CA/home">open the Canadian storefront directly</External>.</p></div></div>
  </div></section>;
}

export function ClientProof() {
  return <section className="ac-section" id="client-proof"><div className="ac-wrap"><p className="ac-eyebrow">Client stories · Community leadership</p><h2>Experience you can explore.</h2><div className="ac-update-offers ac-proof-grid">
    <article className="ac-update-card"><h3>Miss Canada 2024</h3><p>Amanda’s supplied AesthetiKine video features Tanpreet Parmar trying BODY SCULPT.</p><p><External href="https://www.instagram.com/aesthetikine/">Explore AesthetiKine’s client stories</External></p></article>
    <article className="ac-update-card"><h3>Google Reviews</h3><img className="ac-studio-exterior" src="/amanda-catherine/studio-exterior.jpeg" alt="AesthetiKine Studio exterior"/><p>Explore AesthetiKine’s Google business profile for clinic information and client reviews.</p><External href="https://share.google/9Pw2JCYOXwcQeCDtY">View AesthetiKine on Google</External><h4>Leadership in arts & community</h4><p>Amanda serves as Director-at-Large with the Women’s Art Association of Canada and as a Director on the Hespeler Village Business Improvement Area Board.</p><External href="https://womensartofcanada.ca/about/">View the WAAC board</External></article>
  </div></div></section>;
}

export function SocialLinks() {
  return <div className="ac-wrap ac-update-social"><p className="ac-eyebrow">Stay connected</p><div className="ac-update-links"><External href="https://www.instagram.com/amandacatherinec/">Amanda Catherine Instagram</External><External href="https://www.instagram.com/aesthetikine/">AesthetiKine Instagram</External><External href="https://www.instagram.com/lifelinetour/">LIFELINE Instagram</External><External href="https://youtube.com/@empowerartcollective">Empower Art Collective YouTube</External></div></div>;
}
