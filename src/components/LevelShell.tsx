import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Map as MapIcon, Settings as Gear, Star, Play } from 'lucide-react'
import { Backdrop } from './Stage'
import { Character } from './Character'
import { Badge, Confetti } from './Effects'
import { sayLine, TrButton } from './Guide'
import { sayAll, stopVoice } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { useGame, type LevelId } from '../store/gameStore'
import { levelMeta } from '../content/meta'
import { UI, named, type Line } from '../content/lines'

export interface ActivityDef {
  key: string
  title: Line
  render: (done: () => void) => ReactNode
}

export function TopButton({ onClick, label, children, color = 'btn-cream' }: { onClick: () => void; label: string; children: ReactNode; color?: string }) {
  return (
    <button className={`btn ${color}`} aria-label={label} title={label} onClick={onClick} style={{ width: 80, height: 80, display: 'grid', placeItems: 'center' }}>
      {children}
    </button>
  )
}

export function LevelShell({
  level,
  bg,
  bgDim = 0,
  bgBlur = 0,
  intro,
  activities,
  children,
}: {
  level: LevelId
  bg: string
  bgDim?: number
  bgBlur?: number
  intro: Line[]
  activities: ActivityDef[]
  children?: ReactNode
}) {
  const meta = levelMeta(level)
  const go = useGame((s) => s.go)
  const name = useGame((s) => s.playerName) ?? 'Alya'
  const saved = useGame((s) => s.activityIndex[level] ?? 0)
  const setActivityIndex = useGame((s) => s.setActivityIndex)
  const completeLevel = useGame((s) => s.completeLevel)
  const addTime = useGame((s) => s.addTime)
  const [phase, setPhase] = useState<'intro' | 'play' | 'between' | 'reward'>('intro')
  const [idx, setIdx] = useState(Math.min(saved, activities.length - 1))

  // time on task (only while the tab is visible)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') addTime(5000)
    }, 5000)
    return () => clearInterval(t)
  }, [addTime])
  useEffect(() => () => stopVoice(), [])
  useEffect(() => {
    if (phase === 'intro') sayAll([meta.name, ...intro].map((l) => ({ text: named(l.en, name) })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function activityDone() {
    const next = idx + 1
    if (next >= activities.length) {
      completeLevel(level)
      sfx.levelUp()
      setPhase('reward')
      sayAll([{ text: UI.levelComplete.en }, { text: meta.rewardLine.en }])
      return
    }
    setActivityIndex(level, next)
    sfx.sparkle()
    setPhase('between')
    sayLine(UI.activityDone)
    setTimeout(() => {
      setIdx(next)
      setPhase('play')
    }, 1900)
  }

  const act = activities[idx]
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop src={bg} dim={bgDim} blur={bgBlur} />
      {children}
      {/* header */}
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 30 }}>
        <TopButton label="Back to map" onClick={() => go({ name: 'map' })}>
          <MapIcon size={40} color="#245d61" />
        </TopButton>
        <TopButton label="Settings" onClick={() => go({ name: 'settings', back: 'map' })}>
          <Gear size={38} color="#245d61" />
        </TopButton>
      </div>
      <div style={{ position: 'absolute', top: 22, right: 22, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <div className="panel title-font" style={{ padding: '8px 20px', fontSize: 24, fontWeight: 700, color: meta.colour, borderRadius: 22 }}>
          {meta.num}. {meta.title}
        </div>
        {phase !== 'intro' && (
          <div className="panel" style={{ padding: '6px 14px', borderRadius: 22, display: 'flex', gap: 6 }}>
            {activities.map((a, i) => (
              <Star key={a.key} size={28} color={i < idx || phase === 'reward' ? '#e0a72e' : '#c9c0b0'} fill={i < idx || phase === 'reward' ? '#f7d77b' : 'none'} strokeWidth={2.4} />
            ))}
          </div>
        )}
        {phase === 'play' && act && (
          <div className="title-font" style={{ fontSize: 22, fontWeight: 600, color: '#fff', background: 'rgba(36,93,97,0.85)', padding: '4px 16px', borderRadius: 16 }}>
            {act.title.en}
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Character who="teacher" pose="wave" height={500} style={{ left: 40, bottom: 30 }} />
          <Character who="alya" pose="happy" height={480} style={{ right: 40, bottom: 30 }} />
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel" style={{ width: 640, padding: '34px 40px', textAlign: 'center', zIndex: 10, position: 'relative' }}>
            <TrButton lines={[meta.name, ...intro]} style={{ position: 'absolute', top: 16, right: 16 }} />
            <div className="title-font" style={{ fontSize: 30, color: '#3a9d98', fontWeight: 600 }}>
              Level {meta.num} · {meta.place}
            </div>
            <div className="title-font" style={{ fontSize: 66, fontWeight: 700, color: meta.colour, lineHeight: 1.05, margin: '10px 0 14px' }}>
              {meta.title}
            </div>
            {intro.map((l) => (
              <div key={l.en} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#245d61' }}>{named(l.en, name)}</div>
                {l.tr && <div style={{ fontSize: 22, fontWeight: 800, color: '#e0709b' }}>{named(l.tr, name)}</div>}
              </div>
            ))}
            <div style={{ fontSize: 22, color: '#7a6a55', margin: '12px 0 2px' }}>{activities.length} challenges · {activities.map((a) => a.title.en).join(' · ')}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#e0709b' }}>{activities.length} görev · {activities.map((a) => a.title.tr ?? a.title.en).join(' · ')}</div>
            <button
              className="btn btn-teal title-font"
              style={{ fontSize: 44, padding: '16px 56px', marginTop: 16 }}
              onClick={() => {
                stopVoice()
                sfx.click()
                setPhase('play')
              }}
            >
              <Play size={36} fill="#fff" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} />
              {saved > 0 ? 'Continue' : 'Start'}
            </button>
          </motion.div>
        </div>
      )}

      {phase === 'play' && act && <div key={act.key} style={{ position: 'absolute', inset: 0 }}>{act.render(activityDone)}</div>}

      <AnimatePresence>
        {phase === 'between' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,247,232,0.6)', zIndex: 40 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="panel title-font" style={{ padding: '30px 60px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {activities.map((a, i) => (
                  <motion.span key={a.key} initial={i === idx ? { scale: 0, rotate: -180 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring' }}>
                    <Star size={56} color={i <= idx ? '#e0a72e' : '#c9c0b0'} fill={i <= idx ? '#f7d77b' : 'none'} />
                  </motion.span>
                ))}
              </div>
              <div style={{ fontSize: 46, fontWeight: 700, color: '#245d61', marginTop: 10 }}>{UI.activityDone.en}</div>
              {activities[idx + 1] && <div style={{ fontSize: 30, color: '#3a9d98' }}>Next: {activities[idx + 1].title.en}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'reward' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(36,93,97,0.45)', zIndex: 60, display: 'grid', placeItems: 'center' }}>
          <Confetti />
          <Character who="alya" pose="celebrate" height={480} style={{ left: 120, bottom: 40 }} />
          <Character who="teacher" pose="happy" height={480} flip style={{ right: 120, bottom: 40 }} />
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="panel" style={{ width: 640, padding: 36, textAlign: 'center' }}>
            <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ duration: 1.1, delay: 0.3 }} style={{ display: 'flex', justifyContent: 'center' }}>
              <Badge meta={meta} size={230} />
            </motion.div>
            <div className="title-font" style={{ fontSize: 52, fontWeight: 700, color: '#245d61', marginTop: 10 }}>
              {meta.reward}!
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#3a9d98' }}>Well done, {name}!</div>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24 }}>
              <button className="btn btn-sun title-font" style={{ fontSize: 32, padding: '12px 32px' }} onClick={() => go({ name: 'rewards' })}>
                My Rewards
              </button>
              <button className="btn btn-teal title-font" style={{ fontSize: 32, padding: '12px 32px' }} onClick={() => go({ name: 'map' })}>
                Back to Map
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
