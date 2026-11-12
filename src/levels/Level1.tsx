import { useState } from 'react'
import { motion } from 'motion/react'
import { LevelShell } from '../components/LevelShell'
import { useStage } from '../components/Stage'
import { ChoiceActivity, outcomeFor } from '../components/ChoiceActivity'
import { Guide, sayLine } from '../components/Guide'
import { DragArea, Draggable, DropZone } from '../components/Drag'
import { Pic } from '../components/Pic'
import { Character } from '../components/Character'
import { StarBurst } from '../components/Effects'
import { objectImg } from '../assets/manifest'
import { useGame } from '../store/gameStore'
import { L1, colourHunt, countAndSay, packBag, whatsThisRounds, meetRounds, MEET } from '../content/level1'
import { PRAISE, TRY, pick, type Line } from '../content/lines'
import { sfx } from '../audio/sfx'
import { word } from '../content/vocab'

export function Level1() {
  const name = useGame((s) => s.playerName) ?? 'Alya'
  return (
    <LevelShell
      level="warmup"
      bg="classroom"
      bgDim={0.18}
      intro={L1.intro}
      activities={[
        { key: 'colour', title: L1.titles.colour, render: (done) => <ChoiceActivity rounds={colourHunt} level="warmup" activity="colour-hunt" onDone={done} /> },
        { key: 'count', title: L1.titles.count, render: (done) => <ChoiceActivity rounds={countAndSay} level="warmup" activity="count-and-say" onDone={done} /> },
        { key: 'pack', title: L1.titles.pack, render: (done) => <PackBag onDone={done} /> },
        { key: 'whats', title: L1.titles.whats, render: (done) => <ChoiceActivity rounds={whatsThisRounds} level="warmup" activity="whats-this" onDone={done} /> },
        { key: 'meet', title: L1.titles.meet, render: (done) => <ChoiceActivity rounds={meetRounds(name)} level="warmup" activity="meet-teacher" onDone={done} lead={MEET.hello} requeue={false} /> },
      ]}
    />
  )
}

/** Drag school objects into the bag (or tap object, then tap bag). */
function PackBag({ onDone }: { onDone: () => void }) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  const [round, setRound] = useState(0)
  const [packed, setPacked] = useState<string[]>([])
  const [misses, setMisses] = useState(0)
  const [guide, setGuide] = useState<Line>(packBag.rounds[0].line)
  const [wiggle, setWiggle] = useState(0)
  const [burst, setBurst] = useState(0)
  const r = packBag.rounds[round]
  const { portrait: P } = useStage()

  function onDrop(item: string, target: string) {
    if (target !== 'bag' || !r) return false
    if (item === r.id) {
      sfx.drop()
      setTimeout(() => sfx.correct(), 150)
      setPacked((p) => [...p, item])
      setWiggle((w) => w + 1)
      setBurst(Date.now())
      recordAttempt({ level: 'warmup', activity: 'pack-bag', skill: 'listening', topic: 'pack-bag', item, outcome: outcomeFor(misses, false), misses })
      const praise = pick(PRAISE)
      setGuide(praise)
      sayLine(praise).then(() => {
        const next = round + 1
        setMisses(0)
        if (next >= packBag.rounds.length) onDone()
        else {
          setRound(next)
          setGuide(packBag.rounds[next].line)
        }
      })
      return true
    }
    sfx.tryAgain()
    setMisses((m) => m + 1)
    const t = pick(TRY)
    setGuide(t)
    sayLine(t).then(() => setGuide(misses >= 1 ? packBag.dragHint : r.line))
    return false
  }

  const items = packBag.items.filter((i) => !packed.includes(i))
  return (
    <DragArea onDrop={onDrop}>
      <Guide line={guide} />
      {/* table of school things */}
      <div className="panel" style={{ position: 'absolute', left: P ? 30 : 90, top: P ? 290 : 250, width: P ? 840 : 900, height: P ? 620 : 560, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '24px 34px', padding: 30 }}>
        {items.map((id) => (
          <Draggable key={id} id={id} label={word(id).en} style={{ padding: 10 }}>
            <Pic pic={`obj:${id}`} size={170} />
          </Draggable>
        ))}
      </div>
      <DropZone id="bag" label="school bag" style={{ position: 'absolute', left: P ? 200 : 1040, top: P ? 950 : 220, width: P ? 420 : 400, height: P ? 520 : 520, borderRadius: 40, display: 'grid', placeItems: 'center', background: 'rgba(255,247,232,0.55)' }}>
        <motion.img key={wiggle} src={objectImg('bag')} alt="bag" draggable={false} animate={wiggle ? { rotate: [0, -6, 6, -3, 0], scale: [1, 1.06, 1] } : {}} transition={{ duration: 0.6 }} style={{ width: P ? 320 : 360, pointerEvents: 'none' }} />
        <div className="title-font" style={{ position: 'absolute', bottom: 18, fontSize: 30, color: '#245d61', fontWeight: 700 }}>
          My bag: {packed.length} / {packBag.rounds.length}
        </div>
      </DropZone>
      {burst > 0 && <StarBurst key={burst} x={P ? 410 : 1290} y={P ? 1200 : 480} />}
      <Character who="alya" pose={misses ? 'thinking' : packed.length ? 'happy' : 'idle'} height={280} style={P ? { left: 640, top: 1280 } : { left: 1360, top: 610 }} />
    </DragArea>
  )
}
