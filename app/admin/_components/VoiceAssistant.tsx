'use client';

import { NAVY, GOLD } from '@/lib/design-system';


import { useEffect, useRef, useState } from 'react';

import { executeIntentRoute, submitAdminIntent } from '@/lib/admin-intent-client';

import { startGuidedTour } from './GuidedTour';

import TrustPanel from './TrustPanel';





type VoiceIntent = {

  action: string;

  href?: string;

  query?: string;

  message: string;

  confidence: number;

  sources: string[];

};



export default function VoiceAssistant() {

  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(false);

  const [listening, setListening] = useState(false);

  const [intent, setIntent] = useState<VoiceIntent | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);



  const submit = async (text?: string) => {

    const q = (text ?? query).trim();

    if (!q) return;

    setLoading(true);

    setIntent(null);

    try {

      const data = await submitAdminIntent(q);

      const result = executeIntentRoute(data, { onTour: startGuidedTour });



      if (data.route) {

        setQuery(q);

        setIntent({

          action: data.route.type,

          href: data.route.href,

          message: result.status,

          confidence: 85,

          sources: ['EA Intent Router', 'Mission Control orchestrator'],

        });

      }



      if (!result.navigated && data.route?.type === 'orchestrate' && data.orchestration) {

        setOpen(true);

      }

    } finally {

      setLoading(false);

    }

  };



  const startListening = () => {

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!Recognition) {

      setIntent({

        action: 'unknown',

        message: 'Voice input not supported in this browser — type your command instead.',

        confidence: 0,

        sources: ['Web Speech API'],

      });

      return;

    }



    const recognition = new Recognition() as SpeechRecognitionInstance;

    recognition.lang = 'en-US';

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;



    recognition.onstart = () => setListening(true);

    recognition.onend = () => setListening(false);

    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {

      const transcript = event.results[0]?.[0]?.transcript;

      if (transcript) {

        setQuery(transcript);

        void submit(transcript);

      }

    };



    recognitionRef.current = recognition;

    recognition.start();

  };



  useEffect(() => {

    const onOpen = () => {

      setOpen(true);

      const prefill = sessionStorage.getItem('ea_voice_prefill');

      if (prefill) {

        setQuery(prefill);

        sessionStorage.removeItem('ea_voice_prefill');

      }

    };

    window.addEventListener('ea:open-voice', onOpen);

    return () => window.removeEventListener('ea:open-voice', onOpen);

  }, []);



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {

        e.preventDefault();

        setOpen((v) => !v);

      }

    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);

  }, []);



  return (

    <>

      <button

        type="button"

        onClick={() => setOpen(true)}

        className="text-xs font-semibold px-3 py-1.5 rounded border border-blue-300/40 text-blue-100 hover:bg-white/10 transition"

        title="EA Voice (Ctrl+Shift+V)"

      >

        🎙 Voice

      </button>



      {open && (

        <div

          className="fixed inset-0 z-[110] flex items-center justify-center px-4"

          style={{ backgroundColor: 'rgba(15,31,61,0.55)' }}

          onClick={() => setOpen(false)}

        >

          <div

            className="w-full max-w-md bg-white rounded-lg shadow-2xl p-6"

            onClick={(e) => e.stopPropagation()}

          >

            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>

              EA Voice™

            </p>

            <h3 className="text-lg font-bold mb-2" style={{ color: NAVY }}>

              What do you need?

            </h3>

            <p className="text-xs text-neutral-500 mb-4">

              Try: &quot;Create proposal for Bob&quot;, &quot;Open Resource Radar&quot;, &quot;Search graph for Magnifi&quot;

            </p>



            <div className="flex gap-2 mb-3">

              <input

                autoFocus

                value={query}

                onChange={(e) => setQuery(e.target.value)}

                placeholder="Ask EA Voice…"

                className="flex-1 border border-neutral-200 rounded px-3 py-2 text-sm"

                onKeyDown={(e) => e.key === 'Enter' && submit()}

              />

              <button

                type="button"

                onClick={startListening}

                disabled={listening}

                className="px-3 py-2 text-sm border border-neutral-200 rounded disabled:opacity-50"

                title="Speak"

              >

                {listening ? '…' : '🎤'}

              </button>

            </div>



            <button

              type="button"

              disabled={loading || !query.trim()}

              onClick={() => submit()}

              className="w-full py-2 text-sm font-bold text-white rounded disabled:opacity-50 mb-4"

              style={{ backgroundColor: NAVY }}

            >

              {loading ? 'Routing…' : 'Ask'}

            </button>



            {intent && (

              <div className="space-y-3">

                <p className="text-sm text-neutral-700">{intent.message}</p>

                <TrustPanel

                  confidence={intent.confidence}

                  method="Unified intent router + optional Claude enhancement"

                  sources={intent.sources.map((s) => ({ label: s }))}

                  compact

                />

              </div>

            )}

          </div>

        </div>

      )}

    </>

  );

}



// Web Speech API (browser-only)

type SpeechRecognitionInstance = {

  lang: string;

  interimResults: boolean;

  maxAlternatives: number;

  start(): void;

  onstart: ((ev: Event) => void) | null;

  onend: ((ev: Event) => void) | null;

  onerror: ((ev: Event) => void) | null;

  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;

};



declare global {

  interface Window {

    SpeechRecognition?: new () => SpeechRecognitionInstance;

    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;

  }

}

