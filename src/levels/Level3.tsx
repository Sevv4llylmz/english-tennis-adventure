import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Volume2, Star } from 'lucide-react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, outcomeFor, OptionButton } from '../components/ChoiceActivity'
import { Guide, sayLine } from '../components/Guide'
import { DragArea, Draggable, DropZone } from '../components/Drag'
import { Pic } from '../components/Pic'
import { MicButton, type MicOutcome } from '../components/Mic'
import { StarBurst } from '../components/Effects'
import { Character } from '../components/Character'
import { objectImg } from '../assets/manifest'
import { useScene, useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { L3 } from '../content/level3'
import { TOYS, word, itIsSpec } from '../content/vocab'
import { PRAISE, TRY, UI, pick, shuffle, type Line } from '../content/lines'
import type { ChoiceRound } from '../content/types'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export function Level3() {
  const findRounds = useMemo<ChoiceRound[]>(() => {
    const targets = shuffle(TOYS).slice(0, 5)
    return targets.map((t) => ({
      id: t.id,
      topic: 'toys-listen',
      skill: 'listening',
      prompt: L3.findLines[t.id],
      options: shuffle([t, ...shuffle(TOYS.filter((x) => x.id !== t.id)).slice(0, 3)]).map((o) => ({ id: o.id, pic: `obj:${o.id}`, correct: o.id === t.id })),
      hint: L3.findHint,
      layout: 'pictures',
    }))
  }, [])
  return (
    <LevelShell
      level="toyshop"
      bg="toyShop"
      intro={L3.intro}
      activities={[
        { key: 'explore', title: L3.titles.explore, render: (done) => <Explore onDone={done} /> },
        { key: 'find', title: L3.titles.find, render: (done) => <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,247,232,0.35)' }}><ChoiceActivity rounds={findRounds} level="toyshop" activity="listen-and-find" onDone={done} /></div> },
        { key: 'memory', title: L3.titles.memory, render: (done) => <Memory onDone={done} /> },
        { key: 'organize', title: L3.titles.organize, render: (done) => <Organize onDone={done} /> },
        { key: 'speak', title: L3.titles.speak, render: (done) => <SpeakToys onDone={done} /> },
      ]}
    />
  )
}

function Explore({ onDone }: { onDone: () => void }) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [seen, setSeen] = useState<string[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [guide, setGuide] = useState<Line>(L3.exploreLead)
  const [bounce, setBounce] = useState(0)
  const all = seen.length === TOYS.length
  const scene = useScene()
  const { portrait: P } = useStage()

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={guide} />
      {TOYS.map((t) => {
        const [x, y, h] = scene.toyShop.spots[t.id]
        const active = current === t.id
        return (
          <div key={t.id} style={{ position: 'absolute', left: x, top: y - h, transform: 'translateX(-50%)' }}>
          <motion.button
            aria-label={t.en}
            onClick={() => {
              sfx.pop()
              setCurrent(t.id)
              setBounce((b) => b + 1)
              if (!seen.includes(t.id)) {
                setSeen((s) => [...s, t.id])
                recordAttempt({ level: 'toyshop', activity: 'explore', skill: 'vocabulary', topic: 'toys-explore', item: t.id, outcome: 'first', misses: 0 })
              }
              setGuide(t.intro)
            }}
            animate={active ? { y: [0, -30, 0], rotate: [0, -6, 6, 0] } : { y: 0 }}
            key={active ? `a${bounce}` : 'idle'}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.08 }}
            style={{ position: 'relative', height: h, background: 'none', border: 'none', padding: 0, cursor: 'pointer', filter: active ? 'drop-shadow(0 0 16px #f7d77b)' : undefined }}
          >
            <img src={objectImg(t.id)} alt={t.en} draggable={false} style={{ height: h, filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.25))' }} />
            {seen.includes(t.id) && (
              <span className="title-font" style={{ position: 'absolute', left: '50%', bottom: -14, transform: 'translateX(-50%)', whiteSpace: 'nowrap', background: active ? '#3a9d98' : 'rgba(255,247,232,0.95)', color: active ? '#fff' : '#245d61', borderRadius: 14, padding: '0 12px', fontSize: 24, fontWeight: 700, border: '3px solid #fff' }}>
                {t.en}
              </span>
            )}
          </motion.button>
          </div>
        )
      })}
      {/* repeat panel */}
      {current && (
        <div className="panel" style={{ position: 'absolute', left: P ? 600 : 1280, top: P ? 300 : 190, width: P ? 270 : 290, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Pic pic={`obj:${current}`} size={110} />
          <div className="title-font" style={{ fontSize: 36, fontWeight: 700, color: '#245d61' }}>{word(current).en}</div>
          <button className="btn btn-sun title-font" style={{ fontSize: 22, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => say(word(current).itIs, 'alya')}>
            <Volume2 size={22} /> {word(current).itIs}
          </button>
          <MicButton
            spec={{ accept: itIsSpec(word(current)).accept, keyword: word(current).en, rivals: itIsSpec(word(current)).rivals }}
            level="toyshop"
            item={`toys:${current}`}
            size={80}
            label="Say it too!"
            onOutcome={(o) => {
              if (o.kind === 'correct' || o.kind === 'partial') {
                sfx.correct()
                const p = pick(PRAISE)
                setGuide(p)
                sayLine(p)
              }
            }}
          />
        </div>
      )}
      <div className="panel title-font" style={{ position: 'absolute', left: P ? 30 : 120, top: P ? 300 : 170, padding: '8px 22px', fontSize: 30, fontWeight: 700, color: '#245d61', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Star size={30} color="#e0a72e" fill="#f7d77b" /> {seen.length} / {TOYS.length} toys
      </div>
      {all && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="btn btn-teal title-font pulse-glow"
          style={{ position: 'absolute', left: P ? 30 : 120, top: P ? 380 : 245, fontSize: 34, padding: '10px 30px' }}
          onClick={() => {
            sayLine(L3.exploreDone)
            onDone()
          }}
        >
          Next <ArrowRight size={30} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </motion.button>
      )}
    </div>
  )
}

function Memory({ onDone }: { onDone: () => void }) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const pairs = useMemo(() => shuffle(TOYS).slice(0, 6), [])
  const cards = useMemo(() => shuffle(pairs.flatMap((t) => [{ key: t.id + '-p', id: t.id, kind: 'pic' as const }, { key: t.id + '-w', id: t.id, kind: 'word' as const }])), [pairs])
  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<string[]>([])
  const [fails, setFails] = useState<Record<string, number>>({})
  const [guide, setGuide] = useState<Line>(L3.memoryLead)
  const [lock, setLock] = useState(false)
  const { portrait: P } = useStage()

  function flip(c: (typeof cards)[number]) {
    if (lock || open.includes(c.key) || found.includes(c.id)) return
    sfx.flip()
    const next = [...open, c.key]
    setOpen(next)
    if (c.kind === 'word') say(word(c.id).en.charAt(0).toUpperCase() + word(c.id).en.slice(1) + '!')
    if (next.length === 2) {
      const [a, b] = next.map((k) => cards.find((x) => x.key === k)!)
      setLock(true)
      if (a.id === b.id) {
        setTimeout(() => {
          sfx.correct()
          const f = fails[a.id] ?? 0
          recordAttempt({ level: 'toyshop', activity: 'memory', skill: 'vocabulary', topic: 'memory', item: a.id, outcome: outcomeFor(f, false), misses: f })
          const nf = [...found, a.id]
          setFound(nf)
          setOpen([])
          setLock(false)
          setGuide(word(a.id).intro)
          sayLine(word(a.id).intro).then(() => {
            if (nf.length === pairs.length) {
              setGuide(pick(PRAISE))
              setTimeout(onDone, 900)
            }
          })
        }, 450)
      } else {
        setFails((f) => ({ ...f, [a.id]: (f[a.id] ?? 0) + 1, [b.id]: (f[b.id] ?? 0) + 1 }))
        setTimeout(() => {
          setOpen([])
          setLock(false)
        }, 1200)
      }
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,247,232,0.45)' }}>
      <Guide line={guide} />
      <div style={{ position: 'absolute', left: P ? 30 : 200, right: P ? 30 : 200, top: P ? 300 : 190, bottom: 60, display: 'grid', gridTemplateColumns: P ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 22 }}>
        {cards.map((c) => {
          const up = open.includes(c.key) || found.includes(c.id)
          return (
            <motion.button
              key={c.key}
              aria-label={up ? (c.kind === 'word' ? word(c.id).en : `picture of ${word(c.id).en}`) : 'hidden card'}
              onClick={() => flip(c)}
              animate={{ rotateY: up ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'relative', border: 'none', background: 'none', padding: 0, cursor: 'pointer', transformStyle: 'preserve-3d' }}
            >
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 26, border: '5px solid #fff', background: 'linear-gradient(135deg, #3a9d98, #a8ddc4)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 0 rgba(36,93,97,0.35)' }}>
                <Star size={70} color="#fff" fill="#f7d77b" />
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: 26,
                  border: `5px solid ${found.includes(c.id) ? '#3fae6a' : '#fff'}`,
                  background: '#fffaf0',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 6px 0 rgba(36,93,97,0.2)',
                }}
              >
                {c.kind === 'pic' ? (
                  <Pic pic={`obj:${c.id}`} size={120} />
                ) : (
                  <span className="title-font" style={{ fontSize: 40, fontWeight: 700, color: '#245d61' }}>
                    {word(c.id).en}
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function Organize({ onDone }: { onDone: () => void }) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const rounds = L3.organize
  const [i, setI] = useState(0)
  const [placed, setPlaced] = useState<{ toy: string; zone: string }[]>([])
  const [misses, setMisses] = useState(0)
  const [guide, setGuide] = useState<Line>(rounds[0].line)
  const [burst, setBurst] = useState<{ x: number; y: number; k: number } | null>(null)
  const r = rounds[i]
  const tray = useMemo(() => shuffle(['doll', 'ball', 'train', 'kite', 'car', 'monster']), [])
  const scene = useScene()
  const { portrait: P } = useStage()
  const zones = scene.toyShop.zones
  const T = scene.toyShop.tray

  return (
    <DragArea
      onDrop={(item, target) => {
        if (!r) return false
        if (item === r.toy && target === r.zone) {
          sfx.drop()
          sfx.correct()
          const z = zones[target as keyof typeof zones]
          setBurst({ x: z.x + z.w / 2, y: z.y + z.h / 2, k: Date.now() })
          setPlaced((p) => [...p, { toy: item, zone: target }])
          recordAttempt({ level: 'toyshop', activity: 'organize', skill: 'listening', topic: 'organize', item: `${item}-${target}`, outcome: outcomeFor(misses, false), misses })
          const p = pick(PRAISE)
          setGuide(p)
          sayLine(p).then(() => {
            setMisses(0)
            if (i + 1 >= rounds.length) onDone()
            else {
              setI(i + 1)
              setGuide(rounds[i + 1].line)
            }
          })
          return true
        }
        sfx.tryAgain()
        setMisses((m) => m + 1)
        const t = pick(TRY)
        setGuide(t)
        sayLine(t).then(() => setGuide(misses >= 1 ? L3.organizeHint : r.line))
        return false
      }}
    >
      <Guide line={guide} />
      {(Object.keys(zones) as (keyof typeof zones)[]).map((z) => {
        const Z = zones[z]
        const here = placed.filter((p) => p.zone === z)
        return (
          <DropZone key={z} id={z} label={z} style={{ position: 'absolute', left: Z.x, top: Z.y, width: Z.w, height: Z.h, borderRadius: 24, border: '5px dashed rgba(255,255,255,0.95)', background: 'rgba(58,157,152,0.18)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
            <span className="title-font" style={{ position: 'absolute', top: -38, left: 8, fontSize: 26, fontWeight: 700, color: '#fff', background: '#3a9d98', borderRadius: 12, padding: '0 12px' }}>
              {L3.zoneNames[z].en}
            </span>
            {here.map((p) => (
              <motion.img key={p.toy} initial={{ scale: 1.4 }} animate={{ scale: 1 }} src={objectImg(p.toy)} alt={p.toy} style={{ height: Math.min(Z.h - 10, 110) }} />
            ))}
          </DropZone>
        )
      })}
      <div className="panel" style={{ position: 'absolute', left: T.x, top: T.y, width: T.w, height: T.h, display: 'grid', gridTemplateColumns: P ? 'repeat(3, 1fr)' : '1fr 1fr', placeItems: 'center', padding: 14 }}>
        <span className="title-font" style={{ position: 'absolute', top: -40, left: 20, fontSize: 26, fontWeight: 700, color: '#fff', background: '#8f74c9', borderRadius: 12, padding: '0 12px' }}>Toy box</span>
        {tray
          .filter((t) => !placed.some((p) => p.toy === t))
          .map((t) => (
            <Draggable key={t} id={t} label={word(t).en}>
              <Pic pic={`obj:${t}`} size={120} />
            </Draggable>
          ))}
      </div>
      {burst && <StarBurst key={burst.k} x={burst.x} y={burst.y} />}
    </DragArea>
  )
}

function SpeakToys({ onDone }: { onDone: () => void }) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const recordSpeech = useGame((s) => s.recordSpeech)
  const rounds = L3.speakRounds
  const [i, setI] = useState(0)
  const r = rounds[i]
  const wd = word(r.toy)
  const [guide, setGuide] = useState<Line>(L3.speakLead)
  const [misses, setMisses] = useState(0)
  const [manual, setManual] = useState(false)
  const [solved, setSolved] = useState(false)
  const [burst, setBurst] = useState(0)
  const whats = useMemo(() => ({ en: "What's this?", tr: 'Bu ne?' }), [])
  const options = useMemo(() => shuffle([wd, ...shuffle(TOYS.filter((t) => t.id !== wd.id)).slice(0, 2)]), [wd])
  const { portrait: P } = useStage()

  async function win(how: 'speech' | 'manual', partialOk = false) {
    setSolved(true)
    sfx.correct()
    setBurst(Date.now())
    recordAttempt({ level: 'toyshop', activity: 'speaking', skill: 'speaking', topic: 'toy-speaking', item: r.toy, outcome: outcomeFor(misses, false), misses })
    if (how === 'manual') recordSpeech({ level: 'toyshop', item: `toys:${r.toy}`, result: 'manual' })
    if (partialOk) {
      setGuide(UI.wholeSentence)
      await say(wd.itIs, 'alya')
    }
    const p = how === 'speech' ? UI.recognized : pick(PRAISE)
    setGuide(p)
    await sayLine(p)
    if (how === 'speech') await sayLine(pick(PRAISE))
    setTimeout(() => {
      setSolved(false)
      setManual(false)
      setMisses(0)
      if (i + 1 >= rounds.length) onDone()
      else {
        setI(i + 1)
        setGuide(rounds[i + 1].fullSentence && !rounds[i].fullSentence ? L3.speakFull : whats)
      }
    }, 400)
  }

  function onMic(o: MicOutcome) {
    if (solved) return
    if (o.kind === 'correct') win('speech')
    else if (o.kind === 'partial') {
      if (!r.fullSentence) win('speech', true)
      else {
        setGuide(UI.wholeSentence)
        sayLine(UI.wholeSentence)
      }
    } else if (o.kind === 'other-answer') {
      setMisses((m) => m + 1)
      sfx.tryAgain()
      setGuide(UI.otherAnswer)
      sayLine(UI.otherAnswer)
    } else if (o.kind === 'error' && (o.error === 'unsupported' || o.error === 'not-allowed' || o.error === 'network' || o.error === 'audio-capture')) setManual(true)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,247,232,0.4)' }}>
      <Guide line={guide} />
      <div className="panel" style={{ position: 'absolute', left: P ? 170 : 150, top: P ? 290 : 200, width: 560, height: P ? 440 : 560, display: 'grid', placeItems: 'center' }}>
        <motion.div key={r.toy} initial={{ scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="float-y">
          <Pic pic={`obj:${r.toy}`} size={330} />
        </motion.div>
        <div className="title-font" style={{ position: 'absolute', bottom: 20, fontSize: 28, color: '#8f74c9', fontWeight: 600 }}>
          {r.fullSentence ? 'Say the whole sentence!' : 'Say the word or the sentence!'}
        </div>
      </div>
      <div style={{ position: 'absolute', left: P ? 100 : 780, top: P ? 760 : 180, width: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="title-font" style={{ fontSize: 44, fontWeight: 700, color: '#245d61', background: 'rgba(255,247,232,0.9)', padding: '6px 26px', borderRadius: 24 }}>
          What&apos;s this? → <span style={{ color: '#3a9d98' }}>It&apos;s a …</span>
        </div>
        <button className="btn btn-sun title-font" style={{ fontSize: 28, padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => say(wd.itIs, 'alya')}>
          <Volume2 size={30} /> Listen to the answer
        </button>
        <MicButton spec={itIsSpec(wd)} level="toyshop" item={`toys:${r.toy}`} onOutcome={onMic} size={118} label="Tap and say it!" disabled={solved} />
        {!manual ? (
          <button className="title-font" style={{ marginTop: 50, background: 'rgba(255,255,255,0.8)', border: '3px solid #fff', borderRadius: 18, padding: '8px 22px', fontSize: 24, color: '#245d61', cursor: 'pointer' }} onClick={() => setManual(true)}>
            Can&apos;t use the microphone? Tap the answer
          </button>
        ) : (
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((o) => (
              <OptionButton
                key={o.id}
                compact
                opt={{ id: o.id, label: o.itIs, correct: o.id === wd.id }}
                layout="sentences"
                state={solved && o.id === wd.id ? 'right' : 'idle'}
                onClick={() => {
                  if (solved) return
                  if (o.id === wd.id) {
                    say(o.itIs, 'alya').then(() => win('manual'))
                  } else {
                    sfx.tryAgain()
                    setMisses((m) => m + 1)
                    const t = pick(TRY)
                    setGuide(t)
                    sayLine(t)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
      {!P && <Character who="alya" pose={solved ? 'celebrate' : 'idle'} height={330} style={{ left: 1330, top: 540 }} />}
      {burst > 0 && <StarBurst key={burst} x={P ? 450 : 430} y={P ? 500 : 480} />}
    </div>
  )
}
