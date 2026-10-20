"use client";

import { useEffect, useRef, useState } from "react";

const ASSET_BASE =
  "https://raw.githubusercontent.com/TheArchitect1111/ea-payments/1cb9aa57caff1344ebc20d53d75d4a5497b0e098/public/images/tb3-official";

const scenes = [
  {
    key: "journey",
    image: `${ASSET_BASE}/OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png`,
    eyebrow: "TARRIS BOUIE",
    title: "THE JOURNEY.",
    position: "80% center",
  },
  {
    key: "athlete",
    image: `${ASSET_BASE}/OFFICIAL_03_LOW_STANCE_ARENA.png`,
    eyebrow: "DISCIPLINE. DETERMINATION.",
    title: "ATHLETE.",
    position: "50% 35%",
  },
  {
    key: "student",
    image: `${ASSET_BASE}/OFFICIAL_09_LIBRARY_STUDYING.png`,
    eyebrow: "STUDENT FIRST.",
    title: "STUDENT.",
    position: "50% 20%",
  },
  {
    key: "builder",
    image: `${ASSET_BASE}/OFFICIAL_15_PODIUM_SPEAKING.png`,
    eyebrow: "THE NEXT CHAPTER.",
    title: "BUILDER.",
    position: "50% 20%",
  },
] as const;

const FINAL_IMAGE = `${ASSET_BASE}/OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png`;

export default function TB3Intro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const previousOverflowRef = useRef("");

  const finish = () => {
    try {
      window.sessionStorage.setItem("tb3_intro_seen_v1", "1");
    } catch {
      // Session storage can be unavailable in hardened browsers. The intro still exits normally.
    }

    setLeaving(true);
    document.documentElement.style.overflow = previousOverflowRef.current;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    closeTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 420);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceReplay = params.get("intro") === "1";

    let seen = false;
    try {
      seen = window.sessionStorage.getItem("tb3_intro_seen_v1") === "1";
    } catch {
      seen = false;
    }

    if (seen && !forceReplay) {
      setVisible(false);
      return;
    }

    previousOverflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    [...scenes.map((scene) => scene.image), FINAL_IMAGE].forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timerRef.current = window.setTimeout(finish, reducedMotion ? 1250 : 5600);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      document.documentElement.style.overflow = previousOverflowRef.current;
    };
    // This intro intentionally initializes once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <section
      className={`tb3-intro ${leaving ? "tb3-intro--leaving" : ""}`}
      aria-label="TB3 introduction"
    >
      <div className="tb3-intro__backdrop" aria-hidden="true" />

      {scenes.map((scene, index) => (
        <div
          key={scene.key}
          className={`tb3-intro__scene tb3-intro__scene--${index + 1}`}
          aria-hidden={index !== 0}
        >
          <img
            src={scene.image}
            alt=""
            className="tb3-intro__image"
            style={{ objectPosition: scene.position }}
          />
          <div className="tb3-intro__shade" />
          <div className="tb3-intro__copy">
            <p>{scene.eyebrow}</p>
            <h2>{scene.title}</h2>
          </div>
        </div>
      ))}

      <div className="tb3-intro__final" aria-hidden="true">
        <img src={FINAL_IMAGE} alt="" className="tb3-intro__final-image" />
        <div className="tb3-intro__final-shade" />
        <div className="tb3-intro__final-copy">
          <p>TARRIS BOUIE</p>
          <h2>TB3</h2>
          <span>MORE THAN A GAME.</span>
        </div>
      </div>

      <div className="tb3-intro__chrome" aria-hidden="true">
        <span>TB3 / PLAYER ONE</span>
        <span>001</span>
      </div>

      <button type="button" className="tb3-intro__skip" onClick={finish}>
        SKIP INTRO
      </button>

      <div className="tb3-intro__progress" aria-hidden="true">
        <span />
      </div>

      <style>{`
        .tb3-intro {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          overflow: hidden;
          background: #070707;
          color: #fff;
          opacity: 1;
          transition: opacity 420ms ease;
          font-family: Arial, Helvetica, sans-serif;
        }

        .tb3-intro--leaving {
          opacity: 0;
          pointer-events: none;
        }

        .tb3-intro__backdrop {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 40%, rgba(165, 28, 48, 0.18), transparent 45%),
            #070707;
        }

        .tb3-intro__scene,
        .tb3-intro__final {
          position: absolute;
          inset: 0;
          opacity: 0;
          overflow: hidden;
          background: #070707;
        }

        .tb3-intro__scene--1 { animation: tb3Scene 1.55s 0s both cubic-bezier(.22,.61,.36,1); }
        .tb3-intro__scene--2 { animation: tb3Scene 1.55s 1.0s both cubic-bezier(.22,.61,.36,1); }
        .tb3-intro__scene--3 { animation: tb3Scene 1.55s 2.0s both cubic-bezier(.22,.61,.36,1); }
        .tb3-intro__scene--4 { animation: tb3Scene 1.55s 3.0s both cubic-bezier(.22,.61,.36,1); }
        .tb3-intro__final { animation: tb3Final 1.7s 3.9s both cubic-bezier(.22,.61,.36,1); }

        .tb3-intro__image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.055);
          animation: tb3Push 1.55s both cubic-bezier(.2,.7,.2,1);
          filter: saturate(.92) contrast(1.05);
        }

        .tb3-intro__scene--2 .tb3-intro__image { animation-delay: 1s; }
        .tb3-intro__scene--3 .tb3-intro__image { animation-delay: 2s; }
        .tb3-intro__scene--4 .tb3-intro__image { animation-delay: 3s; }

        .tb3-intro__shade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(0,0,0,.80) 0%, rgba(0,0,0,.24) 54%, rgba(0,0,0,.58) 100%),
            linear-gradient(0deg, rgba(0,0,0,.74) 0%, transparent 55%);
        }

        .tb3-intro__copy {
          position: absolute;
          left: clamp(22px, 7vw, 104px);
          bottom: clamp(72px, 12vh, 138px);
          max-width: 900px;
          text-align: left;
        }

        .tb3-intro__copy p,
        .tb3-intro__final-copy p {
          margin: 0 0 12px;
          font-size: clamp(9px, 1vw, 13px);
          font-weight: 800;
          letter-spacing: .34em;
          color: rgba(255,255,255,.72);
        }

        .tb3-intro__copy h2 {
          margin: 0;
          font-size: clamp(48px, 11vw, 170px);
          line-height: .82;
          font-weight: 950;
          letter-spacing: -.075em;
          text-transform: uppercase;
          text-shadow: 0 8px 48px rgba(0,0,0,.45);
        }

        .tb3-intro__final {
          display: grid;
          place-items: center;
        }

        .tb3-intro__final-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: .52;
          transform: scale(1.02);
        }

        .tb3-intro__final-shade {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 50%, rgba(0,0,0,.1), rgba(0,0,0,.72) 72%),
            linear-gradient(180deg, rgba(0,0,0,.34), rgba(0,0,0,.72));
        }

        .tb3-intro__final-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
        }

        .tb3-intro__final-copy h2 {
          margin: 0;
          font-size: clamp(92px, 21vw, 280px);
          line-height: .74;
          font-weight: 950;
          letter-spacing: -.105em;
          color: #fff;
        }

        .tb3-intro__final-copy span {
          margin-top: 24px;
          font-size: clamp(11px, 1.6vw, 20px);
          font-weight: 900;
          letter-spacing: .34em;
          color: #c41e3a;
        }

        .tb3-intro__chrome {
          position: absolute;
          top: clamp(20px, 4vw, 48px);
          left: clamp(20px, 4vw, 56px);
          right: clamp(20px, 4vw, 56px);
          z-index: 20;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .25em;
          color: rgba(255,255,255,.56);
        }

        .tb3-intro__skip {
          position: absolute;
          top: clamp(48px, 7vw, 78px);
          right: clamp(20px, 4vw, 56px);
          z-index: 30;
          border: 1px solid rgba(255,255,255,.4);
          background: rgba(0,0,0,.35);
          color: #fff;
          padding: 10px 14px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .16em;
          backdrop-filter: blur(8px);
          cursor: pointer;
        }

        .tb3-intro__skip:hover,
        .tb3-intro__skip:focus-visible {
          border-color: #fff;
          background: rgba(255,255,255,.1);
          outline: none;
        }

        .tb3-intro__progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          height: 3px;
          background: rgba(255,255,255,.1);
        }

        .tb3-intro__progress span {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          background: #c41e3a;
          animation: tb3Progress 5.6s linear both;
        }

        @keyframes tb3Scene {
          0% { opacity: 0; }
          12% { opacity: 1; }
          72% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes tb3Push {
          0% { transform: scale(1.065); }
          100% { transform: scale(1.0); }
        }

        @keyframes tb3Final {
          0% { opacity: 0; }
          22% { opacity: 1; }
          100% { opacity: 1; }
        }

        @keyframes tb3Progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @media (max-width: 640px) {
          .tb3-intro__copy {
            left: 22px;
            right: 22px;
            bottom: 86px;
          }

          .tb3-intro__copy h2 {
            font-size: clamp(54px, 21vw, 92px);
          }

          .tb3-intro__final-image {
            object-fit: cover;
          }

          .tb3-intro__final-copy h2 {
            font-size: clamp(108px, 42vw, 170px);
          }

          .tb3-intro__final-copy span {
            max-width: 280px;
            line-height: 1.65;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tb3-intro__scene {
            display: none;
            animation: none;
          }

          .tb3-intro__final {
            opacity: 1;
            animation: none;
          }

          .tb3-intro__final-image,
          .tb3-intro__progress span {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
