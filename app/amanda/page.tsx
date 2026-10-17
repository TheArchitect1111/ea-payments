'use client'
import { useState, useEffect } from 'react'

type Module = {
  id: number
  title: string
  duration: string
  videoId: string
  description: string
  vimeoUrl?: string // Put real Vimeo/YouTube link here
}

const modules: Module[] = [
  { id: 1, title: "Wood Therapy Fundamentals", duration: "45 min", videoId: "placeholder-1", description: "History, benefits, contraindications", vimeoUrl: "" },
  { id: 2, title: "Tools & Techniques", duration: "52 min", videoId: "placeholder-2", description: "Different wood tools + pressure points", vimeoUrl: "" },
  { id: 3, title: "Body Sculpting Protocol", duration: "61 min", videoId: "placeholder-3", description: "Full body protocol step-by-step", vimeoUrl: "" },
  { id: 4, title: "Client Assessment", duration: "38 min", videoId: "placeholder-4", description: "Consultation, photos, measurements", vimeoUrl: "" },
  { id: 5, title: "Certification & Business", duration: "44 min", videoId: "placeholder-5", description: "Pricing, consent forms, certificate", vimeoUrl: "" },
]

export default function AmandaClassroom() {
  const [completed, setCompleted] = useState<number[]>([])
  const [activeId, setActiveId] = useState(1)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('amanda-wood-progress')
    if (saved) {
      try { setCompleted(JSON.parse(saved)) } catch {}
    } else {
      setCompleted([0]) // Start with nothing, user clicks first
    }
    setReady(true)
    
    // Check secure cookie - if no cookie and not ?bypass, redirect to test-session
    const params = new URLSearchParams(window.location.search)
    const isBypass = params.get('bypass') === '1' || params.get('test') === '1'
    if (!isBypass) {
      const hasSession = document.cookie.includes('ea_session=')
      if (!hasSession) {
        console.log('No ea_session - in production would redirect to login')
        // window.location.href = '/api/ea/bridge/test-session?redirect=/amanda'
      }
    }
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem('amanda-wood-progress', JSON.stringify(completed))
  }, [completed, ready])

  if (!ready) return <div className="min-h-screen bg-zinc-950 text-zinc-500 p-10">Loading Amanda Academy...</div>

  const activeModule = modules.find(m => m.id === activeId) || modules[0]
  const isUnlocked = (id: number) => id === 1 || completed.includes(id - 1)
  const progressPct = Math.round((completed.filter(c => c>0).length / modules.length) * 100)
  const allDone = completed.filter(c => c>0).length === modules.length

  const markComplete = () => {
    if (!completed.includes(activeId)) {
      const next = [...completed, activeId].sort((a,b) => a-b)
      setCompleted(next)
      if (activeId < modules.length) setActiveId(activeId + 1)
    } else if (activeId < modules.length) {
      setActiveId(activeId + 1)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Amanda Wood Therapy Academy</h1>
            <p className="text-zinc-500 text-sm">V3.2 FINAL - Amanda's OWN Academy • Stripe Bypassed</p>
          </div>
          <div className="text-right">
            <div className={`text-xs px-3 py-1 rounded-full border ${allDone ? 'bg-green-950 text-green-400 border-green-900' : 'bg-zinc-900 text-zinc-300 border-zinc-800'}`}>
              {progressPct}% {allDone ? '• Certified Ready' : '• In Progress'}
            </div>
            <div className="w-32 bg-zinc-800 rounded-full h-1.5 mt-2 ml-auto">
              <div className="bg-white h-1.5 rounded-full transition-all" style={{width: `${progressPct}%`}}></div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-black rounded-lg aspect-video border border-zinc-800 flex items-center justify-center relative overflow-hidden">
              {activeModule.vimeoUrl ? (
                <iframe src={activeModule.vimeoUrl} className="w-full h-full" allowFullScreen />
              ) : (
                <div className="text-center p-6">
                  <div className="text-5xl mb-3">▶️</div>
                  <p className="text-lg font-medium">{activeModule.title}</p>
                  <p className="text-xs text-zinc-500 mt-2">Video ID: {activeModule.videoId}</p>
                  <p className="text- text-zinc-600 mt-3 max-w-sm mx-auto">Replace vimeoUrl in modules array with real Vimeo/YouTube embed link. Example: https://player.vimeo.com/video/XXXXX</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <h2 className="font-semibold text-lg">{activeModule.title}</h2>
              <p className="text-sm text-zinc-400 mt-1">{activeModule.description} • {activeModule.duration}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={markComplete} className="bg-white text-black text-sm px-5 py-2.5 rounded-full font-medium hover:bg-zinc-200">
                  {completed.includes(activeId) ? '✓ Completed - Next →' : 'Mark Complete & Unlock Next'}
                </button>
                {allDone && (
                  <button onClick={() => alert('Certificate PDF generation - next step: connect PDF lib')} className="bg-green-600 text-white text-sm px-5 py-2.5 rounded-full font-medium">
                    🎓 Download Certificate
                  </button>
                )}
              </div>
              {allDone && <p className="text-xs text-green-400 mt-3">All modules complete! Certificate ready.</p>}
            </div>
          </div>

          <div className="space-y-2">
            {modules.map(m => {
              const unlocked = isUnlocked(m.id)
              const done = completed.includes(m.id)
              return (
                <div key={m.id} onClick={() => unlocked && setActiveId(m.id)} className={`p-3 rounded-lg border transition ${activeId === m.id ? 'bg-white text-black border-white' : unlocked ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer' : 'bg-zinc-900 border-zinc-800 opacity-40 cursor-not-allowed'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{m.id}. {m.title}</span>
                    <span className="text-xs">{done ? '✓' : unlocked ? '○' : '🔒'}</span>
                  </div>
                  <span className="text- opacity-60">{m.duration} • {unlocked ? (done ? 'Completed' : 'Unlocked') : 'Locked - Complete previous'}</span>
                </div>
              )
            })}
            <div className="pt-4 text- text-zinc-600 border-t border-zinc-800 mt-4">
              V3.2 FINAL<br/>
              Progress: localStorage amanda-wood-progress<br/>
              Secure: ea_session cookie (bypass with ?bypass=1)<br/>
              Stripe: BYPASSED - /api/amanda/checkout ready for later<br/>
              Next: Add real Vimeo links + certificate PDF
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
