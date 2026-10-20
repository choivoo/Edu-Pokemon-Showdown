// 코드로 점(도트)을 직접 찍는 작은 픽셀 그래픽 도구. 이미지 파일·이모지를 쓰지 않는다.
export class Pix {
  readonly c: HTMLCanvasElement
  readonly g: CanvasRenderingContext2D
  constructor(readonly w: number, readonly h: number) {
    this.c = document.createElement('canvas')
    this.c.width = w
    this.c.height = h
    this.g = this.c.getContext('2d')!
    this.g.imageSmoothingEnabled = false
  }
  dot(x: number, y: number, col: string) { this.g.fillStyle = col; this.g.fillRect(Math.floor(x), Math.floor(y), 1, 1); return this }
  rect(x: number, y: number, w: number, h: number, col: string) { this.g.fillStyle = col; this.g.fillRect(Math.floor(x), Math.floor(y), w, h); return this }
  clear(x: number, y: number, w = 1, h = 1) { this.g.clearRect(Math.floor(x), Math.floor(y), w, h); return this }
  line(x0: number, y0: number, x1: number, y1: number, col: string) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.dot(x0, y0, col)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) { err += dy; x0 += sx }
      if (e2 <= dx) { err += dx; y0 += sy }
    }
    return this
  }
  disc(cx: number, cy: number, r: number, col: string) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.dot(cx + x, cy + y, col)
    return this
  }
  erase(cx: number, cy: number, r: number) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.clear(cx + x, cy + y)
    return this
  }
  /** 가로로 납작한 타원 */
  oval(cx: number, cy: number, rx: number, ry: number, col: string) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) this.dot(cx + x, cy + y, col)
    return this
  }
  blit(src: CanvasImageSource, x: number, y: number, flip = false) {
    if (!flip) this.g.drawImage(src, Math.floor(x), Math.floor(y))
    else {
      const w = (src as HTMLCanvasElement).width
      this.g.save(); this.g.translate(Math.floor(x) + w, Math.floor(y)); this.g.scale(-1, 1); this.g.drawImage(src, 0, 0); this.g.restore()
    }
    return this
  }
  /** 글자 그림(ASCII 아트) 찍기. '.' 과 ' ' 는 투명 */
  rows(x: number, y: number, rows: string[], pal: Record<string, string>) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && ch !== ' ' && pal[ch]) this.dot(x + i, y + j, pal[ch]) }))
    return this
  }
  /** 칠해진 점 바깥에 1점짜리 윤곽선을 두른다 */
  outline(col: string) {
    const { w, h } = this
    const src = this.g.getImageData(0, 0, w, h)
    const a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3])
    this.g.fillStyle = col
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (a(x, y) > 0) continue
      if (a(x - 1, y) > 0 || a(x + 1, y) > 0 || a(x, y - 1) > 0 || a(x, y + 1) > 0) this.g.fillRect(x, y, 1, 1)
    }
    return this
  }
}

export const make = (w: number, h: number, draw: (p: Pix) => void): HTMLCanvasElement => {
  const p = new Pix(w, h)
  draw(p)
  return p.c
}

/** 결정적 난수(0~1). 같은 입력이면 항상 같은 값 → 맵 장식이 매번 같은 자리에 나온다 */
export function hash(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  h = h ^ (h >>> 16)
  return ((h >>> 0) % 10007) / 10007
}

export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)))
  return '#' + [16, 8, 0].map(sh => c(sh).toString(16).padStart(2, '0')).join('')
}

export const INK = '#2b2838'
