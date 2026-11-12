import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { STAGE_H, STAGE_W } from '../assets/manifest'

/**
 * The game is laid out on a fixed 1600x900 stage that is scaled (never stretched) to fit
 * the window. Every overlay uses stage pixels, so markers, characters and score numbers
 * stay aligned with the artwork at any window size.
 */
const StageCtx = createContext({ scale: 1 })
export const useStage = () => useContext(StageCtx)

export function Stage({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const [box, setBox] = useState({ scale: 1, w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setBox({ scale: Math.min(w / STAGE_W, h / STAGE_H), w, h })
    }
    fit()
    window.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('resize', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('resize', fit)
    }
  }, [])
  const portrait = box.h > box.w * 1.15 && box.w < 900
  return (
    <StageCtx.Provider value={{ scale: box.scale }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 40%, #2f6d70, #163c3f)' }}>
        <div
          id="stage"
          className={reducedMotion ? 'reduced-motion' : ''}
          style={{
            width: STAGE_W,
            height: STAGE_H,
            position: 'absolute',
            left: (box.w - STAGE_W * box.scale) / 2,
            top: (box.h - STAGE_H * box.scale) / 2,
            transform: `scale(${box.scale})`,
            transformOrigin: '0 0',
            overflow: 'hidden',
            borderRadius: box.scale < 0.98 ? 0 : 24,
            background: '#fff7e8',
          }}
        >
          {children}
        </div>
        {portrait && (
          <div style={{ pointerEvents: 'none', position: 'absolute', bottom: 12, left: 12, right: 12, borderRadius: 16, background: 'rgba(255,255,255,0.92)', padding: '8px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#245d61' }}>
            Turn your tablet sideways for a bigger game! · Daha büyük oyun için cihazı yan çevir!
          </div>
        )}
      </div>
    </StageCtx.Provider>
  )
}

/** Full-stage background picture (16:9 artwork on a 16:9 stage – no distortion). */
export function Backdrop({ src, dim = 0, blur = 0 }: { src: string; dim?: number; blur?: number }) {
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
