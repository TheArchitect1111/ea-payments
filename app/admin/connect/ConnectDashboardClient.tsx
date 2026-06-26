'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ConnectionRecord, ConnectProfile } from '@/lib/connect-types';

export default function ConnectDashboardClient({
  connections,
  profiles,
}: {
  connections: ConnectionRecord[];
  profiles: ConnectProfile[];
}) {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const today = new Date().toISOString().slice(0, 10);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return connections.filter((item) => {
      const matchesPriority = priority === 'all' || item.aiPriority === priority;
      const haystack = [item.name, item.email, item.company, item.role, item.aiRecommendedFollowUp, item.automationStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesPriority && (!q || haystack.includes(q));
    });
  }, [connections, priority, query]);

  return (
    <main className="connect-admin">
      <header className="connect-admin-head">
        <div>
          <p>EA Connect Experience</p>
          <h1>Connections</h1>
        </div>
        <div className="connect-admin-actions">
          <Link href="/api/connect/export">Export CSV</Link>
          <Link href="/admin/connect/profiles/new">New Profile</Link>
        </div>
      </header>

      <section className="connect-metrics">
        <article><span>Today</span><strong>{connections.filter((item) => item.createdAt.slice(0, 10) === today).length}</strong></article>
        <article><span>Total</span><strong>{connections.length}</strong></article>
        <article><span>High Priority</span><strong>{connections.filter((item) => item.aiPriority === 'High').length}</strong></article>
        <article><span>Partial Automations</span><strong>{connections.filter((item) => item.automationStatus.startsWith('partial')).length}</strong></article>
      </section>

      <section className="connect-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search connections" />
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="all">All priorities</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
        </select>
      </section>

      <section className="connect-table-wrap">
        <table className="connect-table">
          <thead>
            <tr>
              <th>Connection</th>
              <th>Profile</th>
              <th>Priority</th>
              <th>Follow-up</th>
              <th>Automation</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <span>{item.email}{item.company ? ` · ${item.company}` : ''}</span>
                </td>
                <td>{profileById.get(item.connectProfileId)?.brandName || item.connectProfileId}</td>
                <td><mark data-priority={item.aiPriority || 'Normal'}>{item.aiPriority || 'Normal'}</mark></td>
                <td>{item.aiRecommendedFollowUp || 'Review connection'}</td>
                <td>{item.automationStatus}</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr><td colSpan={6} className="connect-empty">No connections match this filter.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
