import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Backpack, MessageCircle, ToyBrick, WandSparkles, Trophy, Star } from 'lucide-react'
import type { LevelMeta } from '../content/meta'

const COLS = ['#f7d77b', '#a8ddc4', '#a9ddf4', '#f4b7cc', '#b8a2db', '#3a9d98', '#ffb36b']

export function Confetti({ count = 70, duration = 2.6 }: { count?: number; duration?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: Math.random() * 1600,
        d: Math.random() * 0.8,
        r: Math.random() * 720 - 360,
        c: COLS[i % COLS.length],
        w: 12 + Math.random() * 12,
        drift: Math.random() * 200 - 100,
      })),
    [count],
  )
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 120 }}>
      {bits.map((b, i) => (
        <motion.div
          key={i}
          initial={{ x: b.x, y: -40, rotate: 0, opacity: 1 }}
          animate={{ x: b.x + b.drift, y: 960, rotate: b.r, opacity: [1, 1, 0.8] }}
          transition={{ duration: duration + Math.random(), delay: b.d, ease: 'easeIn' }}
          style={{ position: 'absolute', width: b.w, height: b.w * 0.6, background: b.c, borderRadius: 4 }}
        />
      ))}
    </div>
  )
}

/** Little star burst at a point (stage px) – used for correct answers. */
export function StarBurst({ x, y, n = 8 }: { x: number; y: number; n?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 90 }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2
        return (
          <motion.svg
            key={i}
            width="34"
            height="34"
            viewBox="0 0 24 24"
            style={{ position: 'absolute', left: -17, top: -17 }}
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
            animate={{ x: Math.cos(a) * 120, y: Math.sin(a) * 120, scale: 1, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <path d="M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill={COLS[i % COLS.length]} stroke="#fff" strokeWidth="1.2" />
          </motion.svg>
        )
      })}
    </div>
  )
}

export function LevelIcon({ icon, size = 40, color = '#fff' }: { icon: LevelMeta['icon']; size?: number; color?: string }) {
  const p = { size, color, strokeWidth: 2.4 }
  switch (icon) {
    case 'backpack':
      return <Backpack {...p} />
    case 'message':
      return <MessageCircle {...p} />
    case 'toy':
      return <ToyBrick {...p} />
    case 'wand':
      return <WandSparkles {...p} />
    case 'trophy':
      return <Trophy {...p} />
  }
}

/** A reward medallion (badge / star / cup). */
export function Badge({ meta, size = 200, earned = true }: { meta: LevelMeta; size?: number; earned?: boolean }) {
  const isCup = meta.id === 'tennis'
  return (
    <div style={{ width: size, height: size, position: 'relative', filter: earned ? undefined : 'grayscale(1) opacity(0.35)' }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id={`bg-${meta.id}`} cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#fff6c9" />
            <stop offset="0.5" stopColor="#f7d77b" />
            <stop offset="1" stopColor="#d9a93a" />
          </radialGradient>
        </defs>
        {meta.id === 'warmup' ? (
          <path d="M100 8l26 58 62 6-47 42 14 62-55-32-55 32 14-62L12 72l62-6z" fill={`url(#bg-${meta.id})`} stroke="#fff" strokeWidth="8" strokeLinejoin="round" />
        ) : (
          <>
            {!isCup && <path d="M60 150 L45 198 L75 182 L100 198 L100 150Z M140 150 L155 198 L125 182 L100 198 L100 150Z" fill={meta.colour} opacity="0.9" />}
            <circle cx="100" cy="92" r="82" fill={`url(#bg-${meta.id})`} stroke="#fff" strokeWidth="8" />
            <circle cx="100" cy="92" r="62" fill={meta.colour} stroke="#fff6d8" strokeWidth="5" />
          </>
        )}
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: meta.id === 'warmup' ? size * 0.33 : size * 0.27, display: 'grid', placeItems: 'center' }}>
        {meta.id === 'warmup' ? <Star size={size * 0.28} color="#fff" fill="#fff" /> : <LevelIcon icon={meta.icon} size={size * 0.34} />}
      </div>
    </div>
  )
}

export function TrophyArt({ size = 260 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-label="Trophy">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="0.45" stopColor="#f2c94c" />
          <stop offset="1" stopColor="#c48a12" />
        </linearGradient>
      </defs>
      <path d="M50 30 C20 30 18 78 60 88" fill="none" stroke="url(#gold)" strokeWidth="12" strokeLinecap="round" />
      <path d="M150 30 C180 30 182 78 140 88" fill="none" stroke="url(#gold)" strokeWidth="12" strokeLinecap="round" />
      <path d="M48 20 H152 V60 C152 98 128 118 100 118 C72 118 48 98 48 60Z" fill="url(#gold)" stroke="#fff" strokeWidth="5" />
      <rect x="88" y="116" width="24" height="30" fill="url(#gold)" />
      <rect x="60" y="146" width="80" height="20" rx="6" fill="#3a9d98" stroke="#fff" strokeWidth="4" />
      <rect x="48" y="164" width="104" height="22" rx="8" fill="#245d61" stroke="#fff" strokeWidth="4" />
      <circle cx="100" cy="62" r="20" fill="#d8ef3a" stroke="#fff" strokeWidth="4" />
      <path d="M86 50 C96 56 96 68 86 74 M114 50 C104 56 104 68 114 74" stroke="#fff" strokeWidth="3" fill="none" />
      <ellipse cx="70" cy="44" rx="6" ry="14" fill="#fff" opacity="0.5" />
    </svg>
  )
}
