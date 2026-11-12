import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Mic, Loader2, ShieldCheck, MicOff } from 'lucide-react'
import { listenOnce, recognitionSupported, stopListening, type RecError } from '../speech/recognition'
import { matchSpeech, type MatchOutcome, type SpeakSpec } from '../speech/match'
import { stopVoice } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { useGame, type LevelId } from '../store/gameStore'
import { sayLine } from './Guide'
import { UI } from '../content/lines'

export type MicOutcome = { kind: MatchOutcome; heard: string } | { kind: 'error'; error: RecError }

const ERROR_TEXT: Record<RecError, string> = {
  unsupported: 'Speaking practice needs Chrome, Edge or Safari. Tap the answer instead!',
  'not-allowed': 'The microphone is blocked. A grown-up can allow it in the browser. Tap the answer instead!',
  'no-speech': "I didn't hear anything. Try again!",
  network: 'The speech service is not reachable (internet?). Tap the answer instead!',
  aborted: 'Stopped. Try again!',
  timeout: "I didn't hear anything. Try again!",
  'audio-capture': 'No microphone found. Tap the answer instead!',
  other: 'Something went wrong. Try again or tap the answer!',
}

/** Grown-up consent before the browser speech recogniser is used (it may send audio to the browser vendor). */
export function MicConsent({ onClose }: { onClose: (ok: boolean) => void }) {
  const setSettings = useGame((s) => s.setSettings)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,50,52,0.55)', zIndex: 200, display: 'grid', placeItems: 'center' }}>
      <div className="panel" style={{ width: 980, padding: '34px 44px' }}>
        <div className="title-font" style={{ fontSize: 40, fontWeight: 700, color: '#245d61', display: 'flex', alignItems: 'center', gap: 14 }}>
          <ShieldCheck size={44} /> For grown-ups · Yetişkinler için
        </div>
        <p style={{ fontSize: 24, lineHeight: 1.45, margin: '16px 0' }}>
          Speaking practice uses your browser&apos;s speech recognition. In Chrome and Edge the spoken audio is sent to the browser
          maker&apos;s speech service (Google / Microsoft) to be turned into text. This game does <b>not</b> record or store any audio – it only
          compares the returned text with the expected answer.
        </p>
        <p style={{ fontSize: 22, lineHeight: 1.45, margin: '0 0 18px', color: '#7a4a62' }}>
          Konuşma alıştırması tarayıcının ses tanıma özelliğini kullanır. Chrome ve Edge&apos;de konuşma sesi metne çevrilmek için tarayıcı
          şirketinin sunucusuna gönderilir. Oyun hiçbir ses kaydı saklamaz. Mikrofonsuz da oynanabilir: cevaplara dokunmak yeterli.
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-cream" style={{ padding: '14px 30px', fontSize: 26 }} onClick={() => onClose(false)}>
            Not now · Şimdi değil
          </button>
          <button
            className="btn btn-teal"
            style={{ padding: '14px 30px', fontSize: 26 }}
            onClick={() => {
              setSettings({ micEnabled: true })
              onClose(true)
            }}
          >
            Allow speaking · İzin ver
          </button>
        </div>
      </div>
    </div>
  )
}

export function MicButton({
  spec,
  level,
  item,
  onOutcome,
  size = 110,
  disabled,
  label = 'Say it!',
}: {
  spec: SpeakSpec
  level: LevelId
  item: string
  onOutcome: (o: MicOutcome) => void
  size?: number
  disabled?: boolean
  label?: string
}) {
  const micEnabled = useGame((s) => s.settings.micEnabled)
  const recordSpeech = useGame((s) => s.recordSpeech)
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [msg, setMsg] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  useEffect(() => () => stopListening(), [])

  async function run(force = false) {
    if (state !== 'idle') {
      stopListening()
      return
    }
    if (!recognitionSupported()) {
      setMsg(ERROR_TEXT.unsupported)
      onOutcome({ kind: 'error', error: 'unsupported' })
      return
    }
    if (!micEnabled && !force) {
      setConsent(true)
      return
    }
    stopVoice()
    setMsg(null)
    sfx.pop()
    setState('listening')
    const res = await listenOnce(7000)
    setState('processing')
    await new Promise((r) => setTimeout(r, 250))
    setState('idle')
    if (!res.ok) {
      recordSpeech({ level, item, result: 'error', heard: res.error })
      setMsg(ERROR_TEXT[res.error])
      if (res.error === 'no-speech' || res.error === 'timeout') sayLine(UI.noHear)
      onOutcome({ kind: 'error', error: res.error })
      return
    }
    const m = matchSpeech(res.alternatives, spec)
    recordSpeech({ level, item, result: m.outcome, heard: m.heard })
    setMsg(m.heard ? `I heard: “${m.heard}”` : null)
    if (m.outcome === 'unclear') sayLine(UI.noHear)
    onOutcome({ kind: m.outcome, heard: m.heard })
  }

  const listening = state === 'listening'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {listening && <span className="mic-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#f4b7cc' }} />}
        <motion.button
          className={`btn ${listening ? 'btn-pink' : 'btn-teal'}`}
          disabled={disabled}
          onClick={() => run()}
          aria-label={listening ? 'Listening – tap to stop' : 'Speak your answer'}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'grid', placeItems: 'center' }}
          animate={listening ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.8, repeat: listening ? Infinity : 0 }}
        >
          {state === 'processing' ? <Loader2 size={size * 0.45} className="spin-slow" /> : micEnabled || !recognitionSupported() ? recognitionSupported() ? <Mic size={size * 0.48} /> : <MicOff size={size * 0.45} /> : <Mic size={size * 0.48} />}
        </motion.button>
      </div>
      <div className="title-font" style={{ fontSize: 22, fontWeight: 600, color: '#245d61' }}>
        {listening ? 'Listening… speak now!' : state === 'processing' ? 'Checking…' : label}
      </div>
      {msg && (
        <div style={{ position: 'absolute', top: size + 34, width: 420, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#7a4a62', background: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: '6px 10px', zIndex: 5 }}>
          {msg}
        </div>
      )}
      {consent && (
        <MicConsent
          onClose={(ok) => {
            setConsent(false)
            if (ok) setTimeout(() => run(true), 50)
          }}
        />
      )}
    </div>
  )
}
