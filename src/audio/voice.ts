/**
 * Speech output service.
 * 1. Pre-generated neural voice clips (public/audio/voice, made by tools/gen_voices.py):
 *    teacher = en-GB-LibbyNeural (warm British female), alya = en-GB-MaisieNeural (British child),
 *    tr = tr-TR-EmelNeural (Turkish help).
 * 2. Fallback: the browser SpeechSynthesis API (used for lines that contain the player's own
 *    name, or if a clip is missing / fails to load).
 * Only one line plays at a time; starting a new line or changing screens cancels the old one.
 */
import { useGame } from '../store/gameStore'
import { music } from './sfx'

export type VoiceId = 'teacher' | 'alya' | 'tr'

let manifest: Record<string, string> | null = null
let manifestPromise: Promise<void> | null = null
const base = import.meta.env.BASE_URL + 'audio/voice/'

export function loadVoiceManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(base + 'manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((m) => {
        manifest = m
      })
      .catch(() => {
        manifest = {}
      })
  }
  return manifestPromise
}

export function clipKey(voice: VoiceId, text: string) {
  return `${voice}|${text.trim()}`
}

let current: HTMLAudioElement | null = null
let currentResolve: (() => void) | null = null
let token = 0
const listeners = new Set<(speaking: boolean) => void>()
export function onSpeaking(fn: (speaking: boolean) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit(v: boolean) {
  listeners.forEach((f) => f(v))
  music.duck(v)
}

export function stopVoice() {
  token++
  if (current) {
    current.pause()
    current.src = ''
    current = null
  }
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
  currentResolve?.()
  currentResolve = null
  emit(false)
}

// ---- browser voices (fallback) ----
let browserVoices: SpeechSynthesisVoice[] = []
function refreshVoices() {
  try {
    browserVoices = window.speechSynthesis?.getVoices() ?? []
  } catch {
    browserVoices = []
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices()
  window.speechSynthesis.onvoiceschanged = refreshVoices
}
function pickBrowserVoice(lang: 'en' | 'tr') {
  const vs = browserVoices.filter((v) => v.lang.toLowerCase().startsWith(lang))
  if (lang === 'tr') return vs[0]
  const female = /libby|sonia|maisie|female|hazel|susan|kate|serena|martha|emily|amy/i
  return (
    vs.find((v) => v.lang === 'en-GB' && female.test(v.name)) ||
    vs.find((v) => v.lang === 'en-GB') ||
    vs.find((v) => female.test(v.name)) ||
    vs[0]
  )
}

function speakBrowser(text: string, voice: VoiceId, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    const s = useGame.getState().settings
    const u = new SpeechSynthesisUtterance(text)
    const lang = voice === 'tr' ? 'tr' : 'en'
    const v = pickBrowserVoice(lang)
    if (v) u.voice = v
    u.lang = voice === 'tr' ? 'tr-TR' : 'en-GB'
    u.rate = 0.9 * s.voiceRate
    u.pitch = voice === 'alya' ? 1.25 : 1.05
    u.volume = s.voiceVol
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (my === token) emit(false)
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    currentResolve = finish
    emit(true)
    window.speechSynthesis.speak(u)
    // safety net: some browsers never fire onend
    setTimeout(finish, 1500 + text.length * 120)
  })
}

/** Say one line. Resolves true when it finished, false when something interrupted it. */
export async function say(text: string, voice: VoiceId = 'teacher'): Promise<boolean> {
  stopVoice()
  const my = ++token
  await sayInner(text, voice, my)
  return my === token
}

async function sayInner(text: string, voice: VoiceId, my: number): Promise<void> {
  if (!text.trim()) return
  if (!manifest) await loadVoiceManifest()
  if (my !== token) return
  const file = manifest?.[clipKey(voice, text)]
  if (!file) {
    if (import.meta.env.DEV) console.debug('[voice] no clip, using browser voice:', voice, text)
    return speakBrowser(text, voice, my)
  }
  const s = useGame.getState().settings
  return new Promise<void>((resolve) => {
    const a = new Audio(base + file)
    a.volume = Math.min(1, s.voiceVol)
    a.playbackRate = s.voiceRate
    ;(a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true
    current = a
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (my === token) {
        current = null
        emit(false)
      }
      resolve()
    }
    currentResolve = finish
    a.onended = finish
    a.onerror = () => {
      if (done) return
      done = true
      if (my === token) speakBrowser(text, voice, my).then(resolve)
      else resolve()
    }
    emit(true)
    a.play().catch(() => {
      // autoplay blocked or decode error -> browser voice
      if (done) return
      done = true
      if (my === token) speakBrowser(text, voice, my).then(resolve)
      else resolve()
    })
  })
}

/** Say several lines in a row; stops if something else starts speaking. */
export async function sayAll(lines: { text: string; voice?: VoiceId }[]) {
  for (const l of lines) {
    const ok = await say(l.text, l.voice ?? 'teacher')
    if (!ok) return false
    const t = token
    await new Promise((r) => setTimeout(r, 200))
    if (t !== token) return false
  }
  return true
}

export function isSpeaking() {
  return !!current
}
