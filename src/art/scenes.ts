// 캠프·섬 지도·항해·타이틀 장면. 전부 점으로 찍은 그림이며 이모지/이미지는 쓰지 않는다.
import { AREAS, type Theme } from '../lib/stages'
import { FAN_AREA_COUNT } from '../lib/originalCampaign'
import { drawBattleWorld, DOT, ENV_H, ENV_W, envPix, flush, PAL, pathTile, rockObj, TILE, treeObj, waterTile } from './world'
import { eachDot, textWidth } from './font'
import { hash, INK, make, shade } from './px'
import { frontSprite } from '../data/sprites'
import { sprite } from '../engine/render'
import { decorationById } from '../lib/decorations'

const W = ENV_W * DOT
const H = ENV_H * DOT
const obj = (c: HTMLCanvasElement, x: number, y: number) => envPix.g.drawImage(c, Math.floor(x), Math.floor(y))

// ---------- 요리 냄비 + 모닥불 (화면 좌표 POT 위치) ----------
export const POT = { x: 560, y: 190, w: 220, h: 170 }

const potCache = new Map<number, HTMLCanvasElement>()
function potSprite(frame: number, hot: boolean): HTMLCanvasElement {
  const key = frame + (hot ? 10 : 0)
  let c = potCache.get(key)
  if (c) return c
  c = make(64, 52, p => {
    // 장작과 불꽃
    p.rect(8, 44, 48, 5, '#6a4222').rect(8, 44, 48, 1, '#8a5a30').rect(14, 48, 36, 3, '#4a2c16')
    p.line(12, 46, 52, 42, '#7a4b25').line(12, 42, 52, 46, '#7a4b25')
    const fl = [[0, 6], [1, 9], [2, 7]][frame % 3]
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 9, h = fl[1] - Math.abs(2 - i) * 2 + ((frame + i) % 2)
      p.rect(x, 44 - h, 6, h, '#ff7a1a').rect(x + 1, 44 - h + 2, 4, h - 2, '#ffc23a').rect(x + 2, 44 - h + 4, 2, Math.max(1, h - 4), '#fff1a0')
    }
    // 냄비 몸통
    p.rect(8, 14, 48, 26, '#4e4e58').rect(8, 14, 48, 2, '#6a6a76').rect(8, 38, 48, 3, '#34343c')
    p.rect(10, 18, 4, 18, '#6a6a76').rect(52, 18, 3, 20, '#2e2e36')
    p.rect(4, 20, 6, 8, '#34343c').rect(54, 20, 6, 8, '#34343c')
    p.rect(12, 40, 6, 5, '#34343c').rect(46, 40, 6, 5, '#34343c')
    // 가장자리 + 끓는 수프
    p.oval(32, 14, 26, 7, '#34343c').oval(32, 14, 24, 6, '#262630')
    const stew = hot ? ['#ff9a2a', '#ffb347', '#ffd06a'] : ['#e8861a', '#f59a2a', '#ffc04a']
    p.oval(32, 14, 22, 5, stew[0]).oval(32, 13, 18, 3, stew[1])
    for (let i = 0; i < 6; i++) {
      const bx = 14 + Math.floor(hash(i, frame, 3) * 36), by = 11 + Math.floor(hash(i, frame, 4) * 6)
      p.dot(bx, by, stew[2]).dot(bx + 1, by, stew[2]).dot(bx, by - 1, '#fff1a0')
    }
    p.outline(INK)
  })
  potCache.set(key, c)
  return c
}

function steam(t: number, x: number, y: number, hot: boolean) {
  const g = envPix.g
  for (let i = 0; i < (hot ? 9 : 5); i++) {
    const k = (t * (hot ? 0.9 : 0.5) + i / (hot ? 9 : 5)) % 1
    g.fillStyle = `rgba(255,255,255,${(1 - k) * 0.85})`
    const px = x + Math.round(Math.sin(t * 2 + i * 2) * 3) + (i - 2) * 4
    const py = y - k * 26
    const s = 2 + Math.floor(k * 3)
    g.fillRect(Math.floor(px), Math.floor(py), s, s)
  }
}

/** 베이스캠프 바닥(점 도화지에 그린 뒤 3배 확대) + 냄비 */
export function drawCampWorld(t: number, cooking: boolean) {
  drawBattleWorld('forest', 0, t)
  const g = envPix.g
  const cx = (POT.x + POT.w / 2) / DOT, cy = (POT.y + POT.h / 2) / DOT
  // 냄비 둘레 노란 길 (마름모 모양으로 길 타일)
  for (let j = -4; j <= 4; j++) for (let i = -8; i <= 8; i++) {
    if (Math.abs(i) / 8 + Math.abs(j) / 4 <= 1) obj(pathTile('forest', (i + j + 20) % 3), Math.floor(cx / TILE) * TILE + i * TILE - 8, Math.floor(cy / TILE) * TILE + j * TILE + 4)
  }
  g.fillStyle = '#00000022'
  g.beginPath(); g.ellipse(cx, cy + 22, 30, 6, 0, 0, Math.PI * 2); g.fill()
  obj(potSprite(Math.floor(t * 6) % 3, cooking), cx - 32, cy - 24)
  steam(t, cx, cy - 10, cooking)
  // 캠프 소품: 울타리, 나무
  for (let i = 0; i < 6; i++) { g.fillStyle = '#8a5a34'; g.fillRect(20 + i * 10, 150, 3, 12); g.fillStyle = '#b07a44'; g.fillRect(20 + i * 10, 150, 3, 2) }
  g.fillStyle = '#8a5a34'; g.fillRect(20, 154, 53, 2); g.fillRect(20, 159, 53, 2)
  obj(treeObj('forest', 0), 6, 22); obj(treeObj('forest', 1), 276, 108); obj(rockObj('forest', 1), 250, 28)
}

/** 캠프: 도트 바닥 + 돌아다니는 동료(PokeAPI 스프라이트) */
export function drawCamp(ctx: CanvasRenderingContext2D, t: number, mons: number[], cooking: boolean, decorations: string[] = []) {
  drawCampWorld(t, cooking)
  flush(ctx)
  // Procedurally painted 2D furniture (no retail 3D art or sprites).
  const furnitureSpots = [{ x: 120, y: 270 }, { x: 310, y: 230 }, { x: 875, y: 275 }, { x: 925, y: 405 }, { x: 155, y: 475 }]
  decorations.slice(0, furnitureSpots.length).forEach((id, i) => {
    const decor = decorationById(id)
    if (!decor) return
    const { x, y } = furnitureSpots[i]
    ctx.fillStyle = '#272238'
    ctx.fillRect(x - 31, y + 8, 64, 12)
    ctx.fillStyle = decor.color
    ctx.fillRect(x - 25, y - 43, 50, 51)
    ctx.fillStyle = '#fff2ce'
    ctx.fillRect(x - 18, y - 36, 35, 8)
    ctx.fillRect(x - 18, y - 23, 22, 7)
    ctx.fillStyle = '#333042'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(decor.name, x, y + 35)
  })
  const list = mons.slice(0, 8)
  list.forEach((id, i) => {
    const ph = hash(id, i) * 6.28, sp = 0.18 + hash(i, 3) * 0.15
    const cx = 250 + (i % 4) * 90 + hash(i, 5) * 40, cy = 330 + (i >> 2) * 70
    const px = cx + Math.cos(t * sp + ph) * 90, py = cy + Math.sin(t * sp * 1.3 + ph) * 28
    const vx = -Math.sin(t * sp + ph)
    const img = sprite(frontSprite(id))
    const hop = Math.abs(Math.sin(t * 6 + i)) * 5
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(Math.floor(px - 24), Math.floor(py - 3), 48, 6)
    if (img.complete && img.naturalWidth) {
      ctx.save(); ctx.translate(Math.floor(px), Math.floor(py - hop))
      if (vx > 0) ctx.scale(-1, 1)
      ctx.drawImage(img, -48, -86, 96, 96)
      ctx.restore()
    }
  })
}

// ---------- 섬 지도 ----------
export const AREA_NODES = [
  { x: 150, y: 400 }, { x: 300, y: 290 }, { x: 440, y: 400 }, { x: 590, y: 280 }, { x: 740, y: 390 }, { x: 830, y: 190 },
]
export const ENDLESS_NODE = { x: 120, y: 170 }

const plateCache = new Map<string, HTMLCanvasElement>()
function plate(theme: Theme, w: number, h: number, mode: 'open' | 'locked' | 'gold'): HTMLCanvasElement {
  const key = `${theme}-${w}-${h}-${mode}`
  let c = plateCache.get(key)
  if (c) return c
  c = make(w, h + 12, p => {
    const pal = PAL[theme]
    const top = mode === 'gold' ? '#ffe27a' : pal.a
    // 윗면: 타일 무늬를 가장자리가 둥글게 깎인 모양으로 채운다
    for (let y = 0; y < h; y++) {
      const inset = y < 3 ? 3 - y : y > h - 4 ? y - (h - 4) : 0
      p.rect(inset * 2, y, w - inset * 4, 1, (Math.floor(y / 4) + 0) % 2 ? shade(top, 0.97) : top)
    }
    for (let i = 0; i < w / 3; i++) p.dot(6 + Math.floor(hash(i, w, 1) * (w - 12)), 4 + Math.floor(hash(i, w, 2) * (h - 8)), shade(top, 1.12))
    const side = mode === 'gold' ? '#b89a2a' : shade(pal.a, 0.55)
    for (let y = h; y < h + 10; y++) p.rect(6, y, w - 12, 1, y % 3 === 0 ? shade(side, 0.85) : side)
    p.rect(6, h, w - 12, 1, shade(side, 1.25))
    p.outline(INK)
    if (mode === 'locked') { p.g.globalCompositeOperation = 'source-atop'; p.g.fillStyle = 'rgba(110,116,134,0.72)'; p.g.fillRect(0, 0, w, h + 12) }
  })
  plateCache.set(key, c)
  return c
}

export function drawSea(t: number) {
  const frame = Math.floor(t * 2) % 4
  for (let ty = 0; ty < Math.ceil(ENV_H / TILE); ty++) for (let tx = 0; tx < ENV_W / TILE; tx++) obj(waterTile('beach', frame), tx * TILE, ty * TILE)
  const g = envPix.g
  g.fillStyle = '#ffffffaa'
  for (let i = 0; i < 18; i++) g.fillRect(((i * 53 + t * 6) % (ENV_W + 20)) - 10, 8 + ((i * 37) % (ENV_H - 16)), 5, 1)
}

/** 섬 탐험 지도 */
export function drawIsland(ctx: CanvasRenderingContext2D, t: number, unlocked: boolean[], endless = false) {
  drawSea(t)
  // 길(다리): 지역 사이를 모래 타일로 잇는다
  const pts = AREA_NODES.map(n => ({ x: n.x / DOT, y: n.y / DOT + 8 }))
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1]
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 9)
    for (let k = 0; k <= n; k++) obj(pathTile('beach', k % 3), a.x + ((b.x - a.x) * k) / n - 8, a.y + ((b.y - a.y) * k) / n - 8)
  }
  AREAS.slice(0, FAN_AREA_COUNT).forEach((a, i) => {
    const n = AREA_NODES[i]
    const x = n.x / DOT - 40, y = n.y / DOT - 20
    obj(plate(a.theme, 80, 34, unlocked[i] ? 'open' : 'locked'), x, y)
    if (unlocked[i]) {
      obj(treeObj(a.theme, i), x + 2, y - 18)
      obj(treeObj(a.theme, i + 1), x + 50, y - 14)
      obj(rockObj(a.theme, i), x + 34, y + 20)
    }
  })
  obj(plate('altar', 60, 26, endless ? 'gold' : 'locked'), ENDLESS_NODE.x / DOT - 30, ENDLESS_NODE.y / DOT - 13)
  flush(ctx)
}

// ---------- 항해(인트로) ----------
const boatCanvas = () => make(48, 36, p => {
  // 선체
  for (let y = 0; y < 8; y++) p.rect(2 + y, 24 + y, 44 - y * 2, 1, y < 2 ? '#a0703c' : y < 5 ? '#8a5a30' : '#6a4222')
  p.rect(2, 24, 44, 2, '#c08a4c')
  // 돛대와 돛
  p.rect(23, 4, 2, 21, '#6a4222')
  for (let y = 0; y < 17; y++) p.rect(25, 6 + y, 2 + Math.floor(y * 0.9), 1, y < 3 ? '#ffffff' : y % 6 < 2 ? '#ee4b4b' : '#fff3c8')
  for (let y = 0; y < 13; y++) p.rect(23 - Math.floor(y * 0.9) - 2, 9 + y, 2 + Math.floor(y * 0.9), 1, y % 6 < 2 ? '#ee4b4b' : '#ffffff')
  p.rect(25, 1, 8, 4, '#ffd23f').rect(25, 1, 8, 1, '#fff3a0')
  p.outline(INK)
})
let boat: HTMLCanvasElement | null = null

/** 인트로: 바다 위를 떠가는 배 */
export function drawVoyage(ctx: CanvasRenderingContext2D, t: number) {
  drawSea(t)
  boat ??= boatCanvas()
  const bob = Math.round(Math.sin(t * 2) * 2)
  obj(boat, ENV_W / 2 - 24, ENV_H / 2 - 24 + bob)
  const g = envPix.g
  g.fillStyle = '#ffffffcc'
  for (let i = 0; i < 4; i++) g.fillRect(ENV_W / 2 - 26 + i * 12 + Math.round(Math.sin(t * 3 + i) * 2), ENV_H / 2 + 14 + bob, 8, 1)
  flush(ctx)
}

// ---------- 타이틀 로고 ----------
function logoText(s: string, x: number, y: number, scale: number, fill: string, edge: string, shadow: string) {
  const g = envPix.g
  const put = (c: string, dx: number, dy: number) => { g.fillStyle = c; eachDot(s, x + dx, y + dy, scale, (a, b, w, h) => g.fillRect(a, b, w, h), 1) }
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) put(edge, dx, dy)
  put(shadow, 2, 2); put(shadow, 1, 2); put(shadow, 2, 1)
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(edge, dx, dy)
  put(fill, 0, 0)
  put('#ffffff55', 0, 0)
  g.fillStyle = fill; eachDot(s, x, y, scale, (a, b, w, h) => g.fillRect(a, b, w, h), 1)
  g.fillStyle = '#fff6b0'; eachDot(s, x, y, scale, (a, b, w) => g.fillRect(a, b, w, 1), 1)
}

/** 타이틀: 흘러가는 들판 + 점으로 찍은 로고 */
export function drawTitleWorld(ctx: CanvasRenderingContext2D, t: number) {
  drawBattleWorld('forest', t * 40, t)
  const g = envPix.g
  const sw = textWidth('POKEMON', 1, 1)
  void sw
  // POKEMON (작은 글자)
  const small = 'POKEMON'
  const sx = Math.floor((ENV_W - textWidth(small, 2, 1)) / 2)
  logoText(small, sx, 6, 2, '#ff5ca8', INK, '#ffffff')
  // QUEST (큰 글자)
  const big = 'QUEST'
  const bx = Math.floor((ENV_W - textWidth(big, 5, 1)) / 2)
  logoText(big, bx, 26, 5, '#ffc400', INK, '#c0392b')
  // FAN EDITION 띠
  const ribbon = 'FAN EDITION'
  const rw = textWidth(ribbon, 2, 1) + 16
  const rx = Math.floor((ENV_W - rw) / 2)
  g.fillStyle = INK; g.fillRect(rx - 1, 70, rw + 2, 15)
  g.fillStyle = '#e8524a'; g.fillRect(rx, 71, rw, 13)
  g.fillStyle = '#ff8a7a'; g.fillRect(rx, 71, rw, 2)
  g.fillStyle = '#ffffff'; eachDot(ribbon, rx + 8, 74, 2, (a, b, w, h) => g.fillRect(a, b, w, h), 1)
  flush(ctx)
}

export { W as SCENE_W, H as SCENE_H }
