import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { BG, SCENE, type BgKey } from '../assets/manifest'

/**
 * The game is laid out on a fixed stage that is scaled (never stretched) to fit the window:
 *  - landscape screens (computer, tablet sideways, phone sideways): 1600 x 900
 *  - portrait screens (phone, tablet upright):                       900 x 1600
 * Each scene has a matching 16:9 / 9:16 background, and every overlay uses stage pixels for
 * the current orientation, so markers, characters and scores stay aligned with the artwork.
 * Any space left around the stage is filled with a blurred copy of the current background.
 */
export interface StageInfo {
  scale: number
  portrait: boolean
  W: number
  H: number
  setAmbient: (src: string) => void
}
const StageCtx = createContext<StageInfo>({ scale: 1, portrait: false, W: 1600, H: 900, setAmbient: () => {} })
export const useStage = () => useContext(StageCtx)

function measure() {
  const w = window.innerWidth
  const h = window.innerHeight
  const portrait = h > w
  const W = portrait ? 900 : 1600
  const H = portrait ? 1600 : 900
  return { w, h, portrait, W, H, scale: Math.min(w / W, h / H) }
}

export function Stage({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const [box, setBox] = useState(measure)
  const [ambient, setAmbient] = useState<string>('')
  useEffect(() => {
    const fit = () => setBox(measure())
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    window.visualViewport?.addEventListener('resize', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
      window.visualViewport?.removeEventListener('resize', fit)
    }
  }, [])
  const { W, H, scale } = box
  return (
    <StageCtx.Provider value={{ scale, portrait: box.portrait, W, H, setAmbient }}>
      <div
        style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 40%, #2f6d70, #163c3f)', overflow: 'clip' }}
        // the unscaled stage is larger than the window; never let focus or touch scroll this box
        onScroll={(e) => {
          e.currentTarget.scrollLeft = 0
          e.currentTarget.scrollTop = 0
        }}
      >
        {ambient && (
          <img
            src={ambient}
            alt=""
            aria-hidden
            style={{ position: 'absolute', inset: -40, width: 'calc(100% + 80px)', height: 'calc(100% + 80px)', objectFit: 'cover', filter: 'blur(22px) brightness(0.85)', opacity: 0.9 }}
          />
        )}
        <div
          id="stage"
          className={reducedMotion ? 'reduced-motion' : ''}
          data-orientation={box.portrait ? 'portrait' : 'landscape'}
          style={{
            width: W,
            height: H,
            position: 'absolute',
            left: (box.w - W * scale) / 2,
            top: (box.h - H * scale) / 2,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            overflow: 'hidden',
            background: '#fff7e8',
            boxShadow: '0 0 40px rgba(0,0,0,0.35)',
          }}
        >
          {children}
        </div>
      </div>
    </StageCtx.Provider>
  )
}

/** Full-stage background: the 16:9 or 9:16 version of the scene, matching the orientation. */
export function Backdrop({ bg, dim = 0, blur = 0 }: { bg: BgKey; dim?: number; blur?: number }) {
  const { portrait, setAmbient } = useStage()
  const src = portrait ? BG[bg].p : BG[bg].l
  useEffect(() => setAmbient(src), [src, setAmbient])
  return (
    <>
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: blur ? `blur(${blur}px)` : undefined, transform: blur ? 'scale(1.03)' : undefined }}
      />
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(255,247,232,${dim})` }} />}
    </>
  )
}

/** Pick a value for the current orientation. */
export function usePick() {
  const { portrait } = useStage()
  return <T,>(landscape: T, portraitValue: T): T => (portrait ? portraitValue : landscape)
}

/** Scene coordinates for the current orientation. */
export function useScene() {
  const { portrait } = useStage()
  return portrait ? SCENE.p : SCENE.l
}
