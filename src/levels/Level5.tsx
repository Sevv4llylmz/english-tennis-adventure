import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Map as MapIcon, Settings as Gear, Play, RotateCcw, Trophy, Volume2 } from 'lucide-react'
import { Backdrop } from '../components/Stage'
import { Character } from '../components/Character'
import { Guide, sayLine } from '../components/Guide'
import { TopButton } from '../components/LevelShell'
import { OptionButton, VisualView, outcomeFor } from '../components/ChoiceActivity'
import { SentenceBuilder } from '../components/SentenceBuilder'
import { MicButton, type MicOutcome } from '../components/Mic'
import { Confetti, TrophyArt, StarBurst } from '../components/Effects'
import { TennisBall, Pic } from '../components/Pic'
import { BG, SCENE, type Pose } from '../assets/manifest'
import { useGame, reviewKeys } from '../store/gameStore'
import { L5, buildTennisQuestions, itIsSpec, type TennisQ } from '../content/tennis'
import { levelMeta } from '../content/meta'
import { PRAISE, UI, pick, shuffle, named, type Line } from '../content/lines'
import { TOYS, SCHOOL } from '../content/vocab'
import { sfx } from '../audio/sfx'
import { say, stopVoice } from '../audio/voice'
import type { Option } from '../content/types'

const C = SCENE.court
const ALYA_HIT = { x: 445, y: 540 }
const TEACHER_HIT = { x: 1155, y: 540 }
const COURT_Y = 688
const SCORE_TEXT = ['0', '15', '30', '40', 'Game']

/**
 * Scoring rules (documented in README):
 *  - Every point is a rally. Alya must answer 2 questions correctly to win the point.
 *  - A wrong tap answer (or wrong word order): "Oh no!", the right answer turns green and is
 *    spoken, and the Teacher wins the point. The missed item comes back later (review queue).
 *  - Speaking questions never give the Teacher a point (no penalty for microphone problems).
 *  - The Teacher's score stops at 40, so the child always wins with sustained effort.
 *    No deuce: Alya's 4th point wins the game.
 */
export function Level5() {
  const go = useGame((s) => s.go)
  const name = useGame((s) => s.playerName) ?? 'Alya'
  const review = useGame((s) => s.review)
  const completeLevel = useGame((s) => s.completeLevel)
  const addTime = useGame((s) => s.addTime)
  const reduced = useGame((s) => s.settings.reducedMotion)
  const [phase, setPhase] = useState<'intro' | 'play' | 'victory'>('intro')
  const [score, setScore] = useState({ alya: 0, teacher: 0 })
  const [alyaPose, setAlyaPose] = useState<Pose>('ready')
  const [teacherPose, setTeacherPose] = useState<Pose>('ready')
  const [guide, setGuide] = useState<Line | null>(null)
  const [q, setQ] = useState<TennisQ | null>(null)
  const [qKey, setQKey] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const [burst, setBurst] = useState(0)
  const questions = useRef<TennisQ[]>([])
  const qIndex = useRef(0)
  const rallyHits = useRef(0)
  const ball = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  const alive = useRef(true)
  const scoreRef = useRef({ alya: 0, teacher: 0 })
  scoreRef.current = score

  useEffect(() => {
    alive.current = true
    const t = setInterval(() => document.visibilityState === 'visible' && addTime(5000), 5000)
    return () => {
      alive.current = false
      clearInterval(t)
      stopVoice()
    }
  }, [addTime])

  useEffect(() => {
    if (phase === 'intro') {
      setGuide(L5.intro[0])
      sayLine(levelMeta('tennis').name).then((ok) => ok && sayLine(L5.intro[0])).then((ok) => ok && sayLine(L5.intro[1]))
    }
  }, [phase])

  // ---------------------------------------------------------------- ball animation
  function place(x: number, y: number) {
    if (ball.current) ball.current.style.transform = `translate(${x - 20}px, ${y - 20}px)`
    if (shadow.current) {
      const h = Math.max(0, COURT_Y + 30 - y)
      const s = Math.max(0.35, 1 - h / 600)
      shadow.current.style.transform = `translate(${x - 24}px, ${COURT_Y + 22}px) scale(${s})`
      shadow.current.style.opacity = String(0.15 + s * 0.35)
    }
  }
  function arc(from: { x: number; y: number }, to: { x: number; y: number }, peakY: number, ms: number) {
    const dur = reduced ? ms * 0.5 : ms
    return new Promise<void>((resolve) => {
      const h = (from.y + to.y) / 2 - peakY
      const t0 = performance.now()
      const step = (now: number) => {
        if (!alive.current) return resolve()
        const t = Math.min(1, (now - t0) / dur)
        const x = from.x + (to.x - from.x) * t
        const y = from.y + (to.y - from.y) * t - 4 * h * t * (1 - t)
        place(x, y)
        if (t < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    })
  }
  const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? ms / 2 : ms))

  async function teacherShot() {
    setTeacherPose('swing')
    sfx.hit()
    const bounce = { x: 620 + Math.random() * 60, y: COURT_Y }
    await arc(TEACHER_HIT, bounce, 300, 760)
    sfx.bounce()
    setTeacherPose('ready')
    await arc(bounce, ALYA_HIT, 470, 420)
  }
  async function alyaShot(winner: boolean) {
    setAlyaPose('swing')
    sfx.hit()
    const bounce = { x: 1000 + Math.random() * 60, y: COURT_Y }
    await arc(ALYA_HIT, bounce, 290, 760)
    sfx.bounce()
    setAlyaPose('ready')
    if (winner) {
      setTeacherPose('thinking')
      await arc(bounce, { x: 1720, y: 560 }, 470, 650)
    } else await arc(bounce, TEACHER_HIT, 470, 420)
  }

  // ---------------------------------------------------------------- match flow
  function nextQuestion() {
    if (qIndex.current >= questions.current.length) {
      questions.current = buildTennisQuestions(reviewKeys(useGame.getState().review), 10)
      qIndex.current = 0
    }
    const nq = questions.current[qIndex.current++]
    setQ(nq)
    setQKey((k) => k + 1)
  }

  async function startPoint(first = false) {
    rallyHits.current = 0
    setAlyaPose('ready')
    setTeacherPose('ready')
    place(TEACHER_HIT.x, TEACHER_HIT.y)
    setGuide(L5.serve)
    await sayLine(L5.serve)
    if (!alive.current) return
    await wait(first ? 200 : 100)
    await teacherShot()
    if (!alive.current) return
    nextQuestion()
  }

  async function onAnswered(result: { teacherPoint: boolean }) {
    setQ(null)
    if (result.teacherPoint) {
      // the ball slips past Alya
      setAlyaPose('sad')
      await arc(ALYA_HIT, { x: -80, y: 640 }, 500, 600)
      const atMax = scoreRef.current.teacher >= 3
      setScore((s) => ({ ...s, teacher: Math.min(3, s.teacher + 1) }))
      setTeacherPose('happy')
      const line = atMax ? L5.keepGoing : L5.teacherPoint
      setGuide(line)
      await sayLine(line)
      await wait(400)
      if (alive.current) startPoint()
      return
    }
    rallyHits.current += 1
    const winner = rallyHits.current >= 2
    await alyaShot(winner)
    if (!alive.current) return
    if (winner) {
      const a = scoreRef.current.alya + 1
      setScore((s) => ({ ...s, alya: a }))
      setAlyaPose('celebrate')
      setBurst(Date.now())
      sfx.sparkle()
      setFlash(SCORE_TEXT[a])
      const line = L5.points[a - 1]
      setGuide(line)
      await sayLine(line)
      setFlash(null)
      if (a >= 4) {
        completeLevel('tennis')
        setPhase('victory')
        sfx.fanfare()
        setAlyaPose('celebrate')
        setTeacherPose('happy')
        await wait(600)
        await sayLine(L5.victory)
        await say(named(L5.congrats.en, name))
        return
      }
      await wait(500)
      startPoint()
    } else {
      setTeacherPose('swing')
      setGuide(L5.rally)
      sayLine(L5.rally)
      await teacherShot()
      if (alive.current) nextQuestion()
    }
  }

  const begin = () => {
    stopVoice()
    sfx.click()
    setScore({ alya: 0, teacher: 0 })
    questions.current = buildTennisQuestions(reviewKeys(review), 10)
    qIndex.current = 0
    setPhase('play')
    setTimeout(() => startPoint(true), 300)
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop src={BG.court} />
      {/* dynamic scoreboard numbers over the painted (blank) scoreboard */}
      {(['alya', 'teacher'] as const).map((who) => {
        const p = who === 'alya' ? C.scoreAlya : C.scoreTeacher
        return (
          <motion.div
            key={who + score[who]}
            data-testid={`score-${who}`}
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="title-font"
            style={{ position: 'absolute', left: p.x - 70, top: p.y - 32, width: 140, textAlign: 'center', fontSize: SCORE_TEXT[score[who]].length > 2 ? 36 : 58, fontWeight: 700, color: who === 'alya' ? '#ffe9a8' : '#e7dcff', textShadow: '0 0 10px rgba(255,255,255,0.35)', lineHeight: '64px' }}
          >
            {SCORE_TEXT[score[who]]}
          </motion.div>
        )
      })}

      {/* players (independent layers, facing each other) */}
      <Character who="alya" pose={alyaPose} height={340} style={{ left: C.alyaX - 136, top: C.groundY - 340 }} label="Alya" />
      <Character who="teacher" pose={teacherPose} height={340} flip style={{ left: C.teacherX - 136, top: C.groundY - 340 }} label="Teacher" />
      {/* ball + shadow */}
      <div ref={shadow} style={{ position: 'absolute', left: 0, top: 0, width: 48, height: 14, borderRadius: '50%', background: 'rgba(30,40,30,0.5)', transform: `translate(${TEACHER_HIT.x}px, ${COURT_Y + 22}px)`, pointerEvents: 'none', opacity: phase === 'play' ? 1 : 0 }} />
      <div ref={ball} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${TEACHER_HIT.x - 20}px, ${TEACHER_HIT.y - 20}px)`, pointerEvents: 'none', zIndex: 15, opacity: phase === 'play' ? 1 : 0, filter: q ? 'drop-shadow(0 0 12px #fff8b0)' : undefined }}>
        <div className={q ? 'float-y' : ''}>
          <TennisBall size={40} />
        </div>
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 30 }}>
        <TopButton label="Back to map" onClick={() => go({ name: 'map' })}>
          <MapIcon size={40} color="#245d61" />
        </TopButton>
        <TopButton label="Settings" onClick={() => go({ name: 'settings', back: 'map' })}>
          <Gear size={38} color="#245d61" />
        </TopButton>
      </div>
      {guide && phase === 'play' && <Guide line={guide} auto={false} width={980} />}

      {q && phase === 'play' && (
          <motion.div key={qKey} initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} className="panel" style={{ position: 'absolute', left: 470, top: 430, width: 660, height: 455, padding: '14px 18px', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <TennisQuestion q={q} setGuide={setGuide} setAlyaPose={setAlyaPose} onAnswered={onAnswered} />
          </motion.div>
      )}
      {flash && (
        <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="title-font text-outline" style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontSize: 120, fontWeight: 700, color: '#f7d77b', zIndex: 40 }}>
          {flash === 'Game' ? 'GAME!' : `${flash}!`}
        </motion.div>
      )}
      {burst > 0 && <StarBurst key={burst} x={C.alyaX} y={420} n={12} />}

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,247,232,0.25)' }}>
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel" style={{ width: 640, padding: '30px 40px', textAlign: 'center', marginTop: 120 }}>
            <div className="title-font" style={{ fontSize: 30, color: '#3a9d98', fontWeight: 600 }}>Level 5 · Final Tournament</div>
            <div className="title-font" style={{ fontSize: 64, fontWeight: 700, color: '#e0a72e' }}>Tennis Challenge!</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#245d61' }}>{L5.intro[1].en}</div>
            <div style={{ fontSize: 21, color: '#7a6a55', marginTop: 10 }}>2 right answers = 1 point · 0 → 15 → 30 → 40 → Game!</div>
            <button className="btn btn-teal title-font" style={{ fontSize: 44, padding: '14px 56px', marginTop: 20 }} onClick={begin}>
              <Play size={36} fill="#fff" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} /> Play!
            </button>
          </motion.div>
        </div>
      )}

      {phase === 'victory' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(36,93,97,0.35)', zIndex: 60 }}>
          <Confetti count={110} />
          <Character who="alya" pose="celebrate" height={460} style={{ left: 90, bottom: 40 }} />
          <Character who="teacher" pose="happy" height={440} flip style={{ right: 90, bottom: 40 }} />
          <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="panel" style={{ position: 'absolute', left: 470, top: 60, width: 660, padding: 30, textAlign: 'center' }}>
            <motion.div animate={{ rotate: [0, -5, 5, 0], y: [0, -10, 0] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ display: 'flex', justifyContent: 'center' }}>
              <TrophyArt size={240} />
            </motion.div>
            <div className="title-font" style={{ fontSize: 76, fontWeight: 700, color: '#e0a72e', lineHeight: 1 }}>YOU DID IT!</div>
            <div className="title-font" style={{ fontSize: 44, fontWeight: 700, color: '#3a9d98', marginTop: 6 }}>ENGLISH TENNIS CHAMPION!</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#245d61', marginTop: 8 }}>{named(L5.congrats.en, name)}</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 22 }}>
              <button className="btn btn-sun title-font" style={{ fontSize: 28, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => setPhase('intro')}>
                <RotateCcw size={28} /> Play Again
              </button>
              <button className="btn btn-lav title-font" style={{ fontSize: 28, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => go({ name: 'rewards' })}>
                <Trophy size={28} /> My Rewards
              </button>
              <button className="btn btn-teal title-font" style={{ fontSize: 28, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => go({ name: 'map' })}>
                <MapIcon size={28} /> Back to Map
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/** One question inside the frozen rally. Handles hints, retries, reveal, speaking and recording. */
function TennisQuestion({
  q,
  setGuide,
  setAlyaPose,
  onAnswered,
}: {
  q: TennisQ
  setGuide: (l: Line) => void
  setAlyaPose: (p: Pose) => void
  onAnswered: (r: { teacherPoint: boolean }) => void
}) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const recordSpeech = useGame((s) => s.recordSpeech)
  const [misses, setMisses] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [shownAnswer, setShownAnswer] = useState<string | null>(null)
  const [solved, setSolved] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const done = useRef(false)

  const prompt: Line =
    q.kind === 'choice' ? q.round.prompt : q.kind === 'arrange' ? L5.arrangePrompt : L5.speakPrompt
  const options = useMemo<Option[]>(() => {
    if (q.kind === 'choice') return shuffle(q.round.options)
    if (q.kind === 'speak') {
      const pool = q.word.set === 'toys' ? TOYS : SCHOOL
      return shuffle([q.word, ...shuffle(pool.filter((w) => w.id !== q.word.id)).slice(0, 2)]).map((w) => ({ id: w.id, label: w.itIs, correct: w.id === q.word.id, say: w.itIs }))
    }
    return []
  }, [q])

  useEffect(() => {
    setGuide(prompt)
    sayLine(prompt)
    setAlyaPose('ready')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const meta = q.kind === 'choice' ? { topic: q.round.topic, item: q.round.id, skill: q.round.skill } : q.kind === 'arrange' ? { topic: 'word-order', item: q.words.join(' '), skill: 'grammar' as const } : { topic: 'toy-speaking', item: q.word.id, skill: 'speaking' as const }

  async function finish(m: number, rev: boolean, sayText?: string) {
    if (done.current) return
    done.current = true
    sfx.correct()
    setAlyaPose('happy')
    recordAttempt({ level: 'tennis', activity: 'match', skill: meta.skill, topic: meta.topic, item: meta.item, outcome: outcomeFor(m, rev), misses: m })
    if (sayText) await say(sayText, 'alya')
    if (!rev) {
      const p = pick(PRAISE)
      setGuide(p)
      await sayLine(p)
    }
    onAnswered({ teacherPoint: rev && q.kind === 'choice' })
  }
  /**
   * A wrong answer in the match: "Oh no!", the right answer turns green and is spoken,
   * then the Teacher wins the point. (Speaking questions never do this – mic problems are not punished.)
   */
  async function miss(id: string) {
    if (done.current) return
    done.current = true
    sfx.tryAgain()
    setAlyaPose('sad')
    setMisses(1)
    setWrong((w) => [...w, id])
    const correct = options.find((o) => o.correct)
    if (correct) setSolved(correct.id)
    if (q.kind === 'arrange') setShownAnswer(q.words.join(' ').replace(/ ([.,?])/g, '$1'))
    setGuide(L5.ohNo)
    await sayLine(L5.ohNo)
    if (q.kind === 'arrange') await say(q.say, 'alya')
    else if (correct?.say) await say(correct.say, 'alya')
    else if (q.kind === 'choice') await sayLine(q.round.prompt)
    recordAttempt({ level: 'tennis', activity: 'match', skill: meta.skill, topic: meta.topic, item: meta.item, outcome: 'revealed', misses: 1 })
    await new Promise((r) => setTimeout(r, 500))
    onAnswered({ teacherPoint: true })
  }
  function choose(o: Option) {
    if (done.current || solved) return
    if (o.correct) {
      setSolved(o.id)
      finish(misses, false, o.say)
    } else miss(o.id)
  }
  const stateOf = (o: Option) => (solved === o.id ? 'right' : wrong.includes(o.id) ? 'wrong' : solved ? 'dim' : 'idle') as 'idle'

  if (q.kind === 'arrange')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {q.pic && <Pic pic={q.pic} size={110} />}
        {shownAnswer ? (
          <div className="card is-correct title-font" style={{ fontSize: 40, fontWeight: 700, color: '#245d61', padding: '12px 30px', cursor: 'default' }}>
            {shownAnswer} ✓
          </div>
        ) : (
          <SentenceBuilder compact words={q.words} onMiss={() => miss('order')} onSolved={() => finish(0, false, q.say)} />
        )}
      </div>
    )

  if (q.kind === 'speak') {
    const onMic = (o: MicOutcome) => {
      if (done.current) return
      if (o.kind === 'correct') {
        setGuide(UI.recognized)
        finish(misses, false)
      } else if (o.kind === 'partial') {
        setGuide(UI.wholeSentence)
        sayLine(UI.wholeSentence)
      } else if (o.kind === 'other-answer') {
        setMisses((m) => m + 1)
        sfx.tryAgain()
        setGuide(UI.otherAnswer)
        sayLine(UI.otherAnswer)
      } else if (o.kind === 'error' && o.error !== 'no-speech' && o.error !== 'timeout' && o.error !== 'aborted') setManual(true)
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Pic pic={`obj:${q.word.id}`} size={130} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <MicButton spec={itIsSpec(q.word)} level="tennis" item={`toys:${q.word.id}`} onOutcome={onMic} size={100} label="Say: It's a …" />
          </div>
          <button className="btn btn-sun" aria-label="Listen to the answer" style={{ width: 70, height: 70, display: 'grid', placeItems: 'center' }} onClick={() => say(q.word.itIs, 'alya')}>
            <Volume2 size={34} />
          </button>
        </div>
        {!manual ? (
          <button className="title-font" style={{ marginTop: 34, background: 'rgba(255,255,255,0.85)', border: '3px solid #fff', borderRadius: 16, padding: '6px 18px', fontSize: 22, color: '#245d61', cursor: 'pointer' }} onClick={() => setManual(true)}>
            Tap the answer instead
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 30, width: '86%' }}>
            {options.map((o) => (
              <OptionButton
                key={o.id}
                compact
                opt={o}
                layout="sentences"
                state={stateOf(o)}
                onClick={() => {
                  if (o.correct) recordSpeech({ level: 'tennis', item: `toys:${q.word.id}`, result: 'manual' })
                  choose(o)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const r = q.round
  const layout = r.layout ?? 'sentences'
  const hasVisual = r.visual && r.visual.type !== 'none' && r.visual.type !== 'listen'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      {hasVisual && r.visual?.type === 'object' && (
        <div style={{ height: 150, display: 'grid', placeItems: 'center' }}>
          <Pic pic={r.visual.pic} size={140} />
        </div>
      )}
      {r.visual?.type === 'qword' && (
        <div className="title-font" style={{ fontSize: 44, fontWeight: 700, color: '#245d61', textAlign: 'center', lineHeight: 1.2 }}>
          {r.visual.sentence.replace('___', solved ? options.find((o) => o.id === solved)?.label ?? '___' : '___')}
          {r.visual.answer && <div style={{ fontSize: 30, color: '#8f74c9' }}>— {r.visual.answer}</div>}
        </div>
      )}
      {hasVisual && r.visual?.type !== 'object' && r.visual?.type !== 'qword' && (
        <div style={{ transform: 'scale(0.42)', height: 180, marginTop: -60, marginBottom: 20, transformOrigin: '50% 30%' }}>
          <VisualView visual={r.visual} solved={!!solved} />
        </div>
      )}
      {r.visual?.type === 'listen' && (
        <button className="btn btn-sun" aria-label="Listen again" onClick={() => sayLine(r.prompt)} style={{ width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', marginBottom: 6 }}>
          <Volume2 size={64} />
        </button>
      )}
      <div style={{ display: 'flex', flexDirection: layout === 'sentences' ? 'column' : 'row', gap: 10, width: layout === 'sentences' ? '88%' : undefined, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((o) => (
          <OptionButton key={o.id} compact opt={o} layout={layout} state={stateOf(o)} onClick={() => choose(o)} />
        ))}
      </div>
    </div>
  )
}
