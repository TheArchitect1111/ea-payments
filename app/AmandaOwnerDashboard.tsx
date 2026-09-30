// AmandaOwnerDashboard.tsx - Approved warm owner dashboard
// Place in: ea-payments / lib/amanda-catherine or app/portal/[slug]/member
import React from "react";

export default function AmandaOwnerDashboard({ user, role }: any) {
  return (
    <div className="min-h-screen bg-[#fdf8f3] text-[#2b1e16]">
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r p-6">
        <h2 className="font-serif text-2xl mb-8">Amanda Catherine</h2>
        <nav className="space-y-3 text-sm">
          <a className="block font-semibold">Home</a>
          <a className="block opacity-70">My Sessions</a>
          <a className="block opacity-70">Book Jane</a>
          <a className="block opacity-70">My Resources</a>
          {role === 'admin' && <a className="block opacity-70">Admin</a>}
        </nav>
      </aside>
      <main className="ml-64 p-10">
        <h1 className="text-4xl font-serif mb-2">Welcome back, {user?.name || 'Amanda'}.</h1>
        <p className="opacity-70 mb-8">Your portal is live. Here's your next step.</p>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">Next Session</div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">Jane Availability</div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">Your Book Feature</div>
        </div>
      </main>
      <style>{`
        .font-serif { font-family: serif; }
      `}</style>
    </div>
  );
}
