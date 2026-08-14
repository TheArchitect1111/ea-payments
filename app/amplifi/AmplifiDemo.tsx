'use client';

import { useState } from 'react';

const stages = [
  { label: 'Add the event', title: 'Give Amplifi the event details once.', note: 'Add the objective, audience, date, location, registration link, channels, and brand voice.', status: 'BRIEF COMPLETE' },
  { label: 'See the posts', title: 'See the complete campaign Amplifi created.', note: 'Nine messages cover the announcement, registration, reminders, event day, thanks, and results.', status: '9 POSTS CREATED' },
  { label: 'Review', title: 'Review each platform version before it moves.', note: 'Edit the copy, replace the image, request another version, approve it, or place it on the schedule.', status: '3 AWAITING REVIEW' },
  { label: 'Schedule', title: 'See exactly what will publish and when.', note: 'Approved posts move into the calendar. Nothing publishes outside the rules you choose.', status: '4 SCHEDULED' },
] as const;

const posts = [
  ['Facebook', 'Event announcement', 'Ready for review'], ['Instagram', 'Square announcement', 'Draft'], ['LinkedIn', 'Partner and sponsor post', 'Approved'],
  ['Facebook', 'Registration reminder', 'Scheduled'], ['Instagram', 'Activity spotlight', 'Ready for review'], ['LinkedIn', 'Sponsor recognition', 'Approved'],
  ['Facebook', 'Deadline reminder', 'Scheduled'], ['Instagram', 'Day-of event post', 'Draft'], ['LinkedIn', 'Thank-you and results', 'Planned'],
] as const;
const nav = ['Home', 'Create', 'Campaigns', 'Smart Research', 'Content Library', 'Approvals', 'Calendar', 'Publishing', 'Results', 'Brand Settings'];

export default function AmplifiDemo() {
  const [active, setActive] = useState(0);
  const [channel, setChannel] = useState<'Facebook'|'Instagram'|'LinkedIn'>('Facebook');
  const stage = stages[active];
  return <section className="amp-demo" id="demo">
    <header><p className="amp-kicker">A WORKING AMPLIFI CAMPAIGN</p><h2>See what you would<br/>actually work with.</h2><p>Open each step to follow one fundraiser from a short brief to approved, scheduled social posts.</p></header>
    <div className="amp-demo-tabs" role="tablist" aria-label="Campaign demo steps">{stages.map((item,index)=><button type="button" role="tab" aria-selected={active===index} className={active===index?'active':''} onClick={()=>setActive(index)} key={item.label}><span>0{index+1}</span>{item.label}</button>)}</div>
    <div className="amp-demo-stage">
      <div className="amp-demo-copy"><span>{stage.status}</span><h3>{stage.title}</h3><p>{stage.note}</p><div className="amp-demo-controls"><button type="button" onClick={()=>setActive(Math.max(0,active-1))} disabled={active===0}>Previous</button><button type="button" onClick={()=>setActive(Math.min(stages.length-1,active+1))} disabled={active===stages.length-1}>Next step</button></div></div>
      <div className="amp-dashboard-shell"><aside className="amp-dashboard-nav"><div className="amp-dash-brand"><span className="amp-mini-mark">A</span><b>Amplifi</b></div><nav>{nav.map((item,i)=><span className={(active===0&&i===1)||(active===1&&i===2)||(active===2&&i===5)||(active===3&&i===6)?'active':''} key={item}>{item}</span>)}</nav><small>Smartchitecture active</small></aside><div className="amp-dashboard-main">
        <div className="amp-dashboard-head"><div><small>CAMPAIGN</small><h3>Community Leadership Fundraiser</h3></div><button>Share campaign</button></div>
        <div className="amp-dashboard-stats"><span><b>9</b>posts created</span><span><b>3</b>awaiting review</span><span><b>6</b>approved</span><span><b>4</b>scheduled</span><span><b>2</b>published</span><span><b>38</b>tracked clicks</span></div>
        {active===0&&<div className="amp-dash-brief"><Title kicker="CAMPAIGN BRIEF" title="What is happening?" status="Saved"/><div className="amp-brief-fields"><label>Objective<strong>Increase registrations and sponsor support</strong></label><label>Audience<strong>Members, supporters, community partners</strong></label><label>Date<strong>October 18</strong></label><label>Location<strong>Community Center</strong></label><label>Registration link<strong>event.example/register</strong></label><label>Channels<strong>Facebook · Instagram · LinkedIn</strong></label></div><button>Create the campaign</button></div>}
        {active===1&&<div className="amp-dash-posts"><Title kicker="CONTENT SET" title="9 posts created from this brief" status="Campaign sequence"/><div className="amp-dash-post-grid">{posts.map(([platform,title,status],i)=><article key={title}><div><b>{platform}</b><small>{status}</small></div><span>{String(i+1).padStart(2,'0')}</span><h5>{title}</h5><p>{i<3?'Introduce the fundraiser.':i<6?'Build interest and action.':'Carry the story through.'}</p></article>)}</div></div>}
        {active===2&&<div className="amp-dash-review"><div className="amp-channel-tabs">{(['Facebook','Instagram','LinkedIn'] as const).map(item=><button className={channel===item?'active':''} onClick={()=>setChannel(item)} key={item}>{item}</button>)}</div><div className="amp-review-work"><div className={`amp-social-preview ${channel.toLowerCase()}`}><div><b>{channel}</b><small>READY FOR REVIEW</small></div><div className="amp-social-image"><span>FALL FUNDRAISER</span><small>OCTOBER 18</small></div><h4>{channel==='LinkedIn'?'Community partners make meaningful work possible.':'Save the date for our Fall Fundraiser.'}</h4><p>{channel==='Instagram'?'A night for community, connection, and a shared purpose. Registration is now open.':'Join local leaders, supporters, and neighbors as we build support for the work ahead.'}</p></div><div className="amp-review-actions"><small>POST 1 OF 3 TO REVIEW</small><h4>What would you like to do?</h4><button>Edit copy</button><button>Replace image</button><button>Request another version</button><button className="primary">Approve</button><button className="primary">Approve and schedule</button></div></div></div>}
        {active===3&&<div className="amp-dash-calendar"><Title kicker="OCTOBER 14 TO 20" title="Campaign calendar" status="4 scheduled · 2 published"/><div className="amp-calendar-week">{[['MON','14','LinkedIn · Partner post'],['TUE','15','Facebook · Registration'],['WED','16','Instagram · Spotlight'],['THU','17','Facebook · Deadline'],['FRI','18','Instagram · Day-of'],['SAT','19','LinkedIn · Thank you'],['SUN','20','Results recap']].map(([day,date,item],i)=><div key={day}><small>{day}</small><b>{date}</b><span className={i<2?'published':i<5?'scheduled':'planned'}>{item}</span><em>{i<2?'Published':i<5?'Scheduled':'Planned'}</em></div>)}</div></div>}
      </div></div>
      <div className="amp-demo-phone" aria-label="Mobile Amplifi view"><div className="amp-phone-top"><span className="amp-mini-mark">A</span><b>Amplifi</b><i>3</i></div><small>FUNDRAISER CAMPAIGN</small><h4>{active===0?'Brief ready':active===1?'9 posts created':active===2?'3 posts to review':'Campaign calendar'}</h4><div className="amp-phone-progress"><span>Campaign progress</span><b>{active===0?'Ready to create':active===1?'Content prepared':active===2?'6 of 9 approved':'4 scheduled · 2 published'}</b><i><em style={{width:`${24+active*24}%`}}/></i></div>{active===2&&<div className="amp-phone-card"><b>Facebook</b><p>Save the date for our Fall Fundraiser.</p><button>Approve</button></div>}{active===3&&<div className="amp-phone-card"><b>Today · Oct 18</b><p>Instagram day-of post</p><small>Scheduled 9:00 AM</small></div>}<button>{active===0?'Create campaign':active===1?'View all posts':active===2?'Review next post':'Open calendar'}</button><nav><span>Home</span><span>Create</span><span>Calendar</span><span>Results</span></nav></div>
    </div><p className="amp-demo-note">Interactive product preview using sample campaign information. Your channels, content, permissions, and publishing rules are configured for your organization.</p>
  </section>;
}

function Title({kicker,title,status}:{kicker:string;title:string;status:string}) { return <div className="amp-dash-section-title"><div><small>{kicker}</small><h4>{title}</h4></div><span>{status}</span></div>; }
