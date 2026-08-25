'use client';

import { useMemo, useState } from 'react';
import type { PortalCrmHomeModel } from '@/lib/crm-pilot';
import './crm-pilot.css';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Decision', 'Won', 'Lost'];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function dueLabel(value?: string) {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export default function CrmPilotClient({ initialModel }: { initialModel: PortalCrmHomeModel }) {
  const [model, setModel] = useState(initialModel);
  const [notice, setNotice] = useState('');

  const metrics = useMemo(() => {
    const openStages = new Set(['New', 'Contacted', 'Qualified', 'Proposal', 'Decision']);
    const cards = model.pipeline.flatMap((column) => column.cards);
    const open = cards.filter((card) => openStages.has(card.stage));
    return {
      ...model.metrics,
      openOpportunities: open.length,
      pipelineValue: open.reduce((sum, card) => sum + card.value, 0),
      overdueTasks: model.taskQueue.filter((task) => task.overdue).length,
    };
  }, [model]);

  function completeTask(taskId: string) {
    setModel((current) => ({
      ...current,
      taskQueue: current.taskQueue.filter((task) => task.id !== taskId),
      eva: current.eva.filter((signal) => signal.taskId !== taskId),
    }));
    setNotice('Task completed. Eva removed it from the attention queue.');
  }

  function advanceOpportunity(opportunityId: string) {
    setModel((current) => {
      let moving: PortalCrmHomeModel['pipeline'][number]['cards'][number] | undefined;
      const stripped = current.pipeline.map((column) => ({
        ...column,
        cards: column.cards.filter((card) => {
          if (card.id === opportunityId) moving = card;
          return card.id !== opportunityId;
        }),
      }));
      if (!moving) return current;
      const index = Math.max(0, STAGES.indexOf(moving.stage));
      const nextStage = STAGES[Math.min(index + 1, STAGES.length - 1)];
      const next = stripped.map((column) =>
        column.stage === nextStage
          ? { ...column, cards: [...column.cards, { ...moving!, stage: nextStage, needsAttention: false }] }
          : column,
      );
      return {
        ...current,
        pipeline: next,
        eva: current.eva.filter((signal) => signal.opportunityId !== opportunityId),
      };
    });
    setNotice('Opportunity moved forward. Eva cleared the stale-stage alert for this preview.');
  }

  return (
    <section className="crm-pilot-shell">
      <header className="crm-pilot-header">
        <div>
          <p className="crm-eyebrow">EA CRM · CLIENT PORTAL PILOT</p>
          <h1>Relationships, pipeline, and next actions.</h1>
          <p>Eva watches the work so the client does not have to remember every follow-up.</p>
        </div>
        <span className="crm-eva-pill">Eva watching</span>
      </header>

      {notice && <div className="crm-notice">{notice}</div>}

      <div className="crm-metrics">
        <article><span>Contacts</span><strong>{metrics.contacts}</strong></article>
        <article><span>Open opportunities</span><strong>{metrics.openOpportunities}</strong></article>
        <article><span>Pipeline</span><strong>{money(metrics.pipelineValue)}</strong></article>
        <article className={metrics.overdueTasks ? 'warn' : ''}><span>Overdue</span><strong>{metrics.overdueTasks}</strong></article>
      </div>

      <div className="crm-top-grid">
        <section className="crm-panel crm-eva-panel">
          <div className="crm-panel-head"><div><span>Eva</span><h2>Next best actions</h2></div></div>
          <div className="crm-signal-list">
            {model.eva.length ? model.eva.slice(0, 6).map((signal, index) => (
              <article key={`${signal.title}-${index}`} className={`crm-signal ${signal.severity}`}>
                <strong>{signal.title}</strong>
                <p>{signal.message}</p>
                <small>{signal.recommendedAction}</small>
              </article>
            )) : <p className="crm-muted">Nothing urgent. Eva will surface the next action when attention is needed.</p>}
          </div>
        </section>

        <section className="crm-panel">
          <div className="crm-panel-head"><div><span>Today</span><h2>Task queue</h2></div></div>
          <div className="crm-task-list">
            {model.taskQueue.length ? model.taskQueue.map((task) => (
              <article className={`crm-task ${task.overdue ? 'overdue' : ''}`} key={task.id}>
                <button onClick={() => completeTask(task.id)} aria-label={`Complete ${task.title}`}>✓</button>
                <div><strong>{task.title}</strong><small>{dueLabel(task.dueAt)}{task.overdue ? ' · overdue' : ''}</small></div>
              </article>
            )) : <p className="crm-muted">No open tasks.</p>}
          </div>
        </section>
      </div>

      <section className="crm-panel crm-pipeline-panel">
        <div className="crm-panel-head"><div><span>Pipeline</span><h2>Opportunity board</h2></div><span className="crm-preview-tag">Interactive preview</span></div>
        <div className="crm-pipeline">
          {model.pipeline.filter((column) => column.cards.length || !['Won', 'Lost'].includes(column.stage)).map((column) => (
            <section className="crm-column" key={column.stage}>
              <header><strong>{column.stage}</strong><span>{column.cards.length} · {money(column.cards.reduce((sum, card) => sum + card.value, 0))}</span></header>
              <div>
                {column.cards.length ? column.cards.map((card) => (
                  <button className={`crm-card ${card.needsAttention ? 'needs-attention' : ''}`} key={card.id} onClick={() => advanceOpportunity(card.id)}>
                    <span>{card.title}</span>
                    <strong>{money(card.value)}</strong>
                    <small>{card.needsAttention ? 'Eva: needs attention · tap to advance' : 'Tap to advance stage'}</small>
                  </button>
                )) : <p className="crm-column-empty">No opportunities</p>}
              </div>
            </section>
          ))}
        </div>
      </section>

      <p className="crm-footnote">Pilot data is temporary and isolated. Production persistence will switch to the Frappe-backed EA CRM provider without changing this portal experience.</p>
    </section>
  );
}
