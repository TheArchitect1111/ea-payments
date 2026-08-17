import Image from 'next/image';

const JANE_BOOKING_URL = 'https://aesthetikine.janeapp.com/';
const AMANDA_COURSE_LOGIN_URL = '/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning';
const AMANDA_ADMIN_LOGIN_URL = '/portal/login?next=%2Fportal%2Famanda-catherine%2Freports';

const signatureExperiences = [
  {
    title: 'Half-Day Therapeutic Wellness Experience',
    duration: '2.5 hours',
    price: '$395',
    description:
      'A curated wellness session combining functional therapy, facial rejuvenation, and lymphatic activation for a full-body reset.',
  },
  {
    title: 'Full Day Luxury Wellness Reset Experience',
    duration: '4–5 hours',
    price: '$795',
    description:
      'Our signature immersive wellness journey designed to restore posture, circulation, skin vitality, and nervous-system balance.',
    includes: [
      'Align & Heal™ neuromuscular therapy',
      'PostureCorrect™ mobility session',
      'FaceForm™ sculpt facial',
      'GlassGlow™ dermal therapy',
      'BodySculpt™ lymphatic contouring',
      'Oxygen infusion + LED rejuvenation',
      'Guided breathwork session',
      'Relaxation tea ritual',
      'Personalized wellness roadmap',
    ],
  },
] as const;

const ivTherapies = [
  ['Glow Drip™', 'Supports skin health and collagen production.'],
  ['Stress Reset Drip™', 'Helps calm the nervous system and support recovery from stress.'],
  ['Recovery & Performance Drip™', 'Supports muscle recovery and physical performance.'],
  ['HairRestore Drip™', 'Provides nutrients that support scalp and follicular health.'],
  ['Metabolic Sculpt Drip™', 'Supports energy, metabolism, and circulation.'],
] as const;

const memberships = [
  {
    title: 'Glow Membership',
    price: '$149 / month',
    description: 'One Glow Facial and Lymphatic Drainage session each month.',
  },
  {
    title: 'Premium Wellness Membership',
    price: '$349 / month',
    description: 'IPL Glow Facial, Lymphatic Drainage, and a Wellness Glow IV Drip each month.',
  },
] as const;

const socialLinks = [
  ['Amanda Catherine on Instagram', 'https://www.instagram.com/amandacatherinec/'],
  ['LIFELINE Tour on Instagram', 'https://www.instagram.com/lifelinetour/'],
  ['AesthetiKine on Instagram', 'https://www.instagram.com/aesthetikine/'],
  ['Empower Art Collective on YouTube', 'https://youtube.com/@empowerartcollective'],
  ['AesthetiKine website', 'https://www.aesthetikine.com/'],
  ['Empower Art Collective website', 'https://www.empowerartcollective.com/'],
] as const;

const programs = [
  {
    eyebrow: 'Virtual or in person',
    title: 'AesthetiKine Nervous System Reset',
    price: 'CAD $997',
    description:
      'Practitioner training in a calm, structured recovery experience that blends grounding, breath coaching, mobility, facial drainage, and gentle lymphatic-style support.',
    learn: [
      'Client-centered session flow',
      'Grounding and breath-coaching techniques',
      'Facial and body drainage foundations',
      'Safe preparation, closing, and aftercare',
    ],
  },
  {
    eyebrow: 'In-person certification',
    title: 'Body Sculpt Practitioner Certification',
    price: 'CAD $2,497',
    description:
      'Hands-on education in Amanda Catherine’s kinesiology-based body-contouring method, including directional manual work, selective wood therapy, anatomy-led pressure, and treatment sequencing.',
    learn: [
      '60- and 90-minute treatment structures',
      'Anatomy-led sculpting and directional work',
      'Wood-tool selection and controlled application',
      'Client comfort, safety, and professional language',
    ],
  },
] as const;

export function isAmandaPublicSiteSlug(slug: string): boolean {
  const key = slug.trim().toLowerCase();
  return key === 'amanda-catherine' || key.startsWith('amanda-catherine-');
}

export default function AmandaPublicAdditions() {
  return (
    <div className="ak-public-additions">
      <section className="ak-signature" id="signature-wellness" aria-labelledby="ak-signature-title">
        <div className="ak-section-heading">
          <p className="ak-kicker">Signature wellness experiences</p>
          <h2 id="ak-signature-title">Time set aside for your whole system.</h2>
          <p>Thoughtfully sequenced care for restoration, circulation, mobility, skin vitality, and calm.</p>
        </div>
        <div className="ak-experience-grid">
          {signatureExperiences.map((experience) => (
            <article className="ak-experience" key={experience.title}>
              <div className="ak-experience__meta"><span>{experience.duration}</span><strong>{experience.price}</strong></div>
              <h3>{experience.title}</h3>
              <p>{experience.description}</p>
              {'includes' in experience ? (
                <ul>{experience.includes.map((item) => <li key={item}>{item}</li>)}</ul>
              ) : null}
              <a href={JANE_BOOKING_URL} target="_blank" rel="noopener noreferrer">Book with Jane <span aria-hidden>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="ak-iv" id="iv-wellness" aria-labelledby="ak-iv-title">
        <div className="ak-section-heading">
          <p className="ak-kicker">IV wellness therapy</p>
          <h2 id="ak-iv-title">Support designed around how you want to feel.</h2>
        </div>
        <div className="ak-iv-list">
          {ivTherapies.map(([title, description]) => (
            <article key={title}><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
        <p className="ak-clinical-note">IV services are provided only following appropriate screening and by an authorized medical professional.</p>
      </section>

      <section className="ak-memberships" id="memberships" aria-labelledby="ak-memberships-title">
        <div className="ak-section-heading">
          <p className="ak-kicker">Membership programs</p>
          <h2 id="ak-memberships-title">Make wellness part of your rhythm.</h2>
        </div>
        <div className="ak-membership-grid">
          {memberships.map((membership) => (
            <article key={membership.title}>
              <h3>{membership.title}</h3>
              <strong>{membership.price}</strong>
              <p>{membership.description}</p>
              <a href={`mailto:amanda@aesthetikine.com?subject=${encodeURIComponent(membership.title)}`}>Ask about membership <span aria-hidden>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="ak-financing" id="financing" aria-labelledby="ak-financing-title">
        <div>
          <p className="ak-kicker">Flexible financing</p>
          <h2 id="ak-financing-title">Beauty now. Pay later.</h2>
          <p>Scan Amanda’s personal Medicard QR code to review financing through iFinance.</p>
        </div>
        <div className="ak-financing__image">
          <Image src="/amanda-catherine/amanda-medicard-qr.jpg" alt="Amanda Catherine’s Medicard by iFinance QR code" fill sizes="(max-width: 780px) 92vw, 520px" />
        </div>
      </section>

      <section className="ak-corporate" id="corporate-wellness" aria-labelledby="ak-corporate-title">
        <div className="ak-corporate__copy">
          <p className="ak-kicker">AesthetiKine Corporate Wellness</p>
          <h2 id="ak-corporate-title">Healthier people. Stronger teams.</h2>
          <p>Flexible onsite and virtual support built around four pillars: Align & Analyze, Onsite Wellness, Individual Care, and Leadership & Culture.</p>
          <ul>
            <li>Kinesiology assessments and personalized wellness foundations</li>
            <li>Virtual sessions, Lunch & Learns, and immersive onsite visits</li>
            <li>Individual employee care and progress support</li>
            <li>Leadership wellness, resilience, and workplace culture</li>
          </ul>
          <a className="ak-primary-link" href="mailto:amanda@aesthetikine.com?subject=AesthetiKine%20Corporate%20Wellness">Request the corporate overview <span aria-hidden>→</span></a>
        </div>
        <div className="ak-corporate__pricing">
          <p>Corporate Wellness Kickstart <strong>$997</strong></p>
          <p>Monthly Wellness Partnership <strong>$1,497/month</strong></p>
          <p>Quarterly Wellness Partnership <strong>$2,997</strong></p>
          <p>Premium Workplace Partnership <strong>$2,997/month</strong></p>
        </div>
      </section>

      <section className="ak-academy" id="training-certification" aria-labelledby="ak-academy-title">
        <div className="ak-academy__intro">
          <p className="ak-kicker">AesthetiKine Academy</p>
          <h2 id="ak-academy-title">Learn the method. Practice with purpose.</h2>
          <p>
            Practitioner education created by Amanda Catherine Case, Registered Kinesiologist,
            for professionals who want thoughtful, anatomy-aware wellness and aesthetic training.
          </p>
          <div className="ak-academy__actions">
            <a className="ak-primary-link" href={AMANDA_COURSE_LOGIN_URL}>Open Courses &amp; Learning <span aria-hidden="true">→</span></a>
            <a className="ak-text-link" href={AMANDA_ADMIN_LOGIN_URL}>Amanda administrator login <span aria-hidden="true">→</span></a>
          </div>
        </div>

        <div className="ak-programs">
          {programs.map((program) => (
            <article className="ak-program" key={program.title}>
              <p className="ak-program__eyebrow">{program.eyebrow}</p>
              <h3>{program.title}</h3>
              <p className="ak-program__price">{program.price}</p>
              <p className="ak-program__description">{program.description}</p>
              <h4>Training includes</h4>
              <ul>
                {program.learn.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a
                className="ak-text-link"
                href={`mailto:amanda@aesthetikine.com?subject=${encodeURIComponent(program.title + ' training')}`}
              >
                Request training details <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>

        <div className="ak-certificate">
          <div className="ak-certificate__mark" aria-hidden="true">AK</div>
          <div>
            <p className="ak-kicker">Certificate of completion</p>
            <h3>A credential that reflects completed practitioner training.</h3>
            <p>
              Eligible participants receive an AesthetiKine Academy certificate after completing
              the training requirements. Course manuals, timed protocols, and practitioner
              resources are protected materials provided only to enrolled participants.
            </p>
          </div>
        </div>
      </section>

      <section className="ak-connect" id="connect-with-amanda" aria-labelledby="ak-connect-title">
        <div>
          <p className="ak-kicker">Connect with Amanda</p>
          <h2 id="ak-connect-title">Amanda Catherine</h2>
          <p>National Sales Director · Visionary</p>
        </div>
        <div className="ak-connect__links">
          {socialLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}<span aria-hidden>↗</span></a>)}
        </div>
      </section>

      <section className="ak-intake" id="client-intake" aria-labelledby="ak-intake-title">
        <div>
          <p className="ak-kicker">Private by design</p>
          <h2 id="ak-intake-title">Client intake stays securely inside Jane.</h2>
          <p>
            Health history, consent, insurance information, and other personal details are never
            collected or stored by this website. After booking, clients complete the appropriate
            forms through Amanda’s secure Jane experience.
          </p>
        </div>
        <a className="ak-primary-link" href={JANE_BOOKING_URL} target="_blank" rel="noopener noreferrer">
          Book securely with Jane <span aria-hidden="true">→</span>
        </a>
      </section>

      <style>{`
        .ak-public-additions {
          --ak-ink: #241b18;
          --ak-wine: #713148;
          --ak-gold: #b78c55;
          --ak-cream: #fbf6ee;
          color: var(--ak-ink);
          background: #fffdf9;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .ak-academy {
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(72px, 9vw, 132px) clamp(22px, 6vw, 82px);
        }
        .ak-signature,
        .ak-iv,
        .ak-memberships,
        .ak-financing,
        .ak-corporate,
        .ak-connect {
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(72px, 9vw, 132px) clamp(22px, 6vw, 82px);
        }
        .ak-section-heading { max-width: 850px; margin-bottom: 48px; }
        .ak-academy__actions { display:flex; flex-wrap:wrap; align-items:center; gap:18px; margin-top:28px; }
        .ak-section-heading h2,
        .ak-financing h2,
        .ak-corporate h2,
        .ak-connect h2 {
          margin: 0 0 18px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 7vw, 78px);
          font-weight: 500;
          letter-spacing: -.045em;
          line-height: .98;
        }
        .ak-section-heading > p:last-child,
        .ak-financing > div > p:last-child,
        .ak-corporate__copy > p,
        .ak-connect > div > p:last-child { color: #685d57; font-size: clamp(17px, 2vw, 21px); line-height: 1.65; }
        .ak-experience-grid { display: grid; grid-template-columns: .85fr 1.15fr; gap: 24px; }
        .ak-experience { padding: clamp(28px, 4vw, 48px); border: 1px solid #eadfce; background: #fffdfa; }
        .ak-experience:nth-child(2) { color: #fff9f1; background: linear-gradient(145deg, #713148, #321923); }
        .ak-experience__meta { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 40px; color: var(--ak-gold); text-transform: uppercase; letter-spacing: .08em; font-size: 12px; }
        .ak-experience h3,
        .ak-iv h3,
        .ak-memberships h3 { margin: 0 0 16px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(28px, 4vw, 43px); font-weight: 500; line-height: 1.05; }
        .ak-experience > p { color: inherit; opacity: .78; line-height: 1.7; }
        .ak-experience ul,
        .ak-corporate ul { columns: 2; gap: 26px; padding: 0; list-style: none; }
        .ak-experience li,
        .ak-corporate li { break-inside: avoid; margin-bottom: 10px; padding-left: 18px; position: relative; line-height: 1.45; }
        .ak-experience li::before,
        .ak-corporate li::before { position: absolute; left: 0; content: "✦"; color: var(--ak-gold); }
        .ak-experience a,
        .ak-memberships a { display: inline-flex; gap: 10px; margin-top: 24px; color: inherit; font-weight: 800; text-underline-offset: 5px; }
        .ak-iv { max-width: none; color: #f8f3e9; background: #3e4820; }
        .ak-iv .ak-section-heading { max-width: 1080px; margin-inline: auto; }
        .ak-iv .ak-kicker { color: #d5aa65; }
        .ak-iv-list { display: grid; max-width: 1080px; margin: 0 auto; grid-template-columns: repeat(5, 1fr); border-top: 1px solid rgba(255,255,255,.24); }
        .ak-iv-list article { padding: 26px 18px 10px; border-right: 1px solid rgba(255,255,255,.18); }
        .ak-iv-list article:last-child { border-right: 0; }
        .ak-iv h3 { font-size: 24px; }
        .ak-iv-list p { color: rgba(255,255,255,.7); line-height: 1.55; }
        .ak-clinical-note { max-width: 1080px; margin: 38px auto 0; color: rgba(255,255,255,.58); font-size: 13px; }
        .ak-membership-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; padding: 1px; background: #dac9b8; }
        .ak-membership-grid article { padding: clamp(34px, 5vw, 62px); background: #fffdf9; }
        .ak-membership-grid strong { color: var(--ak-wine); font-size: 21px; }
        .ak-membership-grid p { color: #685d57; line-height: 1.65; }
        .ak-financing { display: grid; grid-template-columns: .82fr 1.18fr; gap: clamp(36px, 7vw, 90px); align-items: center; max-width: none; background: #f5f2f0; }
        .ak-financing__image { position: relative; overflow: hidden; aspect-ratio: 1.493 / 1; border-radius: 20px; box-shadow: 0 24px 70px rgba(26,25,25,.18); }
        .ak-financing__image img { object-fit: cover; object-position: center 17%; }
        .ak-corporate { display: grid; grid-template-columns: 1.15fr .85fr; gap: 70px; align-items: end; }
        .ak-corporate__copy > p { max-width: 690px; }
        .ak-corporate__pricing { border-top: 1px solid #d8c7b4; }
        .ak-corporate__pricing p { display: flex; justify-content: space-between; gap: 20px; margin: 0; padding: 22px 0; border-bottom: 1px solid #d8c7b4; }
        .ak-corporate__pricing strong { color: var(--ak-wine); white-space: nowrap; }
        .ak-connect { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; background: #fffdf9; }
        .ak-connect__links { border-top: 1px solid #e3d7cb; }
        .ak-connect__links a { display: flex; justify-content: space-between; gap: 20px; padding: 17px 4px; border-bottom: 1px solid #e3d7cb; color: var(--ak-ink); text-decoration: none; }
        .ak-academy__intro {
          max-width: 820px;
          margin-bottom: 54px;
        }
        .ak-kicker,
        .ak-program__eyebrow {
          margin: 0 0 14px;
          color: var(--ak-wine);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ak-academy h2,
        .ak-intake h2 {
          max-width: 920px;
          margin: 0 0 20px;
          color: var(--ak-ink);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 7vw, 82px);
          font-weight: 500;
          letter-spacing: -.045em;
          line-height: .98;
        }
        .ak-academy__intro > p:last-child,
        .ak-intake p {
          max-width: 720px;
          margin: 0;
          color: #685d57;
          font-size: clamp(17px, 2vw, 21px);
          line-height: 1.65;
        }
        .ak-programs {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
        }
        .ak-program {
          display: flex;
          min-height: 570px;
          flex-direction: column;
          padding: clamp(28px, 4vw, 48px);
          border: 1px solid #eadfce;
          border-radius: 28px;
          background:
            radial-gradient(circle at 100% 0%, rgba(183, 140, 85, .16), transparent 34%),
            linear-gradient(150deg, #fffdfa, #f8f0e5);
          box-shadow: 0 26px 70px rgba(54, 36, 29, .09);
        }
        .ak-program:nth-child(2) {
          background:
            radial-gradient(circle at 100% 0%, rgba(183, 140, 85, .22), transparent 35%),
            linear-gradient(145deg, #6f2d45, #321923);
          color: #fff9f1;
          border-color: rgba(255, 255, 255, .16);
        }
        .ak-program:nth-child(2) .ak-program__eyebrow,
        .ak-program:nth-child(2) .ak-program__price {
          color: #e4c493;
        }
        .ak-program:nth-child(2) .ak-program__description,
        .ak-program:nth-child(2) li {
          color: rgba(255, 249, 241, .76);
        }
        .ak-program h3,
        .ak-certificate h3 {
          margin: 0 0 18px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(31px, 4vw, 48px);
          font-weight: 500;
          letter-spacing: -.035em;
          line-height: 1.05;
        }
        .ak-program__price {
          margin: 0 0 26px;
          color: var(--ak-wine);
          font-size: 19px;
          font-weight: 800;
        }
        .ak-program__description {
          margin: 0 0 28px;
          color: #685d57;
          font-size: 16px;
          line-height: 1.7;
        }
        .ak-program h4 {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: .15em;
          text-transform: uppercase;
        }
        .ak-program ul {
          display: grid;
          gap: 10px;
          margin: 0 0 34px;
          padding: 0;
          list-style: none;
        }
        .ak-program li {
          position: relative;
          padding-left: 22px;
          color: #685d57;
          line-height: 1.5;
        }
        .ak-program li::before {
          position: absolute;
          left: 0;
          content: "✦";
          color: var(--ak-gold);
        }
        .ak-text-link {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          width: fit-content;
          margin-top: auto;
          color: inherit;
          font-weight: 800;
          text-underline-offset: 5px;
        }
        .ak-certificate {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: clamp(24px, 5vw, 64px);
          align-items: center;
          margin-top: 32px;
          padding: clamp(30px, 6vw, 70px);
          border: 1px solid #dfcda9;
          background: #fffdfa;
        }
        .ak-certificate__mark {
          display: grid;
          width: clamp(112px, 18vw, 180px);
          aspect-ratio: 1;
          place-items: center;
          border: 1px solid var(--ak-gold);
          border-radius: 50%;
          color: var(--ak-wine);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(36px, 7vw, 64px);
        }
        .ak-certificate h3 {
          max-width: 780px;
        }
        .ak-certificate p:last-child {
          max-width: 800px;
          margin: 0;
          color: #685d57;
          line-height: 1.7;
        }
        .ak-intake {
          display: flex;
          gap: 42px;
          align-items: flex-end;
          justify-content: space-between;
          padding: clamp(62px, 8vw, 112px) max(24px, calc((100vw - 1080px) / 2));
          background: var(--ak-cream);
          border-top: 1px solid #eadfce;
        }
        .ak-intake h2 {
          max-width: 720px;
          font-size: clamp(38px, 6vw, 68px);
        }
        .ak-primary-link {
          display: inline-flex;
          flex: 0 0 auto;
          gap: 12px;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          padding: 0 24px;
          border-radius: 999px;
          color: #fff;
          background: var(--ak-wine);
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 14px 35px rgba(113, 49, 72, .22);
        }
        @media (max-width: 780px) {
          .ak-experience-grid,
          .ak-membership-grid,
          .ak-financing,
          .ak-corporate,
          .ak-connect { grid-template-columns: 1fr; }
          .ak-iv-list { grid-template-columns: 1fr; }
          .ak-iv-list article { border-right: 0; border-bottom: 1px solid rgba(255,255,255,.18); }
          .ak-experience ul,
          .ak-corporate ul { columns: 1; }
          .ak-programs { grid-template-columns: 1fr; }
          .ak-program { min-height: 0; }
          .ak-certificate { grid-template-columns: 1fr; }
          .ak-intake { align-items: flex-start; flex-direction: column; }
          .ak-primary-link { width: 100%; }
        }
      `}</style>
    </div>
  );
}
