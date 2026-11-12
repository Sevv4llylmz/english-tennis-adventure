/**
 * Central asset manifest. Every image the game uses has a stable id here.
 * Files live in public/assets and are produced from assets-src/ by tools/prepare_assets.py.
 * Scene coordinates are in STAGE pixels (the 1600x900 game stage). All backgrounds are
 * 16:9 and fill the stage exactly, so overlay positions never drift when the window resizes.
 */
const base = import.meta.env.BASE_URL + 'assets/'

export const STAGE_W = 1600
export const STAGE_H = 900

export const BG = {
  map: base + 'backgrounds/adventure-map/adventure-map.webp',
  classroom: base + 'backgrounds/classroom/classroom.webp',
  toyShop: base + 'backgrounds/toy-shop/toy-shop.webp',
  grammarRoom: base + 'backgrounds/grammar-room/grammar-room.webp',
  court: base + 'backgrounds/tennis-court/tennis-court.webp',
} as const

export type Pose = 'idle' | 'happy' | 'thinking' | 'sad' | 'celebrate' | 'swing' | 'ready' | 'wave'
export const POSES: Pose[] = ['idle', 'happy', 'thinking', 'sad', 'celebrate', 'swing', 'ready', 'wave']
export type Who = 'alya' | 'teacher'

/** Sprite pixel sizes (from tools/asset-report.json) – used to keep aspect ratios exact. */
export const SPRITE_SIZE: Record<Who, Record<Pose, [number, number]>> = {
  alya: { idle: [242, 508], happy: [277, 511], thinking: [260, 504], sad: [244, 501], celebrate: [296, 522], swing: [392, 525], ready: [351, 494], wave: [307, 524] },
  teacher: { idle: [256, 507], happy: [296, 512], thinking: [274, 511], sad: [252, 523], celebrate: [302, 522], swing: [400, 526], ready: [348, 502], wave: [330, 527] },
}

export function sprite(who: Who, pose: Pose) {
  return `${base}characters/${who}/${who}-${pose}.webp`
}

export const SCHOOL_IDS = ['pen', 'rubber', 'pencil', 'book', 'notebook', 'bag', 'desk', 'ruler', 'pencil-case'] as const
export const DECOR_IDS = ['chair', 'board'] as const
export const TOY_IDS = ['kite', 'doll', 'monster', 'plane', 'computer-game', 'train', 'car', 'ball', 'bike', 'go-kart'] as const
export type SchoolId = (typeof SCHOOL_IDS)[number]
export type ToyId = (typeof TOY_IDS)[number]

export function objectImg(id: string) {
  const isToy = (TOY_IDS as readonly string[]).includes(id)
  return `${base}objects/${isToy ? 'toys' : 'school'}/${id}.webp`
}

/** Normalised (stage-pixel) positions of things painted inside backgrounds. */
export const SCENE = {
  map: {
    // level markers sit on the winding path (centre points)
    markers: [
      // the path is followed right -> left, then up to the school
      { x: 1330, y: 478 },
      { x: 860, y: 708 },
      { x: 420, y: 700 },
      { x: 600, y: 478 },
      { x: 770, y: 352 },
    ],
  },
  court: {
    // blank score areas inside the painted "Alya – Teacher" scoreboard
    scoreAlya: { x: 893, y: 362 },
    scoreTeacher: { x: 1012, y: 362 },
    groundY: 722, // where the players' feet touch the court
    alyaX: 330, // centre x of Alya
    teacherX: 1290,
    netX: 850,
    netTopY: 455,
  },
  toyShop: {
    zones: {
      shelf: { x: 268, y: 418, w: 232, h: 100 },
      counter: { x: 520, y: 392, w: 620, h: 82 },
      rug: { x: 520, y: 700, w: 580, h: 150 },
    },
  },
}

/** Everything worth preloading, by screen. */
export const PRELOAD = [
  ...Object.values(BG),
  ...POSES.map((p) => sprite('alya', p)),
  ...POSES.map((p) => sprite('teacher', p)),
  ...[...SCHOOL_IDS, ...DECOR_IDS, ...TOY_IDS].map(objectImg),
]

export function preloadAll(onProgress?: (done: number, total: number) => void) {
  let done = 0
  const total = PRELOAD.length
  return Promise.all(
    PRELOAD.map(
      (src) =>
        new Promise<void>((res) => {
          const img = new Image()
          img.onload = img.onerror = () => {
            done++
            onProgress?.(done, total)
            res()
          }
          img.src = src
        }),
    ),
  )
}
