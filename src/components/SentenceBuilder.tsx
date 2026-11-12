import { useMemo, useState } from 'react'
import { motion, LayoutGroup } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { shuffle } from '../content/lines'
import { sfx } from '../audio/sfx'
import { Pic } from './Pic'

/**
 * Word tiles -> sentence slots. Tap a tile to place it in the next slot, tap a placed tile
 * to send it back. When all slots are filled the order is checked; a wrong order highlights
 * the first wrong slot and sends the later tiles back so the child can try again.
 */
export function SentenceBuilder({
  words,
  pic,
  onSolved,
  onMiss,
  compact = false,
}: {
  words: string[]
  pic?: string
  onSolved: () => void
  onMiss?: (n: number) => void
  compact?: boolean
}) {
  const tiles = useMemo(() => {
    let s = shuffle(words.map((w, i) => ({ id: `${i}-${w}`, w })))
    // never start already solved
    if (s.map((t) => t.w).join(' ') === words.join(' ')) s = [...s.slice(1), s[0]]
    return s
  }, [words])
  const [placed, setPlaced] = useState<string[]>([])
  const [bad, setBad] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [misses, setMisses] = useState(0)
  const fs = compact ? 34 : 50

  function place(id: string) {
    if (done) return
    sfx.pop()
    setBad(null)
    const next = [...placed, id]
    setPlaced(next)
    if (next.length === words.length) {
      const got = next.map((x) => tiles.find((t) => t.id === x)!.w)
      const firstWrong = got.findIndex((w, i) => w !== words[i])
      if (firstWrong === -1) {
        setDone(true)
        sfx.sparkle()
        setTimeout(onSolved, 300)
      } else {
        sfx.tryAgain()
        const m = misses + 1
        setMisses(m)
        onMiss?.(m)
        setBad(firstWrong)
        setTimeout(() => setPlaced(next.slice(0, firstWrong)), 1100)
      }
    }
  }
  const tile = (t: { id: string; w: string }, inSlot: boolean, i?: number) => (
    <motion.button
      layoutId={t.id}
      key={t.id}
      className="tile"
      onClick={() => {
        if (done) return
        if (inSlot) {
          sfx.click()
          setBad(null)
          setPlaced((p) => p.filter((x) => x !== t.id))
        } else place(t.id)
      }}
      style={{
        fontSize: fs,
        padding: compact ? '4px 16px' : '8px 24px',
        minWidth: compact ? 56 : 80,
        borderColor: done ? '#3fae6a' : bad === i ? '#f0973c' : undefined,
        background: done ? 'linear-gradient(#f2fff6,#d6f5e1)' : bad === i ? 'linear-gradient(#fff3e6,#ffe0bf)' : undefined,
      }}
    >
      {t.w}
    </motion.button>
  )
  return (
    <LayoutGroup>
      <div data-words={import.meta.env.DEV ? words.join('|') : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 16 : 34 }}>
        {pic && !compact && <Pic pic={pic} size={170} />}
        <div style={{ display: 'flex', gap: compact ? 10 : 16, alignItems: 'center', minHeight: compact ? 70 : 100, flexWrap: 'wrap', justifyContent: 'center' }}>
          {words.map((_, i) => {
            const id = placed[i]
            const t = id ? tiles.find((x) => x.id === id)! : null
            return (
              <div
                key={i}
                style={{
                  minWidth: compact ? 64 : 96,
                  height: compact ? 68 : 96,
                  borderRadius: 22,
                  border: `4px dashed ${bad === i ? '#f0973c' : 'rgba(58,157,152,0.6)'}`,
                  background: 'rgba(255,255,255,0.5)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 4,
                }}
              >
                {t && tile(t, true, i)}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: compact ? 12 : 20, flexWrap: 'wrap', justifyContent: 'center', minHeight: compact ? 60 : 90 }}>
          {tiles.filter((t) => !placed.includes(t.id)).map((t) => tile(t, false))}
        </div>
        {!compact && placed.length > 0 && !done && (
          <button className="btn btn-cream" style={{ fontSize: 22, padding: '6px 18px', display: 'flex', gap: 6, alignItems: 'center' }} onClick={() => setPlaced([])}>
            <RotateCcw size={20} /> Start again
          </button>
        )}
      </div>
    </LayoutGroup>
  )
}
