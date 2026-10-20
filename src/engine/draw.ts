// 도트풍 탑다운 그림 도구. 3D 대신 "윗면 + 앞면" 두 면으로 큐브 느낌을 낸다.
import type { Theme } from '../lib/stages'

export const W = 960
export const H = 540

export const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h))
}

/** 결정적인 해시 난수(0~1) */
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

export function cube(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, depth: number, top: string, side?: string) {
  rect(ctx, x, y + h, w, depth, side ?? shade(top, 0.62))
  rect(ctx, x, y, w, h, top)
  rect(ctx, x, y, w, 3, shade(top, 1.15))
}

export function tree(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, color = '#4cae4f') {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath(); ctx.ellipse(x + 20 * s, y + 52 * s, 26 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill()
  rect(ctx, x + 15 * s, y + 30 * s, 10 * s, 22 * s, '#7a4b25')
  cube(ctx, x, y, 40 * s, 30 * s, 12 * s, color)
  cube(ctx, x + 8 * s, y - 14 * s, 24 * s, 16 * s, 8 * s, shade(color, 1.1))
}

export function rock(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, color = '#8d9097') {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath(); ctx.ellipse(x + 20 * s, y + 24 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill()
  cube(ctx, x, y, 38 * s, 16 * s, 10 * s, color)
  cube(ctx, x + 8 * s, y - 8 * s, 20 * s, 10 * s, 6 * s, shade(color, 1.08))
}

export function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, top: string, side = '#8a5a34') {
  cube(ctx, x, y, w, h, 18, top, side)
  rect(ctx, x, y + h + 14, w, 4, shade(side, 0.8))
}

interface GroundDef { a: string; b: string; deco: string; accent: string }
const GROUNDS: Record<Theme, GroundDef> = {
  beach: { a: '#8fdc6a', b: '#86d262', deco: '#6fbf4e', accent: '#ffe78a' },
  forest: { a: '#7fd35e', b: '#76c957', deco: '#58a845', accent: '#ff9ec7' },
  cave: { a: '#7b7396', b: '#726a8e', deco: '#5d5678', accent: '#b9a8ff' },
  gorge: { a: '#c9b98e', b: '#c0b084', deco: '#a99a72', accent: '#fff08a' },
  volcano: { a: '#6e4a44', b: '#654039', deco: '#4d302b', accent: '#ff8a3d' },
  altar: { a: '#7a6fb8', b: '#7266b0', deco: '#5f549c', accent: '#fff6a8' },
}

/** 전투 바닥: 체크무늬 잔디 + 노란 길 + 웅덩이 + 큐브 나무/바위가 가로로 스크롤 */
export function drawGround(ctx: CanvasRenderingContext2D, theme: Theme, scroll: number, t: number) {
  const g = GROUNDS[theme]
  const T = 60
  rect(ctx, 0, 0, W, H, g.a)
  const off = -(((scroll % T) + T) % T)
  const col0 = Math.floor(scroll / T)
  for (let ci = -1; ci <= W / T + 1; ci++) {
    const wx = col0 + ci
    const x = off + ci * T
    for (let r = 0; r < H / T + 1; r++) {
      if ((wx + r) % 2) rect(ctx, x, r * T, T, T, g.b)
      const h = hash(wx, r, 7)
      if (h > 0.82) rect(ctx, x + 10 + h * 20, r * T + 12, 6, 4, g.deco)
      if (h < 0.05) { rect(ctx, x + 22, r * T + 30, 4, 4, g.accent); rect(ctx, x + 26, r * T + 26, 4, 4, '#fff') }
    }
  }
  // 노란 길(삼각 타일)
  const sx = 240
  const px = off + (Math.floor((scroll + sx) / 240) * 240 - scroll)
  void px
  const pathStep = 300
  const poff = -(((scroll * 1) % pathStep) + pathStep) % pathStep
  for (let i = -1; i < W / pathStep + 2; i++) {
    const wx = Math.floor(scroll / pathStep) + i
    const x = poff + i * pathStep
    if (hash(wx, 3) > 0.35) {
      const y = 250 + hash(wx, 4) * 120
      ctx.fillStyle = theme === 'cave' || theme === 'altar' ? '#9a90c8' : theme === 'volcano' ? '#8a5a3a' : '#f3d98a'
      ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + 200, y + 16); ctx.lineTo(x + 130, y + 80); ctx.lineTo(x - 10, y + 60); ctx.closePath(); ctx.fill()
    }
  }
  // 웅덩이 / 용암 / 물
  const pondStep = 520
  const pooff = -(((scroll * 1) % pondStep) + pondStep) % pondStep
  for (let i = -1; i < W / pondStep + 2; i++) {
    const wx = Math.floor(scroll / pondStep) + i
    if (hash(wx, 9) > 0.45) {
      const x = pooff + i * pondStep + 120
      const y = hash(wx, 10) > 0.5 ? 70 : 470
      const water = theme === 'volcano' ? '#ff6a2a' : theme === 'cave' ? '#4a6fb0' : '#46b8f0'
      rect(ctx, x - 4, y - 4, 188, 76, shade(water, 0.8))
      rect(ctx, x, y, 180, 68, water)
      if (Math.sin(t * 2 + wx) > 0) rect(ctx, x + 20, y + 20, 40, 4, 'rgba(255,255,255,0.55)')
    }
  }
  // 큐브 나무/바위/블록 (위·아래 띠에만 놓아 전투를 가리지 않게)
  const decoStep = 150
  const doff = -(((scroll * 1) % decoStep) + decoStep) % decoStep
  for (let i = -1; i < W / decoStep + 2; i++) {
    const wx = Math.floor(scroll / decoStep) + i
    const x = doff + i * decoStep
    for (const [band, y0] of [[0, 20], [1, 478]] as const) {
      const h = hash(wx, band, 21)
      if (h > 0.62) continue
      const y = y0 + hash(wx, band, 5) * 20
      const bx = x + hash(wx, band, 6) * 60
      if (h < 0.22) {
        if (theme === 'cave') block(ctx, bx, y, 70, 30, '#6d6595', '#4a4470')
        else if (theme === 'altar') cube(ctx, bx, y - 10, 24, 40, 14, '#a99cf0')
        else if (theme === 'volcano') rock(ctx, bx, y + 10, 1.2, '#7a4a40')
        else if (theme === 'gorge') block(ctx, bx, y, 80, 34, '#b8a878', '#8a7a52')
        else block(ctx, bx, y, 80, 34, '#6fcf4c', '#8a5a34')
      } else if (h < 0.42) {
        if (theme === 'cave' || theme === 'altar') rock(ctx, bx, y + 20, 1, '#9a92c0')
        else if (theme === 'volcano') rock(ctx, bx, y + 20, 1, '#5a3a34')
        else tree(ctx, bx, y, 1, theme === 'beach' ? '#3fae5a' : '#3f9a47')
      } else {
        rock(ctx, bx, y + 24, 0.9)
      }
    }
  }
  if (theme === 'beach') { rect(ctx, 0, 0, W, 34, '#4fb6ee'); for (let i = 0; i < 12; i++) rect(ctx, ((i * 97 + scroll * 0.4) % (W + 60)) - 30, 8 + (i % 3) * 8, 28, 3, 'rgba(255,255,255,0.7)') }
  if (theme === 'volcano' || theme === 'altar' || theme === 'cave') {
    for (let i = 0; i < 16; i++) {
      const x = (i * 131 + scroll * 0.2) % W
      const y = theme === 'volcano' ? H - ((t * 24 + i * 47) % H) : (i * 71) % H
      if (Math.sin(t * 3 + i) > -0.3) rect(ctx, x, y, 3, 3, g.accent)
    }
  }
  if (theme === 'gorge' && Math.sin(t * 1.1) > 0.985) rect(ctx, 0, 0, W, H, 'rgba(255,255,200,0.3)')
}
