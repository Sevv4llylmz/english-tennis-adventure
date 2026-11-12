import { objectImg, sprite } from '../assets/manifest'

/** Small original SVG props (rackets, fruit, sky cards) used where no artwork exists. */
export function Racket({ colour, size = 160 }: { colour: string; size?: number }) {
  return (
    <svg width={size * 0.62} height={size} viewBox="0 0 62 100" aria-hidden>
      <defs>
        <pattern id={`str-${colour}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3h6M3 0v6" stroke="#fff" strokeWidth="0.9" opacity="0.9" />
        </pattern>
      </defs>
      <ellipse cx="31" cy="32" rx="26" ry="29" fill={`url(#str-${colour})`} stroke={colour} strokeWidth="6" />
      <ellipse cx="31" cy="32" rx="26" ry="29" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <path d="M24 59 L31 70 L38 59" fill="none" stroke={colour} strokeWidth="5" strokeLinejoin="round" />
      <rect x="27" y="68" width="8" height="30" rx="4" fill="#4a3a5a" />
      <rect x="27" y="70" width="8" height="4" fill="#fff" opacity="0.4" />
    </svg>
  )
}

export function TennisBall({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <radialGradient id="tb" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#f6ff9e" />
          <stop offset="0.6" stopColor="#d8ef3a" />
          <stop offset="1" stopColor="#9fbf12" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#tb)" />
      <path d="M6 9 C16 14 16 26 6 31" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.9" />
      <path d="M34 9 C24 14 24 26 34 31" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.9" />
    </svg>
  )
}

function Fruit({ kind, size }: { kind: 'apple' | 'orange'; size: number }) {
  if (kind === 'apple')
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <defs>
          <radialGradient id="ap" cx="35%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ff8a80" />
            <stop offset="0.55" stopColor="#e53935" />
            <stop offset="1" stopColor="#a31515" />
          </radialGradient>
        </defs>
        <path d="M50 28 C30 14 8 26 12 52 C15 78 34 94 50 86 C66 94 85 78 88 52 C92 26 70 14 50 28Z" fill="url(#ap)" />
        <path d="M50 28 C49 20 51 12 55 6" stroke="#6d4c2f" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M54 16 C64 6 78 10 80 14 C72 22 60 22 54 16Z" fill="#6fbf4a" />
        <ellipse cx="32" cy="40" rx="7" ry="11" fill="#fff" opacity="0.35" />
      </svg>
    )
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id="or" cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="0.55" stopColor="#ff9f1c" />
          <stop offset="1" stopColor="#d9700b" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="55" r="38" fill="url(#or)" />
      <path d="M50 18 C56 8 70 8 74 12 C66 20 56 20 50 18Z" fill="#6fbf4a" />
      <circle cx="50" cy="19" r="3" fill="#7a5a2f" />
      <ellipse cx="35" cy="42" rx="7" ry="10" fill="#fff" opacity="0.35" />
    </svg>
  )
}

function TimeCard({ kind, size }: { kind: 'morning' | 'evening'; size: number }) {
  const morning = kind === 'morning'
  return (
    <svg width={size * 1.3} height={size} viewBox="0 0 130 100" aria-hidden style={{ borderRadius: 18 }}>
      <defs>
        <linearGradient id={`sky-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={morning ? '#8fd3f4' : '#3b3f8f'} />
          <stop offset="1" stopColor={morning ? '#fff2c2' : '#e88fb0'} />
        </linearGradient>
      </defs>
      <rect width="130" height="100" rx="16" fill={`url(#sky-${kind})`} />
      {morning ? (
        <g>
          <circle cx="40" cy="62" r="18" fill="#ffd54a" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <line key={i} x1={40 + Math.cos(a) * 24} y1={62 + Math.sin(a) * 24} x2={40 + Math.cos(a) * 31} y2={62 + Math.sin(a) * 31} stroke="#ffd54a" strokeWidth="4" strokeLinecap="round" />
          })}
          <ellipse cx="95" cy="30" rx="20" ry="9" fill="#fff" />
        </g>
      ) : (
        <g>
          <path d="M98 20 A20 20 0 1 0 110 52 A16 16 0 1 1 98 20Z" fill="#fff3b0" />
          {[[20, 20], [45, 35], [70, 15], [30, 55], [60, 50]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" />
          ))}
        </g>
      )}
      <rect y="82" width="130" height="18" fill={morning ? '#8fd18a' : '#3c6b55'} />
    </svg>
  )
}

/** Renders a picture reference: "obj:kite", "char:teacher", "racket:pink", "time:morning", "fruit:apple". */
export function Pic({ pic, size = 150, filter, className }: { pic: string; size?: number; filter?: string; className?: string }) {
  const [kind, id] = pic.split(':')
  if (kind === 'obj')
    return (
      <img
        src={objectImg(id)}
        alt={id.replace('-', ' ')}
        draggable={false}
        className={className}
        style={{ maxHeight: size, maxWidth: size * 1.35, objectFit: 'contain', filter: [filter, 'drop-shadow(0 6px 6px rgba(0,0,0,0.18))'].filter(Boolean).join(' ') }}
      />
    )
  if (kind === 'char')
    return <img src={sprite(id as 'alya' | 'teacher', 'idle')} alt={id} draggable={false} className={className} style={{ height: size, objectFit: 'contain' }} />
  if (kind === 'racket') return <Racket colour={id === 'pink' ? '#e86f9e' : '#8a62c9'} size={size} />
  if (kind === 'time') return <TimeCard kind={id as 'morning' | 'evening'} size={size * 0.8} />
  if (kind === 'fruit') return <Fruit kind={id as 'apple' | 'orange'} size={size} />
  return null
}
