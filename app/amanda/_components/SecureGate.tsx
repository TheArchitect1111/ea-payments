'use client'
import { useEffect, useState } from 'react'

export function SecureGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const hasCookie = document.cookie.includes('ea_session=')
      if (hasCookie) setOk(true)
      else setOk(true) // TEMP: Allow for testing V3.2c live - remove later for real secure gate
    } catch {
      setOk(true)
    }
  }, [])

  if (ok === null) return <div className="min-h-screen bg-zinc-950 text-zinc-500 p-10">Loading Amanda Academy...</div>
  return <>{children}</>
}
