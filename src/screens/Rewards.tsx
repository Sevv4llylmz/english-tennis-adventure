import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Backdrop, useStage } from '../components/Stage'
import { Badge } from '../components/Effects'
import { Character } from '../components/Character'

import { useGame } from '../store/gameStore'
import { LEVELS } from '../content/meta'
import { sayLine } from '../components/Guide'

export function Rewards() {
  const go = useGame((s) => s.go)
  const rewards = useGame((s) => s.rewards)
  const name = useGame((s) => s.playerName) ?? 'Alya'
  const { portrait: P } = useStage()
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop bg="grammarRoom" dim={0.35} />
      <button className="btn btn-cream title-font" style={{ position: 'absolute', top: 24, left: 24, fontSize: 30, padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => go({ name: 'map' })}>
        <ArrowLeft size={30} /> Map
      </button>
      <div className="title-font text-outline" style={{ position: 'absolute', top: P ? 120 : 30, width: '100%', textAlign: 'center', fontSize: P ? 58 : 68, fontWeight: 700, color: '#fff' }}>
        {name}&apos;s Rewards
      </div>
      <div className="panel" style={{ position: 'absolute', left: P ? 30 : 300, right: P ? 30 : 60, top: P ? 220 : 170, bottom: P ? 430 : 90, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: P ? 20 : 40, padding: P ? 20 : 30 }}>
        {LEVELS.map((lv, i) => {
          const got = rewards.includes(lv.id)
          return (
            <motion.button
              key={lv.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => got && sayLine(lv.rewardLine)}
              style={{ width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: got ? 'pointer' : 'default' }}
              aria-label={`${lv.reward}${got ? '' : ' (not earned yet)'}`}
            >
              <motion.div whileHover={got ? { rotate: [0, -8, 8, 0] } : {}}>
                <Badge meta={lv} size={200} earned={got} />
              </motion.div>
              <div className="title-font" style={{ fontSize: 28, fontWeight: 700, color: got ? '#245d61' : '#9a9182', marginTop: 8, textAlign: 'center' }}>
                {lv.reward}
              </div>
              <div style={{ fontSize: 20, color: got ? '#3fae6a' : '#9a9182', fontWeight: 700 }}>{got ? 'Earned!' : `Finish level ${lv.num}`}</div>
            </motion.button>
          )
        })}
      </div>
      <Character who="alya" pose={rewards.length ? 'celebrate' : 'idle'} height={P ? 390 : 420} style={{ left: P ? 300 : 20, bottom: 20 }} />
    </div>
  )
}
