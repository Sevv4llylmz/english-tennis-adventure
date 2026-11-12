import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Volume2, ArrowRight } from 'lucide-react'
import type { ChoiceRound, Option, Visual } from '../content/types'
import { PRAISE, TRY, UI, L, pick, shuffle, type Line } from '../content/lines'
import { Guide, sayLine, TrButton } from './Guide'
import { Pic } from './Pic'
import { Character } from './Character'
import { MicButton, type MicOutcome } from './Mic'
import { StarBurst } from './Effects'
import { useStage } from './Stage'
import { say, stopVoice } from '../audio/voice'
import { sfx } from '../audio/sfx'
import { useGame, type LevelId, type Outcome } from '../store/gameStore'
import { objectImg } from '../assets/manifest'

/** dev builds only: marks answers in the DOM for automated browser tests */
const DEV_MARK = import.meta.env.DEV

/** Word alone, a short pause, then its meaning – so the question word is heard clearly. */
async function playTeach(round: ChoiceRound) {
  if (!round.teach) return
  const ok = await sayLine(round.teach.wordLine)
  if (!ok) return
  await new Promise((r) => setTimeout(r, 700))
  await sayLine(round.teach.line)
}

/** Dusty-pink speech bubble that holds the microphone ("Tap or say it"). */
export function SayItPill({ children, label = 'Or say it!' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="card" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: 18, padding: '8px 14px 8px 28px', background: 'linear-gradient(#fbe3ea, #f4c9d6)', borderColor: '#fff' }}>
      <span className="title-font" style={{ fontSize: 30, color: '#8a3a5c', fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  )
}

export const REVEAL = L("Here's the answer. Tap it!", 'İşte cevap. Ona dokun!')

export function outcomeFor(misses: number, revealed: boolean): Outcome {
  if (revealed) return 'revealed'
  return misses === 0 ? 'first' : misses === 1 ? 'hint' : 'retry'
}

// ------------------------------------------------------------------ visuals
export function VisualView({ visual, solved, size = 1 }: { visual?: Visual; solved: boolean; size?: number }) {
  const [counted, setCounted] = useState<number[]>([])
  const { portrait } = useStage()
  if (!visual || visual.type === 'none') return null
  switch (visual.type) {
    case 'object':
      return (
        <div className="panel" style={{ width: 460 * size, height: 420 * size, display: 'grid', placeItems: 'center' }}>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="float-y">
            <Pic pic={visual.pic} size={290 * size} />
          </motion.div>
        </div>
      )
    case 'count': {
      const cols = visual.n > 6 ? 4 : 3
      return (
        <div className="panel" style={{ width: 520, padding: 24, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, placeItems: 'center' }}>
          {Array.from({ length: visual.n }).map((_, i) => {
            const k = counted.indexOf(i)
            return (
              <button
                key={i}
                onClick={() => {
                  if (k >= 0) return
                  sfx.pop()
                  const next = [...counted, i]
                  setCounted(next)
                  say(['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'][next.length - 1])
                }}
                aria-label={`item ${i + 1}`}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', transform: `rotate(${(i % 3) * 7 - 7}deg)` }}
              >
                <Pic pic={visual.pic} size={visual.n > 6 ? 92 : 110} />
                {k >= 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="title-font"
                    style={{ position: 'absolute', top: -6, right: -6, width: 42, height: 42, borderRadius: '50%', background: '#3a9d98', color: '#fff', fontSize: 26, fontWeight: 700, display: 'grid', placeItems: 'center', border: '3px solid #fff' }}
                  >
                    {k + 1}
                  </motion.span>
                )}
              </button>
            )
          })}
        </div>
      )
    }
    case 'mystery':
      return (
        <div className="panel" style={{ width: 460, height: 420, display: 'grid', placeItems: 'center', position: 'relative' }}>
          <motion.div animate={{ filter: solved ? 'brightness(1)' : 'brightness(0) opacity(0.55)' }} transition={{ duration: 0.6 }}>
            <Pic pic={visual.pic} size={280} />
          </motion.div>
          {!solved && (
            <div className="title-font" style={{ position: 'absolute', fontSize: 140, color: '#f7d77b', fontWeight: 700, textShadow: '0 6px 0 #245d61' }}>
              ?
            </div>
          )}
        </div>
      )
    case 'hidden-ball':
      return (
        <div className="panel" style={{ width: 520, height: 420, position: 'relative', overflow: 'hidden' }}>
          <img src={objectImg('desk')} alt="desk" draggable={false} style={{ position: 'absolute', left: 70, top: 90, width: 380 }} />
          <motion.img
            src={objectImg('ball')}
            alt="ball"
            draggable={false}
            initial={{ x: -260, rotate: -360 }}
            animate={{ x: 0, rotate: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
            style={{ position: 'absolute', left: 205, top: 255, width: 110 }}
          />
          <div className="title-font" style={{ position: 'absolute', bottom: 12, width: '100%', textAlign: 'center', fontSize: 26, color: '#245d61' }}>
            Look where the ball goes!
          </div>
        </div>
      )
    case 'listen':
      return null
    case 'teacher-talk':
      return (
        <div style={{ width: portrait ? 340 : 460, height: portrait ? 400 : 560, position: 'relative' }}>
          <Character who="teacher" pose={visual.pose ?? 'idle'} height={portrait ? 390 : 540} style={{ left: 30, bottom: 0 }} />
        </div>
      )
    case 'qword':
      return (
        <div className="panel" style={{ width: 560, padding: '40px 30px', textAlign: 'center' }}>
          <div className="title-font" style={{ fontSize: 56, fontWeight: 700, color: '#245d61' }}>
            {visual.sentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span style={{ display: 'inline-block', minWidth: 130, borderBottom: '6px dashed #3a9d98', color: '#3a9d98' }}>{solved ? '✓' : ' '}</span>
                )}
              </span>
            ))}
          </div>
          {visual.answer && (
            <div className="title-font" style={{ fontSize: 40, color: '#8f74c9', marginTop: 22 }}>
              — {visual.answer}
            </div>
          )}
        </div>
      )
  }
}

// ------------------------------------------------------------------ option button
export function OptionButton({
  opt,
  layout,
  state,
  onClick,
  compact,
}: {
  opt: Option
  layout: ChoiceRound['layout']
  state: 'idle' | 'right' | 'wrong' | 'reveal' | 'dim'
  onClick: (e: React.MouseEvent) => void
  compact?: boolean
}) {
  const cls = `card ${state === 'right' ? 'is-correct' : state === 'wrong' ? 'is-wrong shake' : state === 'reveal' ? 'pulse-glow is-selected' : ''}`
  const mark =
    state === 'right' ? (
      <span style={{ color: '#3fae6a', fontSize: 34, fontWeight: 800 }}>✓</span>
    ) : state === 'wrong' ? (
      <span style={{ color: '#f0973c', fontSize: 34, fontWeight: 800 }}>✗</span>
    ) : null
  if (layout === 'numbers')
    return (
      <button
        data-correct={DEV_MARK ? String(opt.correct) : undefined}
        className={cls + ' title-font'}
        onClick={onClick}
        style={{ minWidth: compact ? 120 : 170, height: compact ? 90 : 130, padding: '0 22px', fontSize: compact ? 38 : 52, fontWeight: 700, color: '#245d61', opacity: state === 'dim' ? 0.45 : 1 }}
      >
        {opt.label} {mark}
      </button>
    )
  if (layout === 'pictures' || (opt.pic && !opt.label))
    return (
      <button
        data-correct={DEV_MARK ? String(opt.correct) : undefined}
        className={cls}
        onClick={onClick}
        aria-label={opt.label ?? opt.id}
        style={{ width: compact ? 190 : 260, minHeight: compact ? 170 : 250, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', opacity: state === 'dim' ? 0.45 : 1 }}
      >
        {opt.pic && <Pic pic={opt.pic} size={compact ? 120 : 190} filter={opt.colour} />}
        {opt.label && (
          <span className="title-font" style={{ fontSize: compact ? 24 : 30, fontWeight: 600, color: '#245d61' }}>
            {opt.label}
          </span>
        )}
        <span style={{ position: 'absolute', top: 6, right: 14 }}>{mark}</span>
      </button>
    )
  return (
    <button
      data-correct={DEV_MARK ? String(opt.correct) : undefined}
      className={cls + ' title-font'}
      onClick={onClick}
      style={{ minHeight: compact ? 76 : 96, padding: compact ? '8px 26px' : '12px 34px', fontSize: compact ? 30 : 38, fontWeight: 600, color: '#245d61', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, opacity: state === 'dim' ? 0.45 : 1 }}
    >
      <span>{opt.label}</span>
      {mark}
    </button>
  )
}

// ------------------------------------------------------------------ engine
interface QItem extends ChoiceRound {
  _k: string
  _again?: boolean
}

export function ChoiceActivity({
  rounds,
  level,
  activity,
  onDone,
  requeue = true,
  lead,
}: {
  rounds: ChoiceRound[]
  level: LevelId
  activity: string
  onDone: () => void
  requeue?: boolean
  lead?: Line
}) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [queue, setQueue] = useState<QItem[]>(() => rounds.map((r, i) => ({ ...r, _k: `${r.id}-${i}` })))
  const [idx, setIdx] = useState(0)
  const round = queue[idx]
  const [phase, setPhase] = useState<'lead' | 'teach' | 'ask' | 'done'>(lead ? 'lead' : round?.teach ? 'teach' : 'ask')
  const [guide, setGuide] = useState<Line | null>(lead ?? round?.teach?.line ?? round?.prompt ?? null)
  const [misses, setMisses] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [solved, setSolved] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number; k: number } | null>(null)
  const busy = useRef(false)
  const { portrait } = useStage()
  const options = useMemo(() => (round ? shuffle(round.options) : []), [round?._k])

  useEffect(() => {
    if (!round) return
    setMisses(0)
    setWrong([])
    setRevealed(false)
    setSolved(null)
    busy.current = false
    if (phase === 'lead') return
    if (round.teach) {
      setPhase('teach')
      setGuide(round.teach.line)
      playTeach(round)
    } else {
      setPhase('ask')
      setGuide(round.prompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?._k])

  if (!round) return null

  async function choose(opt: Option, e?: { x: number; y: number }) {
    if (phase !== 'ask' || busy.current || solved) return
    if (revealed && !opt.correct) return
    if (opt.correct) {
      busy.current = true
      setSolved(opt.id)
      sfx.correct()
      if (e) setBurst({ ...e, k: Date.now() })
      recordAttempt({ level, activity, skill: round.skill, topic: round.topic, item: round.id, outcome: outcomeFor(misses, revealed), misses })
      if (requeue && misses > 0 && !round._again) {
        setQueue((q) => [...q, { ...round, _k: round._k + '-again', _again: true }])
      }
      if (opt.say) await say(opt.say, 'alya')
      const praise = round.after ?? pick(PRAISE)
      setGuide(praise)
      await sayLine(praise)
      await new Promise((r) => setTimeout(r, 450))
      if (idx + 1 < queue.length + (requeue && misses > 0 && !round._again ? 1 : 0)) setIdx((i) => i + 1)
      else {
        setPhase('done')
        onDone()
      }
      return
    }
    sfx.tryAgain()
    const m = misses + 1
    setMisses(m)
    setWrong((w) => [...w, opt.id])
    busy.current = true
    if (m === 1) {
      const t = pick(TRY)
      setGuide(t)
      await sayLine(t)
      setGuide(round.hint)
    } else {
      setRevealed(true)
      setGuide(REVEAL)
    }
    busy.current = false
  }

  function onMic(o: MicOutcome) {
    if (o.kind === 'correct') {
      const c = options.find((x) => x.correct)
      if (c) choose(c)
    } else if (o.kind === 'partial') {
      sayLine(UI.wholeSentence)
      setGuide(UI.wholeSentence)
    } else if (o.kind === 'other-answer') {
      choose({ id: '__spoken__', correct: false })
    }
  }

  const layout = round.layout ?? (options.every((o) => o.pic && !o.label) ? 'pictures' : 'sentences')
  const hasVisual = round.visual && round.visual.type !== 'none' && round.visual.type !== 'listen'
  const stateOf = (o: Option): 'idle' | 'right' | 'wrong' | 'reveal' | 'dim' => {
    if (solved === o.id) return 'right'
    if (solved) return 'dim'
    if (wrong.includes(o.id)) return 'wrong'
    if (revealed && o.correct) return 'reveal'
    if (revealed) return 'dim'
    return 'idle'
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={guide} auto={phase !== 'teach'} hideText={!!round.hideText && !solved && guide === round.prompt} />
      {/* lead card */}
      {phase === 'lead' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <button
            className="btn btn-teal title-font"
            style={{ fontSize: 44, padding: '20px 56px', marginTop: 120 }}
            onClick={() => {
              sfx.click()
              if (round.teach) {
                setPhase('teach')
                setGuide(round.teach.line)
                playTeach(round)
              } else {
                setPhase('ask')
                setGuide(round.prompt)
              }
            }}
          >
            Let&apos;s start! <ArrowRight size={36} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      )}
      {/* teaching card for question words */}
      <AnimatePresence>
        {phase === 'teach' && round.teach && (
          <motion.div
            key={'teach' + round._k}
            initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={portrait ? { position: 'absolute', left: 50, top: 340, width: 800, height: 600 } : { position: 'absolute', left: 400, top: 210, width: 800, height: 560 }}
            className="panel"
          >
            <TrButton lines={[round.teach.wordLine, round.teach.line]} style={{ position: 'absolute', top: 18, right: 18 }} />
            <button className="btn btn-sun" aria-label="Listen again" onClick={() => playTeach(round)} style={{ position: 'absolute', top: 18, left: 18, width: 64, height: 64, display: 'grid', placeItems: 'center' }}>
              <Volume2 size={32} />
            </button>
            <div style={{ textAlign: 'center', paddingTop: 46 }}>
              <div className="title-font" style={{ fontSize: 120, fontWeight: 700, color: '#3a9d98', textShadow: '0 6px 0 #a8ddc4', lineHeight: 1.1 }}>
                {round.teach.word} <span style={{ color: '#245d61' }}>=</span> <span style={{ color: '#e0709b', textShadow: '0 6px 0 #f9d3e1' }}>{round.teach.tr}</span>
              </div>
              <div className="title-font" style={{ fontSize: 52, color: '#245d61', marginTop: 14, fontWeight: 600 }}>
                {round.teach.meaning}
              </div>
              <div style={{ fontSize: 38, color: '#e0709b', fontWeight: 800, marginTop: 4 }}>{round.teach.meaningTr}</div>
              <button
                className="btn btn-sun title-font"
                style={{ fontSize: 40, padding: '14px 48px', marginTop: 40 }}
                onClick={() => {
                  sfx.click()
                  stopVoice()
                  setPhase('ask')
                  setGuide(round.prompt)
                }}
              >
                Got it! <ArrowRight size={32} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'ask' && (
        <motion.div
          key={round._k}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'absolute', left: portrait ? 30 : 60, right: portrait ? 30 : 60, top: portrait ? 290 : 180, bottom: 60, display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: portrait ? 34 : 60 }}
        >
          {hasVisual && <VisualView visual={round.visual} solved={!!solved} />}
          {round.visual?.type === 'listen' && (
            <button className="btn btn-sun" aria-label="Listen again" onClick={() => sayLine(round.prompt)} style={{ width: 230, height: 230, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              <Volume2 size={120} />
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
            <div
              style={{
                display: layout === 'sentences' ? 'grid' : 'flex',
                gridTemplateColumns: layout === 'sentences' && !hasVisual && options.length > 3 ? '1fr 1fr' : '1fr',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: layout === 'sentences' ? 18 : 26,
                maxWidth: portrait ? (layout === 'pictures' && options.length === 4 ? 600 : 840) : hasVisual ? 880 : 1300,
                width: portrait && layout === 'sentences' ? '100%' : undefined,
              }}
            >
              {options.map((o) => (
                <OptionButton
                  key={o.id}
                  opt={o}
                  layout={layout}
                  state={stateOf(o)}
                  onClick={(ev) => {
                    const stage = document.getElementById('stage')!.getBoundingClientRect()
                    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
                    const sc = stage.width / 1600
                    choose(o, { x: (r.left + r.width / 2 - stage.left) / sc, y: (r.top + r.height / 2 - stage.top) / sc })
                  }}
                />
              ))}
            </div>
            {round.speak && !solved && (
              <SayItPill>
                <MicButton spec={round.speak} level={level} item={`${round.topic}:${round.id}`} onOutcome={onMic} size={84} label="" />
              </SayItPill>
            )}
          </div>
        </motion.div>
      )}
      {burst && <StarBurst key={burst.k} x={burst.x} y={burst.y} />}
      {/* round dots */}
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
        {queue.map((q, i) => (
          <span key={q._k} style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #fff', background: i < idx || (i === idx && solved) ? '#3a9d98' : i === idx ? '#f7d77b' : 'rgba(255,255,255,0.5)' }} />
        ))}
      </div>
    </div>
  )
}
