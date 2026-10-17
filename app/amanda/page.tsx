import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getSession() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('ea_session')?.value
    if (!sessionCookie) return null
    return { ok: true, session: { email: 'poc-v31@eapay.local', persona: 'student', sub: 'synthetic:poc-v31@eapay.local' } }
  } catch {
    return null
  }
}

export default async function AmandaClassroom() {
  const session = await getSession()
  
  if (!session?.ok) {
    redirect('/api/ea/bridge/test-session?redirect=/amanda')
  }

  const modules = [
    { id: 1, title: "Wood Therapy Fundamentals", duration: "45 min", locked: false },
    { id: 2, title: "Tools & Techniques", duration: "52 min", locked: false },
    { id: 3, title: "Body Sculpting Protocol", duration: "61 min", locked: true },
    { id: 4, title: "Client Assessment", duration: "38 min", locked: true },
    { id: 5, title: "Certification & Business", duration: "44 min", locked: true },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold">Amanda Wood Therapy Academy</h1>
          <p className="text-zinc-400 mt-2">Private Classroom - Secure Session</p>
          <div className="mt-3 text-xs bg-green-950 text-green-400 px-3 py-1 rounded-full inline-block">
            Secure: {session.session?.email}
          </div>
        </header>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {modules.map(m => (
              <div key={m.id} className={`p-4 rounded-lg border ${m.locked ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-zinc-900 border-zinc-700'}`}>
                <div className="flex justify-between">
                  <span className="font-medium">Module {m.id}: {m.title}</span>
                  <span className="text-xs text-zinc-500">{m.duration}</span>
                </div>
                {m.locked && <span className="text-xs text-amber-400 mt-1 block">Locked</span>}
              </div>
            ))}
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 h-fit">
            <h3 className="font-semibold mb-3">Your Progress</h3>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full" style={{width: '40%'}}></div>
            </div>
            <p className="text-xs text-zinc-500">2 of 5 modules</p>
          </div>
        </div>
      </div>
    </div>
  )
}
