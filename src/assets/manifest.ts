/**
 * Central asset manifest. Every image the game uses has a stable id here.
 * Files live in public/assets and are produced from assets-src/ by tools/prepare_assets.py.
 * Scene coordinates are in STAGE pixels: 1600x900 in landscape, 900x1600 in portrait. Every
 * background exists in both shapes and fills the stage exactly, so overlays never drift.
 */
const base = import.meta.env.BASE_URL + 'assets/'

export const STAGE_W = 1600
export const STAGE_H = 900

const bg = (name: string) => ({
  l: `${base}backgrounds/${name}/${name}.webp`, // 16:9 landscape
  p: `${base}backgrounds/${name}/${name}-portrait.webp`, // 9:16 portrait (phones)
})
export const BG = {
  map: bg('adventure-map'),
  classroom: bg('classroom'),
  toyShop: bg('toy-shop'),
  grammarRoom: bg('grammar-room'),
  court: bg('tennis-court'),
} as const
export type BgKey = keyof typeof BG

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

/**
 * Positions of things painted inside the backgrounds, in stage pixels, for both layouts:
 * l = landscape 1600x900 artwork, p = portrait 900x1600 artwork.
 */
type Pt = { x: number; y: number }
type Zone = { x: number; y: number; w: number; h: number }
export interface SceneSet {
  map: { markers: Pt[] }
  court: {
    scoreAlya: Pt
    scoreTeacher: Pt
    scoreSize: number
    groundY: number // where the players' feet touch the court
    alyaX: number
    teacherX: number
    playerH: number
    alyaHit: Pt
    teacherHit: Pt
    bounceY: number
    peakY: number
    bounceAlyaSide: number // x where the teacher's shot bounces
    bounceTeacherSide: number
    card: Zone // question card
  }
  toyShop: {
    zones: { shelf: Zone; counter: Zone; rug: Zone }
    tray: Zone
    spots: Record<string, [number, number, number]> // centre x, bottom y, height
  }
}

export const SCENE: { l: SceneSet; p: SceneSet } = {
  l: {
    map: {
      // the path is followed right -> left, then up to the school
      markers: [
        { x: 1330, y: 478 },
        { x: 860, y: 708 },
        { x: 420, y: 700 },
        { x: 600, y: 478 },
        { x: 770, y: 352 },
      ],
    },
    court: {
      scoreAlya: { x: 893, y: 362 },
      scoreTeacher: { x: 1012, y: 362 },
      scoreSize: 58,
      groundY: 722,
      alyaX: 330,
      teacherX: 1290,
      playerH: 340,
      alyaHit: { x: 445, y: 540 },
      teacherHit: { x: 1155, y: 540 },
      bounceY: 688,
      peakY: 300,
      bounceAlyaSide: 620,
      bounceTeacherSide: 1000,
      card: { x: 470, y: 430, w: 660, h: 455 },
    },
    toyShop: {
      zones: {
        shelf: { x: 268, y: 418, w: 232, h: 100 },
        counter: { x: 520, y: 392, w: 620, h: 82 },
        rug: { x: 520, y: 700, w: 580, h: 150 },
      },
      tray: { x: 1180, y: 250, w: 380, h: 470 },
      spots: {
        kite: [150, 470, 170],
        doll: [250, 650, 150],
        monster: [640, 810, 170],
        plane: [640, 478, 115],
        'computer-game': [880, 478, 95],
        train: [840, 860, 120],
        car: [1060, 835, 105],
        ball: [430, 880, 105],
        bike: [1240, 890, 165],
        'go-kart': [1470, 890, 135],
      },
    },
  },
  p: {
    map: {
      // bottom of the winding path up to the school door
      markers: [
        { x: 470, y: 1420 },
        { x: 175, y: 1060 },
        { x: 640, y: 960 },
        { x: 330, y: 778 },
        { x: 480, y: 640 },
      ],
    },
    court: {
      scoreAlya: { x: 470, y: 744 },
      scoreTeacher: { x: 550, y: 744 },
      scoreSize: 40,
      groundY: 1012,
      alyaX: 185,
      teacherX: 715,
      playerH: 270,
      alyaHit: { x: 278, y: 892 },
      teacherHit: { x: 622, y: 892 },
      bounceY: 975,
      peakY: 785,
      bounceAlyaSide: 330,
      bounceTeacherSide: 590,
      card: { x: 40, y: 1060, w: 820, h: 520 },
    },
    toyShop: {
      zones: {
        shelf: { x: 125, y: 765, w: 145, h: 100 },
        counter: { x: 270, y: 780, w: 360, h: 80 },
        rug: { x: 225, y: 1040, w: 420, h: 150 },
      },
      tray: { x: 40, y: 1230, w: 820, h: 340 },
      spots: {
        kite: [95, 660, 130],
        doll: [135, 1000, 115],
        monster: [300, 1155, 135],
        plane: [585, 842, 82],
        'computer-game': [445, 1160, 72],
        train: [575, 1168, 92],
        car: [430, 1335, 100],
        ball: [235, 1300, 100],
        bike: [660, 1370, 150],
        'go-kart': [440, 1530, 120],
      },
    },
  },
}

/** Everything worth preloading, by screen. */
export const PRELOAD = [
  ...Object.values(BG).flatMap((b) => [b.l, b.p]),
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
