import { useEffect, useState } from 'react'
import { Eye, CircleCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, outcomeFor } from '../components/ChoiceActivity'
import { Guide, sayLine } from '../components/Guide'
import { DragArea, Draggable, DropZone } from '../components/Drag'
import { Pic } from '../components/Pic'
import { Character } from '../components/Character'
import { StarBurst } from '../components/Effects'
import { BG, objectImg } from '../assets/manifest'
import { useGame } from '../store/gameStore'
import { L2, questionDetective, listenDo, engTrRounds, engTrLead, aboutYou } from '../content/level2'
import { PRAISE, TRY, pick, type Line } from '../content/lines'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'
import type { Pose } from '../assets/manifest'

export function Level2() {
  return (
    <LevelShell
      level="detective"
      bg={BG.map}
      bgDim={0.35}
      bgBlur={4}
      intro={L2.intro}
      activities={[
        { key: 'qd', title: L2.titles.qd, render: (done) => <ChoiceActivity rounds={questionDetective} level="detective" activity="question-detective" onDone={done} /> },
        { key: 'do', title: L2.titles.listenDo, render: (done) => <ListenAndDo onDone={done} /> },
        { key: 'engtr', title: L2.titles.engTr, render: (done) => <ChoiceActivity rounds={engTrRounds} level="detective" activity="english-or-turkish" onDone={done} lead={engTrLead} /> },
        { key: 'about', title: L2.titles.about, render: (done) => <ChoiceActivity rounds={aboutYou} level="detective" activity="what-about-you" onDone={done} requeue={false} /> },
      ]}
    >
      <DetectiveFrame />
    </LevelShell>
  )
}

/** Magnifying-glass frame that turns the campus into a detective scene. */
function DetectiveFrame() {
  return (
    <svg width="1600" height="900" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18 }} aria-hidden>
      <circle cx="1460" cy="760" r="90" fill="none" stroke="#245d61" strokeWidth="18" />
      <line x1="1395" y1="825" x2="1320" y2="900" stroke="#245d61" strokeWidth="26" strokeLinecap="round" />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${60 + i * 50} ${860 - (i % 2) * 30} q12 -18 24 0`} stroke="#245d61" strokeWidth="8" fill="none" />
      ))}
    </svg>
  )
}

function OpenBook({ open }: { open: boolean }) {
  return (
    <div style={{ width: 340, height: 260, position: 'relative', display: 'grid', placeItems: 'center' }}>
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div key="open" initial={{ scaleX: 0.2, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0.2, opacity: 0 }} transition={{ duration: 0.45 }} style={{ display: 'flex', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))' }}>
            {[0, 1].map((p) => (
              <div key={p} style={{ width: 160, height: 210, background: '#fffaf0', border: '8px solid #8f74c9', borderRadius: p ? '6px 18px 18px 6px' : '18px 6px 6px 18px', padding: '26px 18px', boxSizing: 'border-box' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 6, background: '#d9cdea', borderRadius: 3, margin: '0 0 18px', width: `${70 + ((i * 13 + p * 7) % 30)}%` }} />
                ))}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.img key="closed" src={objectImg('book')} alt="closed book" initial={{ scaleX: 0.3, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0.3, opacity: 0 }} transition={{ duration: 0.4 }} style={{ height: 230 }} draggable={false} />
        )}
      </AnimatePresence>
    </div>
  )
}

type Step = 'pass' | 'look' | 'open' | 'close' | 'comeback'
const STEPS: Step[] = ['pass', 'look', 'open', 'close', 'comeback']
const STEP_LINE: Record<Step, Line> = { pass: listenDo.pass, look: listenDo.lookAtMe, open: listenDo.open, close: listenDo.close, comeback: listenDo.goAway }
const STEP_HINT: Record<Step, Line> = { pass: listenDo.passHint, look: listenDo.lookHint, open: listenDo.openHint, close: listenDo.closeHint, comeback: listenDo.comeBackHint }

/** Physical "Listen and do" actions: the child shows understanding by doing the action. */
function ListenAndDo({ onDone }: { onDone: () => void }) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const [guide, setGuide] = useState<Line>(STEP_LINE.pass)
  const [misses, setMisses] = useState(0)
  const [bookOpen, setBookOpen] = useState(false)
  const [teacherPose, setTeacherPose] = useState<Pose>('wave')
  const [teacherAway, setTeacherAway] = useState(false)
  const [passed, setPassed] = useState(false)
  const [burst, setBurst] = useState<{ x: number; y: number; k: number } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (step === 'comeback') {
      setTeacherPose('idle')
      setTimeout(() => setTeacherAway(true), 1400)
    } else if (step === 'look' || step === 'pass') setTeacherPose('wave')
    else setTeacherPose('idle')
  }, [step])

  async function success(x: number, y: number, extra?: () => Promise<unknown>) {
    setBusy(true)
    sfx.correct()
    setBurst({ x, y, k: Date.now() })
    recordAttempt({ level: 'detective', activity: 'listen-and-do', skill: 'listening', topic: 'listen-do', item: step, outcome: outcomeFor(misses, false), misses })
    setTeacherPose('happy')
    if (extra) await extra()
    const p = pick(PRAISE)
    setGuide(p)
    await sayLine(p)
    setMisses(0)
    setBusy(false)
    if (i + 1 >= STEPS.length) onDone()
    else {
      setI(i + 1)
      setGuide(STEP_LINE[STEPS[i + 1]])
    }
  }
  async function miss() {
    if (busy) return
    sfx.tryAgain()
    setMisses((m) => m + 1)
    const t = pick(TRY)
    setGuide(t)
    await sayLine(t)
    setGuide(STEP_HINT[step])
  }

  const teacherX = teacherAway ? 1700 : 1060
  return (
    <DragArea
      onDrop={(item, target) => {
        if (step !== 'pass' || target !== 'teacher-hand') return false
        if (item === 'pencil') {
          setPassed(true)
          sfx.drop()
          success(1180, 520, async () => {
            await sayLine(listenDo.thanks)
            await say(listenDo.welcome, 'alya')
          })
          return true
        }
        miss()
        return false
      }}
    >
      <Guide line={guide} />
      {/* Teacher */}
      <motion.div initial={false} animate={{ x: teacherX }} transition={{ duration: 1.3, ease: 'easeInOut' }} style={{ position: 'absolute', left: 0, top: 260, width: 440, height: 600 }}>
        <Character
          who="teacher"
          pose={teacherPose}
          height={560}
          flip
          style={{ left: 0, bottom: 0 }}
          label="Teacher"
          onClick={step === 'look' && !busy ? () => success(1250, 450, () => sayLine(listenDo.cool)) : undefined}
        />
        {step === 'pass' && !passed && (
          <DropZone id="teacher-hand" label="Teacher's hand" style={{ position: 'absolute', left: -10, top: 170, width: 230, height: 230, borderRadius: '50%', border: '6px dashed rgba(58,157,152,0.8)', background: 'rgba(255,255,255,0.25)' }} />
        )}
        {passed && step === 'pass' && <img src={objectImg('pencil')} alt="" style={{ position: 'absolute', left: 60, top: 210, height: 140, transform: 'rotate(-30deg)' }} />}
      </motion.div>

      {/* left side props per step */}
      {step === 'pass' && (
        <div className="panel" style={{ position: 'absolute', left: 120, top: 300, width: 760, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          {['ruler', 'pencil', 'rubber'].map((id) =>
            passed && id === 'pencil' ? (
              <div key={id} style={{ width: 170 }} />
            ) : (
              <Draggable key={id} id={id} label={id} disabled={busy}>
                <Pic pic={`obj:${id}`} size={220} />
              </Draggable>
            ),
          )}
        </div>
      )}
      {step === 'look' && (
        <>
          <Character who="alya" pose="idle" height={520} style={{ left: 260, top: 300 }} label="Alya" onClick={() => !busy && miss()} />
          <motion.button
            className="btn btn-mint title-font"
            aria-label="I'm looking at you"
            disabled={busy}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            onClick={() => !busy && success(800, 560, () => sayLine(listenDo.cool))}
            style={{ position: 'absolute', left: 690, top: 470, width: 240, height: 200, borderRadius: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={70} strokeWidth={2.4} />
              <CircleCheck size={58} strokeWidth={2.6} color="#3fae6a" />
            </span>
            <span style={{ fontSize: 28 }}>I&apos;m looking!</span>
          </motion.button>
        </>
      )}
      {(step === 'open' || step === 'close') && (
        <div className="panel" style={{ position: 'absolute', left: 120, top: 290, width: 820, height: 460, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          <button
            aria-label="book"
            className="card"
            style={{ padding: 20 }}
            onClick={() => {
              if (busy) return
              if (step === 'open' && !bookOpen) {
                sfx.flip()
                setBookOpen(true)
                success(530, 520)
              } else if (step === 'close' && bookOpen) {
                sfx.flip()
                setBookOpen(false)
                success(530, 520)
              } else miss()
            }}
          >
            <OpenBook open={bookOpen} />
          </button>
          <button aria-label="bag" className="card" style={{ padding: 20 }} onClick={() => miss()}>
            <img src={objectImg('bag')} alt="bag" style={{ height: 250 }} draggable={false} />
          </button>
        </div>
      )}
      {step === 'comeback' && (
        <div style={{ position: 'absolute', left: 140, top: 300, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Character who="alya" pose="thinking" height={360} style={{ position: 'relative', left: 0, top: 0 }} />
          <div style={{ display: 'flex', gap: 20 }}>
            {listenDo.comeBackOpts.map((o) => (
              <button
                key={o}
                className="card title-font"
                disabled={!teacherAway || busy}
                style={{ fontSize: 40, padding: '16px 30px', fontWeight: 600, color: '#245d61', opacity: teacherAway ? 1 : 0.5 }}
                onClick={() => {
                  if (o === listenDo.comeBack) {
                    success(700, 760, async () => {
                      await say(o, 'alya')
                      setTeacherAway(false)
                      await new Promise((r) => setTimeout(r, 1300))
                      await sayLine(listenDo.imBack)
                    })
                  } else miss()
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
      {burst && <StarBurst key={burst.k} x={burst.x} y={burst.y} />}
    </DragArea>
  )
}
