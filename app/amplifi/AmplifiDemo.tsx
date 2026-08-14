'use client';

import { useState } from 'react';

const stages = [
  { label: 'Brief', title: 'Start with the event once', note: 'Amplifi uses the objective, audience, date, location, registration link, and brand voice.', status: 'BRIEF COMPLETE' },
  { label: 'Create', title: 'A campaign appears, not one lonely post', note: 'Nine connected messages cover announcement, registration, speakers, reminders, day-of content, thanks, and recap.', status: '9 POSTS CREATED' },
  { label: 'Review', title: 'Your judgment stays in the loop', note: 'Approve, edit, replace the visual, change the channel, request another version, or reject the draft.', status: '6 APPROVED · 3 TO REVIEW' },
  { label: 'Move', title: 'Approved work keeps moving', note: 'Amplifi follows the calendar, publishes only approved content, and brings the response back into Smartchitecture.', status: '4 SCHEDULED' },
] as const;

export default function AmplifiDemo() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return <section className="amp-demo" id="demo">
    <header><p className="amp-kicker">INTERACTIVE CAMPAIGN WALKTHROUGH</p><h2>See one event become<br/>a coordinated campaign.</h2><p>Select each step to follow the work from a simple brief to scheduled content.</p></header>
    <div className="amp-demo-tabs" role="tablist" aria-label="Campaign demo steps">{stages.map((item, index) => <button type="button" role="tab" aria-selected={active === index} className={active === index ? 'active' : ''} onClick={() => setActive(index)} key={item.label}><span>0{index + 1}</span>{item.label}</button>)}</div>
    <div className="amp-demo-stage">
      <div className="amp-demo-copy"><span>{stage.status}</span><h3>{stage.title}</h3><p>{stage.note}</p><div className="amp-demo-controls"><button type="button" onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}>Previous</button><button type="button" onClick={() => setActive(Math.min(stages.length - 1, active + 1))} disabled={active === stages.length - 1}>Next step</button></div></div>
      <div className={`amp-product amp-product-${active}`}>
        <div className="amp-product-top"><span className="amp-mini-mark">A</span><b>Community Leadership Fundraiser</b><small>{stage.status}</small></div>
        {active === 0 && <div className="amp-brief-view"><label>Campaign objective<strong>Increase awareness and registrations</strong></label><label>Audience<strong>Community leaders · supporters · partners</strong></label><div><label>Event date<strong>October 18</strong></label><label>Channels<strong>Facebook · Instagram · LinkedIn</strong></label></div><button>Build the campaign</button></div>}
        {active === 1 && <div className="amp-create-view"><div className="amp-campaign-track">{['Announcement','Registration','Speaker','Deadline','Tomorrow','Today','Thank you','Photo recap','Results'].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div><div className="amp-create-summary"><strong>9</strong><p>coordinated posts created from one event brief</p></div></div>}
        {active === 2 && <div className="amp-review-view"><div className="amp-post-preview"><small>FACEBOOK · READY FOR REVIEW</small><h4>Leadership grows when the community gathers.</h4><p>Join us for an evening designed to connect local leaders, supporters, and new possibilities...</p><div><button>Change</button><button>Replace visual</button><button>Approve</button></div></div><aside><span><b>6</b>Approved</span><span><b>3</b>Awaiting review</span><span><b>0</b>Published without approval</span></aside></div>}
        {active === 3 && <div className="amp-move-view"><div className="amp-calendar-strip">{['MON','TUE','WED','THU','FRI'].map((day,index) => <span className={index === 1 || index === 3 ? 'has-post' : ''} key={day}><small>{day}</small><b>{14 + index}</b>{index === 1 && <i>Registration reminder</i>}{index === 3 && <i>Featured speaker</i>}</span>)}</div><div className="amp-move-stats"><p><strong>4</strong>Scheduled</p><p><strong>2</strong>Published</p><p><strong>38</strong>Tracked clicks</p><p><strong>1</strong>Learning system</p></div></div>}
      </div>
      <div className="amp-demo-phone" aria-label="Mobile Amplifi view"><div className="amp-phone-top"><span className="amp-mini-mark">A</span><b>Amplifi</b><i>3</i></div><small>TODAY</small><h4>Leadership Fundraiser</h4><div className="amp-phone-progress"><span>Campaign progress</span><b>{active < 2 ? 'Preparing content' : active === 2 ? '6 of 9 approved' : '4 posts scheduled'}</b><i><em style={{width: `${25 + active * 22}%`}}/></i></div><button>{active < 2 ? 'View campaign' : active === 2 ? 'Review next post' : 'Open calendar'}</button><nav><span>Home</span><span>Create</span><span>Calendar</span><span>Results</span></nav></div>
    </div>
    <p className="amp-demo-note">This walkthrough demonstrates the Amplifi campaign experience using sample information. Your content, channels, permissions, and rules are configured for your organization.</p>
  </section>;
}
