'use client'
import { useEffect, useState } from 'react'

export function SecureGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if ea_session cookie exists (set by secret-gated bridge)
    const hasCookie = document.cookie.includes('ea_session=')
    if (hasCookie) setOk(true)
    else {
      // No cookie? Redirect to bridge login
      window.location.href = '/api/ea/bridge/test-session?redirect=/amanda'
    }
  }, [])

  if (ok === null) return <div className="min-h-screen bg-zinc-950 text-zinc-500 p-10">Checking secure session...</div>
  if (!ok) return <div className="min-h-screen bg-zinc-950 text-white p-10">Redirecting to secure login...</div>
  return <>{children}</>
}
