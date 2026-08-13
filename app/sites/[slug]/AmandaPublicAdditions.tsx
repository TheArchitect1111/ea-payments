const JANE_BOOKING_URL = 'https://aesthetikine.janeapp.com/';

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
      <section className="ak-academy" id="training-certification" aria-labelledby="ak-academy-title">
        <div className="ak-academy__intro">
          <p className="ak-kicker">AesthetiKine Academy</p>
          <h2 id="ak-academy-title">Learn the method. Practice with purpose.</h2>
          <p>
            Practitioner education created by Amanda Catherine Case, Registered Kinesiologist,
            for professionals who want thoughtful, anatomy-aware wellness and aesthetic training.
          </p>
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
