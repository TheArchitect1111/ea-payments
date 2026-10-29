'use client'
import { useState, useEffect } from 'react'
import { SecureGate } from './_components/SecureGate'

type Module = {
  id: number
  title: string
  duration: string
  videoId: string
  description: string
}

const modules: Module[] = [
  { id: 1, title: "Wood Therapy Fundamentals", duration: "45 min", videoId: "placeholder-1", description: "History, benefits, contraindications" },
  { id: 2, title: "Tools & Techniques", duration: "52 min", videoId: "placeholder-2", description: "Different wood tools + pressure points" },
  { id: 3, title: "Body Sculpting Protocol", duration: "61 min", videoId: "placeholder-3", description: "Full body protocol step-by-step" },
  { id: 4, title: "Client Assessment", duration: "38 min", videoId: "placeholder-4", description: "Consultation, photos, measurements" },
  { id: 5, title: "Certification & Business", duration: "44 min", videoId: "placeholder-5", description: "Pricing, consent forms, certificate" },
]

function ClassroomInner() {
  const [completed, setCompleted] = useState<number[]>([1])
  const [activeId, setActiveId] = useState(1)

  useEffect(() => {
    const saved = localStorage.getItem('amanda-wood-progress')
    if (saved) setCompleted(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('amanda-wood-progress', JSON.stringify(completed))
  }, [completed])

  const activeModule = modules.find(m => m.id === activeId) || modules[0]
  const isUnlocked = (id: number) => id === 1 || completed.includes(id - 1)
  const progressPct = Math.round((completed.length / modules.length) * 100)

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
        <header className="mb-6 border-b border-zinc-800 pb-4 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Amanda Wood Therapy Academy</h1>
            <p className="text-zinc-500 text-sm">V3.2c - Secure + Progress + Stripe Ready</p>
          </div>
          <div className="text-right">
            <div className="text-xs bg-green-950 text-green-400 border border-green-900 px-3 py-1 rounded-full">{progressPct}% • Secure</div>
            <div className="w-24 bg-zinc-800 rounded-full h-1 mt-2 ml-auto">
              <div className="bg-white h-1 rounded-full transition-all" style={{width: `${progressPct}%`}}></div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-black rounded-lg aspect-video border border-zinc-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">▶️</div>
                <p className="text-sm font-medium">{activeModule.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{activeModule.videoId}</p>
              </div>
            </div>
            <div className="mt-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <h2 className="font-semibold">{activeModule.title}</h2>
              <p className="text-sm text-zinc-400 mt-1">{activeModule.description} • {activeModule.duration}</p>
              <button data-cta-name="Mark Complete & Unlock Next" data-cta-key="mark-complete-unlock-next" onClick={markComplete} className="mt-3 bg-white text-black text-sm px-4 py-2 rounded-full font-medium">
                {completed.includes(activeId) ? '✓ Completed - Next →' : 'Mark Complete & Unlock Next'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {modules.map(m => {
              const unlocked = isUnlocked(m.id)
              const done = completed.includes(m.id)
              return (
                <div key={m.id} onClick={() => unlocked && setActiveId(m.id)} className={`p-3 rounded-lg border cursor-pointer ${activeId === m.id ? 'bg-white text-black border-white' : unlocked ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900 border-zinc-800 opacity-40'}`}>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{m.id}. {m.title}</span>
                    <span className="text-xs">{done ? '✓' : unlocked ? '○' : '🔒'}</span>
                  </div>
                  <span className="text- opacity-60">{m.duration} • {unlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AmandaClassroom() {
  return (
    <SecureGate>
      <ClassroomInner />
    </SecureGate>
  )
}
