export const W = 960
export const H = 540

export const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h))
}
