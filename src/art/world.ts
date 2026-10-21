// 맵 전체를 코드로 찍은 도트로 그린다. 3px 크기의 "점" 위에 타일(16x16 점)과 오브젝트를 배치한다.
import type { Theme } from '../lib/stages'
import { hash, INK, make, type Pix, Pix as PixClass, shade } from './px'

export const DOT = 3
export const ENV_W = 320
export const ENV_H = 180
export const TILE = 16

interface Pal { a: string; b: string; tuft: string; light: string; flower: string; path: string; pathDk: string; water: string; waterLt: string; sky: string }
const PAL: Record<Theme, Pal> = {
  beach: { a: '#f0dc9c', b: '#e8d08c', tuft: '#d8bc6c', light: '#fff2c0', flower: '#ff9ec7', path: '#d8c07c', pathDk: '#c4a860', water: '#3fb2ee', waterLt: '#b8ecff', sky: '#6ec8ff' },
  forest: { a: '#82d65e', b: '#78cc56', tuft: '#56a844', light: '#a6ec7c', flower: '#ff9ec7', path: '#f0d98a', pathDk: '#d9bf66', water: '#46b8f0', waterLt: '#b8ecff', sky: '#9bd8a4' },
  cave: { a: '#7a7296', b: '#726a8e', tuft: '#5a5276', light: '#9a90b8', flower: '#b8a8ff', path: '#968cb6', pathDk: '#7e749e', water: '#3a5fb0', waterLt: '#8ab0ff', sky: '#1a1830' },
  gorge: { a: '#cbb98c', b: '#c2b080', tuft: '#a89868', light: '#e6d6a8', flower: '#fff08a', path: '#a08e68', pathDk: '#8a7a58', water: '#4aa6e0', waterLt: '#b8e6ff', sky: '#8a8fc0' },
  volcano: { a: '#6e4a44', b: '#654039', tuft: '#4d302b', light: '#8a6258', flower: '#ff8a3d', path: '#8a5e50', pathDk: '#744a3e', water: '#ff6a2a', waterLt: '#ffd05a', sky: '#4a1a1a' },
  altar: { a: '#7a6fb8', b: '#7266b0', tuft: '#5a4f98', light: '#a99cf0', flower: '#fff6a8', path: '#9a8ed0', pathDk: '#8478bc', water: '#5a7ae8', waterLt: '#c0d0ff', sky: '#0b0b2a' },
}

// ---------- 타일 ----------
const tileCache = new Map<string, HTMLCanvasElement>()
const cached = (key: string, w: number, h: number, draw: (p: Pix) => void) => {
  let c = tileCache.get(key)
  if (!c) { c = make(w, h, draw); tileCache.set(key, c) }
  return c
}

function floorTile(theme: Theme, kind: number): HTMLCanvasElement {
  return cached(`floor-${theme}-${kind}`, TILE, TILE, p => {
    const pal = PAL[theme]
    p.rect(0, 0, TILE, TILE, kind % 2 ? pal.b : pal.a)
    const r = (i: number) => hash(kind * 31 + i, theme.length, 5)
    // 잔디 포기(작은 v 모양)
    for (let i = 0; i < 3; i++) {
      const x = 1 + Math.floor(r(i) * 12), y = 2 + Math.floor(r(i + 9) * 12)
      p.dot(x, y, pal.tuft).dot(x + 1, y - 1, pal.tuft).dot(x + 2, y, pal.tuft)
    }
    for (let i = 0; i < 4; i++) p.dot(Math.floor(r(i + 20) * 16), Math.floor(r(i + 30) * 16), pal.light)
    if (kind >= 4) {
      // 꽃 / 반짝이
      const x = 3 + Math.floor(r(50) * 9), y = 3 + Math.floor(r(51) * 9)
      p.dot(x, y, pal.flower).dot(x + 1, y, pal.flower).dot(x, y + 1, '#ffffff').dot(x - 1, y, '#ffffff').dot(x, y - 1, '#ffffff')
    }
  })
}

function pathTile(theme: Theme, kind: number): HTMLCanvasElement {
  return cached(`path-${theme}-${kind}`, TILE, TILE, p => {
    const pal = PAL[theme]
    p.rect(0, 0, TILE, TILE, pal.path)
    for (let i = 0; i < 9; i++) p.dot(Math.floor(hash(i, kind, 3) * 16), Math.floor(hash(i, kind, 4) * 16), pal.pathDk)
    for (let i = 0; i < 4; i++) p.dot(Math.floor(hash(i, kind, 8) * 16), Math.floor(hash(i, kind, 9) * 16), '#ffffff55')
  })
}

function waterTile(theme: Theme, frame: number): HTMLCanvasElement {
  return cached(`water-${theme}-${frame}`, TILE, TILE, p => {
    const pal = PAL[theme]
    p.rect(0, 0, TILE, TILE, pal.water)
    p.rect(0, 0, TILE, TILE, shade(pal.water, 1))
    for (let row = 0; row < 4; row++) {
      const y = row * 4 + 1
      const off = (frame * 2 + row * 5) % 16
      for (let x = 0; x < 5; x++) p.dot((off + x) % 16, y, pal.waterLt)
    }
  })
}

// ---------- 오브젝트(점으로 찍은 큐브풍 그림) ----------
function tree(theme: Theme, variant: number): HTMLCanvasElement {
  return cached(`tree-${theme}-${variant}`, 30, 38, p => {
    const dark = theme === 'volcano' ? '#8a3a2a' : theme === 'cave' || theme === 'altar' ? '#6a5ab0' : theme === 'beach' ? '#2f9a4a' : '#2f8a3a'
    const mid = shade(dark, 1.25), light = shade(dark, 1.55)
    p.oval(15, 36, 12, 2, '#00000030')
    if (theme === 'beach') {
      // 야자수
      for (let i = 0; i < 24; i++) p.rect(14 + Math.floor(Math.sin(i / 5) * 2), 35 - i, 3, 1, i % 4 < 2 ? '#a0703c' : '#8a5a2c')
      const lx = 15, ly = 11
      for (const [dx, dy] of [[-10, 2], [10, 2], [-7, -4], [7, -4], [0, -7], [-12, 7], [12, 7]]) {
        p.line(lx, ly, lx + dx, ly + dy, mid); p.line(lx, ly + 1, lx + dx, ly + dy + 1, dark); p.line(lx, ly - 1, lx + dx, ly + dy - 1, light)
      }
      p.disc(15, 12, 2, '#8a5a2c')
    } else if (theme === 'cave' || theme === 'altar') {
      // 수정 무더기
      const c1 = theme === 'altar' ? '#c8b8ff' : '#9a8cff'
      for (const [x, h, w] of [[8, 22, 6], [15, 30, 7], [22, 18, 5]]) {
        p.rect(x - w / 2, 36 - h, w, h, c1).rect(x - w / 2, 36 - h, 2, h, '#e8e0ff').rect(x + w / 2 - 2, 36 - h, 2, h, shade(c1, 0.7))
        p.rect(x - w / 2 + 1, 35 - h, w - 2, 1, '#ffffff')
      }
    } else if (variant % 2 === 0) {
      // 큐브 나무
      p.rect(12, 24, 6, 12, '#7a4b25').rect(12, 24, 2, 12, '#9a6035')
      p.rect(4, 6, 22, 18, dark).rect(4, 6, 22, 3, light).rect(4, 6, 2, 18, mid).rect(24, 6, 2, 18, shade(dark, 0.8))
      p.rect(8, 0, 14, 8, mid).rect(8, 0, 14, 2, light).rect(8, 0, 2, 8, light)
      for (let i = 0; i < 6; i++) p.dot(7 + Math.floor(hash(i, variant, 2) * 16), 10 + Math.floor(hash(i, variant, 3) * 12), light)
    } else {
      // 전나무 (층층이 삼각)
      p.rect(13, 28, 4, 8, '#7a4b25')
      for (let i = 0; i < 3; i++) {
        const y = 4 + i * 8, w = 8 + i * 5
        for (let r = 0; r < 10; r++) { const hw = Math.floor((w * (r + 1)) / 10 / 1); p.rect(15 - hw / 2, y + r, hw, 1, r < 2 ? light : r % 3 ? mid : dark) }
      }
    }
    p.outline(INK)
  })
}

function rock(theme: Theme, variant: number): HTMLCanvasElement {
  return cached(`rock-${theme}-${variant}`, 22, 16, p => {
    const base = theme === 'volcano' ? '#7a4a40' : theme === 'cave' || theme === 'altar' ? '#9a92c0' : theme === 'beach' ? '#c8c2b0' : '#9da0a8'
    p.oval(11, 14, 10, 2, '#00000030')
    p.rect(2, 4, 18, 9, base).rect(2, 4, 18, 2, shade(base, 1.2)).rect(2, 11, 18, 2, shade(base, 0.7))
    p.rect(6, 0, 10, 5, shade(base, 1.1)).rect(6, 0, 10, 1, shade(base, 1.3))
    p.dot(5 + (variant % 3), 8, shade(base, 0.8)).dot(12, 7, shade(base, 0.8)).dot(15, 9, shade(base, 1.3))
    p.outline(INK)
  })
}

function cliff(theme: Theme, w: number): HTMLCanvasElement {
  return cached(`cliff-${theme}-${w}`, w, 26, p => {
    const top = theme === 'cave' ? '#6d6595' : theme === 'volcano' ? '#8a5a4a' : theme === 'gorge' ? '#c8b880' : theme === 'altar' ? '#8a7ed0' : theme === 'beach' ? '#7bd04a' : '#6fcf4c'
    const side = theme === 'cave' ? '#4a4470' : theme === 'volcano' ? '#5a3228' : theme === 'gorge' ? '#8a7a52' : theme === 'altar' ? '#5f549c' : '#8a5a34'
    p.rect(0, 0, w, 14, top).rect(0, 0, w, 2, shade(top, 1.2))
    p.rect(0, 14, w, 10, side)
    for (let x = 2; x < w; x += 6) p.rect(x, 15, 2, 8 - (x % 3), shade(side, 0.82))
    p.rect(0, 22, w, 2, shade(side, 0.7))
    for (let i = 0; i < w / 5; i++) p.dot(Math.floor(hash(i, w, 1) * w), 2 + Math.floor(hash(i, w, 2) * 10), shade(top, 0.85))
    p.outline(INK)
  })
}

// ---------- 화면(점 도화지) ----------
const screen = new PixClass(ENV_W, ENV_H)
export const envCanvas = screen.c

/** 점 도화지를 실제 화면에 3배로 확대해 붙인다 (부드럽게 뭉개지지 않음) */
export function flush(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(screen.c, 0, 0, ENV_W * DOT, ENV_H * DOT)
}

const drawObj = (c: HTMLCanvasElement, x: number, y: number) => screen.g.drawImage(c, Math.floor(x), Math.floor(y))

/** 전투 바닥. scroll 은 화면 픽셀 단위 가로 이동량 */
export function drawBattleWorld(theme: Theme, scroll: number, t: number, depthScroll = 0) {
  const pal = PAL[theme]
  const sd = Math.floor(scroll / DOT)
  const col0 = Math.floor(sd / TILE)
  const ox = -(((sd % TILE) + TILE) % TILE)
  const vertical = Math.floor(depthScroll / DOT)
  const row0 = Math.floor(vertical / TILE)
  const oy = -(((vertical % TILE) + TILE) % TILE)
  const frame = Math.floor(t * 2) % 4
  const g = screen.g
  g.fillStyle = pal.a
  g.fillRect(0, 0, ENV_W, ENV_H)

  // 바닥 타일
  for (let ty = -1; ty <= Math.ceil(ENV_H / TILE); ty++) {
    for (let tx = -1; tx <= ENV_W / TILE + 1; tx++) {
      const wc = col0 + tx
      const wy=row0+ty
      const h = hash(wc, wy, 7)
      const kind = (wc + wy) % 2 === 0 ? (h > 0.9 ? 4 : h > 0.5 ? 2 : 0) : h > 0.9 ? 5 : h > 0.5 ? 3 : 1
      drawObj(floorTile(theme, kind), ox + tx * TILE, oy + ty * TILE)
    }
  }
  // 길(타원 모양으로 타일 덮기)
  const cw = 6, ch = 3
  for (let cx = Math.floor(sd / (cw * TILE)) - 1; cx <= Math.floor((sd + ENV_W) / (cw * TILE)) + 1; cx++) {
    for (let cy = 1; cy < 3; cy++) {
      if (hash(cx, cy, 11) < 0.72) continue
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
        const nx = (i - (cw - 1) / 2) / (cw / 2), ny = (j - (ch - 1) / 2) / (ch / 2)
        if (nx * nx + ny * ny > 0.62) continue
        drawObj(pathTile(theme, (i + j) % 3), cx * cw * TILE + i * TILE - sd, (cy * 3 + j) * TILE - 8)
      }
    }
  }
  // 웅덩이 (위·아래 띠)
  for (let cx = Math.floor(sd / 220) - 1; cx <= Math.floor((sd + ENV_W) / 220) + 1; cx++) {
    if (hash(cx, 21) < 0.45) continue
    const top = hash(cx, 22) > 0.5
    const x = cx * 220 + 40 - sd, y = top ? 6 : 140
    const w = 5, h = 2
    g.fillStyle = INK; g.fillRect(x - 1, y - 1, w * TILE + 2, h * TILE + 2)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) drawObj(waterTile(theme, frame), x + i * TILE, y + j * TILE)
    g.fillStyle = pal.waterLt; g.fillRect(x, y, w * TILE, 1)
  }
  if (theme === 'beach') {
    for (let tx = -1; tx <= ENV_W / TILE + 1; tx++) for (let ty = 0; ty < 2; ty++) drawObj(waterTile(theme, frame), ox + tx * TILE, ty * TILE - 6)
    g.fillStyle = '#ffffff'
    for (let i = 0; i < 20; i++) g.fillRect(((i * 17 + sd + Math.floor(t * 8)) % (ENV_W + 20)) - 10, 24 + (i % 2), 6, 1)
  }

  // 큐브 나무 / 바위 / 절벽 (위·아래 띠에만 놓아 전투를 가리지 않는다)
  const step = 38
  for (let c = Math.floor(sd / step) - 2; c <= Math.floor((sd + ENV_W) / step) + 2; c++) {
    for (const band of [0, 1]) {
      const h = hash(c, band, 31)
      if (h > 0.66) continue
      const x = c * step - sd + hash(c, band, 6) * 14
      const y = band === 0 ? 0 + hash(c, band, 5) * 12 : 142 + hash(c, band, 5) * 12
      if (h < 0.18) drawObj(cliff(theme, 36 + Math.floor(hash(c, band, 8) * 3) * 6), x, band === 0 ? y + 2 : y + 8)
      else if (h < 0.4) drawObj(tree(theme, Math.floor(hash(c, band, 9) * 4)), x, y - (band === 0 ? 6 : 0))
      else drawObj(rock(theme, Math.floor(hash(c, band, 10) * 3)), x, band === 0 ? y + 14 : y + 18)
    }
  }
  // 반짝이는 점 (동굴/제단/화산/협곡)
  if (theme === 'altar' || theme === 'cave' || theme === 'volcano' || theme === 'gorge') {
    g.fillStyle = theme === 'volcano' ? '#ffb347' : theme === 'gorge' ? '#fff36b' : '#e8e0ff'
    for (let i = 0; i < 14; i++) {
      const x = (i * 47 + sd * 0.3) % ENV_W
      const y = theme === 'volcano' ? ENV_H - ((t * 9 + i * 19) % ENV_H) : (i * 29) % ENV_H
      if (Math.sin(t * 3 + i) > -0.3) g.fillRect(Math.floor(x), Math.floor(y), 1, 1)
    }
  }
  if (theme === 'gorge' && Math.sin(t * 1.1) > 0.985) { g.fillStyle = 'rgba(255,255,200,0.3)'; g.fillRect(0, 0, ENV_W, ENV_H) }
}

export { tree as treeObj, rock as rockObj, cliff as cliffObj, floorTile, pathTile, waterTile, PAL }
export const envPix = screen
