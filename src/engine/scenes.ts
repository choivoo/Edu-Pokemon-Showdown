import { frontSprite } from '../data/sprites'
import { AREAS, type Theme } from '../lib/stages'
import { block, cube, drawGround, H, hash, rect, shade, tree, W } from './draw'
import { sprite } from './render'


export const POT = { x: 560, y: 190, w: 220, h: 170 }

function steam(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  for (let i = 0; i < 5; i++) {
    const k = ((t * 0.5 + i / 5) % 1)
    ctx.globalAlpha = (1 - k) * 0.7
    const r = 8 + k * 14
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i * 2) * 10 + (i - 2) * 14, y - k * 70, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** 베이스캠프: 노란 타일 + 요리 냄비 + 돌아다니는 동료들 */
export function drawCamp(ctx: CanvasRenderingContext2D, t: number, mons: number[], cooking: boolean) {
  ctx.imageSmoothingEnabled = false
  drawGround(ctx, 'forest', 0, t)
  // 냄비 주변 노란 다이아몬드 타일
  for (const [dx, dy] of [[-170, 30], [-40, 150], [230, 100], [100, 190]]) {
    const cx = POT.x + POT.w / 2 + dx, cy = POT.y + POT.h / 2 + dy
    ctx.fillStyle = '#f6d982'
    ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx + 78, cy); ctx.lineTo(cx, cy + 40); ctx.lineTo(cx - 78, cy); ctx.closePath(); ctx.fill()
  }
  // 냄비
  const { x, y, w } = POT
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + 150, 120, 26, 0, 0, Math.PI * 2); ctx.fill()
  cube(ctx, x + 10, y + 40, w - 20, 70, 44, '#55555c', '#38383e')
  rect(ctx, x + 26, y + 50, w - 52, 40, '#2d2d33')
  const glow = cooking ? 0.5 + 0.5 * Math.sin(t * 12) : 0.5 + 0.2 * Math.sin(t * 3)
  rect(ctx, x + 32, y + 54, w - 64, 32, `rgb(255,${Math.floor(130 + glow * 60)},40)`)
  for (let i = 0; i < 6; i++) rect(ctx, x + 44 + hash(i) * (w - 110) + Math.sin(t * 2 + i) * 4, y + 58 + hash(i, 2) * 20, 10, 6, '#ffd06a')
  rect(ctx, x, y + 70, 16, 22, '#38383e'); rect(ctx, x + w - 16, y + 70, 16, 22, '#38383e')
  steam(ctx, x + w / 2, y + 40, t * (cooking ? 2 : 1))
  // 나무
  tree(ctx, 70, 90, 1.4); tree(ctx, 860, 400, 1.3, '#3f9a47'); block(ctx, 90, 400, 130, 40, '#6fcf4c')
  // 돌아다니는 동료
  const list = mons.slice(0, 8)
  list.forEach((id, i) => {
    const ph = hash(id, i) * 6.28, sp = 0.18 + hash(i, 3) * 0.15
    const cx = 250 + (i % 4) * 90 + hash(i, 5) * 40, cy = 330 + (i >> 2) * 70
    const px = cx + Math.cos(t * sp + ph) * 90, py = cy + Math.sin(t * sp * 1.3 + ph) * 28
    const vx = -Math.sin(t * sp + ph)
    const img = sprite(frontSprite(id))
    const hop = Math.abs(Math.sin(t * 6 + i)) * 5
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath(); ctx.ellipse(px, py, 26, 9, 0, 0, Math.PI * 2); ctx.fill()
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

const LAND: Record<Theme, string> = { beach: '#f2dc9b', forest: '#6fcf4c', cave: '#8c84b0', gorge: '#c9b98e', volcano: '#a8584a', altar: '#9a8cf0' }

export function drawIsland(ctx: CanvasRenderingContext2D, t: number, unlocked: boolean[], endless = false) {
  ctx.imageSmoothingEnabled = false
  for (let i = 0; i < 9; i++) rect(ctx, 0, i * 60, W, 60, shade('#46b8f0', 1.05 - i * 0.035))
  for (let i = 0; i < 26; i++) {
    const x = ((i * 137 + t * 14) % (W + 80)) - 40, y = 20 + hash(i, 1) * (H - 40)
    ctx.globalAlpha = 0.45; rect(ctx, x, y, 34 + hash(i, 2) * 26, 4, '#fff'); ctx.globalAlpha = 1
  }
  // 연결 다리
  ctx.strokeStyle = '#e6d08a'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  AREA_NODES.forEach((n, i) => (i ? ctx.lineTo(n.x, n.y + 30) : ctx.moveTo(n.x, n.y + 30)))
  ctx.stroke()
  // 섬 블록
  AREAS.forEach((a, i) => {
    const n = AREA_NODES[i]
    const top = unlocked[i] ? LAND[a.theme] : '#8a8f9c'
    block(ctx, n.x - 90, n.y - 20, 180, 70, top, shade(top, 0.6))
    if (unlocked[i]) {
      tree(ctx, n.x - 80, n.y - 52, 0.7, a.theme === 'volcano' ? '#a04a3a' : a.theme === 'cave' || a.theme === 'altar' ? '#8a7ad0' : '#3fae5a')
      tree(ctx, n.x + 44, n.y - 40, 0.6, a.theme === 'beach' ? '#3fae5a' : '#4cae4f')
    }
  })
  // 끝없는 별길 섬
  if (endless) block(ctx, ENDLESS_NODE.x - 70, ENDLESS_NODE.y - 10, 140, 50, '#ffe27a', '#b89a2a')
}
