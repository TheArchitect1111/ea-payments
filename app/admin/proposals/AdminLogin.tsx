'use client';

import { useState, FormEvent } from 'react';

const NAVY = '#1B2B4D';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Invalid password.');
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            Efficiency Architects
          </p>
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
            Admin Access
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800">
                Proposal Dashboard
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Admin access required.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
