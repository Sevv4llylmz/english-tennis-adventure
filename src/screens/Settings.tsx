import { useState } from 'react'
import { ArrowLeft, Mic, Volume2 } from 'lucide-react'
import { Backdrop, useStage } from '../components/Stage'

import { useGame, type Screen } from '../store/gameStore'
import { music, sfx } from '../audio/sfx'
import { say } from '../audio/voice'
import { recognitionSupported } from '../speech/recognition'
import { MicConsent } from '../components/Mic'

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '12px 4px', borderBottom: '2px dashed #e8dcc3' }}>
      <div>
        <div className="title-font" style={{ fontSize: 28, fontWeight: 600, color: '#245d61' }}>{label}</div>
        {sub && <div style={{ fontSize: 18, color: '#7a6a55' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{children}</div>
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        sfx.click()
        onChange(!on)
      }}
      style={{ width: 96, height: 52, borderRadius: 30, border: '4px solid #fff', background: on ? '#3a9d98' : '#cfc6b5', position: 'relative', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.15)' }}
    >
      <span style={{ position: 'absolute', top: 4, left: on ? 48 : 4, width: 36, height: 36, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

function Slider({ value, onChange, min = 0, max = 1, step = 0.05, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string }) {
  return <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: 260, height: 30 }} />
}

export function Settings({ back }: { back: Screen['name'] }) {
  const go = useGame((s) => s.go)
  const s = useGame((st) => st.settings)
  const set = useGame((st) => st.setSettings)
  const name = useGame((st) => st.playerName) ?? 'Alya'
  const setName = useGame((st) => st.setName)
  const [nameDraft, setNameDraft] = useState(name)
  const [consent, setConsent] = useState(false)
  const { portrait: P } = useStage()
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop bg="classroom" dim={0.45} blur={3} />
      <button className="btn btn-cream title-font" style={{ position: 'absolute', top: 24, left: 24, fontSize: 30, padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 5 }} onClick={() => go({ name: back === 'menu' ? 'menu' : 'map' } as Screen)}>
        <ArrowLeft size={30} /> Back
      </button>
      <div className="panel" style={{ position: 'absolute', left: P ? 24 : 260, right: P ? 24 : 260, top: P ? 130 : 30, bottom: 30, padding: P ? '20px 28px' : '22px 44px', overflowY: 'auto' }}>
        <div className="title-font" style={{ fontSize: 52, fontWeight: 700, color: '#3a9d98' }}>Settings · Ayarlar</div>
        <Row label="My name" sub="Display name / takma ad">
          <input className="name-input" value={nameDraft} maxLength={20} onChange={(e) => setNameDraft(e.target.value)} style={{ fontSize: 28, padding: '6px 16px', width: 240 }} aria-label="Display name" />
          <button className="btn btn-teal title-font" style={{ fontSize: 24, padding: '6px 20px' }} onClick={() => setName(nameDraft)} disabled={nameDraft.trim() === name}>
            Save
          </button>
        </Row>
        <Row label="Turkish help (TR button)" sub="Türkçe yardım düğmesi">
          <Toggle label="Turkish help" on={s.assist} onChange={(v) => set({ assist: v })} />
        </Row>
        <Row label="Voice speed" sub={s.voiceRate < 0.9 ? 'Slow' : s.voiceRate > 1.02 ? 'Fast' : 'Normal'}>
          <Slider label="Voice speed" value={s.voiceRate} min={0.75} max={1.15} onChange={(v) => set({ voiceRate: v })} />
          <button className="btn btn-sun" aria-label="Test voice" style={{ width: 56, height: 56, display: 'grid', placeItems: 'center' }} onClick={() => say('Great job!')}>
            <Volume2 size={28} />
          </button>
        </Row>
        <Row label="Voice volume">
          <Slider label="Voice volume" value={s.voiceVol} onChange={(v) => set({ voiceVol: v })} />
        </Row>
        <Row label="Music">
          <Toggle
            label="Music on"
            on={s.musicOn}
            onChange={(v) => {
              set({ musicOn: v })
              if (v) music.start()
              setTimeout(() => music.refresh(), 0)
            }}
          />
          <Slider
            label="Music volume"
            value={s.musicVol}
            onChange={(v) => {
              set({ musicVol: v })
              setTimeout(() => music.refresh(), 0)
            }}
          />
        </Row>
        <Row label="Sound effects">
          <Slider
            label="Sound effects volume"
            value={s.sfxVol}
            onChange={(v) => {
              set({ sfxVol: v })
              setTimeout(() => sfx.correct(), 0)
            }}
          />
        </Row>
        <Row label="Reduced motion" sub="Fewer moving effects / daha az hareket">
          <Toggle label="Reduced motion" on={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
        </Row>
        <Row
          label="Speaking with the microphone"
          sub={
            !recognitionSupported()
              ? 'This browser has no speech recognition – use Chrome, Edge or Safari. Tapping answers always works.'
              : s.micEnabled
                ? 'On – allowed by a grown-up. Audio is transcribed by the browser’s speech service; the game stores no audio.'
                : 'Off – a grown-up must allow it first.'
          }
        >
          <Mic size={30} color="#245d61" />
          <Toggle label="Microphone speaking" on={s.micEnabled} onChange={(v) => (v ? setConsent(true) : set({ micEnabled: false }))} />
        </Row>
      </div>
      {consent && <MicConsent onClose={() => setConsent(false)} />}
    </div>
  )
}
