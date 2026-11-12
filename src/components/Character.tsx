import { AnimatePresence, motion, type TargetAndTransition } from 'motion/react'
import { sprite, type Pose, type Who } from '../assets/manifest'

/**
 * Pose-based character animation built only from the supplied artwork: the pose image
 * cross-fades, and small transforms add life (breathing, bounce, jump, tilt). No warping.
 */
export function Character({
  who,
  pose,
  height = 360,
  flip = false,
  className,
  style,
  onClick,
  label,
}: {
  who: Who
  pose: Pose
  height?: number
  flip?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  label?: string
}) {
  const motionFor: Record<Pose, TargetAndTransition> = {
    idle: {},
    ready: {},
    wave: { rotate: [0, -2, 0, 2, 0], transition: { duration: 1.6, repeat: Infinity } },
    happy: { y: [0, -24, 0], transition: { duration: 0.5, repeat: 1 } },
    celebrate: { y: [0, -40, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 } },
    thinking: { rotate: [0, -3, 0], transition: { duration: 2.4, repeat: Infinity } },
    sad: { y: [0, 6, 0], transition: { duration: 0.8 } },
    swing: { rotate: [6, -4, 0], transition: { duration: 0.35 } },
  }
  const Tag = onClick ? motion.button : motion.div
  return (
    <Tag
      className={className}
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'absolute',
        height,
        width: height * 0.8,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        transformOrigin: '50% 100%',
        ...style,
      }}
    >
      <motion.div key={pose} style={{ position: 'absolute', inset: 0, transformOrigin: '50% 100%' }} animate={motionFor[pose]}>
        <div className={pose === 'idle' || pose === 'ready' ? 'breathe' : ''} style={{ position: 'absolute', inset: 0 }}>
          <AnimatePresence initial={false}>
            <motion.img
              key={pose}
              src={sprite(who, pose)}
              alt={label ?? who}
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                height: '100%',
                width: 'auto',
                maxWidth: 'none',
                transform: `translateX(-50%) ${flip ? 'scaleX(-1)' : ''}`,
                filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.18))',
              }}
            />
          </AnimatePresence>
        </div>
      </motion.div>
      {pose === 'thinking' && (
        <motion.div
          className="title-font"
          style={{ position: 'absolute', top: -height * 0.02, right: flip ? undefined : -10, left: flip ? -10 : undefined, fontSize: height * 0.16, color: '#3a9d98', fontWeight: 700 }}
          animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          ?
        </motion.div>
      )}
      {(pose === 'celebrate' || pose === 'happy') && <Sparkles size={height} />}
    </Tag>
  )
}

function Sparkles({ size }: { size: number }) {
  const stars = [
    [-0.1, 0.1], [0.85, 0.05], [0.95, 0.4], [-0.15, 0.45], [0.4, -0.08],
  ]
  return (
    <>
      {stars.map(([x, y], i) => (
        <motion.svg
          key={i}
          width={size * 0.09}
          height={size * 0.09}
          viewBox="0 0 24 24"
          style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 0.9], opacity: [0, 1, 0], rotate: [0, 90] }}
          transition={{ duration: 1.2, delay: i * 0.12, repeat: Infinity, repeatDelay: 0.6 }}
        >
          <path d="M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f7d77b" stroke="#fff" strokeWidth="1" />
        </motion.svg>
      ))}
    </>
  )
}
