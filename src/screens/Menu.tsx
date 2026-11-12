import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Play, Trophy, Settings as Gear, GraduationCap } from 'lucide-react'
import { Backdrop } from '../components/Stage'
import { Character } from '../components/Character'
import { BG } from '../assets/manifest'
import { useGame, LEVEL_ORDER } from '../store/gameStore'
import { WELCOME, named } from '../content/lines'
import { sayAll } from '../audio/voice'
import { sfx, unlockAudio, music } from '../audio/sfx'

/** Returning player: "Welcome back" menu. Audio starts only after the first tap (autoplay rules). */
export function Menu() {
  const name = useGame((s) => s.playerName) ?? 'Alya'
  const go = useGame((s) => s.go)
  const completed = useGame((s) => s.completed)
  const [awake, setAwake] = useState(false)
  const anyProgress = LEVEL_ORDER.some((l) => completed[l])

  useEffect(() => {
    if (awake) sayAll([{ text: named(WELCOME.welcomeBack.en, name) }, { text: WELCOME.menu.en }])
  }, [awake, name])

  const wake = () => {
    if (!awake) {
      unlockAudio()
      music.start()
      setAwake(true)
    }
  }
  const btn = (label: string, icon: React.ReactNode, onClick: () => void, cls: string) => (
    <button
      className={`btn ${cls} title-font`}
      style={{ width: 430, fontSize: 40, padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'center' }}
      onClick={() => {
        wake()
        sfx.click()
        onClick()
      }}
    >
      {icon}
      {label}
    </button>
  )
  return (
    <div style={{ position: 'absolute', inset: 0 }} onPointerDown={wake}>
      <Backdrop src={BG.court} dim={0.15} />
      <Character who="alya" pose="wave" height={600} style={{ left: 150, bottom: 40 }} />
      <Character who="teacher" pose="ready" height={560} flip style={{ right: 130, bottom: 40 }} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="panel" style={{ position: 'absolute', left: 560, top: 205, width: 480, padding: '30px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div className="title-font" style={{ fontSize: 58, fontWeight: 700, color: '#3a9d98' }}>Hi, {name}!</div>
        <div className="title-font" style={{ fontSize: 30, color: '#245d61', marginTop: -10 }}>
          {anyProgress ? `Welcome back, ${name}!` : 'Ready for an adventure?'}
        </div>
        {btn(anyProgress ? 'Continue' : 'Play', <Play size={38} fill="currentColor" />, () => go({ name: 'map' }), 'btn-teal')}
        {btn('My Rewards', <Trophy size={38} />, () => go({ name: 'rewards' }), 'btn-sun')}
        {btn('Settings', <Gear size={38} />, () => go({ name: 'settings', back: 'menu' }), 'btn-mint')}
      </motion.div>
      <button
        onClick={() => go({ name: 'teacher' })}
        className="title-font"
        style={{ position: 'absolute', right: 18, bottom: 14, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 14, padding: '6px 14px', fontSize: 18, color: '#245d61', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <GraduationCap size={20} /> Teacher Mode
      </button>
    </div>
  )
}
