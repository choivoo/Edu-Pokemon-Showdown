import { type RefObject, useEffect } from 'react'

/** 캔버스에 매 프레임 그림을 그리는 훅. draw(ctx, 누적초, 경과초) */
export function useCanvas(ref: RefObject<HTMLCanvasElement | null>, draw: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void, deps: unknown[] = []) {
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      draw(ctx, now / 1000, dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
