import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Backdrop } from '../components/Stage'
import { Character } from '../components/Character'
import { Guide, sayLine } from '../components/Guide'
import { BG } from '../assets/manifest'
import { useGame } from '../store/gameStore'
import { WELCOME, named } from '../content/lines'
import { sayAll } from '../audio/voice'
import { sfx, unlockAudio, music } from '../audio/sfx'

/** First launch: ask for a display name (a nickname is enough), then greet the player. */
export function Welcome() {
  const setName = useGame((s) => s.setName)
  const go = useGame((s) => s.go)
  const [value, setValue] = useState('Alya')
  const [step, setStep] = useState<'start' | 'ask' | 'greet'>('start')
  const [chosen, setChosen] = useState('Alya')

  useEffect(() => {
    if (step === 'greet') {
      sayAll([WELCOME.hi, WELCOME.welcome, WELCOME.ready].map((l) => ({ text: named(l.en, chosen) })))
    }
  }, [step, chosen])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop src={BG.map} dim={0.25} />
      <div className="title-font text-outline" style={{ position: 'absolute', top: 30, width: '100%', textAlign: 'center', fontSize: 78, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
        My English Tennis Adventure
      </div>
      <Character who="alya" pose={step === 'greet' ? 'celebrate' : 'wave'} height={600} style={{ left: 120, bottom: 30 }} />
      <Character who="teacher" pose={step === 'greet' ? 'happy' : 'idle'} height={560} flip style={{ right: 110, bottom: 30 }} />

      <AnimatePresence mode="wait">
        {step === 'start' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', left: 500, top: 330, width: 600, textAlign: 'center' }}>
            <button
              className="btn btn-teal title-font pulse-glow"
              style={{ fontSize: 58, padding: '24px 70px' }}
              onClick={() => {
                unlockAudio()
                music.start()
                sfx.click()
                setStep('ask')
              }}
            >
              ▶ Start
            </button>
            <div className="panel" style={{ marginTop: 26, padding: '12px 20px', fontSize: 22, fontWeight: 700 }}>
              Sound on! · Sesi aç! 🔊
            </div>
          </motion.div>
        )}
        {step === 'ask' && (
          <motion.div key="ask" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Guide line={WELCOME.askName} width={900} top={160} />
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const n = value.trim().slice(0, 20) || 'Alya'
                setName(n)
                setChosen(n)
                sfx.levelUp()
                setStep('greet')
              }}
              className="panel"
              style={{ position: 'absolute', left: 470, top: 360, width: 660, padding: 34, textAlign: 'center' }}
            >
              <label htmlFor="nick" className="title-font" style={{ fontSize: 34, fontWeight: 600, color: '#245d61' }}>
                What&apos;s your name?
              </label>
              <input
                id="nick"
                className="name-input"
                value={value}
                maxLength={20}
                autoComplete="off"
                onChange={(e) => setValue(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 16, padding: '14px 24px', fontSize: 48, textAlign: 'center', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 20, color: '#7a6a55', marginTop: 8 }}>A nickname is enough · Takma ad yeterli</div>
              <button type="submit" className="btn btn-sun title-font" style={{ fontSize: 44, padding: '14px 54px', marginTop: 20 }}>
                Let&apos;s Go!
              </button>
            </form>
          </motion.div>
        )}
        {step === 'greet' && (
          <motion.div key="greet" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.45 }} className="panel" style={{ position: 'absolute', left: 470, top: 250, width: 660, padding: 40, textAlign: 'center' }}>
            <div className="title-font" style={{ fontSize: 80, fontWeight: 700, color: '#3a9d98' }}>Hi, {chosen}!</div>
            <div className="title-font" style={{ fontSize: 38, color: '#245d61', marginTop: 8 }}>Welcome to your English Adventure!</div>
            <div className="title-font" style={{ fontSize: 34, color: '#8f74c9', marginTop: 8 }}>Are you ready to play?</div>
            <button
              className="btn btn-teal title-font"
              style={{ fontSize: 46, padding: '16px 60px', marginTop: 28 }}
              onClick={() => {
                sfx.click()
                sayLine(null)
                go({ name: 'map' })
              }}
            >
              Yes! Let&apos;s play!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
