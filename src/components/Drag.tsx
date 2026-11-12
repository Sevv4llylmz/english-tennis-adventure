import { createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useStage } from './Stage'
import { sfx } from '../audio/sfx'

/**
 * Drag-and-drop that works with mouse, touch and pen, inside the scaled stage.
 * Tap alternative: tap an item (it lifts), then tap a drop zone.
 * onDrop returns true if the drop is accepted; otherwise the item glides back.
 */
interface Ctx {
  selected: string | null
  active: string | null
  select: (id: string | null) => void
  setActive: (id: string | null) => void
  drop: (item: string, target: string) => boolean
}
const DragCtx = createContext<Ctx | null>(null)

export function DragArea({ onDrop, children }: { onDrop: (item: string, target: string) => boolean; children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const ctx: Ctx = {
    selected,
    active,
    select: (id) => setSelected(id),
    setActive,
    drop: (item, target) => {
      const ok = onDrop(item, target)
      setSelected(null)
      return ok
    },
  }
  return <DragCtx.Provider value={ctx}>{children}</DragCtx.Provider>
}

export function Draggable({
  id,
  children,
  style,
  className,
  disabled,
  label,
}: {
  id: string
  children: ReactNode
  style?: CSSProperties
  className?: string
  disabled?: boolean
  label?: string
}) {
  const ctx = useContext(DragCtx)!
  const { scale } = useStage()
  const ref = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const [off, setOff] = useState({ x: 0, y: 0, anim: false })
  const lifted = ctx.selected === id || ctx.active === id

  function onDown(e: React.PointerEvent) {
    if (disabled) return
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, moved: false }
    // safety net: finish the drag even if this element misses the pointerup
    const onWinUp = (ev: PointerEvent) => finish(ev.clientX, ev.clientY)
    window.addEventListener('pointerup', onWinUp, { once: true })
  }
  function onMove(e: React.PointerEvent) {
    const s = start.current
    if (!s) return
    const dx = (e.clientX - s.x) / scale
    const dy = (e.clientY - s.y) / scale
    if (!s.moved && Math.hypot(dx, dy) > 8) {
      s.moved = true
      ctx.setActive(id)
      ctx.select(null)
    }
    if (s.moved) setOff({ x: dx, y: dy, anim: false })
  }
  function finish(clientX: number, clientY: number) {
    const s = start.current
    start.current = null
    if (!s) return
    if (!s.moved) {
      sfx.click()
      ctx.select(ctx.selected === id ? null : id)
      return
    }
    ctx.setActive(null)
    const el = ref.current
    if (el) el.style.pointerEvents = 'none'
    const hit = document.elementFromPoint(clientX, clientY)?.closest('[data-drop]') as HTMLElement | null
    if (el) el.style.pointerEvents = ''
    const ok = hit ? ctx.drop(id, hit.dataset.drop!) : false
    setOff({ x: 0, y: 0, anim: !ok })
  }
  function onUp(e: React.PointerEvent) {
    finish(e.clientX, e.clientY)
  }
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label ?? id}
      aria-pressed={ctx.selected === id}
      className={className}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        start.current = null
        ctx.setActive(null)
        setOff({ x: 0, y: 0, anim: true })
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') ctx.select(ctx.selected === id ? null : id)
      }}
      style={{
        touchAction: 'none',
        cursor: disabled ? 'default' : lifted ? 'grabbing' : 'grab',
        transform: `translate(${off.x}px, ${off.y}px) scale(${lifted ? 1.1 : 1})`,
        transition: off.anim ? 'transform 0.35s cubic-bezier(.3,1.4,.5,1)' : lifted && off.x === 0 ? 'transform 0.15s' : 'none',
        filter: lifted ? 'drop-shadow(0 14px 12px rgba(0,0,0,0.3))' : undefined,
        zIndex: lifted ? 50 : undefined,
        outline: ctx.selected === id ? '5px dashed #f7d77b' : undefined,
        outlineOffset: 6,
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function DropZone({
  id,
  children,
  style,
  className,
  label,
}: {
  id: string
  children?: ReactNode
  style?: CSSProperties
  className?: string
  label?: string
}) {
  const ctx = useContext(DragCtx)!
  const armed = !!(ctx.selected || ctx.active)
  return (
    <div
      data-drop={id}
      role="button"
      aria-label={label ?? id}
      tabIndex={armed ? 0 : -1}
      className={className}
      onClick={() => {
        if (ctx.selected) ctx.drop(ctx.selected, id)
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && ctx.selected) ctx.drop(ctx.selected, id)
      }}
      style={{
        transition: 'box-shadow 0.2s, background 0.2s',
        boxShadow: armed ? '0 0 0 6px rgba(247,215,123,0.85), 0 0 30px rgba(247,215,123,0.6)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
