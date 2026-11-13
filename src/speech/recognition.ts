/**
 * Speech recognition abstraction over the browser Web Speech API.
 * - Chrome / Edge: webkitSpeechRecognition (audio is sent to the browser vendor's cloud
 *   service for transcription – that is why a grown-up must enable it in Settings first).
 * - Safari: SpeechRecognition (Apple service / on-device).
 * - Firefox: not supported -> the game always offers a tap-to-answer alternative.
 * No audio is ever stored or sent anywhere by this game itself.
 */
export type RecError = 'unsupported' | 'not-allowed' | 'no-speech' | 'network' | 'aborted' | 'timeout' | 'audio-capture' | 'other'
export interface RecAlternative {
  transcript: string
  confidence: number
}
export type RecResult = { ok: true; alternatives: RecAlternative[] } | { ok: false; error: RecError }

// minimal typings (not in lib.dom for all TS versions)
interface SRLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SRCtor = new () => SRLike

function ctor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function recognitionSupported() {
  return typeof window !== 'undefined' && !!ctor()
}

let active: SRLike | null = null

export function stopListening() {
  try {
    active?.abort()
  } catch {
    /* ignore */
  }
  active = null
}

export function listenOnce(timeoutMs = 7000): Promise<RecResult> {
  const C = ctor()
  if (!C) return Promise.resolve({ ok: false, error: 'unsupported' })
  stopListening()
  return new Promise((resolve) => {
    let settled = false
    const done = (r: RecResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      // release the microphone right away so the device leaves its "call" audio mode
      rec.onresult = rec.onerror = rec.onend = null
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
      if (active === rec) active = null
      resolve(r)
    }
    const rec = new C()
    active = rec
    rec.lang = 'en-GB'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 5
    rec.onresult = (e) => {
      const res = e.results[0]
      const alts: RecAlternative[] = []
      for (let i = 0; i < res.length; i++) alts.push({ transcript: res[i].transcript, confidence: res[i].confidence ?? 0 })
      done({ ok: true, alternatives: alts })
    }
    rec.onerror = (e) => {
      const map: Record<string, RecError> = {
        'not-allowed': 'not-allowed',
        'service-not-allowed': 'not-allowed',
        'no-speech': 'no-speech',
        network: 'network',
        aborted: 'aborted',
        'audio-capture': 'audio-capture',
      }
      done({ ok: false, error: map[e.error] ?? 'other' })
    }
    rec.onend = () => done({ ok: false, error: 'no-speech' })
    const timer = setTimeout(() => done({ ok: false, error: 'timeout' }), timeoutMs)
    try {
      rec.start()
    } catch {
      done({ ok: false, error: 'other' })
    }
  })
}
