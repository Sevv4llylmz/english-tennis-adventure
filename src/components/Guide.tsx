import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Volume2, Languages, Ear } from 'lucide-react'
import { sprite, SPRITE_SIZE, type Pose } from '../assets/manifest'

/** face centre of each teacher pose, as a fraction of the sprite size */
const FACE: Partial<Record<Pose, [number, number]>> = { idle: [0.67, 0.24], happy: [0.6, 0.24], wave: [0.54, 0.245], thinking: [0.68, 0.225] }
import { say, onSpeaking } from '../audio/voice'
import { useGame } from '../store/gameStore'
import { useStage } from './Stage'
import { named, type Line } from '../content/lines'

/** Speak a Line in the teacher voice, filling in the player's name. */
export function sayLine(line: Line | null | undefined) {
  if (!line) return Promise.resolve(true)
  const name = useGame.getState().playerName ?? 'Alya'
  return say(named(line.en, name), 'teacher')
}
export function sayTr(line: Line | null | undefined) {
  if (!line?.tr) return Promise.resolve(true)
  const name = useGame.getState().playerName ?? 'Alya'
  return say(named(line.tr, name), 'tr')
}

export function useIsSpeaking() {
  const [s, setS] = useState(false)
  useEffect(() => {
    const off = onSpeaking(setS)
    return () => {
      off()
    }
  }, [])
  return s
}

/** Round avatar of the teacher (face crop of her sprite). */
export function TeacherAvatar({ size = 110, pose = 'idle', talking = false }: { size?: number; pose?: Pose; talking?: boolean }) {
  return (
    <motion.div
      animate={talking ? { rotate: [0, -3, 3, 0] } : { rotate: 0 }}
      transition={talking ? { duration: 0.9, repeat: Infinity } : {}}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '5px solid #fff',
        background: 'linear-gradient(#bfe6f5, #e7f6ee)',
        overflow: 'hidden',
        position: 'relative',
        flex: 'none',
        boxShadow: '0 6px 14px rgba(0,0,0,0.2)',
      }}
    >
      {(() => {
        // zoomed so the face sits in the middle of the circle
        const [w, h] = SPRITE_SIZE.teacher[pose]
        const H = size * 1.85
        const W = (H * w) / h
        const [fx, fy] = FACE[pose] ?? [0.58, 0.19]
        return <img src={sprite('teacher', pose)} alt="Teacher" draggable={false} style={{ position: 'absolute', height: H, width: W, left: size / 2 - fx * W, top: size / 2 - fy * H, maxWidth: 'none' }} />
      })()}
    </motion.div>
  )
}

/**
 * The teacher's speech bubble: shows the current instruction, speaks it automatically,
 * and offers "Listen again" and (optional) Turkish help.
 */
export function Guide({
  line,
  auto = true,
  hideText = false,
  pose = 'idle',
  extra,
  width = 1060,
  top = 18,
  left = 120,
  portraitTop = 140,
  onSpoken,
}: {
  line: Line | null
  auto?: boolean
  hideText?: boolean
  pose?: Pose
  extra?: React.ReactNode
  width?: number
  top?: number
  left?: number
  /** top position in the portrait (phone) layout */
  portraitTop?: number
  onSpoken?: () => void
}) {
  const assist = useGame((s) => s.settings.assist)
  const stage = useStage()
  const name = useGame((s) => s.playerName) ?? 'Alya'
  const [showTr, setShowTr] = useState(false)
  const speaking = useIsSpeaking()
  const lastKey = useRef<string>('')
  useEffect(() => {
    setShowTr(false)
    if (!line || !auto) return
    const key = line.en
    lastKey.current = key
    let alive = true
    sayLine(line).then((ok) => {
      if (alive && ok) onSpoken?.()
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line])
  if (!line) return null
  const box = stage.portrait ? { top: portraitTop, left: 20, width: stage.W - 40 } : { top, left, width }
  return (
    <div style={{ position: 'absolute', ...box, display: 'flex', alignItems: 'center', gap: 14, zIndex: 20 }}>
      <TeacherAvatar size={stage.portrait ? 100 : 112} pose={pose} talking={speaking} />
      <AnimatePresence mode="wait">
        <motion.div
          key={line.en}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="panel"
          style={{ flex: 1, padding: '14px 26px', borderRadius: 32, position: 'relative', minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <div style={{ position: 'absolute', left: -18, top: 38, width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderRight: '20px solid #fff' }} />
          <div className="title-font" style={{ fontSize: 36, fontWeight: 600, color: '#245d61', lineHeight: 1.15 }}>
            {hideText ? <span style={{ color: '#3a9d98', display: 'inline-flex', alignItems: 'center', gap: 10 }}>Listen carefully… <Ear size={36} /></span> : named(line.en, name)}
          </div>
          {showTr && line.tr && (
            <div style={{ fontSize: 26, color: '#a14d72', fontWeight: 700, marginTop: 4 }}><span style={{ background: '#f4b7cc', color: '#fff', borderRadius: 10, padding: '0 8px', marginRight: 8, fontSize: 20 }}>TR</span>{named(line.tr, name)}</div>
          )}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          className="btn btn-sun"
          aria-label="Listen again"
          title="Listen again"
          onClick={() => sayLine(line)}
          style={{ width: 76, height: 76, display: 'grid', placeItems: 'center' }}
        >
          <motion.span animate={speaking ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.6, repeat: speaking ? Infinity : 0 }}>
            <Volume2 size={38} />
          </motion.span>
        </button>
        {assist && line.tr && (
          <button
            className="btn btn-pink"
            aria-label="Turkish help"
            title="Türkçe yardım"
            onClick={() => {
              setShowTr(true)
              sayTr(line)
            }}
            style={{ width: 76, height: 50, fontSize: 22 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Languages size={20} />
              TR
            </span>
          </button>
        )}
      </div>
      {extra}
    </div>
  )
}

/** Small pink TR button for cards: shows (via onShow) and speaks the Turkish help of the given lines. */
export function TrButton({ lines, onShow, style }: { lines: Line[]; onShow?: () => void; style?: React.CSSProperties }) {
  const assist = useGame((s) => s.settings.assist)
  if (!assist) return null
  return (
    <button
      className="btn btn-pink"
      aria-label="Turkish help"
      title="Türkçe yardım"
      onClick={async (e) => {
        e.stopPropagation()
        onShow?.()
        for (const l of lines) {
          const ok = await sayTr(l)
          if (!ok) return
          await new Promise((r) => setTimeout(r, 250))
        }
      }}
      style={{ width: 84, height: 54, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, ...style }}
    >
      <Languages size={20} />
      TR
    </button>
  )
}
