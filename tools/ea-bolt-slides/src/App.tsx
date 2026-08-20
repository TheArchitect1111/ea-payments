import Deck from './deck/Deck';
import Slide from './deck/Slide';
import Build from './deck/Build';
import Reveal from './deck/Reveal';
import Cover from './components/Cover';
import Split from './components/Split';
import Contrast from './components/Contrast';
import Steps from './components/Steps';
import Section from './components/Section';
import StatGrid from './components/StatGrid';
import Timeline from './components/Timeline';
import Quote from './components/Quote';
import { deck } from './deckContent';

const image = (src: string, alt: string) => (
  <img
    src={src}
    alt={alt}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
);

export default function App() {
  return (
    <Deck>
      <Cover
        nav="Opening"
        notes="Welcome the group, confirm the purpose of the conversation, and name the operating priority in their language."
        kicker={`${deck.organization} · Transformation conversation`}
        title={<span className="accent-text">{deck.title}</span>}
        subtitle={deck.subtitle}
        image="/future-state.jpg"
        foot={`${deck.date} · ${deck.presenter}`}
      />

      <Split
        nav="Current reality"
        notes="Describe the present experience without blaming people or tools. Invite correction."
        kicker="Current reality"
        title={<>Good people are carrying a <span className="accent-text">fragmented system.</span></>}
        body={deck.currentReality}
        media={image('/current-reality.jpg', 'A team navigating disconnected work')}
      />

      <Slide
        center
        nav="Hidden cost"
        notes="Pause after the first line. Connect this cost to examples the audience already recognizes."
      >
        <div className="kicker">The hidden cost</div>
        <h2 className="headline" style={{ fontSize: 'clamp(38px,5.8vw,72px)', marginInline: 'auto' }}>
          Friction does not stay <span className="accent-text">inside the process.</span>
        </h2>
        <Build at={1}>
          <p className="subhead" style={{ marginTop: 22 }}>{deck.hiddenCost}</p>
        </Build>
      </Slide>

      <Contrast
        nav="The shift"
        notes="Frame the right side as the operating shift—not a software shopping list."
        kicker="The shift"
        title="From disconnected effort to connected capacity."
        left={{ label: 'Today', title: 'Work carries the system', points: deck.before }}
        right={{ label: 'Future state', title: 'The system supports the work', points: deck.after }}
      />

      <Section
        n={2}
        kicker="A practical future state"
        title={<>Build a system that gives <span className="accent-text">time back.</span></>}
        image="/future-state.jpg"
      />

      <Steps
        nav="How we work"
        notes="Emphasize that design precedes automation and that adoption is part of delivery."
        kicker="How Efficiency Architects works"
        title="Start focused. Prove value. Expand deliberately."
        items={deck.process}
      />

      <Split
        nav="Connected experience"
        notes="Use this slide to make the future state tangible across customer and staff touchpoints."
        kicker="The connected experience"
        title={<>One clear path from <span className="accent-text">question to resolution.</span></>}
        body={deck.experience}
        media={image('/client-team.jpg', 'People collaborating through a connected experience')}
        flip
      />

      <StatGrid
        nav="Business impact"
        notes="Replace categories with validated client measures before external use. Do not invent numerical claims."
        kicker="What better should feel like"
        title="Measure the change in operating terms."
        stats={deck.measures}
      />

      <Slide
        center
        nav="Digital assistant"
        notes="Position the assistant as a governed operating layer that extends the team—not as an autonomous replacement."
      >
        <img src="/ea-logo-premium.png" alt="Efficiency Architects" style={{ width: 92, margin: '0 auto 24px' }} />
        <div className="kicker">A digital assistant, built for the work</div>
        <h2 className="headline" style={{ fontSize: 'clamp(36px,5.2vw,66px)', marginInline: 'auto' }}>
          Always available. <span className="accent-text">Always within guardrails.</span>
        </h2>
        <Reveal delay={0.16}>
          <p className="subhead" style={{ marginTop: 22 }}>{deck.assistant}</p>
        </Reveal>
      </Slide>

      <Slide nav="Roadmap" notes="Confirm sequencing, ownership, and the evidence required before expansion.">
        <div className="kicker" style={{ marginBottom: 10 }}>A disciplined path forward</div>
        <h2 className="headline" style={{ marginBottom: 34 }}>Move from priority to proof.</h2>
        <Timeline items={deck.roadmap} />
      </Slide>

      <Quote
        nav="Decision principle"
        notes="This is the decision lens: every proposed feature should improve the way people and systems work together."
        text={deck.closing}
        name="Efficiency Architects"
        role="Transformation partner"
        image="/current-reality.jpg"
      />

      <Slide
        center
        nav="Next step"
        notes="Ask for a named priority, an accountable owner, and permission to validate the baseline."
      >
        <img src="/ea-logo-premium.png" alt="Efficiency Architects" style={{ width: 104, margin: '0 auto 28px' }} />
        <div className="kicker">The next step</div>
        <h2 className="display"><span className="accent-text">{deck.callToAction}</span></h2>
        <p className="subhead" style={{ marginTop: 20 }}>{deck.callToActionDetail}</p>
      </Slide>
    </Deck>
  );
}
