import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { Sparkles, ArrowRight, MessageSquare, HelpCircle, Volume2 } from 'lucide-react'
import { LevelShell } from '../components/LevelShell'
import { useStage } from '../components/Stage'
import { ChoiceActivity, outcomeFor } from '../components/ChoiceActivity'
import { Guide, sayLine, TrButton } from '../components/Guide'
import { DragArea, Draggable, DropZone } from '../components/Drag'
import { Pic } from '../components/Pic'
import { SentenceBuilder } from '../components/SentenceBuilder'
import { StarBurst } from '../components/Effects'
import { Character } from '../components/Character'

import { useGame } from '../store/gameStore'
import { L4, articleItems, buildItems, yesNoRounds, itsCheckRound, isntCheckRound } from '../content/level4'
import { PRAISE, TRY, pick, type Line } from '../content/lines'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export function Level4() {
  return (
    <LevelShell
      level="grammar"
      bg="grammarRoom"
      bgDim={0.12}
      intro={L4.intro}
      activities={[
        { key: 'q', title: L4.titles.question, render: (done) => <StatementToQuestion onDone={done} /> },
        { key: 'its', title: L4.titles.its, render: (done) => <Contraction kind="its" onDone={done} /> },
        { key: 'isnt', title: L4.titles.isnt, render: (done) => <Contraction kind="isnt" onDone={done} /> },
        { key: 'yn', title: L4.titles.yesno, render: (done) => <ChoiceActivity rounds={yesNoRounds} level="grammar" activity="yes-no" onDone={done} /> },
        { key: 'an', title: L4.titles.article, render: (done) => <Articles onDone={done} /> },
        { key: 'build', title: L4.titles.build, render: (done) => <Build onDone={done} /> },
      ]}
    />
  )
}

function Block({ id, text, color = '#b8a2db', highlight }: { id: string; text: string; color?: string; highlight?: boolean }) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      className="title-font"
      style={{
        fontSize: 64,
        fontWeight: 700,
        padding: '10px 28px',
        borderRadius: 24,
        background: highlight ? 'linear-gradient(#fff6c9,#f7d77b)' : '#fff',
        border: `5px solid ${highlight ? '#e0a72e' : color}`,
        color: '#3d2a66',
        boxShadow: '0 6px 0 rgba(61,42,102,0.2)',
      }}
    >
      {text}
    </motion.div>
  )
}

/** Activity 1: It is a pencil. -> Is it a pencil?  (watch, then build it yourself) */
function StatementToQuestion({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [phase, setPhase] = useState<'statement' | 'question' | 'task'>('statement')
  const [showTr, setShowTr] = useState(false)
  const [guide, setGuide] = useState<Line>(L4.qExplain1)
  const [misses, setMisses] = useState(0)
  const [burst, setBurst] = useState(0)
  const q = phase !== 'statement'
  const order = q ? ['is', 'it', 'a', 'pencil', 'end'] : ['it', 'is', 'a', 'pencil', 'end']
  const text: Record<string, string> = { it: q ? 'it' : 'It', is: q ? 'Is' : 'is', a: 'a', pencil: 'pencil', end: q ? '?' : '.' }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={guide} />
      {phase !== 'task' ? (
        <div className="panel" style={{ position: 'absolute', left: P ? 24 : 170, right: P ? 24 : 170, top: P ? 300 : 210, height: P ? 620 : 540, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
          <TrButton lines={[q ? L4.questionInfo : L4.statementInfo]} onShow={() => setShowTr(true)} style={{ position: 'absolute', top: 18, right: 18 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Pic pic="obj:pencil" size={130} />
            <div className="title-font" style={{ fontSize: 34, fontWeight: 700, color: q ? '#8f74c9' : '#3a9d98', display: 'flex', alignItems: 'center', gap: 10 }}>
              {q ? <HelpCircle size={44} /> : <MessageSquare size={44} />}
              {q ? 'Question (voice goes up ↗)' : 'Statement (voice goes down ↘)'}
            </div>
          </div>
          {showTr && <TrText line={q ? L4.questionInfo : L4.statementInfo} />}
          <LayoutGroup>
            <div style={{ display: 'flex', gap: 18 }}>
              {order.map((k) => (
                <Block key={k} id={k} text={text[k]} highlight={k === 'is' && q} />
              ))}
            </div>
          </LayoutGroup>
          <div style={{ display: 'flex', gap: 20 }}>
            <button className="btn btn-sun title-font" style={{ fontSize: 30, padding: '10px 26px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => say(q ? L4.question : L4.statement, 'alya')}>
              <Volume2 size={30} /> Listen
            </button>
            {phase === 'statement' ? (
              <button
                className="btn btn-lav title-font"
                style={{ fontSize: 34, padding: '10px 32px', display: 'flex', gap: 10, alignItems: 'center' }}
                onClick={async () => {
                  sfx.whoosh()
                  setPhase('question')
                  sfx.sparkle()
                  setGuide(L4.qExplain2)
                  await sayLine(L4.qExplain2)
                  await say(L4.statement, 'alya')
                  await say(L4.question, 'alya')
                }}
              >
                <Sparkles size={34} /> Make it a question!
              </button>
            ) : (
              <>
                <button className="btn btn-cream title-font" style={{ fontSize: 30, padding: '10px 26px' }} onClick={() => setPhase('statement')}>
                  Back to statement
                </button>
                <button
                  className="btn btn-teal title-font"
                  style={{ fontSize: 34, padding: '10px 32px' }}
                  onClick={() => {
                    setPhase('task')
                    setGuide(L4.qTask2)
                  }}
                >
                  My turn! <ArrowRight size={30} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="panel" style={{ position: 'absolute', left: P ? 24 : 170, right: P ? 24 : 170, top: P ? 300 : 210, height: P ? 680 : 560, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="title-font" style={{ fontSize: 34, color: '#3a9d98', marginBottom: 10 }}>
              It is a ball. → <b>?</b>
            </div>
            <SentenceBuilder
              words={['Is', 'it', 'a', 'ball', '?']}
              pic="obj:ball"
              onMiss={(m) => {
                setMisses(m)
                const t = pick(TRY)
                setGuide(t)
                sayLine(t).then(() => setGuide(L4.qHint))
              }}
              onSolved={async () => {
                sfx.correct()
                setBurst(Date.now())
                recordAttempt({ level: 'grammar', activity: 'it-is-is-it', skill: 'grammar', topic: 'word-order', item: 'is-it-question', outcome: outcomeFor(misses, false), misses })
                await say(L4.qBall, 'alya')
                const p = pick(PRAISE)
                setGuide(p)
                await sayLine(p)
                onDone()
              }}
            />
          </div>
        </div>
      )}
      {burst > 0 && <StarBurst key={burst} x={P ? 450 : 800} y={P ? 640 : 480} n={12} />}
    </div>
  )
}

/** Activities 2 & 3: It is -> It's,  is not -> isn't (same meaning). */
function Contraction({ kind, onDone }: { kind: 'its' | 'isnt'; onDone: () => void }) {
  const { portrait: P } = useStage()
  const [short, setShort] = useState(false)
  const [check, setCheck] = useState(false)
  const explain = kind === 'its' ? L4.itsExplain : L4.isntExplain
  const [guide, setGuide] = useState<Line>(explain)
  const [showTr, setShowTr] = useState(false)
  const how = kind === 'its' ? L4.itsHow : L4.isntHow
  const same = kind === 'its' ? L4.itsSame : L4.isntSame
  if (check) return <ChoiceActivity rounds={[kind === 'its' ? itsCheckRound : isntCheckRound]} level="grammar" activity={kind === 'its' ? 'its' : 'isnt'} onDone={onDone} />
  const longSay = kind === 'its' ? L4.itIsBall : L4.isNotPen
  const shortSay = kind === 'its' ? L4.itsBall : L4.isntPen
  const pic = kind === 'its' ? 'obj:ball' : 'obj:pencil'
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={guide} />
      <div className="panel" style={{ position: 'absolute', left: P ? 24 : 150, right: P ? 24 : 150, top: P ? 300 : 195, height: P ? 760 : 640, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <TrButton lines={short ? [how, same] : [same]} onShow={() => setShowTr(true)} style={{ position: 'absolute', top: 18, right: 18 }} />
        <Pic pic={pic} size={120} />
        <LayoutGroup>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {kind === 'its' ? (
              <>
                {!short ? (
                  <>
                    <Block id="It" text="It" />
                    <Block id="is" text="is" highlight />
                  </>
                ) : (
                  <Block id="It" text="It's" highlight />
                )}
                <Block id="a" text="a" />
                <Block id="ball" text="ball." />
              </>
            ) : (
              <>
                <Block id="It" text="It" />
                {!short ? (
                  <>
                    <Block id="is" text="is" highlight />
                    <Block id="not" text="not" highlight />
                  </>
                ) : (
                  <Block id="is" text="isn't" highlight />
                )}
                <Block id="a" text="a" />
                <Block id="pen" text="pen." />
              </>
            )}
          </div>
        </LayoutGroup>
        <AnimatePresence>
          {short && (
            <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="title-font" style={{ fontSize: 30, color: '#8f74c9', fontWeight: 600 }}>
              {how.en}
              {showTr && <TrText line={how} />}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="title-font" style={{ fontSize: 34, color: '#3a9d98', fontWeight: 700, textAlign: 'center' }}>
          {same.en}
          {showTr && <TrText line={same} />}
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button className="btn btn-sun title-font" style={{ fontSize: 30, padding: '10px 26px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => say(short ? shortSay : longSay, 'alya')}>
            <Volume2 size={30} /> Listen
          </button>
          <button
            className="btn btn-lav title-font"
            style={{ fontSize: 32, padding: '10px 30px', display: 'flex', gap: 10, alignItems: 'center' }}
            onClick={() => {
              sfx.sparkle()
              const s = !short
              setShort(s)
              setGuide(L4.toggle)
              say(s ? shortSay : longSay, 'alya')
            }}
          >
            <Sparkles size={32} /> {short ? 'Long form' : 'Short form'}
          </button>
          <button className="btn btn-teal title-font" style={{ fontSize: 32, padding: '10px 30px' }} onClick={() => setCheck(true)}>
            Check! <ArrowRight size={30} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Activity 5: drag a / an into the gap. */
function Articles({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [stage, setStage] = useState<'learn' | 'play'>('learn')
  const [i, setI] = useState(0)
  const [filled, setFilled] = useState<string | null>(null)
  const [misses, setMisses] = useState(0)
  const [guide, setGuide] = useState<Line>(L4.aExplain)
  const [burst, setBurst] = useState(0)
  const it = articleItems[i]

  if (stage === 'learn')
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Guide line={guide} onSpoken={() => guide === L4.aExplain && setGuide(L4.anExplain)} />
        <div className="panel" style={{ position: 'absolute', left: P ? 24 : 110, right: P ? 24 : 110, top: P ? 300 : 190, height: P ? 1080 : 610, display: 'flex', flexDirection: P ? 'column' : 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          {[
            { art: 'a', items: [['obj:ball', 'a ball'], ['obj:kite', 'a kite'], ['obj:doll', 'a doll']], line: L4.aExplain },
            { art: 'an', items: [['fruit:apple', 'an apple'], ['fruit:orange', 'an orange'], ['obj:monster', 'an ugly monster']], line: L4.anExplain },
          ].map((g) => (
            <div key={g.art} className="card" role="button" tabIndex={0} onClick={() => setGuide(g.line)} style={{ width: P ? 800 : 590, padding: '18px 24px', position: 'relative' }}>
              <TrButton lines={[g.line]} style={{ position: 'absolute', top: 14, right: 14 }} />
              <div className="title-font" style={{ fontSize: 80, fontWeight: 700, color: g.art === 'a' ? '#3a9d98' : '#8f74c9', lineHeight: 1 }}>{g.art}</div>
              {g.items.map(([p, t]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '4px 0 4px 40px' }}>
                  <Pic pic={p} size={70} />
                  <span className="title-font" style={{ fontSize: 40, color: '#245d61', fontWeight: 600 }}>
                    <b style={{ color: g.art === 'a' ? '#3a9d98' : '#8f74c9' }}>{g.art}</b> {t.slice(g.art.length + 1)}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: P ? 30 : 23, fontWeight: 800, color: '#e0709b', lineHeight: 1.3, marginTop: 8 }}>{g.line.tr}</div>
            </div>
          ))}
        </div>
        <button
          className="btn btn-teal title-font"
          style={{ position: 'absolute', left: P ? 320 : 690, top: P ? 1420 : 812, fontSize: 36, padding: '8px 40px' }}
          onClick={() => {
            setStage('play')
            setGuide(L4.articleTask)
          }}
        >
          Let&apos;s play! <ArrowRight size={30} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </button>
      </div>
    )

  return (
    <DragArea
      onDrop={(item, target) => {
        if (target !== 'gap' || filled) return false
        if (item === it.article) {
          setFilled(item)
          sfx.drop()
          sfx.correct()
          setBurst(Date.now())
          recordAttempt({ level: 'grammar', activity: 'a-an', skill: 'grammar', topic: 'articles', item: it.noun, outcome: outcomeFor(misses, false), misses })
          ;(async () => {
            await say(it.say, 'alya')
            const p = pick(PRAISE)
            setGuide(p)
            await sayLine(p)
            setMisses(0)
            setFilled(null)
            if (i + 1 >= articleItems.length) onDone()
            else {
              setI(i + 1)
              setGuide(L4.articleTask)
            }
          })()
          return true
        }
        sfx.tryAgain()
        setMisses((m) => m + 1)
        const t = pick(TRY)
        setGuide(t)
        sayLine(t).then(() => setGuide(L4.articleHint))
        return false
      }}
    >
      <Guide line={guide} />
      <div className="panel" style={{ position: 'absolute', left: P ? 24 : 200, right: P ? 24 : 200, top: P ? 300 : 210, height: P ? 720 : 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <motion.div key={it.noun} initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
          <Pic pic={it.pic} size={180} />
        </motion.div>
        <div className="title-font" style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: P ? 54 : 70, fontWeight: 700, color: '#245d61' }}>
          It&apos;s
          <DropZone id="gap" label="gap" style={{ minWidth: 150, height: 100, borderRadius: 22, border: '5px dashed #3a9d98', display: 'grid', placeItems: 'center', background: filled ? '#d6f5e1' : 'rgba(255,255,255,0.6)' }}>
            {filled && <span style={{ color: '#3fae6a' }}>{filled}</span>}
          </DropZone>
          {it.noun}.
        </div>
        <div style={{ display: 'flex', gap: 40 }}>
          {(['a', 'an'] as const).map((a) => (
            <Draggable key={a} id={a} label={a}>
              <div className="tile" style={{ fontSize: 64, padding: '8px 40px' }}>{a}</div>
            </Draggable>
          ))}
        </div>
      </div>
      {burst > 0 && <StarBurst key={burst} x={P ? 450 : 800} y={P ? 640 : 560} />}
    </DragArea>
  )
}

/** Activity 6: Build a sentence from word tiles. */
function Build({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [guide, setGuide] = useState<Line>(L4.buildLead)
  const [burst, setBurst] = useState(0)
  const it = buildItems[i]
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={guide} />
      <div className="panel" style={{ position: 'absolute', left: P ? 24 : 150, right: P ? 24 : 150, top: P ? 300 : 200, height: P ? 720 : 600, display: 'grid', placeItems: 'center' }}>
        <SentenceBuilder
          key={i}
          words={it.words}
          pic={it.pic}
          onMiss={(m) => {
            setMisses(m)
            const t = pick(TRY)
            setGuide(t)
            sayLine(t).then(() => setGuide(L4.buildHint))
          }}
          onSolved={async () => {
            sfx.correct()
            setBurst(Date.now())
            recordAttempt({ level: 'grammar', activity: 'build', skill: 'grammar', topic: 'word-order', item: it.words.join(' '), outcome: outcomeFor(misses, false), misses })
            await say(it.say, 'alya')
            const p = pick(PRAISE)
            setGuide(p)
            await sayLine(p)
            setMisses(0)
            if (i + 1 >= buildItems.length) onDone()
            else {
              setI(i + 1)
              setGuide(L4.buildLead)
            }
          }}
        />
      </div>
      <Character who="alya" pose={misses ? 'thinking' : 'idle'} height={300} style={P ? { left: 600, top: 1180 } : { left: 1390, top: 580 }} />
      {burst > 0 && <StarBurst key={burst} x={P ? 450 : 800} y={P ? 560 : 420} n={12} />}
    </div>
  )
}

/** Pink Turkish explanation text under an English line. */
function TrText({ line }: { line: Line }) {
  return <div style={{ fontFamily: 'var(--font-body)', fontSize: 26, fontWeight: 800, color: '#e0709b', marginTop: 4, textAlign: 'center' }}>{line.tr}</div>
}
